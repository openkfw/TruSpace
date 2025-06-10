import path from "path";

const isContainer = process.env.CONTAINER === "true";
const cwd = process.cwd();
let dbPath: string;

if (isContainer) {
  dbPath = process.env.DATABASE_PATH || "/app/data/truspace.db";
} else {
  dbPath =
    process.env.DATABASE_PATH || path.resolve(cwd, "../volumes/db/truspace.db");
}

const knexConfig = {
  development: {
    client: "sqlite3",
    connection: {
      filename: dbPath,
    },
    migrations: {
      directory: path.resolve(cwd, "src/db/migrations"),
    },
    seeds: {
      directory: path.resolve(cwd, "src/db/seeds"),
    },
    useNullAsDefault: true,
  },
  test: {
    client: "sqlite3",
    connection: {
      filename: ":memory:",
    },
    migrations: {
      directory: path.resolve(cwd, "src/db/migrations"),
    },
    seeds: {
      directory: path.resolve(cwd, "src/db/seeds"),
    },
    useNullAsDefault: true,
  },
  production: {
    client: "sqlite3",
    connection: {
      filename: dbPath,
    },
    migrations: {
      directory: path.resolve(cwd, "src/db/migrations"),
    },
    seeds: {
      directory: path.resolve(cwd, "src/db/seeds"),
    },
    useNullAsDefault: true,
  },
};

export default knexConfig;
