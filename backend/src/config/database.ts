import knex from "knex";
import knexConfig from "../../knexfile";

const environment = process.env.NODE_ENV || "development";

const db = knex(knexConfig[environment as keyof typeof knexConfig]);

export default db;
