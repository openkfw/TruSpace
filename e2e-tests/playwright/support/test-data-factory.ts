import type { Page } from "@playwright/test";

import { runtimeEnv } from "./runtime-env";
import type {
  ScenarioState,
  ScenarioWorkspace,
  TestUser,
  WorkspaceVisibility,
} from "./scenario-types";

const CSRF_COOKIE_NAME = "XSRF-TOKEN";

type RegisterOptions = {
  allowConflict?: boolean;
};

export class TestDataFactory {
  constructor(private readonly page: Page) {}

  async ensureDefaultUserExists(state: ScenarioState) {
    const defaultUser = this.storeUser(state, "default", {
      email: runtimeEnv.username,
      name: "Playwright Default User",
      password: runtimeEnv.password,
    });

    await this.registerUserViaApi(defaultUser, { allowConflict: true });
    return defaultUser;
  }

  async ensureScenarioUser(state: ScenarioState, userKey: string) {
    const existingUser = this.lookupUser(state, userKey);
    if (existingUser) {
      return existingUser;
    }

    const user = this.storeUser(state, userKey, this.buildUser(userKey), {
      cleanup: true,
    });
    await this.registerUserViaApi(user);
    return user;
  }

  rememberPendingScenarioUser(state: ScenarioState, userKey: string) {
    return (
      this.lookupUser(state, userKey) ??
      this.storeUser(state, userKey, this.buildUser(userKey), {
        cleanup: true,
      })
    );
  }

  rememberWorkspace(state: ScenarioState, workspace: ScenarioWorkspace) {
    const existingWorkspaces = state.createdWorkspaces ?? [];
    const nextWorkspaces = existingWorkspaces.filter(
      (existingWorkspace) => existingWorkspace.id !== workspace.id,
    );

    nextWorkspaces.push(workspace);

    state.createdWorkspaces = nextWorkspaces;
    state.createdWorkspaceCid = workspace.cid;
    state.createdWorkspaceId = workspace.id;
    state.createdWorkspaceName = workspace.name;
    state.createdWorkspaceVisibility = workspace.visibility;
  }

  updateStoredWorkspaceVisibility(
    state: ScenarioState,
    workspaceId: string,
    visibility: WorkspaceVisibility,
  ) {
    state.createdWorkspaceVisibility = visibility;
    state.createdWorkspaces = (state.createdWorkspaces ?? []).map((workspace) =>
      workspace.id === workspaceId ? { ...workspace, visibility } : workspace,
    );
  }

  markWorkspaceDeleted(state: ScenarioState, workspaceId: string) {
    state.createdWorkspaces = (state.createdWorkspaces ?? []).map((workspace) =>
      workspace.id === workspaceId ? { ...workspace, deleted: true } : workspace,
    );
  }

  markUserDeleted(state: ScenarioState, userKey: string) {
    state.deletedUserKeys = appendUnique(state.deletedUserKeys, userKey);

    if (state.activeUserKey === userKey) {
      state.activeUserKey = undefined;
    }
  }

  async cleanupScenarioData(state: ScenarioState) {
    const workspacesToDelete = [...(state.createdWorkspaces ?? [])]
      .filter((workspace) => !workspace.deleted)
      .reverse();

    for (const workspace of workspacesToDelete) {
      const owner = this.lookupUser(state, workspace.ownerUserKey);
      if (!owner) {
        throw new Error(
          `Cannot clean up workspace "${workspace.name}" without its owner "${workspace.ownerUserKey}".`,
        );
      }

      const wasDeleted = await this.deleteWorkspaceAsUser(owner, workspace);
      if (wasDeleted) {
        this.markWorkspaceDeleted(state, workspace.id);
      }
    }

    const usersToDelete = [...new Set(state.cleanupUserKeys ?? [])].reverse();
    for (const userKey of usersToDelete) {
      if (this.userWasDeleted(state, userKey)) {
        continue;
      }

      const user = this.lookupUser(state, userKey);
      if (!user) {
        continue;
      }

      const wasDeleted = await this.deleteUserAsSelf(user);
      if (wasDeleted) {
        this.markUserDeleted(state, userKey);
      }
    }

    await this.page.context().clearCookies();
  }

  private lookupUser(state: ScenarioState, userKey: string) {
    return state.users?.[userKey];
  }

  private storeUser(
    state: ScenarioState,
    userKey: string,
    user: TestUser,
    options?: { cleanup?: boolean },
  ) {
    state.users = {
      ...(state.users ?? {}),
      [userKey]: user,
    };

    if (options?.cleanup) {
      state.cleanupUserKeys = appendUnique(state.cleanupUserKeys, userKey);
    }

    return user;
  }

  private buildUser(userKey: string): TestUser {
    const normalizedKey = userKey.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const uniqueId = `${Date.now()}-${Math.round(Math.random() * 100000)}`;

    return {
      email: `playwright-${normalizedKey}-${uniqueId}@example.com`,
      name: `Playwright ${userKey} ${uniqueId}`,
      password: runtimeEnv.password,
    };
  }

  private async registerUserViaApi(
    user: TestUser,
    options?: RegisterOptions,
  ) {
    const response = await this.page.request.post(
      `${runtimeEnv.apiUrl}/api/users/register`,
      {
        data: {
          confirmationLink: `${runtimeEnv.baseUrl}/confirm`,
          confirmPassword: user.password,
          email: user.email,
          lang: "en",
          name: user.name,
          password: user.password,
        },
      },
    );

    if (response.ok()) {
      return;
    }

    if (options?.allowConflict && response.status() === 409) {
      return;
    }

    throw new Error(
      `Failed to register user "${user.email}" via API. Status: ${response.status()}`,
    );
  }

  private async deleteWorkspaceAsUser(
    user: TestUser,
    workspace: ScenarioWorkspace,
  ) {
    await this.loginViaApi(user);
    const csrfToken = await this.ensureCsrfToken();
    const response = await this.page.request.delete(
      `${runtimeEnv.apiUrl}/api/workspaces/${workspace.cid}/${workspace.id}`,
      {
        headers: {
          "X-CSRF-Token": csrfToken,
        },
      },
    );

    if (response.ok() || response.status() === 404) {
      return true;
    }

    throw new Error(
      `Failed to delete workspace "${workspace.name}" during cleanup. Status: ${response.status()}`,
    );
  }

  private async deleteUserAsSelf(user: TestUser) {
    const canAuthenticate = await this.tryLoginViaApi(user);
    if (!canAuthenticate) {
      return false;
    }

    const csrfToken = await this.ensureCsrfToken();
    const response = await this.page.request.delete(
      `${runtimeEnv.apiUrl}/api/users/delete-user`,
      {
        headers: {
          "X-CSRF-Token": csrfToken,
        },
      },
    );

    if (response.ok() || response.status() === 404) {
      return true;
    }

    throw new Error(
      `Failed to delete user "${user.email}" during cleanup. Status: ${response.status()}`,
    );
  }

  private async loginViaApi(user: TestUser) {
    const canAuthenticate = await this.tryLoginViaApi(user);
    if (!canAuthenticate) {
      throw new Error(`Failed to authenticate cleanup user "${user.email}".`);
    }
  }

  private async tryLoginViaApi(user: TestUser) {
    await this.page.context().clearCookies();

    const response = await this.page.request.post(
      `${runtimeEnv.apiUrl}/api/users/login`,
      {
        data: {
          email: user.email,
          password: user.password,
        },
      },
    );

    return response.ok();
  }

  private async ensureCsrfToken() {
    const response = await this.page.request.get(
      `${runtimeEnv.apiUrl}/api/workspaces`,
    );

    if (!response.ok()) {
      throw new Error(
        `Failed to establish CSRF token for cleanup. Status: ${response.status()}`,
      );
    }

    const cookies = await this.page.context().cookies(runtimeEnv.apiUrl);
    const csrfCookie = cookies.find((cookie) => cookie.name === CSRF_COOKIE_NAME);

    if (!csrfCookie?.value) {
      throw new Error("Failed to read the CSRF token cookie for cleanup.");
    }

    return csrfCookie.value;
  }

  private userWasDeleted(state: ScenarioState, userKey: string) {
    return (state.deletedUserKeys ?? []).includes(userKey);
  }
}

function appendUnique(values: string[] | undefined, value: string) {
  if (values?.includes(value)) {
    return values;
  }

  return [...(values ?? []), value];
}
