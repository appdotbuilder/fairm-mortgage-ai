import { z } from 'zod';

// Enum for loan types
export const loanTypeEnum = z.enum(['conventional', 'fha', 'va', 'usda', 'jumbo']);
export type LoanType = z.infer<typeof loanTypeEnum>;

// Enum for loan terms (in years)
export const loanTermEnum = z.enum(['15', '20', '25', '30']);
export type LoanTerm = z.infer<typeof loanTermEnum>;

// Enum for property types
export const propertyTypeEnum = z.enum(['single_family', 'condo', 'townhouse', 'multi_family']);
export type PropertyType = z.infer<typeof propertyTypeEnum>;

// Enum for occupancy types
export const occupancyTypeEnum = z.enum(['primary', 'secondary', 'investment']);
export type OccupancyType = z.infer<typeof occupancyTypeEnum>;

// Lender schema
export const lenderSchema = z.object({
  id: z.number(),
  name: z.string(),
  logo_url: z.string().nullable(),
  website_url: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Lender = z.infer<typeof lenderSchema>;

// Input schema for creating lenders
export const createLenderInputSchema = z.object({
  name: z.string().min(1),
  logo_url: z.string().url().nullable(),
  website_url: z.string().url().nullable(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  is_active: z.boolean().default(true)
});

export type CreateLenderInput = z.infer<typeof createLenderInputSchema>;

// Mortgage rate schema
export const mortgageRateSchema = z.object({
  id: z.number(),
  lender_id: z.number(),
  loan_type: loanTypeEnum,
  loan_term: loanTermEnum,
  interest_rate: z.number(),
  apr: z.number(),
  points: z.number(),
  min_credit_score: z.number().int(),
  max_loan_amount: z.number(),
  min_down_payment_percent: z.number(),
  closing_costs: z.number().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type MortgageRate = z.infer<typeof mortgageRateSchema>;

// Input schema for creating mortgage rates
export const createMortgageRateInputSchema = z.object({
  lender_id: z.number(),
  loan_type: loanTypeEnum,
  loan_term: loanTermEnum,
  interest_rate: z.number().positive(),
  apr: z.number().positive(),
  points: z.number().nonnegative(),
  min_credit_score: z.number().int().min(300).max(850),
  max_loan_amount: z.number().positive(),
  min_down_payment_percent: z.number().min(0).max(100),
  closing_costs: z.number().nonnegative().nullable(),
  is_active: z.boolean().default(true)
});

export type CreateMortgageRateInput = z.infer<typeof createMortgageRateInputSchema>;

// Mortgage quote request schema
export const mortgageQuoteRequestSchema = z.object({
  id: z.number(),
  loan_amount: z.number(),
  property_value: z.number(),
  down_payment: z.number(),
  credit_score: z.number().int(),
  loan_type: loanTypeEnum,
  loan_term: loanTermEnum,
  property_type: propertyTypeEnum,
  occupancy_type: occupancyTypeEnum,
  zip_code: z.string(),
  debt_to_income_ratio: z.number().nullable(),
  created_at: z.coerce.date()
});

export type MortgageQuoteRequest = z.infer<typeof mortgageQuoteRequestSchema>;

// Input schema for mortgage quote requests
export const createMortgageQuoteRequestInputSchema = z.object({
  loan_amount: z.number().positive(),
  property_value: z.number().positive(),
  down_payment: z.number().nonnegative(),
  credit_score: z.number().int().min(300).max(850),
  loan_type: loanTypeEnum,
  loan_term: loanTermEnum,
  property_type: propertyTypeEnum,
  occupancy_type: occupancyTypeEnum,
  zip_code: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  debt_to_income_ratio: z.number().min(0).max(100).nullable()
});

export type CreateMortgageQuoteRequestInput = z.infer<typeof createMortgageQuoteRequestInputSchema>;

// Mortgage quote response schema (combines rate with lender info)
export const mortgageQuoteSchema = z.object({
  rate_id: z.number(),
  lender_id: z.number(),
  lender_name: z.string(),
  lender_logo_url: z.string().nullable(),
  loan_type: loanTypeEnum,
  loan_term: loanTermEnum,
  interest_rate: z.number(),
  apr: z.number(),
  points: z.number(),
  monthly_payment: z.number(),
  total_interest: z.number(),
  closing_costs: z.number().nullable(),
  down_payment_percent: z.number(),
  loan_to_value_ratio: z.number()
});

export type MortgageQuote = z.infer<typeof mortgageQuoteSchema>;

// Update schemas
export const updateLenderInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  logo_url: z.string().url().nullable().optional(),
  website_url: z.string().url().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  is_active: z.boolean().optional()
});

export type UpdateLenderInput = z.infer<typeof updateLenderInputSchema>;

export const updateMortgageRateInputSchema = z.object({
  id: z.number(),
  lender_id: z.number().optional(),
  loan_type: loanTypeEnum.optional(),
  loan_term: loanTermEnum.optional(),
  interest_rate: z.number().positive().optional(),
  apr: z.number().positive().optional(),
  points: z.number().nonnegative().optional(),
  min_credit_score: z.number().int().min(300).max(850).optional(),
  max_loan_amount: z.number().positive().optional(),
  min_down_payment_percent: z.number().min(0).max(100).optional(),
  closing_costs: z.number().nonnegative().nullable().optional(),
  is_active: z.boolean().optional()
});

export type UpdateMortgageRateInput = z.infer<typeof updateMortgageRateInputSchema>;