import { Knex } from "knex";

/* Migration: Add last_event_id to user_permissions and create events table */

export async function up(knex: Knex): Promise<void> {
  // Add last_event_id to user_permissions
  await knex.schema.alterTable("user_permissions", (table) => {
    table
      .string("last_event_id")
      .nullable()
      .comment(
        "References the ID of the last event that created or updated this permission",
      );
  });

  // Create events table
  await knex.schema.createTable("events", (table) => {
    table
      .string("id")
      .notNullable()
      .primary()
      .comment("NodeID + UUID, globally unique event ID");
    table
      .string("entity_type")
      .notNullable()
      .comment("Type of entity: permission, workspace, etc.");
    table
      .string("entity_id")
      .notNullable()
      .comment("ID of the affected entity");
    table
      .string("entity_event")
      .notNullable()
      .comment("invited, revoked, removed, etc.");
    table
      .json("payload")
      .nullable()
      .comment("Additional metadata for the event");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  // Remove last_event_id from user_permissions
  await knex.schema.alterTable("user_permissions", (table) => {
    table.dropColumn("last_event_id");
  });

  // Drop the events table entirely
  await knex.schema.dropTableIfExists("events");
}
