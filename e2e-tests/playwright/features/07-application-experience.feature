@manual @navigation
Feature: Application experience
  Manual Playwright BDD coverage for navigation, theme settings, and status pages.

  @smoke @ci-candidate
  Scenario: Open the dashboard
    Given a signed-in user is using the application
    When the user opens the dashboard
    Then the dashboard is displayed

  @ci-candidate
  Scenario Outline: Change the theme
    Given a signed-in user is using the application
    When the user changes the theme to "<theme>"
    Then the application uses the "<theme>" theme

    Examples:
      | theme  |
      | light  |
      | dark   |
      | system |

  @ci-candidate
  Scenario: View application status
    Given a signed-in user is using the application
    When the user opens the application status page
    Then the current system health is displayed

  @ci-candidate
  Scenario: Refresh application status
    Given a signed-in user is on the application status page
    When the user refreshes the status
    Then the system health information is updated

  @ci-candidate
  Scenario: View statistics
    Given a signed-in user is using the application
    When the user opens the statistics page
    Then the available statistics are displayed

  @ci-candidate
  Scenario: View desktop help content
    Given a signed-in user is using the application on a desktop device
    When the user opens contextual help
    Then explanatory guidance is displayed

  @wip
  Scenario: View mobile onboarding guidance
    Given a signed-in user opens the application on a mobile device
    When the application starts
    Then onboarding guidance is shown
