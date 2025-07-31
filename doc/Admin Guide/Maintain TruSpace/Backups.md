# Backups

## Backing up necessary directories and files

To ensure the integrity and availability of your TruSpace data, it is crucial to implement a robust backup strategy. From our perspective, we especially recommend to backup the storage of the documents and user data as well as configuration variables. This currently includes the following directories:

- `/volumes` - This directory contains the persistent storage for TruSpace, including user data and documents.
- `.env` - This file contains environment variables that configure the TruSpace instance, such as database connection strings and service URLs.

In the optimal case, you should setup a regular backup schedule for these directories and files. This can be done using various backup tools or scripts that can copy the contents of these directories to a secure location, such as an external storage service or a local backup server.

> [!NOTE]
> If you are aware of any other necessary directories or files that should be backed up, please let us know so we can update this guide accordingly.

## Restoring from backups

To restore TruSpace from a backup, you can follow these steps:

1. Stop the TruSpace services if they are running:
   ```bash
   docker-compose down
   ```
2. Restore the backed-up directories and files to their original locations:
   ```bash
   cp -r /path/to/backup/volumes/* ~/volumes/
   cp /path/to/backup/.env ~/.env
   ```
3. Ensure that the permissions and ownership of the restored files and directories are correct:
   ```bash
   sudo chown -R 1000:1000 ~/volumes
   # or
   sudo chmod -R 744 ~/volumes
   ```
4. Start the TruSpace services again:
   ```bash
   docker-compose up -d
   ```
5. Verify that TruSpace is running correctly and that the data has been restored successfully by accessing the web interface.
