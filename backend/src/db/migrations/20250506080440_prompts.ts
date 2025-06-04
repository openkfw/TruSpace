import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("prompts", (table) => {
    table.increments("id").primary();
    table.string("title", 100).notNullable().unique();
    table.string("prompt").notNullable();
    table.string("created_by").nullable();
    table.string("updated_by").nullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("prompts");
}
