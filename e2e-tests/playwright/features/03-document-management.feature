@document
Feature: Document management
  Playwright BDD coverage for the core document lifecycle in a workspace.

  Background:
    Given a signed-in user is in a dedicated workspace

  @smoke
  Scenario: Upload a supported document
    When the user uploads a supported document
    Then the document appears in the workspace document list

  @wip
  Scenario: Reject an unsupported document type
    When the user uploads an unsupported document type
    Then the upload is rejected
    And the user is informed that the file type is not supported

  Scenario: View document details
    Given a document exists in the current scenario workspace
    When the user opens the document details
    Then the document details are displayed

  Scenario: Download a document
    Given a document exists in the current scenario workspace
    When the user downloads the document
    Then the document download starts successfully

  @destructive
  Scenario: Delete a document
    Given a document exists in the current scenario workspace
    When the user deletes the document
    Then the document is removed from the workspace
