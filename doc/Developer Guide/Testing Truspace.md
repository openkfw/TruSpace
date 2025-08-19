# Testing TruSpace

## End-to-End Testing

To test TruSpace, you need to have the development environment set up. If you haven't done that yet, please refer to the [Setting up development environment](Setting%20up%20Development%20Environment.md) guide.

For our end-to-end testing we use the testing framework [Cypress](https://www.cypress.io/). If you are using WSL, check out this setup guide: [Cypress on WSL](https://nickymeuleman.netlify.app/blog/gui-on-wsl2-cypress/).

To run the tests, follow this guide:

1. Start the local application (the application must be running):
   ```bash
   ./start.sh
   ```
2. Move into test folder:
   ```bash
   cd e2e-tests
   ```
3. Run the tests:
   ```bash
   npm run test
   ```

Make sure that your environment variables are set correctly before running the tests.

## Continuous Integration / Continuous Deployment (CI/CD)

We use GitHub Actions to automate our CI/CD pipeline. Firstly, we use [CodeQL](../../.github/workflows/codeql.yml) to perform static code analysis and identify potential vulnerabilities in the codebase. This helps us maintain a high level of code quality and security.

In addition to CodeQL, we also [build the docker images](../../.github/workflows/docker-images.yml) and afterwards, if successful, run security scans using Trivy and generating SARIF reports.

## Debugging tips

For debugging tips, please refer to our [Admin Debugging Guide](../Admin%20Guide/Debugging.md)
