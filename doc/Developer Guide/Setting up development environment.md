# Setting up the development environment

To contribute to the TruSpace project, you need to set up your development environment. This guide will walk you through the necessary steps to get started.

> [!NOTE]
> This setup is meant for Linux / MacOS environments (zsh shell). If you are using Windows, consider using WSL (Windows Subsystem for Linux) to create a compatible environment. For MacOS, we use Homebrew to manage packages.

## Git

Make sure that Git is installed (often comes preinstalled). You can check if Git is installed by running the following command in your terminal:

```bash
git --version
```

If Git is not installed, you can install it using the package manager for your operating system.

```bash
# For Ubuntu/Debian
sudo apt-get install git

# For MacOS
brew install git
```

If you have not connected to a GitHub account yet, please register. We recommend to create a SSH key via the following commands and add it to your GitHub account:

```bash
# Generate a new SSH key
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Start the SSH agent
eval "$(ssh-agent -s)"

# Add your SSH key to the SSH agent
ssh-add ~/.ssh/id_rsa

# Copy the SSH key to your clipboard
cat ~/.ssh/id_rsa.pub
```

With Git and GitHub setup, you will be able to clone the repository, push changes, and collaborate with others:

```bash
git clone git@github.com:openkfw/TruSpace.git
cd TruSpace
```

## Docker

Docker is used to run TruSpace in a containerized environment, ensuring that all dependencies are managed and the application runs consistently across different systems.

To get started with Docker, you need to install it on your machine. You can follow the official installation guide for your operating system:

- [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
- [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
- [Docker Engine on Linux](https://docs.docker.com/engine/install/)

> [!NOTE]
> If you are not allowed to use Docker e.g. in your enterprise environment (have to have licenses, etc.), you can install [Podman](https://podman.io/docs/installation) on all systems instead. The docker commands can be used interchangeably with podman commands. For more information on using Podman, please refer to the [Podman documentation](https://podman.io/docs/). Usually, all commands should work interchangeably, without any issues (see [Managing Docker compatibility](https://podman-desktop.io/docs/migrating-from-docker/managing-docker-compatibility)). However, should there be issues regarding the docker commands, you can either change docker in the CLI to a podman alias i.e. `alias docker=podman` or change the word `docker` in all commands to `podman`.

Once Docker/Podman is installed, you can verify the installation by running the following command:

```bash
docker --version # if not working, try: podman --version
```

This should display the installed version of Docker/Podman.

## Node.js & npm

Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine. npm is the package manager for Node.js, allowing you to install and manage packages for your project.

To install Node.js and npm, you can use the package manager for your operating system:

```bash
# For Ubuntu/Debian
sudo apt-get install nodejs npm

# For MacOS
brew install node
```

Hint: to install it on WSL, follow [this guide](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl).

Once Node.js and npm are installed, you can verify the installation by running the following commands:

```bash
node --version
npm --version
```

This should display the installed versions of Node.js and npm.

# Typescript

To install TypeScript, you can use npm:

```bash
npm install -g typescript
```

Once TypeScript is installed, you can verify the installation by running the following command:

```bash
tsc --version
```

## Environment variables

In order to run TruSpace, you need to setup a few environment variables. A list of all variables and whether they are required or not can be found [here](../ENVIRONMENT_VARIABLES.md).

Further, we have created an exemplary `.env.example` file in the repository, which you can copy to `.env` and modify according to your needs. You can also use `configure.sh` to assist with the setup.

## IDE

We recommend using Visual Studio Code as your Integrated Development Environment (IDE) for TruSpace development (or Vim for advanced users ;)). It provides excellent support for TypeScript, Docker, and Git. We have also included a `.vscode` folder in the repository with recommended settings and extensions for your convenience.

## Chrome Developer Tools

If you are testing and debugging in Google Chrome, we recommend the following extensions:

- [React Developer Tools](https://chromewebstore.google.com/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?pli=1)
- [Redux Developer Tools](https://chromewebstore.google.com/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)

## Run TruSpace

To run the application **quick and easy**, you can setup the installation using these commands:

```bash
./start.sh
```

This command creates a simple environment configuration, creates docker volumes and spins up docker compose containing backend api and IPFS clusters and additionally NextJS frontend in dev mode. After startup, the frontend is available on http://localhost:3000. Register a user, login and create a workspace for documents!

However when developing the frontend, **we recommend to start the frontend locally, not in Docker**:

```bash
# Start all containers besides frontend
./start.sh --local-frontend

# Start frontend locally
cd frontend
npm i
npm run dev
```

If you plan to use another domain (e.g. on a local raspberry), make sure that the respective domains are updated from `localhost` to your `domain.local` in the `CORS` fields of the `.env` file (`CORS_ORIGIN` and `OI_CORS_ALLOW_ORIGIN`). This can be easily done in the `TruSpace` folder using the example environment:

```bash
sed 's|http://localhost|http://example.com|g' .env.example > .env
```

To enable AI analysis, TruSpace downloads a model configured in `.env`, as an example here is `gemma3:1b` and you can see the full list at the [ollama DB](https://ollama.com/library?q=mistral&sort=popular).

Once the model is downloaded, AI analysis is executed upon each document upload automatically.

For a more detailed guide or setup on other systems such as a standalone server or Raspberry Pi, you can follow the [Admin Installation Guides](../Admin%20Guide/Setup%20TruSpace/Installation.md).
