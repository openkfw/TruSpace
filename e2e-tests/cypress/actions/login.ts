export function login(
  username = Cypress.env("username"),
  password = Cypress.env("password")
) {
  cy.log(Cypress.env("baseUrl"));
  cy.visit(Cypress.env("baseUrl"));
  cy.get('[data-test-id="login-username"]').type(username);
  cy.get('[data-test-id="login-password"]').type(password);
  cy.get('[data-test-id="login-submit"]').click();

  // if add button is visible make request
  cy.get('[data-test-id="sidebar-trigger"]').should("be.visible");
}

export function logout() {
  cy.get('[data-test-id="sidebar-user-menu-label"]').click();
  cy.get('[data-test-id="logout-button"]').click();

  cy.get('[data-test-id="login-submit"]').should("be.visible");
}
