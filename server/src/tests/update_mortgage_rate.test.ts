import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { mortgageRatesTable, lendersTable } from '../db/schema';
import { type UpdateMortgageRateInput } from '../schema';
import { updateMortgageRate } from '../handlers/update_mortgage_rate';
import { eq } from 'drizzle-orm';

describe('updateMortgageRate', () => {
  let testLenderId: number;
  let testRateId: number;

  beforeEach(async () => {
    await createDB();

    // Create a test lender
    const lenderResult = await db.insert(lendersTable)
      .values({
        name: 'Test Lender',
        is_active: true
      })
      .returning()
      .execute();

    testLenderId = lenderResult[0].id;

    // Create a test mortgage rate
    const rateResult = await db.insert(mortgageRatesTable)
      .values({
        lender_id: testLenderId,
        loan_type: 'conventional',
        loan_term: '30',
        interest_rate: '6.500',
        apr: '6.750',
        points: '1.00',
        min_credit_score: 620,
        max_loan_amount: '750000.00',
        min_down_payment_percent: '5.00',
        closing_costs: '5000.00',
        is_active: true
      })
      .returning()
      .execute();

    testRateId = rateResult[0].id;
  });

  afterEach(resetDB);

  it('should update all fields of a mortgage rate', async () => {
    const updateInput: UpdateMortgageRateInput = {
      id: testRateId,
      loan_type: 'fha',
      loan_term: '15',
      interest_rate: 5.750,
      apr: 6.000,
      points: 0.5,
      min_credit_score: 580,
      max_loan_amount: 500000,
      min_down_payment_percent: 3.5,
      closing_costs: 4500,
      is_active: false
    };

    const result = await updateMortgageRate(updateInput);

    // Verify the returned object
    expect(result.id).toBe(testRateId);
    expect(result.lender_id).toBe(testLenderId);
    expect(result.loan_type).toBe('fha');
    expect(result.loan_term).toBe('15');
    expect(result.interest_rate).toBe(5.750);
    expect(result.apr).toBe(6.000);
    expect(result.points).toBe(0.5);
    expect(result.min_credit_score).toBe(580);
    expect(result.max_loan_amount).toBe(500000);
    expect(result.min_down_payment_percent).toBe(3.5);
    expect(result.closing_costs).toBe(4500);
    expect(result.is_active).toBe(false);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify numeric types are correct
    expect(typeof result.interest_rate).toBe('number');
    expect(typeof result.apr).toBe('number');
    expect(typeof result.points).toBe('number');
    expect(typeof result.max_loan_amount).toBe('number');
    expect(typeof result.min_down_payment_percent).toBe('number');
    expect(typeof result.closing_costs).toBe('number');
  });

  it('should update only specified fields', async () => {
    const updateInput: UpdateMortgageRateInput = {
      id: testRateId,
      interest_rate: 5.250,
      apr: 5.500
    };

    const result = await updateMortgageRate(updateInput);

    // Verify updated fields
    expect(result.interest_rate).toBe(5.250);
    expect(result.apr).toBe(5.500);

    // Verify unchanged fields remain the same
    expect(result.loan_type).toBe('conventional');
    expect(result.loan_term).toBe('30');
    expect(result.points).toBe(1.00);
    expect(result.min_credit_score).toBe(620);
    expect(result.max_loan_amount).toBe(750000);
    expect(result.min_down_payment_percent).toBe(5.00);
    expect(result.closing_costs).toBe(5000);
    expect(result.is_active).toBe(true);
  });

  it('should update closing_costs to null', async () => {
    const updateInput: UpdateMortgageRateInput = {
      id: testRateId,
      closing_costs: null
    };

    const result = await updateMortgageRate(updateInput);

    expect(result.closing_costs).toBeNull();
  });

  it('should update lender_id when valid lender exists', async () => {
    // Create another lender
    const newLenderResult = await db.insert(lendersTable)
      .values({
        name: 'New Test Lender',
        is_active: true
      })
      .returning()
      .execute();

    const newLenderId = newLenderResult[0].id;

    const updateInput: UpdateMortgageRateInput = {
      id: testRateId,
      lender_id: newLenderId
    };

    const result = await updateMortgageRate(updateInput);

    expect(result.lender_id).toBe(newLenderId);
  });

  it('should save updated mortgage rate to database', async () => {
    const updateInput: UpdateMortgageRateInput = {
      id: testRateId,
      interest_rate: 4.875,
      points: 2.0,
      is_active: false
    };

    await updateMortgageRate(updateInput);

    // Query the database directly to verify changes
    const savedRates = await db.select()
      .from(mortgageRatesTable)
      .where(eq(mortgageRatesTable.id, testRateId))
      .execute();

    expect(savedRates).toHaveLength(1);
    const savedRate = savedRates[0];
    expect(parseFloat(savedRate.interest_rate)).toBe(4.875);
    expect(parseFloat(savedRate.points)).toBe(2.0);
    expect(savedRate.is_active).toBe(false);
  });

  it('should throw error when mortgage rate does not exist', async () => {
    const nonExistentId = 99999;
    const updateInput: UpdateMortgageRateInput = {
      id: nonExistentId,
      interest_rate: 5.0
    };

    await expect(updateMortgageRate(updateInput))
      .rejects.toThrow(/mortgage rate with id 99999 not found/i);
  });

  it('should throw error when lender_id does not exist', async () => {
    const nonExistentLenderId = 99999;
    const updateInput: UpdateMortgageRateInput = {
      id: testRateId,
      lender_id: nonExistentLenderId
    };

    await expect(updateMortgageRate(updateInput))
      .rejects.toThrow(/lender with id 99999 not found/i);
  });

  it('should handle edge case values correctly', async () => {
    const updateInput: UpdateMortgageRateInput = {
      id: testRateId,
      interest_rate: 0.001, // Very low rate
      apr: 0.001,
      points: 0, // Zero points
      min_credit_score: 300, // Minimum credit score
      max_loan_amount: 1000000, // High loan amount
      min_down_payment_percent: 0, // Zero down payment
      closing_costs: 0 // Zero closing costs
    };

    const result = await updateMortgageRate(updateInput);

    expect(result.interest_rate).toBe(0.001);
    expect(result.apr).toBe(0.001);
    expect(result.points).toBe(0);
    expect(result.min_credit_score).toBe(300);
    expect(result.max_loan_amount).toBe(1000000);
    expect(result.min_down_payment_percent).toBe(0);
    expect(result.closing_costs).toBe(0);
  });

  it('should update updated_at timestamp', async () => {
    // Get the original updated_at timestamp
    const originalRates = await db.select()
      .from(mortgageRatesTable)
      .where(eq(mortgageRatesTable.id, testRateId))
      .execute();

    const originalUpdatedAt = originalRates[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateMortgageRateInput = {
      id: testRateId,
      interest_rate: 5.125
    };

    const result = await updateMortgageRate(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});