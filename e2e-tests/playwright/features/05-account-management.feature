@manual @account
Feature: Account management
  Manual Playwright BDD coverage for registration and user settings.

  @ci-candidate
  Scenario: Successful registration
    Given a visitor is on the registration page
    When the visitor registers with valid account details
    Then the account is created successfully
    And the user can continue into the application

  @ci-candidate
  Scenario: Registration fails for an existing email address
    Given a visitor is on the registration page
    When the visitor registers with an email address that already exists
    Then the registration is rejected
    And the user is informed that the email address is already in use

  @ci-candidate
  Scenario: Registration fails for an invalid email format
    Given a visitor is on the registration page
    When the visitor registers with an invalid email format
    Then the registration is rejected
    And the user is informed that the registration email format is invalid

  @ci-candidate
  Scenario: Registration fails when the password confirmation does not match
    Given a visitor is on the registration page
    When the visitor enters a password and a different password confirmation
    Then the registration is rejected
    And the user is informed that the passwords do not match

  @ci-candidate
  Scenario: Change display name
    Given a signed-in user is on the account settings page
    When the user changes the display name
    Then the updated display name is shown in the application

  @ci-candidate
  Scenario: Save a preferred language
    Given a signed-in user is on the account settings page
    When the user selects a different preferred language
    Then the preferred language is saved

  @ci-candidate
  Scenario Outline: Change notification preferences
    Given a signed-in user is on the account settings page
    When the user updates the "<notification_type>" notification preference
    Then the "<notification_type>" notification preference is saved

    Examples:
      | notification_type     |
      | document updates      |
      | workspace invitations |
      | workspace changes     |

  @ci-candidate
  Scenario: Change avatar
    Given a signed-in user is on the account settings page
    When the user updates the profile avatar
    Then the new avatar is shown in the user profile

  @destructive @ci-candidate
  Scenario: Delete own account
    Given a signed-in user is on the account settings page
    When the user deletes the account
    Then the account is removed
    And the user can no longer access the application with that account
