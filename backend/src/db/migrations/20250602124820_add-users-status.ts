import type { Knex } from "knex";
import { USER_STATUS } from "../../utility/constants";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.string("status").notNullable().defaultTo(USER_STATUS.inactive);
    table.string("user_token");
    table.index("user_token");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("status");
    table.dropColumn("user_token");
    table.dropIndex("user_token");
  });
}
