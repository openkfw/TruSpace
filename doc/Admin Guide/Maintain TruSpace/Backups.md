# Backups

To ensure the integrity and availability of your TruSpace data, it is crucial to implement a robust backup strategy. From our perspective, we especially recommend to backup the storage of the documents and user data as well as configuration variables. This currently includes the following directories:

- `/volumes` - This directory contains the persistent storage for TruSpace, including user data and documents.
- `.env` - This file contains environment variables that configure the TruSpace instance, such as database connection strings and service URLs.

In the optimal case, you should setup a regular backup schedule for these directories and files. This can be done using various backup tools or scripts that can copy the contents of these directories to a secure location, such as an external storage service or a local backup server.

> [!NOTE]
> If you are aware of any other necessary directories or files that should be backed up, please let us know so we can update this guide accordingly.
