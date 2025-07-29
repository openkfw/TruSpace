import { resetUsers } from "../actions/db";
import {
  deleteAllChats,
  deleteAllDocuments,
  deleteAllWorkspaces,
} from "../actions/ipfs";

describe("Cleanup spec", () => {
  it("cleans up environment", () => {
    resetUsers();

    deleteAllChats();
    deleteAllDocuments();
    deleteAllWorkspaces();
  });
});
