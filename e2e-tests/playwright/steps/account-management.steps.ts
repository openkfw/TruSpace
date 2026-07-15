import { Given, Then, When } from "./fixtures";

Given("a visitor is on the registration page", async ({ app }) => {
  await app.gotoRegister();
});

Given("a signed-in user is on the account settings page", async ({ app }) => {
  await app.createSignedInAccountSettingsUser();
});

When("the visitor registers with valid account details", async ({ app }) => {
  await app.registerNewAccount();
});

When(
  "the visitor registers with an email address that already exists",
  async ({ app }) => {
    await app.registerWithExistingEmail();
  },
);

When("the visitor registers with an invalid email format", async ({ app }) => {
  await app.registerWithInvalidEmail();
});

When(
  "the visitor enters a password and a different password confirmation",
  async ({ app }) => {
    await app.registerWithMismatchedPassword();
  },
);

When("the user changes the display name", async ({ app }) => {
  await app.changeDisplayName();
});

When(
  "the user selects a different preferred language",
  async ({ app }) => {
    await app.changePreferredLanguage("de");
  },
);

When(
  "the user updates the {string} notification preference",
  async ({ app }, notificationType: "document updates" | "workspace invitations" | "workspace changes") => {
    await app.updateNotificationPreference(notificationType);
  },
);

When("the user updates the profile avatar", async ({ app }) => {
  await app.updateProfileAvatar();
});

When("the user deletes the account", async ({ app }) => {
  await app.deleteOwnAccount();
});

Then("the account is created successfully", async ({ app }) => {
  await app.expectRegistrationSucceeded();
});

Then("the user can continue into the application", async ({ app }) => {
  await app.continueIntoApplicationAsRegisteredUser();
  await app.expectApplicationShellVisible();
});

Then("the registration is rejected", async ({ app }) => {
  await app.expectRegistrationRejected();
});

Then(
  "the user is informed that the email address is already in use",
  async ({ app }) => {
    await app.expectRegisterEmailTakenError();
  },
);

Then(
  "the user is informed that the registration email format is invalid",
  async ({ app }) => {
    await app.expectRegisterEmailFormatError();
  },
);

Then("the user is informed that the passwords do not match", async ({ app }) => {
  await app.expectRegisterPasswordMismatchError();
});

Then("the updated display name is shown in the application", async ({ app }) => {
  await app.expectUpdatedDisplayNameShown();
});

Then("the preferred language is saved", async ({ app }) => {
  await app.expectPreferredLanguageSaved();
});

Then(
  "the {string} notification preference is saved",
  async ({ app }, notificationType: "document updates" | "workspace invitations" | "workspace changes") => {
    await app.expectNotificationPreferenceSaved(notificationType);
  },
);

Then("the new avatar is shown in the user profile", async ({ app }) => {
  await app.expectUpdatedAvatarShown();
});

Then("the account is removed", async ({ app }) => {
  await app.expectAccountDeleted();
});

Then(
  "the user can no longer access the application with that account",
  async ({ app }) => {
    await app.expectDeletedUserCannotAccessApplication();
  },
);
