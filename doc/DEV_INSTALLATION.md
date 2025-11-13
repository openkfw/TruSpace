# Installation and running in local environment

## Prerequisites

To run this application locally you will need to have [Docker](https://docs.docker.com/get-started/get-docker/) and [Node](https://nodejs.org/en) installed.

If you are running on Windows, use [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) and the [windows-specific section](#starting-dev-environment-on-windows) down below.

## Starting dev environment

- Start dev environment by running `sh start.sh --dev` It will create `.env` file from default `.env.example` file if it doesn't exist. As a next step the script spins up docker compose containing backend api and IPFS cluster, AI functionality Ollama and Open WebUI. As the last step the script installs npm packages and runs NextJS frontend in dev mode.
- TruSpace UI can be found on <http://localhost:3000/>
- Open WebUI can be found on <http://localhost:3333/>

There is an option to run local environment without AI functionality (Ollama and Open WebUI), by setting `DISABLE_ALL_AI_FUNCTIONALITY=true` in `.env` file in the root folder prior to running of `sh start.sh`, or directly running `sh start.sh --dev --no-ai`.

For development purposes and testing of email notifications you can use some dockerised mail catcher like Mailhog. You can simply start it in docker using following command `docker run -p 8025:8025 -p 1025:1025 --name="mailhog" -e MH_HOSTNAME='mailhog.local' mailhog/mailhog`.
Afterwards you can find mailbox UI at <http://localhost:8025/>

## Starting dev environment on Windows

To start the dev environment on Windows in WSL, a few changes need to be made:

- Change the external port of the backend from 8000 to something else, e.g. 8001, in `./frontend/Dockerfile` and `./frontend/startup.sh` and `./frontend/src/config.ts`
- Change the external port of the ollama container from 11434 to something else, e.g. 11435, in `./docker-compose-ai.yml`

These port changes are required to avoid conflicts with Windows services and errors in the startup process.

After these changes, run the following:

- To start the dev environment run `sh start.sh --dev`. It will create `.env` file from default `.env.example` file if it doesn't exist. As a next step the script spins up docker compose containing backend api and IPFS cluster, AI functionality Ollama and Open WebUI. As the last step the script installs npm packages and runs NextJS frontend in dev mode.

After it has spun up, stop the dev environment by killing the terminal and run the following in the root directory:

- `chmod -R 777 volumes`. This makes sure the containers can actually access the files in their volumes.

And the very last step:

- Go to <http://localhost:3333> and login using the credentials found in your `.env` file.
- Go to the top right corner, click on the profile picture and select "Admin Settings" in the drop down menu.
- Go to the top middle and select "Settings", go to "Connections" and under "Manage Ollama API Connections" go to the very right and select the gear icon.
- Under URL input the following: "http://ollama:11434". The port needs to be the internal docker port.
- When clicking on the reload symbol, a green "Server connection verified" toast should appear in the top right corner.
- Close the dialog and click on the download icon next to the gear icon
- Input the model name and download the model specified in your `.env` file, or one of the models found in the [Ollama Model Library](https://ollama.com/library)
  - If the model download fails, try again. If it keeps failing, make sure the connection can be made to the ollama container by checking the instructions above.

There is an option to run local environment without AI functionality (Ollama and Open WebUI), by setting `DISABLE_ALL_AI_FUNCTIONALITY=true` in `.env` file in the root folder prior to running of `sh start.sh`, or directly running `sh start.sh --dev --no-ai`.

With these adjustments made, you can start developing on Windows. Thank you for your contribution!
