export const deleteAllDocuments = () => {
  cy.task("runBashScript", "../helper-scripts/delete-all-documents.sh");
};

export const deleteAllWorkspaces = () => {
  cy.task("runBashScript", "../helper-scripts/delete-all-workspaces.sh");
};

export const deleteAllChats = () => {
  cy.task("runBashScript", "../helper-scripts/delete-all-chats.sh");
};
