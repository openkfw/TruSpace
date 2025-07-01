import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("password_reset_tokens", (table) => {
    table.increments("id").primary();
    table.bigInteger("user_id").notNullable();
    table.binary("token").notNullable().unique();
    table.index("token");
    table.index("user_id");
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("password_reset_tokens");
}

