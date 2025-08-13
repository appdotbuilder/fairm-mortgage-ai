import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { lendersTable, mortgageRatesTable } from '../db/schema';
import { type CreateLenderInput, type CreateMortgageRateInput } from '../schema';
import { getMortgageRates } from '../handlers/get_mortgage_rates';

// Test data for lenders
const testLender1: CreateLenderInput = {
  name: 'Test Bank 1',
  logo_url: 'https://example.com/logo1.png',
  website_url: 'https://testbank1.com',
  phone: '555-0001',
  email: 'contact@testbank1.com',
  is_active: true
};

const testLender2: CreateLenderInput = {
  name: 'Test Credit Union',
  logo_url: null,
  website_url: 'https://testcu.com',
  phone: '555-0002',
  email: 'info@testcu.com',
  is_active: true
};

const inactiveLender: CreateLenderInput = {
  name: 'Inactive Lender',
  logo_url: null,
  website_url: null,
  phone: null,
  email: null,
  is_active: false
};

describe('getMortgageRates', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no rates exist', async () => {
    const result = await getMortgageRates();
    expect(result).toEqual([]);
  });

  it('should fetch active mortgage rates with proper numeric conversions', async () => {
    // Create test lender
    const lenderResult = await db.insert(lendersTable)
      .values({
        name: testLender1.name,
        logo_url: testLender1.logo_url,
        website_url: testLender1.website_url,
        phone: testLender1.phone,
        email: testLender1.email,
        is_active: testLender1.is_active
      })
      .returning()
      .execute();

    const lenderId = lenderResult[0].id;

    // Create test mortgage rate
    const testRate: CreateMortgageRateInput = {
      lender_id: lenderId,
      loan_type: 'conventional',
      loan_term: '30',
      interest_rate: 6.875,
      apr: 7.125,
      points: 1.25,
      min_credit_score: 620,
      max_loan_amount: 750000.00,
      min_down_payment_percent: 10.00,
      closing_costs: 3500.50,
      is_active: true
    };

    await db.insert(mortgageRatesTable)
      .values({
        lender_id: testRate.lender_id,
        loan_type: testRate.loan_type,
        loan_term: testRate.loan_term,
        interest_rate: testRate.interest_rate.toString(),
        apr: testRate.apr.toString(),
        points: testRate.points.toString(),
        min_credit_score: testRate.min_credit_score,
        max_loan_amount: testRate.max_loan_amount.toString(),
        min_down_payment_percent: testRate.min_down_payment_percent.toString(),
        closing_costs: testRate.closing_costs!.toString(),
        is_active: testRate.is_active
      })
      .execute();

    const result = await getMortgageRates();

    expect(result).toHaveLength(1);
    expect(result[0].lender_id).toBe(lenderId);
    expect(result[0].loan_type).toBe('conventional');
    expect(result[0].loan_term).toBe('30');
    
    // Verify numeric conversions
    expect(typeof result[0].interest_rate).toBe('number');
    expect(result[0].interest_rate).toBe(6.875);
    expect(typeof result[0].apr).toBe('number');
    expect(result[0].apr).toBe(7.125);
    expect(typeof result[0].points).toBe('number');
    expect(result[0].points).toBe(1.25);
    expect(typeof result[0].max_loan_amount).toBe('number');
    expect(result[0].max_loan_amount).toBe(750000.00);
    expect(typeof result[0].min_down_payment_percent).toBe('number');
    expect(result[0].min_down_payment_percent).toBe(10.00);
    expect(typeof result[0].closing_costs).toBe('number');
    expect(result[0].closing_costs).toBe(3500.50);
    
    expect(result[0].min_credit_score).toBe(620);
    expect(result[0].is_active).toBe(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should fetch multiple mortgage rates from different lenders', async () => {
    // Create two lenders
    const lender1Result = await db.insert(lendersTable)
      .values({
        name: testLender1.name,
        logo_url: testLender1.logo_url,
        website_url: testLender1.website_url,
        phone: testLender1.phone,
        email: testLender1.email,
        is_active: testLender1.is_active
      })
      .returning()
      .execute();

    const lender2Result = await db.insert(lendersTable)
      .values({
        name: testLender2.name,
        logo_url: testLender2.logo_url,
        website_url: testLender2.website_url,
        phone: testLender2.phone,
        email: testLender2.email,
        is_active: testLender2.is_active
      })
      .returning()
      .execute();

    const lender1Id = lender1Result[0].id;
    const lender2Id = lender2Result[0].id;

    // Create rates for both lenders
    await db.insert(mortgageRatesTable)
      .values([
        {
          lender_id: lender1Id,
          loan_type: 'conventional',
          loan_term: '30',
          interest_rate: '6.500',
          apr: '6.750',
          points: '0.00',
          min_credit_score: 640,
          max_loan_amount: '1000000.00',
          min_down_payment_percent: '20.00',
          closing_costs: '4000.00',
          is_active: true
        },
        {
          lender_id: lender2Id,
          loan_type: 'fha',
          loan_term: '15',
          interest_rate: '5.875',
          apr: '6.125',
          points: '1.50',
          min_credit_score: 580,
          max_loan_amount: '500000.00',
          min_down_payment_percent: '3.50',
          closing_costs: null,
          is_active: true
        }
      ])
      .execute();

    const result = await getMortgageRates();

    expect(result).toHaveLength(2);
    
    // Find rates by loan type
    const conventionalRate = result.find(r => r.loan_type === 'conventional');
    const fhaRate = result.find(r => r.loan_type === 'fha');

    expect(conventionalRate).toBeDefined();
    expect(conventionalRate!.lender_id).toBe(lender1Id);
    expect(conventionalRate!.interest_rate).toBe(6.500);
    expect(conventionalRate!.closing_costs).toBe(4000.00);

    expect(fhaRate).toBeDefined();
    expect(fhaRate!.lender_id).toBe(lender2Id);
    expect(fhaRate!.loan_term).toBe('15');
    expect(fhaRate!.points).toBe(1.50);
    expect(fhaRate!.closing_costs).toBeNull();
  });

  it('should only return active mortgage rates', async () => {
    // Create test lender
    const lenderResult = await db.insert(lendersTable)
      .values({
        name: testLender1.name,
        logo_url: testLender1.logo_url,
        website_url: testLender1.website_url,
        phone: testLender1.phone,
        email: testLender1.email,
        is_active: testLender1.is_active
      })
      .returning()
      .execute();

    const lenderId = lenderResult[0].id;

    // Create both active and inactive rates
    await db.insert(mortgageRatesTable)
      .values([
        {
          lender_id: lenderId,
          loan_type: 'conventional',
          loan_term: '30',
          interest_rate: '6.500',
          apr: '6.750',
          points: '0.00',
          min_credit_score: 640,
          max_loan_amount: '1000000.00',
          min_down_payment_percent: '20.00',
          closing_costs: '4000.00',
          is_active: true
        },
        {
          lender_id: lenderId,
          loan_type: 'fha',
          loan_term: '15',
          interest_rate: '5.875',
          apr: '6.125',
          points: '1.50',
          min_credit_score: 580,
          max_loan_amount: '500000.00',
          min_down_payment_percent: '3.50',
          closing_costs: null,
          is_active: false // Inactive rate
        }
      ])
      .execute();

    const result = await getMortgageRates();

    // Should only return the active rate
    expect(result).toHaveLength(1);
    expect(result[0].loan_type).toBe('conventional');
    expect(result[0].is_active).toBe(true);
  });

  it('should handle null closing costs correctly', async () => {
    // Create test lender
    const lenderResult = await db.insert(lendersTable)
      .values({
        name: testLender1.name,
        logo_url: testLender1.logo_url,
        website_url: testLender1.website_url,
        phone: testLender1.phone,
        email: testLender1.email,
        is_active: testLender1.is_active
      })
      .returning()
      .execute();

    const lenderId = lenderResult[0].id;

    // Create rate with null closing costs
    await db.insert(mortgageRatesTable)
      .values({
        lender_id: lenderId,
        loan_type: 'va',
        loan_term: '20',
        interest_rate: '5.250',
        apr: '5.500',
        points: '0.50',
        min_credit_score: 600,
        max_loan_amount: '800000.00',
        min_down_payment_percent: '0.00',
        closing_costs: null, // Null closing costs
        is_active: true
      })
      .execute();

    const result = await getMortgageRates();

    expect(result).toHaveLength(1);
    expect(result[0].closing_costs).toBeNull();
    expect(result[0].loan_type).toBe('va');
    expect(result[0].min_down_payment_percent).toBe(0.00);
  });
});