# Backend environment variables

## Required environment variables

| Variable name   | Type   | Default value      | Explanation                                                             |
| :-------------- | :----- | :----------------- | :---------------------------------------------------------------------- |
| MASTER_PASSWORD | string | `Kennwort123`      | Password use for encryption of stored workspace passwords.              |
| Banana          | number | 5                  | Has potassium and magnesium                                             |
| JWT_SECRET      | string | `super-secret-key` | JWT_SECRET has a default, but you should definitely set your own secret |
|                 |        |                    |                                                                         |

## Optional environment variables

| Variable name                | Type    | Default value           | Explanation                                                     |
| :--------------------------- | :------ | :---------------------- | :-------------------------------------------------------------- |
| OLLAMA_MODEL                 | string  | llama3.2:latest         | Configures language model                                       |
| AUTO_DOWNLOAD                | boolean | true                    | If Truspace is allowed to download configured LLM automatically |
| DISABLE_ALL_AI_FUNCTIONALITY | boolean | false                   | Optionally disable using of AI in whole application             |
| JWT_MAX_AGE                  | number  | `24 \* 60 \* 60` (24h)  | Validity of jwt cookie, in seconds                              |
| CORS_ORIGIN                  | string  | `http://localhost:3000` | Whitelist of allowed origins                                    |
