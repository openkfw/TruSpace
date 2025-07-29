import { login, logout } from "../actions/login";

describe("Files spec", () => {
  it("upload a file", () => {
    login();
    cy.get('[data-sidebar="menu-sub-button"]:first').click();
    // click on button if it exists
    cy.get('[data-test-id="workspace-tour-confirm-button"]').then(($btn) => {
      if ($btn.length) {
        cy.wrap($btn).click();
      }
    });
    cy.get('[data-test-id="workspace-document-menu-button"]').click();
    cy.get('[data-test-id="workspace-document-upload-button"]').click();
    cy.get("input[type=file]").selectFile("./cypress/files/Koalas.docx", {
      force: true,
    });
    cy.get('[data-test-id="document-upload-submit-button"]').click();

    cy.get(".Toastify__toast--success").should("be.visible");
    cy.get('[data-test-id="document-list-table"]').should(
      "contain",
      "Koalas.docx"
    );
    logout();
  });
});
