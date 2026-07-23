@document @insights
Feature: Document detail and insights
  Playwright BDD coverage for reviewing document content and insights.

  Background:
    Given a signed-in user is viewing a document in a dedicated workspace

  @wip
  Scenario: Preview a document
    When the user opens the document preview
    Then a preview of the document is displayed

  @wip
  Scenario: View document version history
    When the user opens the version history
    Then the available document versions are displayed

  @wip
  Scenario: View document metadata
    When the user opens the document information
    Then the document metadata is displayed

  @wip
  Scenario: View perspectives for a document
    When the user opens the document perspectives
    Then the perspectives for the document are displayed

  @wip
  Scenario: View tags for a document
    When the user opens the document tags
    Then the tags for the document are displayed
