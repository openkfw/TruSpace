import { UploadedFile } from 'express-fileupload';

import { storeUserSettingsDb } from '../../../shared/clients/db';
import { IpfsClient } from '../../../shared/clients/ipfs-client';
import logger from '../../../shared/config/winston';
import { HttpError, InternalServerError } from '../../../shared/errors';
import { AuthenticatedRequest } from '../../../shared/types';
import { UserNotFoundError } from '../errors/user-not-found.error';

export async function postUsersUserSettings(req: AuthenticatedRequest) {
  try {
    const file = req.files?.file as UploadedFile;

    let avatarCid: string | undefined;
    if (file) {
      avatarCid = await new IpfsClient().uploadAvatar(file);
    }

    const notificationSettings = {
      addedToWorkspace: req.body.notificationAddedToWorkspace === 'true',
      removedFromWorkspace: req.body.notificationRemovedFromWorkspace === 'true',
      documentChanged: req.body.notificationDocumentChanged === 'true',
      documentChat: req.body.notificationDocumentChat === 'true',
      workspaceChange: req.body.notificationWorkspaceChange === 'true',
    };

    const updatedUsers = await storeUserSettingsDb(req.user?.email as string, {
      avatarCid,
      preferedLanguage: req.body.preferedLanguage || 'en',
      notificationSettings: JSON.stringify(notificationSettings),
    });

    if (!updatedUsers) {
      throw new UserNotFoundError(`email: ${req.user?.email as string}`);
    }

    return {
      status: 'success',
      message: 'User settings updated successfully',
    };
  } catch (error) {
    logger.error(`Error uploading avatar: ${JSON.stringify(error, null, 2)}`);
    if (error instanceof HttpError) {
      throw error;
    }
    throw new InternalServerError('User settings update failed', error);
  }
}
