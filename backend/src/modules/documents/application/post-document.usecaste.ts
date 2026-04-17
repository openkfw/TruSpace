import { Response } from 'express';
import { UploadedFile } from 'express-fileupload';

import { AuthenticatedRequest } from '../../../shared/types';
import { IpfsClient } from '../../../shared/clients/ipfs-client';
import { oiClient } from '../../../shared/clients/oi-client';
import { encrypt } from '../../../shared/encryption';
import { decodeFilename, createDocumentRequest, getWorkspacePassword } from '../../../shared/handlers/documents';
import { Prompt } from '../../../shared/types/interfaces';
import { checkPermissionForWorkspace } from '../../../shared/utility/permissions';
import {
  readExternalPrompts,
  mergePromptArrays,
  examplePrompts,
  tagsPrompt,
  languagePrompt,
} from '../../../shared/utility/prompts';
import TaskQueue from '../../../shared/utility/jobQueue';
import { NoFileUploadedError } from '../errors/no-file-uploaded.error';

export async function postDocument(req: AuthenticatedRequest, res: Response) {
  if (!req.files || !req.files.file) {
    throw new NoFileUploadedError();
  }
  const { workspace } = req.body;
  const email = req.user?.email as string;
  const userUiid = req.user?.uiid as string;
  const creatorNodeId = req.user?.nodeId as string;

  await checkPermissionForWorkspace(email, res, workspace);

  const file = req.files.file as UploadedFile;
  const filename = decodeFilename(file.name);

  const docRequest = createDocumentRequest({
    filename,
    creatorNodeId,
    creatorUserId: userUiid,
    workspaceOrigin: workspace,
    size: file.size,
    mimetype: file.mimetype,
  });

  const fileDataClone = Buffer.from(file.data);

  const workspacePassword = await getWorkspacePassword(workspace);
  file.data = await encrypt(file.data, workspacePassword);

  const client = new IpfsClient();
  const ipfsClusterResponse = await client.createDocument(docRequest, file);
  const cid = ipfsClusterResponse.cid;

  // ollama obviously needs unencrypted document
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

  const responseMessage = 'Document uploaded successfully';

  return {
    success: true,
    message: responseMessage,
    data: {
      name: encodeURIComponent(file.name),
      size: file.size,
      cid: cid,
      perspectivesStatus: summariesInitialResponse,
      tagsStatus: tagsInitialResponse,
      languageStatus: languageInitialResponse,
    },
  };
}
