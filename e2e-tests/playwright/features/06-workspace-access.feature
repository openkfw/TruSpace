@manual @workspace @sharing
Feature: Workspace access and permissions
  Manual Playwright BDD coverage for sharing and removing workspace access.

  Background:
    Given a signed-in user owns a private workspace

  @sharing @ci-candidate
  Scenario: Invite another user to a workspace
    When the owner invites another user to the workspace
    Then the invited user receives access to the workspace

  @sharing @destructive @ci-candidate
  Scenario: Remove another user from a workspace
    Given another user already has access to the workspace
    When the owner removes that user from the workspace
    Then the removed user no longer has access to the workspace

  @sharing @ci-candidate
  Scenario: Deny access to a user without permission
    Given another signed-in user does not have access to the workspace
    When the user attempts to open that workspace
    Then access is denied

  @sharing @destructive @ci-candidate
  Scenario: Leave a workspace while others remain invited
    Given another user already has access to the workspace
    When the invited user leaves the workspace
    Then that member no longer has access to the workspace
    And the other members remain invited
