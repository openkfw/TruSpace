# Security fixes guide

This document outlines some ways how to maintain the security of your TruSpace installation. It is important to regularly check for updates and apply security patches to ensure the system remains secure.

## NPM packages

One main part of checking for security issues is to keep the NPM packages up to date. You can use the following commands to check for outdated packages and update them:

1. Create a new branch from the latest `main` branch (keep our [branch codex](../../Developer%20Guide/How%20to%20contribute/Git%20commits,%20branches%20and%20workflow.md) in mind)
2. Make sure that your current version is running correctly before updating the packages.
3. Go to any directory using npm, e.g. `backend`, `frontend` or `e2e-tests`
4. Use the following command to check for outdated packages:

```bash
npm audit
```

If there are any vulnerabilities, they will be listed in the output.

4. To update the packages, you can use the following command:

```bash
npm audit fix
```

This will automatically update the packages to the latest version that does not introduce breaking changes. Sometimes, you will have to use the flag `--force` to update packages that introduce breaking changes.

5. If there are still vulnerabilities after running the above command, you can try to update the packages manually by running:

```bash
npm update <package-name>
```

Another often mentioned tool is `npm-check-updates`. With this, you can check for updates and update the packages automatically. You can install it globally using:

```bash
npm install -g npm-check-updates
```

6. After updating the packages, make sure to test your application thoroughly to ensure that everything is working as expected. You can use the following command or start the containers and the entire application to see if it still works:

```bash
npm run dev
```

HINT: Before starting the frontend, you should delete some modules to reinstall them before starting the frontend itself:

```bash
rm -rf node_modules/
rm -rf .next/
```

7. To test the types, you can run:

```bash
npm run build
```

8. Create a pull request so others can test if they have any issues with the updated packages.