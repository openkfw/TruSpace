import { Given, Then, When } from "./fixtures";

Given("a signed-in user is on the application status page", async ({ app }) => {
  await app.ensureDefaultUserExists();
  await app.loginAsUser("default");
  await app.gotoAppStatus();
});

Given(
  "a signed-in user is using the application on a desktop device",
  async ({ app }) => {
    await app.ensureDefaultUserExists();
    await app.loginAsUser("default");
    await app.expectApplicationShellVisible();
  },
);

When("the user opens the dashboard", async ({ app }) => {
  await app.openDashboardFromNavigation();
});

When("the user changes the theme to {string}", async ({ app }, theme: "light" | "dark" | "system") => {
  await app.changeTheme(theme);
});

When("the user opens the application status page", async ({ app }) => {
  await app.openAppStatusFromNavigation();
});

When("the user refreshes the status", async ({ app }) => {
  await app.refreshAppStatus();
});

When("the user opens the statistics page", async ({ app }) => {
  await app.openStatisticsFromNavigation();
});

When("the user opens contextual help", async ({ app }) => {
  await app.openHelpFromNavigation();
});

Then("the dashboard is displayed", async ({ app }) => {
  await app.expectDashboardDisplayed();
});

Then("the application uses the {string} theme", async ({ app }, theme: "light" | "dark" | "system") => {
  await app.expectThemeApplied(theme);
});

Then("the current system health is displayed", async ({ app }) => {
  await app.expectAppStatusDisplayed();
});

Then("the system health information is updated", async ({ app }) => {
  await app.expectAppStatusRefreshed();
});

Then("the available statistics are displayed", async ({ app }) => {
  await app.expectStatisticsDisplayed();
});

Then("explanatory guidance is displayed", async ({ app }) => {
  await app.expectHelpContentDisplayed();
});
