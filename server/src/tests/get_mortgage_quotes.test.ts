import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { lendersTable, mortgageRatesTable } from '../db/schema';
import { type CreateMortgageQuoteRequestInput } from '../schema';
import { getMortgageQuotes } from '../handlers/get_mortgage_quotes';

// Test input for mortgage quote request
const testQuoteRequest: CreateMortgageQuoteRequestInput = {
  loan_amount: 400000,
  property_value: 500000,
  down_payment: 100000,
  credit_score: 750,
  loan_type: 'conventional',
  loan_term: '30',
  property_type: 'single_family',
  occupancy_type: 'primary',
  zip_code: '90210',
  debt_to_income_ratio: 35.5
};

describe('getMortgageQuotes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return mortgage quotes for matching criteria', async () => {
    // Create test lender
    const lenderResult = await db.insert(lendersTable)
      .values({
        name: 'Test Bank',
        logo_url: 'https://example.com/logo.png',
        website_url: 'https://testbank.com',
        phone: '555-1234',
        email: 'info@testbank.com',
        is_active: true
      })
      .returning()
      .execute();

    const lenderId = lenderResult[0].id;

    // Create matching mortgage rate
    await db.insert(mortgageRatesTable)
      .values({
        lender_id: lenderId,
        loan_type: 'conventional',
        loan_term: '30',
        interest_rate: '6.500',
        apr: '6.750',
        points: '1.00',
        min_credit_score: 700,
        max_loan_amount: '500000.00',
        min_down_payment_percent: '10.00',
        closing_costs: '5000.00',
        is_active: true
      })
      .execute();

    const quotes = await getMortgageQuotes(testQuoteRequest);

    expect(quotes).toHaveLength(1);
    
    const quote = quotes[0];
    expect(quote.lender_name).toEqual('Test Bank');
    expect(quote.lender_logo_url).toEqual('https://example.com/logo.png');
    expect(quote.loan_type).toEqual('conventional');
    expect(quote.loan_term).toEqual('30');
    expect(quote.interest_rate).toEqual(6.5);
    expect(quote.apr).toEqual(6.75);
    expect(quote.points).toEqual(1.0);
    expect(quote.closing_costs).toEqual(5000);
    expect(quote.down_payment_percent).toEqual(20); // 100k/500k * 100
    expect(quote.loan_to_value_ratio).toEqual(80); // 400k/500k * 100
    expect(quote.monthly_payment).toBeGreaterThan(0);
    expect(quote.total_interest).toBeGreaterThan(0);
  });

  it('should calculate monthly payment correctly', async () => {
    // Create test lender and rate
    const lenderResult = await db.insert(lendersTable)
      .values({
        name: 'Test Bank',
        is_active: true
      })
      .returning()
      .execute();

    await db.insert(mortgageRatesTable)
      .values({
        lender_id: lenderResult[0].id,
        loan_type: 'conventional',
        loan_term: '30',
        interest_rate: '6.000', // 6% interest
        apr: '6.200',
        points: '0.00',
        min_credit_score: 700,
        max_loan_amount: '500000.00',
        min_down_payment_percent: '10.00',
        is_active: true
      })
      .execute();

    const quotes = await getMortgageQuotes(testQuoteRequest);
    
    expect(quotes).toHaveLength(1);
    
    // For $400,000 loan at 6% for 30 years, monthly payment should be around $2,398
    const expectedMonthlyPayment = 2398.20; // Calculated using standard mortgage formula
    expect(Math.abs(quotes[0].monthly_payment - expectedMonthlyPayment)).toBeLessThan(1);
  });

  it('should filter by credit score', async () => {
    const lenderResult = await db.insert(lendersTable)
      .values({ name: 'Test Bank', is_active: true })
      .returning()
      .execute();

    // Rate requiring higher credit score
    await db.insert(mortgageRatesTable)
      .values({
        lender_id: lenderResult[0].id,
        loan_type: 'conventional',
        loan_term: '30',
        interest_rate: '6.500',
        apr: '6.750',
        points: '0.00',
        min_credit_score: 800, // Higher than test request credit score (750)
        max_loan_amount: '500000.00',
        min_down_payment_percent: '10.00',
        is_active: true
      })
      .execute();

    const quotes = await getMortgageQuotes(testQuoteRequest);
    
    expect(quotes).toHaveLength(0);
  });

  it('should filter by loan amount', async () => {
    const lenderResult = await db.insert(lendersTable)
      .values({ name: 'Test Bank', is_active: true })
      .returning()
      .execute();

    // Rate with lower max loan amount
    await db.insert(mortgageRatesTable)
      .values({
        lender_id: lenderResult[0].id,
        loan_type: 'conventional',
        loan_term: '30',
        interest_rate: '6.500',
        apr: '6.750',
        points: '0.00',
        min_credit_score: 700,
        max_loan_amount: '300000.00', // Lower than test request loan amount (400k)
        min_down_payment_percent: '10.00',
        is_active: true
      })
      .execute();

    const quotes = await getMortgageQuotes(testQuoteRequest);
    
    expect(quotes).toHaveLength(0);
  });

  it('should filter by down payment percentage', async () => {
    const lenderResult = await db.insert(lendersTable)
      .values({ name: 'Test Bank', is_active: true })
      .returning()
      .execute();

    // Rate requiring higher down payment
    await db.insert(mortgageRatesTable)
      .values({
        lender_id: lenderResult[0].id,
        loan_type: 'conventional',
        loan_term: '30',
        interest_rate: '6.500',
        apr: '6.750',
        points: '0.00',
        min_credit_score: 700,
        max_loan_amount: '500000.00',
        min_down_payment_percent: '25.00', // Higher than test request (20%)
        is_active: true
      })
      .execute();

    const quotes = await getMortgageQuotes(testQuoteRequest);
    
    expect(quotes).toHaveLength(0);
  });

  it('should filter by loan type and term', async () => {
    const lenderResult = await db.insert(lendersTable)
      .values({ name: 'Test Bank', is_active: true })
      .returning()
      .execute();

    // Rate with different loan type
    await db.insert(mortgageRatesTable)
      .values({
        lender_id: lenderResult[0].id,
        loan_type: 'fha', // Different from test request (conventional)
        loan_term: '30',
        interest_rate: '6.500',
        apr: '6.750',
        points: '0.00',
        min_credit_score: 700,
        max_loan_amount: '500000.00',
        min_down_payment_percent: '10.00',
        is_active: true
      })
      .execute();

    const quotes = await getMortgageQuotes(testQuoteRequest);
    
    expect(quotes).toHaveLength(0);
  });

  it('should exclude inactive rates and lenders', async () => {
    const lenderResult = await db.insert(lendersTable)
      .values({ name: 'Inactive Bank', is_active: false })
      .returning()
      .execute();

    await db.insert(mortgageRatesTable)
      .values({
        lender_id: lenderResult[0].id,
        loan_type: 'conventional',
        loan_term: '30',
        interest_rate: '6.500',
        apr: '6.750',
        points: '0.00',
        min_credit_score: 700,
        max_loan_amount: '500000.00',
        min_down_payment_percent: '10.00',
        is_active: true
      })
      .execute();

    const quotes = await getMortgageQuotes(testQuoteRequest);
    
    expect(quotes).toHaveLength(0);
  });

  it('should sort results by APR in ascending order', async () => {
    const lenderResult = await db.insert(lendersTable)
      .values({ name: 'Test Bank', is_active: true })
      .returning()
      .execute();

    // Create two rates with different APRs
    await db.insert(mortgageRatesTable)
      .values([
        {
          lender_id: lenderResult[0].id,
          loan_type: 'conventional',
          loan_term: '30',
          interest_rate: '7.000',
          apr: '7.500', // Higher APR
          points: '0.00',
          min_credit_score: 700,
          max_loan_amount: '500000.00',
          min_down_payment_percent: '10.00',
          is_active: true
        },
        {
          lender_id: lenderResult[0].id,
          loan_type: 'conventional',
          loan_term: '30',
          interest_rate: '6.500',
          apr: '6.750', // Lower APR
          points: '1.00',
          min_credit_score: 700,
          max_loan_amount: '500000.00',
          min_down_payment_percent: '10.00',
          is_active: true
        }
      ])
      .execute();

    const quotes = await getMortgageQuotes(testQuoteRequest);
    
    expect(quotes).toHaveLength(2);
    expect(quotes[0].apr).toBeLessThan(quotes[1].apr);
    expect(quotes[0].apr).toEqual(6.75);
    expect(quotes[1].apr).toEqual(7.5);
  });

  it('should handle zero interest rate edge case', async () => {
    const lenderResult = await db.insert(lendersTable)
      .values({ name: 'Test Bank', is_active: true })
      .returning()
      .execute();

    await db.insert(mortgageRatesTable)
      .values({
        lender_id: lenderResult[0].id,
        loan_type: 'conventional',
        loan_term: '30',
        interest_rate: '0.000', // Zero interest rate
        apr: '0.000',
        points: '0.00',
        min_credit_score: 700,
        max_loan_amount: '500000.00',
        min_down_payment_percent: '10.00',
        is_active: true
      })
      .execute();

    const quotes = await getMortgageQuotes(testQuoteRequest);
    
    expect(quotes).toHaveLength(1);
    // With 0% interest, monthly payment should be loan amount / number of payments
    const expectedPayment = 400000 / (30 * 12); // $1,111.11
    expect(Math.abs(quotes[0].monthly_payment - expectedPayment)).toBeLessThan(0.01);
    expect(quotes[0].total_interest).toEqual(0);
  });
});