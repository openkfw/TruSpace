import { Given, Then, When } from "./fixtures";

Given("a signed-in user owns a private workspace", async ({ app }) => {
  await app.createPrivateWorkspaceAsOwner();
});

Given("another user already has access to the workspace", async ({ app }) => {
  await app.ensureAnotherUserHasWorkspaceAccess();
});

Given(
  "another signed-in user does not have access to the workspace",
  async ({ app }) => {
    await app.signInAsUserWithoutWorkspaceAccess();
  },
);

When("the owner invites another user to the workspace", async ({ app }) => {
  await app.inviteUserToCurrentWorkspace("collaborator");
});

When("the owner removes that user from the workspace", async ({ app }) => {
  await app.removeCurrentWorkspaceCollaborator("collaborator");
});

When("the user attempts to open that workspace", async ({ app }) => {
  await app.attemptToOpenStoredWorkspace();
});

When("the invited user leaves the workspace", async ({ app }) => {
  await app.invitedUserLeavesWorkspace();
});

Then("the invited user receives access to the workspace", async ({ app }) => {
  await app.expectInvitedUserHasWorkspaceAccess("collaborator");
});

Then("the removed user no longer has access to the workspace", async ({ app }) => {
  await app.expectRemovedUserNoLongerHasAccess("collaborator");
});

Then("access is denied", async ({ app }) => {
  await app.expectAccessDenied();
});

Then("that member no longer has access to the workspace", async ({ app }) => {
  await app.expectInvitedUserNoLongerHasAccess();
});

Then("the other members remain invited", async ({ app }) => {
  await app.expectOtherWorkspaceMembersRemainInvited();
});
