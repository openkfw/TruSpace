import { Knex } from "knex";
import { USER_STATUS } from "../../utility/constants";

/* Please update REQUIRED_TABLES in backend/src/clients/db/index.ts when adding/removing tables */

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("username", 50).notNullable();
    table.string("email", 100).notNullable().unique();
    table.uuid("uiid").notNullable().defaultTo(knex.fn.uuid());
    table.string("password_hash", 255).notNullable();
    table.string("status").notNullable().defaultTo(USER_STATUS.inactive);
    table.string("user_token");
    table.string("first_sign_in").notNullable().defaultTo(true);
    table.string("avatar_cid").nullable();
    table.string("notification_settings").nullable();
    table.string("prefered_language").nullable();
    table.timestamps(true, true);

    table.index("user_token");
    table.index("uiid");
  });

  await knex.schema.createTable("user_permissions", (table) => {
    table.increments("id").primary();
    table.string("user_email").notNullable();
    table.string("workspace_id").notNullable();
    table.string("role").notNullable();
    table.string("status").notNullable();
    table.timestamps(true, true);

    // TODO Foreign keys would be good
    
    table.index(
      ["user_email", "workspace_id"],
      "unique_user_workspace_permission"
    );
  });

  await knex.schema.createTable("workspace_passwords", (table) => {
    table.increments("id").primary();
    table.string("workspace_id").notNullable().unique();
    table.binary("encrypted_password").notNullable();
  });

  await knex.schema.createTable("job_status", (table) => {
    table.increments("id").primary();
    table.string("request_id", 100).notNullable().unique();
    table.string("status", 20).notNullable();
    table.string("error", 255);
    table.string("template_id", 100).notNullable();
    table.json("attributes");
    table.timestamps(true, true);
  });

  await knex.schema.createTable("prompts", (table) => {
    table.increments("id").primary();
    table.string("title", 100).notNullable().unique();
    table.string("prompt").notNullable();
    table.string("created_by").nullable();
    table.string("updated_by").nullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable("password_reset_tokens", (table) => {
    table.increments("id").primary();
    table.bigInteger("user_id").notNullable();
    table.binary("token").notNullable().unique();
    table.index("token");
    table.index("user_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  // Don't forget to drop tables in reverse order to avoid foreign key constraints :-)
  await knex.schema.dropTableIfExists("password_reset_tokens");
  await knex.schema.dropTableIfExists("prompts");
  await knex.schema.dropTableIfExists("job_status");
  await knex.schema.dropTableIfExists("workspace_passwords");
  await knex.schema.dropTableIfExists("user_permissions");
  await knex.schema.dropTableIfExists("users");
}
