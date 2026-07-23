import path from "node:path";

import { expect, type Locator, type Page } from "@playwright/test";

import { ensureRuntimeFiles, runtimeEnv } from "./runtime-env";
import type {
  NotificationPreference,
  ScenarioState,
  TestUser,
  ThemeMode,
  WorkspaceVisibility,
} from "./scenario-types";
import { TestDataFactory } from "./test-data-factory";

const WORKSPACE_PAGE_URL = /\/workspace\/[^/]+/;
const DOCUMENT_DETAILS_PAGE_URL = /\/workspace\/[^/]+\/document\/[^/]+/;
const LOGIN_PAGE_URL = /\/login/;

export class AppDriver {
  constructor(
    private readonly page: Page,
    private readonly state: ScenarioState,
    private readonly testData: TestDataFactory,
  ) {}

  async gotoLogin() {
    await this.page.goto("/login");
    await expect(this.page.getByTestId("login-submit")).toBeVisible();
  }

  async gotoRegister() {
    await this.page.goto("/register");
    await expect(this.page.getByTestId("register-submit")).toBeVisible();
  }

  async gotoForgotPassword() {
    await this.page.goto("/forgot-password");
    await expect(this.page.getByTestId("forgot-password-submit")).toBeVisible();
  }

  async gotoUserSettings() {
    await this.page.goto("/userSettings");
    await expect(this.page.getByTestId("user-settings-name-input")).toBeVisible();
  }

  async gotoDashboard() {
    await this.page.goto("/dashboard");
    await expect(this.page.getByTestId("dashboard-page")).toBeVisible();
  }

  async gotoStatistics() {
    await this.page.goto("/statistics");
    await expect(this.page.getByTestId("statistics-page")).toBeVisible();
  }

  async gotoHowTo() {
    await this.page.goto("/howTo");
    await expect(this.page.getByTestId("how-to-page")).toBeVisible();
  }

  async gotoAppStatus() {
    await this.page.goto("/appStatus");
    await expect(this.page.getByTestId("app-status-page")).toBeVisible();
  }

  async ensureDefaultUserExists() {
    await this.testData.ensureDefaultUserExists(this.state);
  }

  async ensureScenarioUser(userKey: string) {
    return this.testData.ensureScenarioUser(this.state, userKey);
  }

  async login(
    username = runtimeEnv.username,
    password = runtimeEnv.password,
  ) {
    await this.gotoLogin();
    await this.page.getByTestId("login-username").fill(username);
    await this.page.getByTestId("login-password").fill(password);
    await this.page.getByTestId("login-submit").click();
    await this.expectApplicationShellVisible();
  }

  async loginAsUser(userKey: string) {
    const user = this.requireStoredUser(userKey);

    await this.logoutIfSignedIn();
    await this.login(user.email, user.password);
    this.state.activeUserKey = userKey;
  }

  async logout() {
    await this.page.getByTestId("sidebar-user-menu-button").click();
    await this.page.getByTestId("logout-button").click();
    this.state.activeUserKey = undefined;
  }

  async logoutIfSignedIn() {
    const userMenuButton = this.page.getByTestId("sidebar-user-menu-button");

    if (await userMenuButton.isVisible().catch(() => false)) {
      await this.logout();
      await this.expectLoginPageVisible();
    }
  }

  async expectLoginPageVisible() {
    await expect(this.page.getByTestId("login-submit")).toBeVisible();
    await expect(this.page).toHaveURL(LOGIN_PAGE_URL);
  }

  async expectApplicationShellVisible() {
    await expect(this.page.getByTestId("sidebar-trigger")).toBeVisible({
      timeout: 15_000,
    });
    await expect(this.page).not.toHaveURL(/\/login$/);
  }

  async createWorkspace(
    visibility: WorkspaceVisibility,
    workspaceName = this.createWorkspaceName(visibility),
  ) {
    await this.ensureWorkspaceNavigationVisible();
    await this.page.getByTestId("workspace-create-button").click();
    await expect(this.page.getByTestId("workspace-create-name")).toBeVisible();
    await this.page.getByTestId("workspace-create-name").fill(workspaceName);

    if (visibility === "private") {
      await this.page.getByTestId("workspace-create-private").click();
    }

    const createWorkspaceResponsePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes("/api/workspaces") &&
        response.request().method() === "POST",
      { timeout: 15_000 },
    );

    await this.page.getByTestId("workspace-create-submit").click();
    const createWorkspaceResponse = await createWorkspaceResponsePromise;
    if (!createWorkspaceResponse.ok()) {
      throw new Error(
        `Workspace creation failed with status ${createWorkspaceResponse.status()}.`,
      );
    }

    const createdWorkspace = (await createWorkspaceResponse.json()) as {
      cid: string;
      uuid: string;
    };

    await this.expectInsideWorkspace();
    this.testData.rememberWorkspace(this.state, {
      cid: createdWorkspace.cid,
      id: createdWorkspace.uuid,
      name: workspaceName,
      ownerUserKey: this.requireActiveUserKey(),
      visibility,
    });
  }

  async expectCreatedWorkspaceVisible() {
    const workspaceName = this.requireCreatedWorkspaceName();

    await expect(this.page.locator("body")).toContainText(workspaceName, {
      timeout: 15_000,
    });
  }

  async expectCreatedWorkspaceListedInSidebar() {
    const workspaceName = this.requireCreatedWorkspaceName();

    await this.ensureWorkspaceNavigationVisible();
    await expect(this.workspaceItemByName(workspaceName)).toBeVisible({
      timeout: 15_000,
    });
  }

  async expectInsideWorkspace() {
    await expect(this.page).toHaveURL(WORKSPACE_PAGE_URL, {
      timeout: 15_000,
    });
    await this.dismissWorkspaceTourIfPresent();
    await expect(
      this.page.getByTestId("workspace-document-menu-button"),
    ).toBeVisible();
  }

  async expectCurrentWorkspaceVisibility(visibility: WorkspaceVisibility) {
    await expect(this.page.getByTestId("workspace-visibility-badge")).toContainText(
      new RegExp(visibility, "i"),
      { timeout: 15_000 },
    );
  }

  async openFirstWorkspace() {
    if (this.state.createdWorkspaceId) {
      await this.openStoredWorkspace();
      await this.expectInsideWorkspace();
      return;
    }

    await this.createWorkspace("public");
  }

  async attemptDuplicateWorkspaceCreation() {
    const workspaceName = this.requireCreatedWorkspaceName();

    await this.ensureWorkspaceNavigationVisible();
    this.state.workspaceCountBeforeDuplicateAttempt = await this.workspaceItemByName(
      workspaceName,
    ).count();
    await this.page.getByTestId("workspace-create-button").click();
    await expect(this.page.getByTestId("workspace-create-name")).toBeVisible();
    await this.page.getByTestId("workspace-create-name").fill(workspaceName);
    await this.page.getByTestId("workspace-create-submit").click();
  }

  async expectDuplicateWorkspaceError() {
    await expect(this.page.getByTestId("workspace-create-error")).toBeVisible();
  }

  async expectWorkspaceNotCreated() {
    const workspaceName = this.requireCreatedWorkspaceName();
    const workspaceCountBeforeDuplicateAttempt =
      this.state.workspaceCountBeforeDuplicateAttempt ?? 1;

    await this.ensureWorkspaceNavigationVisible();
    await expect(this.workspaceItemByName(workspaceName)).toHaveCount(
      workspaceCountBeforeDuplicateAttempt,
      { timeout: 15_000 },
    );

    if (this.state.createdWorkspaceId) {
      await expect(this.page).toHaveURL(
        new RegExp(`/workspace/${this.state.createdWorkspaceId}(?:$|[/?])`),
        { timeout: 15_000 },
      );
    }
  }

  async changeCurrentWorkspaceVisibility(targetVisibility: WorkspaceVisibility) {
    await this.expectInsideWorkspace();
    await this.page.getByTestId("workspace-actions-menu-button").click();
    await this.page.getByTestId("workspace-actions-visibility-button").click();
    await this.page.getByTestId("workspace-visibility-confirm-button").click();

    this.testData.updateStoredWorkspaceVisibility(
      this.state,
      this.requireStoredWorkspaceId(),
      targetVisibility,
    );
  }

  async deleteCurrentWorkspace() {
    await this.expectInsideWorkspace();
    const workspaceId = this.requireStoredWorkspaceId();
    await this.page.getByTestId("workspace-actions-menu-button").click();
    await this.page.getByTestId("workspace-actions-delete-button").click();
    await this.page.getByTestId("workspace-delete-confirm-button").click();

    await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    this.testData.markWorkspaceDeleted(this.state, workspaceId);
  }

  async expectCurrentWorkspaceRemovedFromSidebar() {
    const workspaceName = this.requireCreatedWorkspaceName();

    await this.ensureWorkspaceNavigationVisible();
    await expect(this.workspaceItemByName(workspaceName)).toHaveCount(0, {
      timeout: 15_000,
    });
  }

  async uploadDocument() {
    ensureRuntimeFiles();
    await this.expectInsideWorkspace();

    const fileName = path.basename(runtimeEnv.uploadFile);
    this.state.uploadedDocumentName = fileName;

    await this.page.getByTestId("workspace-document-menu-button").click();
    await this.page.getByTestId("workspace-document-upload-button").click();
    await this.page
      .locator('input[type="file"]')
      .first()
      .setInputFiles(runtimeEnv.uploadFile);
    await this.page.getByTestId("document-upload-submit-button").click();

    await this.expectSuccessToast();
  }

  async expectUploadedDocumentVisible() {
    if (!this.state.uploadedDocumentName) {
      throw new Error("No uploaded document name is stored for this scenario.");
    }

    await expect(this.page.getByTestId("document-list-table")).toContainText(
      this.state.uploadedDocumentName,
      { timeout: 20_000 },
    );
  }

  async ensureDocumentExistsInWorkspace() {
    await this.expectInsideWorkspace();
    await this.uploadDocument();
    await this.expectUploadedDocumentVisible();
  }

  async openUploadedDocumentDetails() {
    const row = this.uploadedDocumentRow();
    await expect(row).toBeVisible({ timeout: 20_000 });
    await row.click();
    await this.expectDocumentDetailsVisible();
  }

  async expectDocumentDetailsVisible() {
    await expect(this.page).toHaveURL(DOCUMENT_DETAILS_PAGE_URL, {
      timeout: 15_000,
    });

    if (this.state.uploadedDocumentName) {
      await expect(this.page.locator("body")).toContainText(
        this.state.uploadedDocumentName,
        { timeout: 15_000 },
      );
    }

    await expect(this.page.getByTestId("document-details-tab")).toBeVisible();
    await expect(this.page.getByTestId("document-preview-tab")).toBeVisible();
    await expect(this.page.getByTestId("document-versions-tab")).toBeVisible();
  }

  async requestDocumentDownload() {
    const popupPromise = this.page
      .waitForEvent("popup", { timeout: 10_000 })
      .then(async (popup) => {
        await popup
          .waitForURL(/\/documents\/version\//, { timeout: 10_000 })
          .catch(() => undefined);
        return popup.url();
      });

    const requestPromise = this.page.context()
      .waitForEvent("request", {
        predicate: (request) => request.url().includes("/documents/version/"),
        timeout: 10_000,
      })
      .then((request) => request.url());

    await this.page.getByTestId("document-details-download-button").click();

    this.state.documentDownloadUrl = await Promise.any([
      popupPromise,
      requestPromise,
    ]);
  }

  async expectDocumentDownloadStarted() {
    expect(this.state.documentDownloadUrl).toContain("/documents/version/");
  }

  async deleteUploadedDocumentFromWorkspace() {
    const row = this.uploadedDocumentRow();
    await expect(row).toBeVisible({ timeout: 20_000 });

    await row.getByTestId("document-actions-trigger").click();
    await this.page.getByTestId("document-actions-delete").click();
  }

  async expectUploadedDocumentRemoved() {
    if (!this.state.uploadedDocumentName) {
      throw new Error("No uploaded document name is stored for this scenario.");
    }

    await expect(this.uploadedDocumentRow()).toHaveCount(0, {
      timeout: 20_000,
    });
  }

  async openDocumentDetailsTab(tab: "details" | "preview" | "versions") {
    const tabId =
      tab === "details"
        ? "document-details-tab"
        : tab === "preview"
          ? "document-preview-tab"
          : "document-versions-tab";

    await this.page.getByTestId(tabId).click();
  }

  async openDocumentMetadataSection() {
    await this.openDocumentDetailsTab("details");
    await this.ensureDocumentSectionExpanded(
      "document-metadata-section",
      "document-metadata-trigger",
    );
  }

  async openDocumentTagsSection() {
    await this.openDocumentDetailsTab("details");
    await this.ensureDocumentSectionExpanded(
      "document-tags-section",
      "document-tags-trigger",
    );
  }

  async openDocumentPerspectivesSection() {
    await this.openDocumentDetailsTab("details");
    await this.ensureDocumentSectionExpanded(
      "document-perspectives-section",
      "document-perspectives-trigger",
    );
  }

  async expectDocumentMetadataVisible() {
    await expect(this.page.getByTestId("document-metadata-grid")).toBeVisible();
  }

  async expectDocumentTagsVisible() {
    await expect(this.page.getByTestId("document-tags-content")).toBeVisible();
  }

  async expectDocumentPerspectivesVisible() {
    await expect(
      this.page.getByTestId("document-perspectives-content"),
    ).toBeVisible();
  }

  async expectDocumentPreviewVisible() {
    const docxPreview = this.page.getByTestId("document-docx-preview");
    const pdfPreview = this.page.getByTestId("document-pdf-preview");

    await Promise.any([
      expect(docxPreview).toBeVisible({ timeout: 20_000 }),
      expect(pdfPreview).toBeVisible({ timeout: 20_000 }),
    ]);
  }

  async expectDocumentVersionsVisible() {
    await expect(this.page.getByTestId("document-versions-table")).toBeVisible();
  }

  async registerNewAccount() {
    this.testData.rememberPendingScenarioUser(this.state, "registration");
    await this.gotoRegister();
    await this.submitRegistrationForm(this.requireStoredUser("registration"));
  }

  async registerWithExistingEmail() {
    await this.ensureDefaultUserExists();
    await this.gotoRegister();

    await this.submitRegistrationForm({
      name: "Existing Account",
      email: runtimeEnv.username,
      password: runtimeEnv.password,
    });
  }

  async registerWithInvalidEmail() {
    await this.gotoRegister();

    await this.submitRegistrationForm(
      {
        name: "Invalid Email User",
        email: "invalid-email",
        password: runtimeEnv.password,
      },
      { confirmPassword: runtimeEnv.password },
    );
  }

  async registerWithMismatchedPassword() {
    const user = this.testData.rememberPendingScenarioUser(
      this.state,
      "password-mismatch",
    );

    await this.gotoRegister();
    await this.submitRegistrationForm(user, {
      confirmPassword: `${user.password}-mismatch`,
    });
  }

  async expectRegistrationSucceeded() {
    await expect(this.page).toHaveURL(LOGIN_PAGE_URL, { timeout: 15_000 });
    await expect(this.page.getByTestId("login-submit")).toBeVisible();
  }

  async continueIntoApplicationAsRegisteredUser() {
    await this.loginAsUser("registration");
  }

  async expectRegistrationRejected() {
    await expect(this.page.getByTestId("register-submit")).toBeVisible();
    await expect(this.page).toHaveURL(/\/register/, { timeout: 5_000 });
  }

  async expectRegisterEmailTakenError() {
    await expect(this.page.getByTestId("register-email-taken-error")).toBeVisible();
  }

  async expectRegisterEmailFormatError() {
    await expect(this.page.getByTestId("register-email-error")).toBeVisible();
  }

  async expectRegisterPasswordMismatchError() {
    await expect(
      this.page.getByTestId("register-password-confirm-error"),
    ).toBeVisible();
  }

  async signInWithWrongPassword() {
    await this.ensureDefaultUserExists();
    await this.gotoLogin();
    await this.page.getByTestId("login-username").fill(runtimeEnv.username);
    await this.page.getByTestId("login-password").fill(`${runtimeEnv.password}-wrong`);
    await this.page.getByTestId("login-submit").click();
  }

  async signInWithInvalidEmailFormat() {
    await this.gotoLogin();
    await this.page.getByTestId("login-username").fill("invalid-email");
    await this.page.getByTestId("login-password").fill(runtimeEnv.password);
    await this.page.getByTestId("login-submit").click();
  }

  async signInWithUnknownAccount() {
    await this.gotoLogin();
    await this.page
      .getByTestId("login-username")
      .fill(`unknown-${Date.now()}@example.com`);
    await this.page.getByTestId("login-password").fill(runtimeEnv.password);
    await this.page.getByTestId("login-submit").click();
  }

  async expectLoginRejected() {
    await expect(this.page).toHaveURL(LOGIN_PAGE_URL);
  }

  async expectInvalidCredentialsError() {
    await expect(
      this.page.getByTestId("login-invalid-credentials-error"),
    ).toBeVisible();
  }

  async expectLoginEmailFormatError() {
    await expect(this.page.getByTestId("login-email-error")).toBeVisible();
  }

  async openPasswordRecoveryFromLogin() {
    await this.page.getByTestId("login-forgot-password-link").click();
  }

  async expectPasswordRecoveryPageVisible() {
    await expect(this.page.getByTestId("forgot-password-submit")).toBeVisible();
    await expect(this.page).toHaveURL(/\/forgot-password/, { timeout: 15_000 });
  }

  async createSignedInAccountSettingsUser() {
    await this.ensureScenarioUser("account-settings");
    await this.loginAsUser("account-settings");
    await this.gotoUserSettings();
  }

  async changeDisplayName() {
    const user = this.requireStoredUser("account-settings");
    const updatedDisplayName = `${user.name} Updated`;
    this.state.updatedDisplayName = updatedDisplayName;

    const input = this.page.getByTestId("user-settings-name-input");
    await input.fill(updatedDisplayName);
    await input.press("Enter");
  }

  async expectUpdatedDisplayNameShown() {
    const updatedDisplayName = this.state.updatedDisplayName;

    if (!updatedDisplayName) {
      throw new Error("No updated display name stored for this scenario.");
    }

    await this.page.getByTestId("sidebar-user-menu-button").click();
    await expect(this.page.getByTestId("sidebar-user-menu-label")).toContainText(
      updatedDisplayName,
    );
  }

  async changePreferredLanguage(language: "en" | "de") {
    this.state.selectedLanguage = language;

    await this.page.getByTestId("user-settings-language-trigger").click();
    await this.page.getByTestId(`user-settings-language-${language}`).click();
    await this.page.getByTestId("user-settings-save-button").click();
    await this.expectSuccessToast();
  }

  async expectPreferredLanguageSaved() {
    const selectedLanguage = this.state.selectedLanguage;

    if (!selectedLanguage) {
      throw new Error("No preferred language stored for this scenario.");
    }

    await this.page.reload();
    await expect(this.page.getByTestId("user-settings-language-trigger")).toContainText(
      selectedLanguage === "de" ? "Deutsch" : "English",
      { timeout: 15_000 },
    );
  }

  async updateNotificationPreference(preference: NotificationPreference) {
    const checkbox = this.page.getByTestId(
      this.notificationPreferenceTestId(preference),
    );
    const wasChecked = await this.checkboxIsChecked(checkbox);
    const checked = !wasChecked;

    await checkbox.click();
    this.state.updatedNotificationPreference = { preference, checked };
    await this.page.getByTestId("user-settings-save-button").click();
    await this.expectSuccessToast();
  }

  async expectNotificationPreferenceSaved(preference: NotificationPreference) {
    const updatedPreference = this.state.updatedNotificationPreference;

    if (!updatedPreference || updatedPreference.preference !== preference) {
      throw new Error(`No stored notification preference update for "${preference}".`);
    }

    await this.page.reload();
    const checkbox = this.page.getByTestId(
      this.notificationPreferenceTestId(preference),
    );

    await expect
      .poll(async () => this.checkboxIsChecked(checkbox), { timeout: 15_000 })
      .toBe(updatedPreference.checked);
  }

  async updateProfileAvatar() {
    ensureRuntimeFiles();

    await this.page
      .getByTestId("user-settings-avatar-input")
      .setInputFiles(runtimeEnv.avatarFile);
    await this.page.getByTestId("user-settings-save-button").click();
    await this.expectSuccessToast();
  }

  async expectUpdatedAvatarShown() {
    await expect(
      this.page.locator('[data-test-id="user-settings-avatar-button"] img'),
    ).toHaveAttribute("src", /blob:/, { timeout: 15_000 });
  }

  async deleteOwnAccount() {
    const activeUser = this.requireActiveUser();

    await this.page.getByTestId("user-settings-delete-user-trigger").click();
    await this.page
      .getByTestId("user-settings-delete-user-password")
      .fill(activeUser.password);
    await this.page.getByTestId("user-settings-delete-user-confirm").click();
  }

  async expectAccountDeleted() {
    await this.expectLoginPageVisible();
    this.testData.markUserDeleted(this.state, "account-settings");
  }

  async expectDeletedUserCannotAccessApplication() {
    const deletedUser = this.requireStoredUser("account-settings");

    await this.gotoLogin();
    await this.page.getByTestId("login-username").fill(deletedUser.email);
    await this.page.getByTestId("login-password").fill(deletedUser.password);
    await this.page.getByTestId("login-submit").click();
    await this.expectInvalidCredentialsError();
  }

  async createPrivateWorkspaceAsOwner() {
    await this.ensureDefaultUserExists();
    await this.loginAsUser("default");
    await this.createWorkspace("private");
  }

  async inviteUserToCurrentWorkspace(userKey: string) {
    const invitedUser = await this.ensureScenarioUser(userKey);

    await this.openWorkspaceSharePage();
    await this.page
      .getByTestId("workspace-share-email-input")
      .fill(invitedUser.email);
    await this.page.getByTestId("workspace-share-add-button").click();
    await this.expectCollaboratorVisible(invitedUser.email);
  }

  async expectInvitedUserHasWorkspaceAccess(userKey: string) {
    const workspaceName = this.requireCreatedWorkspaceName();

    await this.loginAsUser(userKey);
    await this.ensureWorkspaceNavigationVisible();
    await expect(this.workspaceItemByName(workspaceName)).toBeVisible({
      timeout: 15_000,
    });

    await this.openStoredWorkspace();
    await this.expectInsideWorkspace();
  }

  async ensureAnotherUserHasWorkspaceAccess() {
    await this.inviteUserToCurrentWorkspace("collaborator");
  }

  async removeCurrentWorkspaceCollaborator(userKey: string) {
    const user = this.requireStoredUser(userKey);

    await this.openWorkspaceSharePage();
    await this.collaboratorRow(user.email)
      .getByTestId("workspace-share-remove-button")
      .click();
  }

  async expectRemovedUserNoLongerHasAccess(userKey: string) {
    await this.loginAsUser(userKey);
    await this.attemptToOpenStoredWorkspace();
    await this.expectAccessDenied();
  }

  async signInAsUserWithoutWorkspaceAccess() {
    await this.ensureScenarioUser("outsider");
    await this.loginAsUser("outsider");
  }

  async attemptToOpenStoredWorkspace() {
    const workspaceId = this.requireStoredWorkspaceId();

    const accessResponsePromise = this.page
      .waitForResponse(
        (response) =>
          response.url().includes("/api/documents") &&
          response.url().includes(`workspace=${workspaceId}`),
        { timeout: 15_000 },
      )
      .catch(() => null);

    await this.page.goto(`/workspace/${workspaceId}`);
    const accessResponse = await accessResponsePromise;
    this.state.lastAccessDeniedStatus = accessResponse?.status();
  }

  async expectAccessDenied() {
    await expect.poll(() => this.state.lastAccessDeniedStatus).toBe(401);
    await expect(this.page.getByTestId("workspace-private-message")).toBeVisible();
  }

  async invitedUserLeavesWorkspace() {
    const invitedUser = this.requireStoredUser("collaborator");

    await this.loginAsUser("collaborator");
    await this.page.goto(`/workspace/${this.requireStoredWorkspaceId()}/share`);
    await expect(this.collaboratorRow(invitedUser.email)).toBeVisible();
    await this.collaboratorRow(invitedUser.email)
      .getByTestId("workspace-share-remove-button")
      .click();
  }

  async expectInvitedUserNoLongerHasAccess() {
    await this.attemptToOpenStoredWorkspace();
    await this.expectAccessDenied();
  }

  async expectOtherWorkspaceMembersRemainInvited() {
    const workspaceName = this.requireCreatedWorkspaceName();

    await this.loginAsUser("default");
    await this.ensureWorkspaceNavigationVisible();
    await expect(this.workspaceItemByName(workspaceName)).toBeVisible({
      timeout: 15_000,
    });
  }

  async openDashboardFromNavigation() {
    await this.page.getByTestId("nav-dashboard-button").click();
  }

  async expectDashboardDisplayed() {
    await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    await expect(this.page.getByTestId("dashboard-page")).toBeVisible();
  }

  async changeTheme(theme: ThemeMode) {
    this.state.selectedTheme = theme;

    await this.page.getByTestId("theme-toggle-button").click();
    await this.page.getByTestId(`theme-${theme}-option`).click();
  }

  async expectThemeApplied(theme: ThemeMode) {
    await expect
      .poll(
        async () =>
          this.page.evaluate(() => window.localStorage.getItem("theme")),
        { timeout: 15_000 },
      )
      .toBe(theme);

    if (theme === "dark") {
      await expect
        .poll(
          async () =>
            this.page.evaluate(() =>
              document.documentElement.classList.contains("dark"),
            ),
          { timeout: 15_000 },
        )
        .toBe(true);
    }

    if (theme === "light") {
      await expect
        .poll(
          async () =>
            this.page.evaluate(() =>
              document.documentElement.classList.contains("dark"),
            ),
          { timeout: 15_000 },
        )
        .toBe(false);
    }
  }

  async openAppStatusFromNavigation() {
    await this.page.getByTestId("nav-app-status-button").click();
  }

  async expectAppStatusDisplayed() {
    await expect(this.page).toHaveURL(/\/appStatus/, { timeout: 15_000 });
    await expect(this.page.getByTestId("app-status-health-overview")).toBeVisible();
  }

  async refreshAppStatus() {
    const healthResponsePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes("/api/health") &&
        !response.url().includes("/api/health/peers"),
      { timeout: 15_000 },
    );
    const peersResponsePromise = this.page.waitForResponse(
      (response) => response.url().includes("/api/health/peers"),
      { timeout: 15_000 },
    );

    await expect(this.page.getByTestId("app-status-refresh-button")).toBeEnabled();
    await this.page.getByTestId("app-status-refresh-button").click();
    const [healthResponse, peersResponse] = await Promise.all([
      healthResponsePromise,
      peersResponsePromise,
    ]);

    this.state.lastAppStatusRefreshSucceeded =
      healthResponse.ok() && peersResponse.ok();
  }

  async expectAppStatusRefreshed() {
    expect(this.state.lastAppStatusRefreshSucceeded).toBe(true);
    await expect(this.page.getByTestId("app-status-health-overview")).toBeVisible();
  }

  async openStatisticsFromNavigation() {
    await this.page.getByTestId("nav-statistics-button").click();
  }

  async expectStatisticsDisplayed() {
    await expect(this.page).toHaveURL(/\/statistics/, { timeout: 15_000 });
    await expect(this.page.getByTestId("statistics-page")).toBeVisible();
  }

  async openHelpFromNavigation() {
    await this.page.getByTestId("nav-how-to-button").click();
  }

  async expectHelpContentDisplayed() {
    await expect(this.page).toHaveURL(/\/howTo/, { timeout: 15_000 });
    await expect(this.page.getByTestId("how-to-page")).toBeVisible();
  }

  private workspaceItems(): Locator {
    return this.page.locator('[data-sidebar="menu-sub-button"]');
  }

  private workspaceItemByName(name: string): Locator {
    return this.workspaceItems().filter({ hasText: name });
  }

  private collaboratorRow(email: string): Locator {
    return this.page
      .getByTestId("workspace-share-collaborator-row")
      .filter({ hasText: email })
      .first();
  }

  private uploadedDocumentRow(): Locator {
    if (!this.state.uploadedDocumentName) {
      throw new Error("No uploaded document name is stored for this scenario.");
    }

    return this.page
      .getByTestId("document-row")
      .filter({ hasText: this.state.uploadedDocumentName })
      .first();
  }

  private async ensureDocumentSectionExpanded(
    sectionTestId: string,
    triggerTestId: string,
  ) {
    const section = this.page.getByTestId(sectionTestId);
    await expect(section).toBeVisible();

    const trigger = this.page.getByTestId(triggerTestId);
    if ((await trigger.getAttribute("aria-expanded")) !== "true") {
      await trigger.click();
    }
  }

  private async ensureWorkspaceNavigationVisible() {
    const createButton = this.page.getByTestId("workspace-create-button");
    if (await createButton.isVisible()) {
      return;
    }

    await this.page.getByTestId("sidebar-trigger").click();
    await expect(createButton).toBeVisible({ timeout: 10_000 });
  }

  private async dismissWorkspaceTourIfPresent() {
    const confirmButton = this.page.getByTestId(
      "workspace-tour-confirm-button",
    );

    if (await confirmButton.isVisible().catch(() => false)) {
      await confirmButton.click();
    }
  }

  private createWorkspaceName(visibility: WorkspaceVisibility) {
    return `${runtimeEnv.workspacePrefix} ${visibility} ${Date.now()}`;
  }

  private requireStoredUser(userKey: string) {
    const user = this.state.users?.[userKey];

    if (!user) {
      throw new Error(`No stored user found for key "${userKey}".`);
    }

    return user;
  }

  private requireActiveUser() {
    if (!this.state.activeUserKey) {
      throw new Error("No active user is stored for this scenario.");
    }

    return this.requireStoredUser(this.state.activeUserKey);
  }

  private requireActiveUserKey() {
    if (!this.state.activeUserKey) {
      throw new Error("No active user key is stored for this scenario.");
    }

    return this.state.activeUserKey;
  }

  private requireCreatedWorkspaceName() {
    if (!this.state.createdWorkspaceName) {
      throw new Error("No created workspace name is stored for this scenario.");
    }

    return this.state.createdWorkspaceName;
  }

  private requireStoredWorkspaceId() {
    if (!this.state.createdWorkspaceId) {
      throw new Error("No workspace id is stored for this scenario.");
    }

    return this.state.createdWorkspaceId;
  }

  private async submitRegistrationForm(
    user: TestUser,
    options?: { confirmPassword?: string },
  ) {
    await this.page.getByTestId("register-name").fill(user.name);
    await this.page.getByTestId("register-email").fill(user.email);
    await this.page.getByTestId("register-password").fill(user.password);
    await this.page
      .getByTestId("register-password-confirm")
      .fill(options?.confirmPassword ?? user.password);
    await this.page.getByTestId("register-terms").check();
    await this.page.getByTestId("register-submit").click();
  }

  private notificationPreferenceTestId(preference: NotificationPreference) {
    if (preference === "document updates") {
      return "user-settings-notification-document-changed";
    }

    if (preference === "workspace invitations") {
      return "user-settings-notification-added-to-workspace";
    }

    return "user-settings-notification-workspace-change";
  }

  private async checkboxIsChecked(locator: Locator) {
    const state = await locator.getAttribute("data-state");
    return state === "checked";
  }

  private async openWorkspaceSharePage() {
    await this.expectInsideWorkspace();
    await this.page.getByTestId("workspace-actions-menu-button").click();
    await this.page.getByTestId("workspace-actions-share-button").click();
    await expect(this.page).toHaveURL(/\/share$/, { timeout: 15_000 });
  }

  private async openStoredWorkspace() {
    await this.page.goto(`/workspace/${this.requireStoredWorkspaceId()}`);
  }

  private async expectCollaboratorVisible(email: string) {
    await expect(this.collaboratorRow(email)).toBeVisible({ timeout: 15_000 });
  }

  private async expectSuccessToast() {
    await expect(this.page.locator(".Toastify__toast--success")).toBeVisible({
      timeout: 15_000,
    });
  }
}
