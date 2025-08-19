# Git commits, branches and workflow

## Commits

When writing commits, please consider the following guidelines:

- Follow [these commit guidelines](https://cbea.ms/git-commit/)
- Write clear and descriptive commit messages
- Use the imperative mood in the subject line
- Limit the subject line to 50 characters
- Wrap the body at 72 characters
- Include relevant issue numbers

## Branches

When creating a new branch, you should consider the following guidelines regarding branch names:

- Lead with the number of the issue you are working on
- Add a short description of what the task is about
- Use hyphens as separators

## Workflow

When working on a feature branch make sure to:

1. Checkout the main branch and pull the recent changes
2. Create a new feature branch respecting the guidelines mentioned above
3. Try to keep the commits separate and respect the guidelines mentioned above. Don't squash the commits into a single one especially if you changed a lot of files
4. Push to the remote repository and open a pull request respecting the guidelines mentioned above
5. Make sure the pipelines are passing
6. Wait for a review. If you need a specific team member to review the PR you can request a review from them and assign them to the PR
7. When your feature is ready make sure you have the latest changes by running `git pull --rebase origin main` on your feature branch and push the changes
8. Merge the pull request into main
