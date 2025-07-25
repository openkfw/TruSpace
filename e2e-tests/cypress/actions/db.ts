const dbPath = "../volumes/db/truspace.db";

export const resetUsers = () => {
  // connect to sqllite database
  cy.task("runSqliteQuery", {
    dbPath,
    query: "DELETE FROM users; DELETE FROM user_permissions;",
  }).then((res) => {
    cy.log("Delete result:", JSON.stringify(res));
  });
};
