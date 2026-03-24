import { Response } from 'express';

import { UploadedFile } from 'express-fileupload';

import { IpfsClient } from '../../../shared/clients/ipfs-client';
import { oiClient } from '../../../shared/clients/oi-client';
import { encrypt } from '../../../shared/encryption';
import { decodeFilename, createDocumentRequest, getWorkspacePassword } from '../../../shared/handlers/documents';
import { sendNotification } from '../../../shared/mailing/notifications';
import { AuthenticatedRequest } from '../../../shared/types';
import { Prompt } from '../../../shared/types/interfaces';
import { checkPermissionForWorkspace } from '../../../shared/utility/permissions';
import {
  readExternalPrompts,
  mergePromptArrays,
  examplePrompts,
  tagsPrompt,
  languagePrompt,
} from '../../../shared/utility/prompts';
import { getUserSettingsByUiid } from '../../../shared/utility/user';
import TaskQueue from '../../../shared/utility/jobQueue';

export async function putDocument(req: AuthenticatedRequest, res: Response) {
  if (!req.files || !req.files.file) {
    return res.status(400).json({
      success: false,
      message: 'No document uploaded',
    });
  }

  try {
    const { workspace, versionTagName } = req.body;
    const { docId } = req.params;
    const email = req.user?.email as string;
    const userUiid = req.user?.uiid as string;
    const creatorNodeId = req.user?.nodeId as string;

    await checkPermissionForWorkspace(email, res, workspace);

    const file = req.files.file as UploadedFile;
    const filename = decodeFilename(file.name);

    const client = new IpfsClient();
    const docInfo = await client.getDocumentDetailsById(docId);
    const latestVersion = docInfo.documentVersions[0].meta.version;

    const docRequest = createDocumentRequest({
      filename,
      version: (parseInt(latestVersion) + 1).toString(),
      creatorNodeId,
      creatorUserId: userUiid,
      size: file.size,
      mimetype: file.mimetype,
      workspaceOrigin: workspace,
      docId,
      versionTagName,
    });
    const fileDataClone = Buffer.from(file.data); // => clone unencrypted file for LLM processing

    const workspacePassword = await getWorkspacePassword(workspace);
    file.data = await encrypt(file.data, workspacePassword);

    // store encrypted document. cid is derived from this encrypted version
    const ipfsClusterResponse = await client.createDocument(docRequest, file);
    const cid = ipfsClusterResponse.cid;

    file.data = fileDataClone;

    // process file with AI if it is a PDF or DOCX
    let fileProcessableWithAI = false;
    const fileExtension = filename.split('.').pop();
    if (fileExtension === 'pdf' || fileExtension === 'docx') {
      fileProcessableWithAI = true;
    }

    let summariesTaskId: string | null = null;
    let tagsTaskId: string | null = null;
    let languageTaskId: string | null = null;
    if (fileProcessableWithAI) {
      const fileData = await oiClient.uploadFile(file);

      if (!fileData || 'error' in fileData) {
        throw new Error('Failed to upload file to Ollama');
      }

      const externalPrompts = readExternalPrompts();
      const summaryPrompts: Prompt[] = mergePromptArrays(externalPrompts, examplePrompts);

      summariesTaskId = await TaskQueue.addJob({
        templateId: 'perspectives',
        cid,
        prompts: summaryPrompts,
      });

      tagsTaskId = await TaskQueue.addJob({
        templateId: 'tags',
        cid,
        prompts: [tagsPrompt],
      });

      languageTaskId = await TaskQueue.addJob({
        templateId: 'language',
        cid,
        prompts: [languagePrompt],
      });
    }

    const { summariesInitialResponse, tagsInitialResponse, languageInitialResponse } = fileProcessableWithAI
      ? {
          summariesInitialResponse: {
            requestId: `${summariesTaskId}`,
            message: 'Request accepted. Processing started for task.',
            statusEndpoint: `/api/perspectives/status/${summariesTaskId}`,
          },
          tagsInitialResponse: {
            requestId: `${tagsTaskId}`,
            message: 'Request accepted. Processing started for task.',
            statusEndpoint: `/api/perspectives/status/${tagsTaskId}`,
          },
          languageInitialResponse: {
            requestId: `${languageTaskId}`,
            message: 'Request accepted. Processing started for task.',
            statusEndpoint: `/api/language/status/${languageTaskId}`,
          },
        }
      : {
          summariesInitialResponse: {
            requestId: null,
            message: 'File not processable with AI. No task created.',
            statusEndpoint: null,
          },
          tagsInitialResponse: {
            requestId: null,
            message: 'File not processable with AI. No task created.',
            statusEndpoint: null,
          },
          languageInitialResponse: {
            requestId: null,
            message: 'File not processable with AI. No task created.',
            statusEndpoint: null,
          },
        };

    docInfo.documentVersions
      .map((version) => version.meta.creatorUserId)
      .reduce((acc: string[], uiid: string) => {
        if (!acc.includes(uiid)) {
          acc.push(uiid);
        }
        return acc;
      }, [])
      .forEach(async (documentCreator: string) => {
        const userSettings = await getUserSettingsByUiid(documentCreator);

        if (userSettings?.notificationSettings?.documentChanged && documentCreator !== req.user?.uiid) {
          sendNotification(
            userSettings?.email,
            'documentChanged',
            `/workspace/${docInfo.meta.workspaceOrigin}/document/${docId}`,
            docInfo.meta.filename,
          );
        }
      });

    const responseMessage = 'Document updated successfully and AI processing initiated where applicable.';

    return {
      success: true,
      message: responseMessage,
      data: {
        name: encodeURIComponent(file.name),
        cid,
        size: file.size,
        perspectivesStatus: summariesInitialResponse,
        tagsStatus: tagsInitialResponse,
        languageStatus: languageInitialResponse,
      },
    };
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
