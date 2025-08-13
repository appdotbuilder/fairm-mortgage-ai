import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { mortgageQuoteRequestsTable } from '../db/schema';
import { getMortgageQuoteRequests } from '../handlers/get_mortgage_quote_requests';
import { type CreateMortgageQuoteRequestInput } from '../schema';

describe('getMortgageQuoteRequests', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no requests exist', async () => {
    const result = await getMortgageQuoteRequests();

    expect(result).toEqual([]);
  });

  it('should fetch single mortgage quote request with correct types', async () => {
    // Insert test data directly into database
    const testData = {
      loan_amount: '450000.00',
      property_value: '550000.00',
      down_payment: '100000.00',
      credit_score: 750,
      loan_type: 'conventional' as const,
      loan_term: '30' as const,
      property_type: 'single_family' as const,
      occupancy_type: 'primary' as const,
      zip_code: '12345',
      debt_to_income_ratio: '35.50'
    };

    await db.insert(mortgageQuoteRequestsTable)
      .values(testData)
      .execute();

    const result = await getMortgageQuoteRequests();

    expect(result).toHaveLength(1);
    
    const request = result[0];
    expect(request.id).toBeDefined();
    expect(request.loan_amount).toBe(450000);
    expect(typeof request.loan_amount).toBe('number');
    expect(request.property_value).toBe(550000);
    expect(typeof request.property_value).toBe('number');
    expect(request.down_payment).toBe(100000);
    expect(typeof request.down_payment).toBe('number');
    expect(request.credit_score).toBe(750);
    expect(request.loan_type).toBe('conventional');
    expect(request.loan_term).toBe('30');
    expect(request.property_type).toBe('single_family');
    expect(request.occupancy_type).toBe('primary');
    expect(request.zip_code).toBe('12345');
    expect(request.debt_to_income_ratio).toBe(35.5);
    expect(typeof request.debt_to_income_ratio).toBe('number');
    expect(request.created_at).toBeInstanceOf(Date);
  });

  it('should handle null debt_to_income_ratio correctly', async () => {
    // Insert test data with null debt_to_income_ratio
    const testData = {
      loan_amount: '300000.00',
      property_value: '400000.00',
      down_payment: '80000.00',
      credit_score: 680,
      loan_type: 'fha' as const,
      loan_term: '15' as const,
      property_type: 'condo' as const,
      occupancy_type: 'secondary' as const,
      zip_code: '67890',
      debt_to_income_ratio: null
    };

    await db.insert(mortgageQuoteRequestsTable)
      .values(testData)
      .execute();

    const result = await getMortgageQuoteRequests();

    expect(result).toHaveLength(1);
    expect(result[0].debt_to_income_ratio).toBeNull();
  });

  it('should return multiple requests ordered by created_at descending', async () => {
    const now = new Date();
    const earlier = new Date(now.getTime() - 3600000); // 1 hour earlier
    const later = new Date(now.getTime() + 3600000); // 1 hour later

    // Insert multiple requests with different timestamps
    const requests = [
      {
        loan_amount: '250000.00',
        property_value: '300000.00',
        down_payment: '50000.00',
        credit_score: 620,
        loan_type: 'va' as const,
        loan_term: '25' as const,
        property_type: 'townhouse' as const,
        occupancy_type: 'primary' as const,
        zip_code: '11111',
        debt_to_income_ratio: '40.00',
        created_at: earlier
      },
      {
        loan_amount: '500000.00',
        property_value: '625000.00',
        down_payment: '125000.00',
        credit_score: 800,
        loan_type: 'jumbo' as const,
        loan_term: '20' as const,
        property_type: 'multi_family' as const,
        occupancy_type: 'investment' as const,
        zip_code: '22222',
        debt_to_income_ratio: '28.75',
        created_at: later
      },
      {
        loan_amount: '400000.00',
        property_value: '500000.00',
        down_payment: '100000.00',
        credit_score: 720,
        loan_type: 'usda' as const,
        loan_term: '30' as const,
        property_type: 'single_family' as const,
        occupancy_type: 'primary' as const,
        zip_code: '33333',
        debt_to_income_ratio: '32.50',
        created_at: now
      }
    ];

    // Insert all requests
    for (const request of requests) {
      await db.insert(mortgageQuoteRequestsTable)
        .values(request)
        .execute();
    }

    const result = await getMortgageQuoteRequests();

    expect(result).toHaveLength(3);

    // Verify ordering (most recent first)
    expect(result[0].loan_amount).toBe(500000); // later timestamp
    expect(result[1].loan_amount).toBe(400000); // now timestamp  
    expect(result[2].loan_amount).toBe(250000); // earlier timestamp

    // Verify all numeric conversions are correct
    result.forEach(request => {
      expect(typeof request.loan_amount).toBe('number');
      expect(typeof request.property_value).toBe('number');
      expect(typeof request.down_payment).toBe('number');
      expect(typeof request.credit_score).toBe('number');
      if (request.debt_to_income_ratio !== null) {
        expect(typeof request.debt_to_income_ratio).toBe('number');
      }
    });
  });

  it('should handle various loan types and property types correctly', async () => {
    const testCases = [
      {
        loan_amount: '200000.00',
        property_value: '250000.00',
        down_payment: '50000.00',
        credit_score: 650,
        loan_type: 'conventional' as const,
        loan_term: '15' as const,
        property_type: 'single_family' as const,
        occupancy_type: 'primary' as const,
        zip_code: '12345-6789',
        debt_to_income_ratio: '25.00'
      },
      {
        loan_amount: '350000.00',
        property_value: '425000.00',
        down_payment: '75000.00',
        credit_score: 700,
        loan_type: 'fha' as const,
        loan_term: '30' as const,
        property_type: 'condo' as const,
        occupancy_type: 'secondary' as const,
        zip_code: '98765',
        debt_to_income_ratio: null
      }
    ];

    // Insert test cases
    for (const testCase of testCases) {
      await db.insert(mortgageQuoteRequestsTable)
        .values(testCase)
        .execute();
    }

    const result = await getMortgageQuoteRequests();

    expect(result).toHaveLength(2);
    
    // Verify enum values are preserved correctly
    const loanTypes = result.map(r => r.loan_type);
    const propertyTypes = result.map(r => r.property_type);
    const occupancyTypes = result.map(r => r.occupancy_type);
    const loanTerms = result.map(r => r.loan_term);

    expect(loanTypes).toContain('conventional');
    expect(loanTypes).toContain('fha');
    expect(propertyTypes).toContain('single_family');
    expect(propertyTypes).toContain('condo');
    expect(occupancyTypes).toContain('primary');
    expect(occupancyTypes).toContain('secondary');
    expect(loanTerms).toContain('15');
    expect(loanTerms).toContain('30');
  });
});