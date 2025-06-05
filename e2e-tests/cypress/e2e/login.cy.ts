import { login, logout } from "../actions/login";

describe("Login spec", () => {
  it("logs in test user", () => {
    login();

    logout();
  });
});
