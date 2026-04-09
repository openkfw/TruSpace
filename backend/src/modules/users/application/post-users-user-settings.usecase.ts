import { UploadedFile } from 'express-fileupload';

import { storeUserSettingsDb } from '../../../shared/clients/db';
import { IpfsClient } from '../../../shared/clients/ipfs-client';
import logger from '../../../shared/config/winston';
import { AuthenticatedRequest } from '../../../shared/types';
import { UseCaseResponse } from '../../../shared/types/usecase';

export async function postUsersUserSettings(req: AuthenticatedRequest): Promise<UseCaseResponse> {
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

    await storeUserSettingsDb(req.user?.email as string, {
      avatarCid,
      preferedLanguage: req.body.preferedLanguage || 'en',
      notificationSettings: JSON.stringify(notificationSettings),
    });

    return {
      body: {
        status: 'success',
        message: 'User settings updated successfully',
      },
    };
  } catch (error) {
    logger.error(`Error uploading avatar: ${JSON.stringify(error, null, 2)}`);
    return {
      statusCode: 500,
      body: {
        status: 'failure',
        message: 'User settings update failed',
      },
    };
  }
}
