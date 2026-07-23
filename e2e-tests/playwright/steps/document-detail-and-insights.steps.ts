import { Given, Then, When } from "./fixtures";

Given(
  "a signed-in user is viewing a document in a dedicated workspace",
  async ({ app }) => {
    await app.ensureDefaultUserExists();
    await app.loginAsUser("default");
    await app.createWorkspace("public");
    await app.ensureDocumentExistsInWorkspace();
    await app.openUploadedDocumentDetails();
  },
);

When("the user opens the document preview", async ({ app }) => {
  await app.openDocumentDetailsTab("preview");
});

When("the user opens the version history", async ({ app }) => {
  await app.openDocumentDetailsTab("versions");
});

When("the user opens the document information", async ({ app }) => {
  await app.openDocumentMetadataSection();
});

When("the user opens the document perspectives", async ({ app }) => {
  await app.openDocumentPerspectivesSection();
});

When("the user opens the document tags", async ({ app }) => {
  await app.openDocumentTagsSection();
});

Then("a preview of the document is displayed", async ({ app }) => {
  await app.expectDocumentPreviewVisible();
});

Then("the available document versions are displayed", async ({ app }) => {
  await app.expectDocumentVersionsVisible();
});

Then("the document metadata is displayed", async ({ app }) => {
  await app.expectDocumentMetadataVisible();
});

Then("the perspectives for the document are displayed", async ({ app }) => {
  await app.expectDocumentPerspectivesVisible();
});

Then("the tags for the document are displayed", async ({ app }) => {
  await app.expectDocumentTagsVisible();
});
