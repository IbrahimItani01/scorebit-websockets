import {
	pgTable,
	serial,
	text,
	timestamp,
	integer,
	json,
	pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Define match_status enum
export const matchStatusEnum = pgEnum("match_status", [
	"scheduled",
	"live",
	"finished",
]);

// Define the 'matches' table
export const matches = pgTable("matches", {
	id: serial("id").primaryKey(),
	sport: text("sport").notNull(),
	homeTeam: text("home_team").notNull(),
	awayTeam: text("away_team").notNull(),
	status: matchStatusEnum("status").notNull().default("scheduled"),
	startTime: timestamp("start_time").notNull(),
	endTime: timestamp("end_time"),
	homeScore: integer("home_score").notNull().default(0),
	awayScore: integer("away_score").notNull().default(0),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define the 'commentary' table
export const commentary = pgTable("commentary", {
	id: serial("id").primaryKey(),
	matchId: integer("match_id")
		.notNull()
		.references(() => matches.id),
	minute: integer("minute"),
	sequence: integer("sequence").notNull(),
	period: text("period"),
	eventType: text("event_type").notNull(),
	actor: text("actor"),
	team: text("team"),
	message: text("message").notNull(),
	metadata: json("metadata"),
	tags: text("tags"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relationships
export const matchesRelations = relations(matches, ({ many }) => ({
	commentary: many(commentary),
}));

export const commentaryRelations = relations(commentary, ({ one }) => ({
	match: one(matches, {
		fields: [commentary.matchId],
		references: [matches.id],
	}),
}));

// Export types for type-safe queries (using JSDoc for JavaScript)
/** @typedef {typeof matches.$inferSelect} Match */
/** @typedef {typeof matches.$inferInsert} NewMatch */
/** @typedef {typeof commentary.$inferSelect} Commentary */
/** @typedef {typeof commentary.$inferInsert} NewCommentary */
