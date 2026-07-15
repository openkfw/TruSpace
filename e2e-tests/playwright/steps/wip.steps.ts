import { Given, Then, When } from "./fixtures";

const notYetAutomated = async () => {
  throw new Error(
    "This scenario is tagged @wip and intentionally excluded from automated execution.",
  );
};

Given("the user session has expired", notYetAutomated);
Given("a signed-in user opens the application on a mobile device", notYetAutomated);
When("the user performs the next action", notYetAutomated);
When("the user updates the workspace details", notYetAutomated);
When("the user uploads an unsupported document type", notYetAutomated);
When("the application starts", notYetAutomated);
Then("the user is redirected to the login page", notYetAutomated);
Then("the user is informed that the session has expired", notYetAutomated);
Then("the workspace details are saved", notYetAutomated);
Then("the upload is rejected", notYetAutomated);
Then("the user is informed that the file type is not supported", notYetAutomated);
Then("onboarding guidance is shown", notYetAutomated);
