declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to set a global variable.
       * @example cy.setGlobal('greeting', 'hello')
       */
      setGlobal(key: string, value: any): Chainable<void>;

      /**
       * Custom command to get a global variable.
       * @example cy.getGlobal('greeting')
       */
      getGlobal(key: string): Chainable<any>;
    }
  }
}

Cypress.SelectorPlayground.defaults({
  onElement: ($el) => {
    const customId = $el.attr("data-test-id");

    if (customId) {
      return `[data-test-id=${customId}]`;
    }
  },
});

Cypress.Commands.add("setGlobal", (key, value) => {
  if (!Cypress.env("globalVars")) {
    Cypress.env("globalVars", {});
  }
  const vars = Cypress.env("globalVars");
  vars[key] = value;
  Cypress.env("globalVars", vars);
});

Cypress.Commands.add("getGlobal", (key) => {
  return Cypress.env("globalVars")?.[key];
});
