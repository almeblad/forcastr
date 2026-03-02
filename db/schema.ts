import { pgTable, text, integer, timestamp, date, uuid, boolean, numeric } from 'drizzle-orm/pg-core';

export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(), // Clerk user ID
  name: text('name').notNull(),
  currency: text('currency').default('SEK').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const clients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id).notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const assignments = pgTable('assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id).notNull(),
  clientId: uuid('client_id').references(() => clients.id).notNull(),
  name: text('name').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  hourlyRate: integer('hourly_rate').notNull(),
  allocationPercent: integer('allocation_percent').default(100).notNull(),
  paymentTerms: integer('payment_terms').default(30).notNull(), // Payment delay in days
  brokerFeePercent: numeric('broker_fee_percent', { precision: 5, scale: 2 }).default('0'), // e.g. 5.00 for 5%
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const salaries = pgTable('salaries', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id).notNull(),
  month: text('month').notNull(), // YYYY-MM
  grossSalary: integer('gross_salary').notNull(),
  employerTaxPercent: numeric('employer_tax_percent', { precision: 5, scale: 2 }).default('31.42').notNull(),
  pensionProvision: integer('pension_provision').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const absences = pgTable('absences', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  type: text('type').notNull(), // 'VACATION', 'SICK', 'VAB', 'OTHER'
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const taxSettings = pgTable('tax_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id).notNull(),
  year: integer('year').notNull(),
  stateTaxThreshold: integer('state_tax_threshold').notNull(), // Brytpunkt statlig skatt
  municipalityCode: text('municipality_code'), // Kommunkod t.ex. "2480" för Umeå
  municipalityName: text('municipality_name'), // Kommunnamn
  municipalTaxPercent: numeric('municipal_tax_percent', { precision: 5, scale: 2 }).default('30.00'), // Kommunalskatt
  countyTaxPercent: numeric('county_tax_percent', { precision: 5, scale: 2 }).default('0'), // Landstingsskatt
  burialFeePercent: numeric('burial_fee_percent', { precision: 5, scale: 2 }).default('0.30'), // Begravningsavgift
  churchTaxEnabled: boolean('church_tax_enabled').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
