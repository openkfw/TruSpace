import { Given, Then, When } from "./fixtures";

Given("a signed-in user is in a dedicated workspace", async ({ app }) => {
  await app.ensureDefaultUserExists();
  await app.loginAsUser("default");
  await app.createWorkspace("public");
});

Given("a document exists in the current scenario workspace", async ({ app }) => {
  await app.ensureDocumentExistsInWorkspace();
});

When("the user uploads a supported document", async ({ app }) => {
  await app.uploadDocument();
});

When("the user opens the document details", async ({ app }) => {
  await app.openUploadedDocumentDetails();
});

When("the user downloads the document", async ({ app }) => {
  await app.openUploadedDocumentDetails();
  await app.requestDocumentDownload();
});

When("the user deletes the document", async ({ app }) => {
  await app.deleteUploadedDocumentFromWorkspace();
});

Then("the document appears in the workspace document list", async ({ app }) => {
  await app.expectUploadedDocumentVisible();
});

Then("the document details are displayed", async ({ app }) => {
  await app.expectDocumentDetailsVisible();
});

Then("the document download starts successfully", async ({ app }) => {
  await app.expectDocumentDownloadStarted();
});

Then("the document is removed from the workspace", async ({ app }) => {
  await app.expectUploadedDocumentRemoved();
});
