@navigation
Feature: Application experience
  Playwright BDD coverage for navigation, theme settings, and status pages.

  @smoke
  Scenario: Open the dashboard
    Given a signed-in user is using the application
    When the user opens the dashboard
    Then the dashboard is displayed

  @smoke
  Scenario Outline: Change the theme
    Given a signed-in user is using the application
    When the user changes the theme to "<theme>"
    Then the application uses the "<theme>" theme

    Examples:
      | theme  |
      | light  |
      | dark   |
      | system |

  @smoke
  Scenario: View application status
    Given a signed-in user is using the application
    When the user opens the application status page
    Then the current system health is displayed

  @wip
  Scenario: Refresh application status
    Given a signed-in user is on the application status page
    When the user refreshes the status
    Then the system health information is updated

  @smoke
  Scenario: View statistics
    Given a signed-in user is using the application
    When the user opens the statistics page
    Then the available statistics are displayed

  @smoke
  Scenario: View desktop help content
    Given a signed-in user is using the application on a desktop device
    When the user opens contextual help
    Then explanatory guidance is displayed

  @wip
  Scenario: View mobile onboarding guidance
    Given a signed-in user opens the application on a mobile device
    When the application starts
    Then onboarding guidance is shown
