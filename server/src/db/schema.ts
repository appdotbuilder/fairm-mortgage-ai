import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums for PostgreSQL
export const loanTypeEnum = pgEnum('loan_type', ['conventional', 'fha', 'va', 'usda', 'jumbo']);
export const loanTermEnum = pgEnum('loan_term', ['15', '20', '25', '30']);
export const propertyTypeEnum = pgEnum('property_type', ['single_family', 'condo', 'townhouse', 'multi_family']);
export const occupancyTypeEnum = pgEnum('occupancy_type', ['primary', 'secondary', 'investment']);

// Lenders table
export const lendersTable = pgTable('lenders', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  logo_url: text('logo_url'), // Nullable by default
  website_url: text('website_url'), // Nullable by default
  phone: text('phone'), // Nullable by default
  email: text('email'), // Nullable by default
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Mortgage rates table
export const mortgageRatesTable = pgTable('mortgage_rates', {
  id: serial('id').primaryKey(),
  lender_id: integer('lender_id').notNull().references(() => lendersTable.id, { onDelete: 'cascade' }),
  loan_type: loanTypeEnum('loan_type').notNull(),
  loan_term: loanTermEnum('loan_term').notNull(),
  interest_rate: numeric('interest_rate', { precision: 5, scale: 3 }).notNull(), // e.g., 6.250%
  apr: numeric('apr', { precision: 5, scale: 3 }).notNull(), // Annual Percentage Rate
  points: numeric('points', { precision: 4, scale: 2 }).notNull(), // Discount points (e.g., 1.50)
  min_credit_score: integer('min_credit_score').notNull(),
  max_loan_amount: numeric('max_loan_amount', { precision: 12, scale: 2 }).notNull(),
  min_down_payment_percent: numeric('min_down_payment_percent', { precision: 5, scale: 2 }).notNull(),
  closing_costs: numeric('closing_costs', { precision: 10, scale: 2 }), // Nullable
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Mortgage quote requests table (to track user requests)
export const mortgageQuoteRequestsTable = pgTable('mortgage_quote_requests', {
  id: serial('id').primaryKey(),
  loan_amount: numeric('loan_amount', { precision: 12, scale: 2 }).notNull(),
  property_value: numeric('property_value', { precision: 12, scale: 2 }).notNull(),
  down_payment: numeric('down_payment', { precision: 12, scale: 2 }).notNull(),
  credit_score: integer('credit_score').notNull(),
  loan_type: loanTypeEnum('loan_type').notNull(),
  loan_term: loanTermEnum('loan_term').notNull(),
  property_type: propertyTypeEnum('property_type').notNull(),
  occupancy_type: occupancyTypeEnum('occupancy_type').notNull(),
  zip_code: text('zip_code').notNull(),
  debt_to_income_ratio: numeric('debt_to_income_ratio', { precision: 5, scale: 2 }), // Nullable
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const lendersRelations = relations(lendersTable, ({ many }) => ({
  mortgageRates: many(mortgageRatesTable)
}));

export const mortgageRatesRelations = relations(mortgageRatesTable, ({ one }) => ({
  lender: one(lendersTable, {
    fields: [mortgageRatesTable.lender_id],
    references: [lendersTable.id]
  })
}));

// TypeScript types for the table schemas
export type Lender = typeof lendersTable.$inferSelect;
export type NewLender = typeof lendersTable.$inferInsert;

export type MortgageRate = typeof mortgageRatesTable.$inferSelect;
export type NewMortgageRate = typeof mortgageRatesTable.$inferInsert;

export type MortgageQuoteRequest = typeof mortgageQuoteRequestsTable.$inferSelect;
export type NewMortgageQuoteRequest = typeof mortgageQuoteRequestsTable.$inferInsert;

// Important: Export all tables and relations for proper query building
export const tables = {
  lenders: lendersTable,
  mortgageRates: mortgageRatesTable,
  mortgageQuoteRequests: mortgageQuoteRequestsTable
};