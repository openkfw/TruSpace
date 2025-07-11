import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.uuid("uiid").notNullable().defaultTo(knex.fn.uuid());
    table.index("uiid");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("uiid");
    table.dropIndex("uiid");
  });
}

