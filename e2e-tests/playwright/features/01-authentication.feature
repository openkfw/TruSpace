@auth
Feature: Authentication
  Playwright BDD coverage for access, validation, and recovery flows.

  @smoke
  Scenario: Successful login
    Given a registered user is on the login page
    When the user signs in with valid credentials
    Then the application shell is displayed

  Scenario: Login fails with a wrong password
    Given a registered user is on the login page
    When the user signs in with a valid email and an invalid password
    Then the login is rejected
    And the user is informed that the credentials are invalid

  Scenario: Login fails with an invalid email format
    Given a visitor is on the login page
    When the visitor signs in with an invalid email format
    Then the login is rejected
    And the user is informed that the email format is invalid

  Scenario: Login fails for an unknown account
    Given a visitor is on the login page
    When the visitor signs in with an email that is not registered
    Then the login is rejected
    And the user is informed that the credentials are invalid

  Scenario: Start password recovery
    Given a visitor is on the login page
    When the visitor chooses the password recovery option
    Then the password recovery page is displayed

  @smoke
  Scenario: Successful logout
    Given a signed-in user is using the application
    When the user logs out
    Then the login page is displayed

  @wip
  Scenario: Session expired during use
    Given a signed-in user is using the application
    And the user session has expired
    When the user performs the next action
    Then the user is redirected to the login page
    And the user is informed that the session has expired
