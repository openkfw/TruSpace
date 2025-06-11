import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("job_status", (table) => {
    table.string("cid");
  });
  await knex.schema.alterTable("prompts", (table) => {
    table.string("workspace_id").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("prompts", (table) => {
    table.dropColumn("workspace_id");
  });
  await knex.schema.alterTable("job_status", (table) => {
    table.dropColumn("cid");
  });
}
