import { login, logout } from "../actions/login";

describe("Workspaces spec", () => {
  it("creates new public workspace", () => {
    login();

    cy.get('[data-test-id="sidebar-trigger"]').click();
    cy.get('[data-test-id="workspace-create-button"]').click();
    cy.get('[data-test-id="workspace-create-name"]').type(
      "Cypress Test Workspace"
    );
    cy.get('[data-test-id="workspace-create-submit"]').click();

    logout();
  });

  it("creates new private workspace", () => {
    login();

    cy.get('[data-test-id="sidebar-trigger"]').click();
    cy.get('[data-test-id="workspace-create-button"]').click();
    cy.get('[data-test-id="workspace-create-name"]').type(
      "Cypress Test Private Workspace"
    );
    cy.get('[data-test-id="workspace-create-private"]').click();
    cy.get('[data-test-id="workspace-create-submit"]').click();

    logout();
  });
});
