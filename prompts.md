# LLM Prompts

Example prompts are provided in the application. You can add your own.

## Adding LLM prompts

## prompts.json

Out-dated, but still functional options is to create `prompts.json` in the `prompts` folder at the root of the application. See `prompts_example.json` file in the same folder for the structure. Note that this folder is mounted as a volume in docker compose.

## Prompts API

Using Truspace API, you can create, (read), update, or delete prompts, which are persisted in the SQLite database. Frontend for this functionality is not complete, but you can use cUrl to instruct the API. Please see `examples.sh` in `scripts/prompts` folder. Prompts API is protected. Only registered users can view and edit prompts, but the required procedure for login and using a cookie is well illustrated in the example script.
