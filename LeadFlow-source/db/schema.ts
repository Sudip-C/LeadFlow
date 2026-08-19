import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull(),
  value: integer("value").notNull().default(0),
  status: text("status").notNull().default("New"),
  source: text("source").notNull().default("Website"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
