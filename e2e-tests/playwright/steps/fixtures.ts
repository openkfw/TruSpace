import { createBdd, test as base } from "playwright-bdd";

import { AppDriver } from "../support/app-driver";
import type { ScenarioState } from "../support/scenario-types";
import { TestDataFactory } from "../support/test-data-factory";

type Fixtures = {
  app: AppDriver;
  scenarioState: ScenarioState;
  testData: TestDataFactory;
};

export const test = base.extend<Fixtures>({
  scenarioState: async ({}, use) => {
    await use({
      cleanupUserKeys: [],
      createdWorkspaces: [],
      deletedUserKeys: [],
    });
  },
  testData: async ({ page }, use) => {
    await use(new TestDataFactory(page));
  },
  app: async ({ page, scenarioState, testData }, use) => {
    await use(new AppDriver(page, scenarioState, testData));
  },
});

export const { After, Given, When, Then } = createBdd(test);

After({ name: "Clean up scenario test data" }, async ({ scenarioState, testData }) => {
  await testData.cleanupScenarioData(scenarioState);
});
