import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("job_status", (table) => {
    table.string("cid");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("job_status", (table) => {
    table.dropColumn("cid");
  });
}
