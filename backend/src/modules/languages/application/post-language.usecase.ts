import { UploadedFile } from 'express-fileupload';

import { oiClient } from '../../../shared/clients/oi-client';
import { Document } from '../../../shared/types/interfaces';
import { FileUploadFailedError } from '../errors/file-upload-failed.error';

export async function postLanguage(file: UploadedFile, document: Document) {
  const fileData = await oiClient.uploadFile(file);

  if (!fileData || 'error' in fileData) {
    throw new FileUploadFailedError(fileData?.error);
  }

  const result = await oiClient.dispatchDetectLanguage(document, fileData);
  return result;
}
