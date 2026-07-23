import { Given, Then, When } from "./fixtures";

Given("a signed-in user is on the workspace overview", async ({ app }) => {
  await app.ensureDefaultUserExists();
  await app.loginAsUser("default");
  await app.expectApplicationShellVisible();
});

Given("a workspace with the requested name already exists", async ({ app }) => {
  await app.createWorkspace("public");
});

Given("the user owns an existing workspace", async ({ app }) => {
  await app.createWorkspace("public");
});

Given("the user owns a private workspace", async ({ app }) => {
  await app.createWorkspace("private");
});

Given("the user owns a public workspace", async ({ app }) => {
  await app.createWorkspace("public");
});

When("the user creates a workspace with a new name", async ({ app }) => {
  await app.createWorkspace("public");
});

When("the user creates a workspace with that same name", async ({ app }) => {
  await app.attemptDuplicateWorkspaceCreation();
});

When("the user creates a private workspace with a new name", async ({ app }) => {
  await app.createWorkspace("private");
});

When("the user creates a public workspace with a new name", async ({ app }) => {
  await app.createWorkspace("public");
});

When(
  "the user changes the workspace visibility to public",
  async ({ app }) => {
    await app.changeCurrentWorkspaceVisibility("public");
  },
);

When(
  "the user changes the workspace visibility to private",
  async ({ app }) => {
    await app.changeCurrentWorkspaceVisibility("private");
  },
);

When("the user deletes the workspace", async ({ app }) => {
  await app.deleteCurrentWorkspace();
});

Then("the workspace is created", async ({ app }) => {
  await app.expectCreatedWorkspaceVisible();
});

Then("the workspace appears in the workspace overview", async ({ app }) => {
  await app.expectCreatedWorkspaceListedInSidebar();
});

Then("the workspace is not created", async ({ app }) => {
  await app.expectWorkspaceNotCreated();
});

Then("the user is informed that the name is already in use", async ({ app }) => {
  await app.expectDuplicateWorkspaceError();
});

Then("the workspace is created as private", async ({ app }) => {
  await app.expectCurrentWorkspaceVisibility("private");
});

Then("the workspace is created as public", async ({ app }) => {
  await app.expectCurrentWorkspaceVisibility("public");
});

Then("the workspace becomes public", async ({ app }) => {
  await app.expectCurrentWorkspaceVisibility("public");
});

Then("the workspace becomes private", async ({ app }) => {
  await app.expectCurrentWorkspaceVisibility("private");
});

Then("the workspace is removed from the workspace overview", async ({ app }) => {
  await app.expectCurrentWorkspaceRemovedFromSidebar();
});
