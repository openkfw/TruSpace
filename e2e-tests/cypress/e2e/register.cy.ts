describe("Register test user spec", () => {
  it("register test user", () => {
    cy.visit(Cypress.env("baseUrl"));
    cy.get('[data-test-id="login-signup-link"]').click();
    cy.get('[data-test-id="register-name"]').type("Cypress Test User");
    cy.get('[data-test-id="register-email"]').type(Cypress.env("username"));
    cy.get('[data-test-id="register-password"]').type(Cypress.env("password"));
    cy.get('[data-test-id="register-password-confirm"]').type(
      Cypress.env("password")
    );
    cy.get('[data-test-id="register-submit"]').click();

    // verify that the user is redirected to the login page
    cy.url().should("include", "/login");
    // verify that the login form is visible
    cy.get('[data-test-id="login-submit"]').should("be.visible");
  });
});
