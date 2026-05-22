import { pgTable, serial, varchar, timestamp, boolean, integer, jsonb, text, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"


export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 用户表
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    openid: varchar("openid", { length: 128 }).notNull().unique(),
    nick_name: varchar("nick_name", { length: 64 }),
    avatar_url: varchar("avatar_url", { length: 512 }),
    grade: varchar("grade", { length: 32 }),
    major: varchar("major", { length: 64 }),
    target_industry: varchar("target_industry", { length: 64 }),
    personality_tags: jsonb("personality_tags").default([]),
    values: jsonb("values").default([]),
    experience_summary: text("experience_summary"),
    recommended_paths: jsonb("recommended_paths").default([]),
    level: integer("level").default(1).notNull(),
    exp: integer("exp").default(0).notNull(),
    title: varchar("title", { length: 32 }).default("求职新手").notNull(),
    badges: jsonb("badges").default([]),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("users_openid_idx").on(table.openid),
  ]
);

// 简历表
export const resumes = pgTable(
  "resumes",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
    version_name: varchar("version_name", { length: 128 }),
    content_text: text("content_text"),
    file_url: varchar("file_url", { length: 512 }),
    match_history: jsonb("match_history").default([]),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("resumes_user_id_idx").on(table.user_id),
    index("resumes_created_at_idx").on(table.created_at),
  ]
);

// 岗位卡片表
export const jobCards = pgTable(
  "job_cards",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
    company: varchar("company", { length: 128 }).notNull(),
    position: varchar("position", { length: 128 }).notNull(),
    jd_text: text("jd_text"),
    jd_url: varchar("jd_url", { length: 512 }),
    status: varchar("status", { length: 20 }).default("interested").notNull(),
    resume_tips: text("resume_tips"),
    hidden_requirements: text("hidden_requirements"),
    hr_questions_prediction: jsonb("hr_questions_prediction").default([]),
    actions: jsonb("actions").default([]),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("job_cards_user_id_idx").on(table.user_id),
    index("job_cards_status_idx").on(table.status),
    index("job_cards_created_at_idx").on(table.created_at),
  ]
);

// 面试表
export const interviews = pgTable(
  "interviews",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
    job_card_id: varchar("job_card_id", { length: 36 }).references(() => jobCards.id),
    type: varchar("type", { length: 20 }).default("single").notNull(),
    conversation: jsonb("conversation").default([]),
    radar_logic: integer("radar_logic"),
    radar_stress: integer("radar_stress"),
    radar_expression: integer("radar_expression"),
    radar_trust: integer("radar_trust"),
    radar_profession: integer("radar_profession"),
    overall_comment: text("overall_comment"),
    highlights: text("highlights"),
    improvements: text("improvements"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("interviews_user_id_idx").on(table.user_id),
    index("interviews_job_card_id_idx").on(table.job_card_id),
    index("interviews_created_at_idx").on(table.created_at),
  ]
);

// HR反向模拟表
export const hrSimulations = pgTable(
  "hr_simulations",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
    selected_resume_index: integer("selected_resume_index"),
    conversation: jsonb("conversation").default([]),
    result_revealed: boolean("result_revealed").default(false),
    hr_notes: text("hr_notes"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("hr_simulations_user_id_idx").on(table.user_id),
  ]
);
