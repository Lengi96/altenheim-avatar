import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  decimal,
  date,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

// ---- Einrichtungen (Multi-Tenancy) ----
export const facilities = pgTable('facilities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  address: text('address'),
  contactEmail: varchar('contact_email', { length: 255 }).notNull(),
  contactPhone: varchar('contact_phone', { length: 50 }),
  plan: varchar('plan', { length: 20 }).default('trial').notNull(),
  maxResidents: integer('max_residents').default(10).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  active: boolean('active').default(true).notNull(),
});

// ---- Benutzer (Pfleger, Admins, Angehörige) ----
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id')
    .references(() => facilities.id, { onDelete: 'cascade' })
    .notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(), // 'admin', 'caregiver', 'family'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  active: boolean('active').default(true).notNull(),
});

// ---- Bewohner ----
export const residents = pgTable(
  'residents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    facilityId: uuid('facility_id')
      .references(() => facilities.id, { onDelete: 'cascade' })
      .notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    displayName: varchar('display_name', { length: 100 }),
    pin: varchar('pin', { length: 255 }), // bcrypt-Hash des PINs
    birthYear: integer('birth_year'),
    gender: varchar('gender', { length: 20 }),
    addressForm: varchar('address_form', { length: 5 }).default('du').notNull(),
    language: varchar('language', { length: 10 }).default('de').notNull(),
    cognitiveLevel: varchar('cognitive_level', { length: 20 }).default('normal').notNull(),
    avatarName: varchar('avatar_name', { length: 50 }).default('Anni').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    active: boolean('active').default(true).notNull(),
  },
  (table) => [
    index('idx_residents_facility').on(table.facilityId),
    index('idx_residents_active').on(table.facilityId, table.active),
  ]
);

// ---- Biografie-Daten ----
export const biographies = pgTable(
  'biographies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    residentId: uuid('resident_id')
      .references(() => residents.id, { onDelete: 'cascade' })
      .notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    key: varchar('key', { length: 100 }).notNull(),
    value: text('value').notNull(),
    source: varchar('source', { length: 20 }).default('manual').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_biographies_unique').on(table.residentId, table.category, table.key),
    index('idx_biographies_resident').on(table.residentId),
  ]
);

// ---- Gespräche ----
export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    residentId: uuid('resident_id')
      .references(() => residents.id, { onDelete: 'cascade' })
      .notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    mode: varchar('mode', { length: 20 }).default('bewohner').notNull(),
    messageCount: integer('message_count').default(0).notNull(),
    moodStart: varchar('mood_start', { length: 20 }),
    moodEnd: varchar('mood_end', { length: 20 }),
    summary: text('summary'),
    flagged: boolean('flagged').default(false).notNull(),
    flagReason: text('flag_reason'),
  },
  (table) => [
    index('idx_conversations_resident').on(table.residentId),
    index('idx_conversations_date').on(table.startedAt),
    index('idx_conversations_resident_ended').on(table.residentId, table.endedAt),
  ]
);

// ---- Einzelne Nachrichten ----
export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .references(() => conversations.id, { onDelete: 'cascade' })
      .notNull(),
    role: varchar('role', { length: 10 }).notNull(), // 'user', 'assistant'
    content: text('content').notNull(),
    moodDetected: varchar('mood_detected', { length: 20 }),
    tokensUsed: integer('tokens_used'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_messages_conversation').on(table.conversationId),
    index('idx_messages_created').on(table.conversationId, table.createdAt),
  ]
);

// ---- Angehörigen-Zuordnung ----
export const familyLinks = pgTable(
  'family_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    residentId: uuid('resident_id')
      .references(() => residents.id, { onDelete: 'cascade' })
      .notNull(),
    relationship: varchar('relationship', { length: 50 }),
    consentGiven: boolean('consent_given').default(false).notNull(),
    consentDate: timestamp('consent_date', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('idx_family_links_unique').on(table.userId, table.residentId),
  ]
);

// ---- Nutzungsstatistiken ----
export const usageStats = pgTable(
  'usage_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    facilityId: uuid('facility_id')
      .references(() => facilities.id, { onDelete: 'cascade' })
      .notNull(),
    month: date('month').notNull(),
    activeResidents: integer('active_residents').default(0).notNull(),
    totalConversations: integer('total_conversations').default(0).notNull(),
    totalMessages: integer('total_messages').default(0).notNull(),
    totalTokens: integer('total_tokens').default(0).notNull(),
    apiCostEur: decimal('api_cost_eur', { precision: 10, scale: 2 }).default('0').notNull(),
  },
  (table) => [
    uniqueIndex('idx_usage_stats_unique').on(table.facilityId, table.month),
  ]
);
