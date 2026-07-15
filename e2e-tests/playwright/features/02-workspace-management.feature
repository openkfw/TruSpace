@manual @workspace
Feature: Workspace management
  Manual Playwright BDD coverage for creating and maintaining workspaces.

  Background:
    Given a signed-in user is on the workspace overview

  @smoke @ci-candidate
  Scenario: Create a workspace with a new name
    When the user creates a workspace with a new name
    Then the workspace is created
    And the workspace appears in the workspace overview

  @ci-candidate
  Scenario: Prevent duplicate workspace names
    Given a workspace with the requested name already exists
    When the user creates a workspace with that same name
    Then the workspace is not created
    And the user is informed that the name is already in use

  @ci-candidate
  Scenario: Create a private workspace
    When the user creates a private workspace with a new name
    Then the workspace is created
    And the workspace is created as private

  @ci-candidate
  Scenario: Create a public workspace
    When the user creates a public workspace with a new name
    Then the workspace is created
    And the workspace is created as public

  @wip
  Scenario: Edit workspace details
    Given the user owns an existing workspace
    When the user updates the workspace details
    Then the workspace details are saved

  @ci-candidate
  Scenario: Change a workspace from private to public
    Given the user owns a private workspace
    When the user changes the workspace visibility to public
    Then the workspace becomes public

  @ci-candidate
  Scenario: Change a workspace from public to private
    Given the user owns a public workspace
    When the user changes the workspace visibility to private
    Then the workspace becomes private

  @destructive @ci-candidate
  Scenario: Delete a workspace
    Given the user owns an existing workspace
    When the user deletes the workspace
    Then the workspace is removed from the workspace overview
