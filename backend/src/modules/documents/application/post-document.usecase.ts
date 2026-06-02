import { Response } from 'express';
import { UploadedFile } from 'express-fileupload';

import { scanBufferForMalware } from '../../../shared/adapters/malware-scanning/index';
import { oiClient } from '../../../shared/clients/oi-client';
import { config } from '../../../shared/config/config';
import { encrypt } from '../../../shared/encryption';
import { MalwareDetectedError } from '../errors/malware-detected.error';
import { decodeFilename, createDocumentRequest, getWorkspacePassword } from '../../../shared/handlers/documents';
import { AuthenticatedRequest } from '../../../shared/types';
import { setRequestContext } from '../../../shared/logging/request-context';
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
import { documentsIpfsRepository } from '../infrastructure/documents-ipfs.repository';

export async function postDocument(req: AuthenticatedRequest, res: Response) {
  if (!req.files || !req.files.file) {
    throw new NoFileUploadedError();
  }
  const { workspace } = req.body;
  const email = req.user?.email as string;
  const userUiid = req.user?.uiid as string;
  const creatorNodeId = req.user?.nodeId as string;

  setRequestContext({ workspaceId: workspace });

  await checkPermissionForWorkspace(email, res, workspace);

  const file = req.files.file as UploadedFile;
  const filename = decodeFilename(file.name);

  let malwareScanMeta:
    | {
        status: string;
        provider: string;
        timestamp: string;
      }
    | undefined;

  if (config.malwareScanning.enabled) {
    const scanResult = await scanBufferForMalware(file.data);
    if (scanResult.status === 'infected') {
      throw new MalwareDetectedError({
        signature: scanResult.signature,
        provider: scanResult.provider,
      });
    }

    malwareScanMeta = {
      status: scanResult.status,
      provider: scanResult.provider,
      timestamp: scanResult.scannedAt,
    };
  }

  const docRequest = createDocumentRequest({
    filename,
    creatorNodeId,
    creatorUserId: userUiid,
    workspaceOrigin: workspace,
    size: file.size,
    mimetype: file.mimetype,
    malwareScanStatus: malwareScanMeta?.status,
    malwareScanProvider: malwareScanMeta?.provider,
    malwareScanTimestamp: malwareScanMeta?.timestamp,
  });

  const fileDataClone = Buffer.from(file.data);

  const workspacePassword = await getWorkspacePassword(workspace);
  file.data = await encrypt(file.data, workspacePassword);

  const ipfsClusterResponse = await documentsIpfsRepository.createDocument(docRequest, file);
  const cid = ipfsClusterResponse.cid;
  setRequestContext({ cid });

  // ollama obviously needs unencrypted document
  file.data = fileDataClone;

  const aiDisabled = config.disableAllAIFunctionality;

  // process file with AI if it is a PDF or DOCX and AI is enabled
  let fileProcessableWithAI = false;
  const fileExtension = filename.split('.').pop();
  if (!aiDisabled && (fileExtension === 'pdf' || fileExtension === 'docx')) {
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

  const noAiMessage = aiDisabled
    ? 'AI functionality disabled. No task created.'
    : 'File not processable with AI. No task created.';

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
          message: noAiMessage,
          statusEndpoint: null,
        },
        tagsInitialResponse: {
          requestId: null,
          message: noAiMessage,
          statusEndpoint: null,
        },
        languageInitialResponse: {
          requestId: null,
          message: noAiMessage,
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
