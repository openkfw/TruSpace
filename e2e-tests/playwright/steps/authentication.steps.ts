import { Given, Then, When } from "./fixtures";

Given("a registered user is on the login page", async ({ app }) => {
  await app.ensureDefaultUserExists();
  await app.gotoLogin();
});

Given("a visitor is on the login page", async ({ app }) => {
  await app.gotoLogin();
});

Given("a signed-in user is using the application", async ({ app }) => {
  await app.ensureDefaultUserExists();
  await app.loginAsUser("default");
});

When("the user signs in with valid credentials", async ({ app }) => {
  await app.loginAsUser("default");
});

When(
  "the user signs in with a valid email and an invalid password",
  async ({ app }) => {
    await app.signInWithWrongPassword();
  },
);

When("the visitor signs in with an invalid email format", async ({ app }) => {
  await app.signInWithInvalidEmailFormat();
});

When(
  "the visitor signs in with an email that is not registered",
  async ({ app }) => {
    await app.signInWithUnknownAccount();
  },
);

When("the visitor chooses the password recovery option", async ({ app }) => {
  await app.openPasswordRecoveryFromLogin();
});

When("the user logs out", async ({ app }) => {
  await app.logout();
});

Then("the application shell is displayed", async ({ app }) => {
  await app.expectApplicationShellVisible();
});

Then("the login is rejected", async ({ app }) => {
  await app.expectLoginRejected();
});

Then("the user is informed that the credentials are invalid", async ({ app }) => {
  await app.expectInvalidCredentialsError();
});

Then("the user is informed that the email format is invalid", async ({ app }) => {
  await app.expectLoginEmailFormatError();
});

Then("the password recovery page is displayed", async ({ app }) => {
  await app.expectPasswordRecoveryPageVisible();
});

Then("the login page is displayed", async ({ app }) => {
  await app.expectLoginPageVisible();
});
