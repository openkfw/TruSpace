@account
Feature: Account management
  Playwright BDD coverage for registration and user settings.

  Scenario: Successful registration
    Given a visitor is on the registration page
    When the visitor registers with valid account details
    Then the account is created successfully
    And the user can continue into the application

  Scenario: Registration fails for an existing email address
    Given a visitor is on the registration page
    When the visitor registers with an email address that already exists
    Then the registration is rejected
    And the user is informed that the email address is already in use

  Scenario: Registration fails for an invalid email format
    Given a visitor is on the registration page
    When the visitor registers with an invalid email format
    Then the registration is rejected
    And the user is informed that the registration email format is invalid

  Scenario: Registration fails when the password confirmation does not match
    Given a visitor is on the registration page
    When the visitor enters a password and a different password confirmation
    Then the registration is rejected
    And the user is informed that the passwords do not match

  Scenario: Change display name
    Given a signed-in user is on the account settings page
    When the user changes the display name
    Then the updated display name is shown in the application

  Scenario: Save a preferred language
    Given a signed-in user is on the account settings page
    When the user selects a different preferred language
    Then the preferred language is saved

  Scenario Outline: Change notification preferences
    Given a signed-in user is on the account settings page
    When the user updates the "<notification_type>" notification preference
    Then the "<notification_type>" notification preference is saved

    Examples:
      | notification_type     |
      | document updates      |
      | workspace invitations |
      | workspace changes     |

  Scenario: Change avatar
    Given a signed-in user is on the account settings page
    When the user updates the profile avatar
    Then the new avatar is shown in the user profile

  @destructive
  Scenario: Delete own account
    Given a signed-in user is on the account settings page
    When the user deletes the account
    Then the account is removed
    And the user can no longer access the application with that account
