import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { mortgageRatesTable, lendersTable } from '../db/schema';
import { type CreateMortgageRateInput } from '../schema';
import { createMortgageRate } from '../handlers/create_mortgage_rate';
import { eq } from 'drizzle-orm';

// Test lender data
const testLender = {
  name: 'Test Bank',
  logo_url: 'https://example.com/logo.png',
  website_url: 'https://example.com',
  phone: '555-0123',
  email: 'info@testbank.com',
  is_active: true
};

// Test mortgage rate input
const testInput: CreateMortgageRateInput = {
  lender_id: 1, // Will be updated after creating lender
  loan_type: 'conventional',
  loan_term: '30',
  interest_rate: 6.750,
  apr: 6.890,
  points: 1.25,
  min_credit_score: 620,
  max_loan_amount: 766550.00,
  min_down_payment_percent: 3.00,
  closing_costs: 3500.00,
  is_active: true
};

describe('createMortgageRate', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a mortgage rate with all fields', async () => {
    // Create prerequisite lender first
    const lenderResult = await db.insert(lendersTable)
      .values(testLender)
      .returning()
      .execute();
    
    const validInput = { ...testInput, lender_id: lenderResult[0].id };
    const result = await createMortgageRate(validInput);

    // Basic field validation
    expect(result.lender_id).toEqual(lenderResult[0].id);
    expect(result.loan_type).toEqual('conventional');
    expect(result.loan_term).toEqual('30');
    expect(result.interest_rate).toEqual(6.750);
    expect(typeof result.interest_rate).toBe('number');
    expect(result.apr).toEqual(6.890);
    expect(typeof result.apr).toBe('number');
    expect(result.points).toEqual(1.25);
    expect(typeof result.points).toBe('number');
    expect(result.min_credit_score).toEqual(620);
    expect(result.max_loan_amount).toEqual(766550.00);
    expect(typeof result.max_loan_amount).toBe('number');
    expect(result.min_down_payment_percent).toEqual(3.00);
    expect(typeof result.min_down_payment_percent).toBe('number');
    expect(result.closing_costs).toEqual(3500.00);
    expect(typeof result.closing_costs).toBe('number');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a mortgage rate with null closing costs', async () => {
    // Create prerequisite lender first
    const lenderResult = await db.insert(lendersTable)
      .values(testLender)
      .returning()
      .execute();
    
    const inputWithNullClosingCosts = { 
      ...testInput, 
      lender_id: lenderResult[0].id,
      closing_costs: null
    };
    
    const result = await createMortgageRate(inputWithNullClosingCosts);

    expect(result.closing_costs).toBeNull();
    expect(result.lender_id).toEqual(lenderResult[0].id);
    expect(result.interest_rate).toEqual(6.750);
  });

  it('should save mortgage rate to database correctly', async () => {
    // Create prerequisite lender first
    const lenderResult = await db.insert(lendersTable)
      .values(testLender)
      .returning()
      .execute();
    
    const validInput = { ...testInput, lender_id: lenderResult[0].id };
    const result = await createMortgageRate(validInput);

    // Query database to verify save
    const mortgageRates = await db.select()
      .from(mortgageRatesTable)
      .where(eq(mortgageRatesTable.id, result.id))
      .execute();

    expect(mortgageRates).toHaveLength(1);
    const savedRate = mortgageRates[0];
    
    expect(savedRate.lender_id).toEqual(lenderResult[0].id);
    expect(savedRate.loan_type).toEqual('conventional');
    expect(savedRate.loan_term).toEqual('30');
    expect(parseFloat(savedRate.interest_rate)).toEqual(6.750);
    expect(parseFloat(savedRate.apr)).toEqual(6.890);
    expect(parseFloat(savedRate.points)).toEqual(1.25);
    expect(savedRate.min_credit_score).toEqual(620);
    expect(parseFloat(savedRate.max_loan_amount)).toEqual(766550.00);
    expect(parseFloat(savedRate.min_down_payment_percent)).toEqual(3.00);
    expect(parseFloat(savedRate.closing_costs!)).toEqual(3500.00);
    expect(savedRate.is_active).toEqual(true);
    expect(savedRate.created_at).toBeInstanceOf(Date);
    expect(savedRate.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different loan types and terms', async () => {
    // Create prerequisite lender first
    const lenderResult = await db.insert(lendersTable)
      .values(testLender)
      .returning()
      .execute();
    
    const fhaInput = {
      ...testInput,
      lender_id: lenderResult[0].id,
      loan_type: 'fha' as const,
      loan_term: '15' as const,
      min_credit_score: 580,
      min_down_payment_percent: 3.5
    };
    
    const result = await createMortgageRate(fhaInput);

    expect(result.loan_type).toEqual('fha');
    expect(result.loan_term).toEqual('15');
    expect(result.min_credit_score).toEqual(580);
    expect(result.min_down_payment_percent).toEqual(3.5);
  });

  it('should throw error for non-existent lender', async () => {
    const invalidInput = { ...testInput, lender_id: 99999 };
    
    await expect(createMortgageRate(invalidInput)).rejects.toThrow(/lender.*not found/i);
  });

  it('should handle numeric precision correctly', async () => {
    // Create prerequisite lender first
    const lenderResult = await db.insert(lendersTable)
      .values(testLender)
      .returning()
      .execute();
    
    const preciseInput = {
      ...testInput,
      lender_id: lenderResult[0].id,
      interest_rate: 6.125,
      apr: 6.247,
      points: 0.75,
      max_loan_amount: 1234567.89,
      min_down_payment_percent: 5.25,
      closing_costs: 2750.50
    };
    
    const result = await createMortgageRate(preciseInput);

    // Verify numeric precision is maintained
    expect(result.interest_rate).toEqual(6.125);
    expect(result.apr).toEqual(6.247);
    expect(result.points).toEqual(0.75);
    expect(result.max_loan_amount).toEqual(1234567.89);
    expect(result.min_down_payment_percent).toEqual(5.25);
    expect(result.closing_costs).toEqual(2750.50);
  });
});