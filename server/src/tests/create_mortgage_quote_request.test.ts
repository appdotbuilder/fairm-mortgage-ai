import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { mortgageQuoteRequestsTable } from '../db/schema';
import { type CreateMortgageQuoteRequestInput } from '../schema';
import { createMortgageQuoteRequest } from '../handlers/create_mortgage_quote_request';
import { eq } from 'drizzle-orm';

// Simple test input with all required fields
const testInput: CreateMortgageQuoteRequestInput = {
  loan_amount: 400000,
  property_value: 500000,
  down_payment: 100000,
  credit_score: 750,
  loan_type: 'conventional',
  loan_term: '30',
  property_type: 'single_family',
  occupancy_type: 'primary',
  zip_code: '12345',
  debt_to_income_ratio: 28.5
};

// Test input with nullable field set to null
const testInputWithNullDTI: CreateMortgageQuoteRequestInput = {
  loan_amount: 300000,
  property_value: 400000,
  down_payment: 60000,
  credit_score: 680,
  loan_type: 'fha',
  loan_term: '15',
  property_type: 'condo',
  occupancy_type: 'secondary',
  zip_code: '54321-1234',
  debt_to_income_ratio: null
};

describe('createMortgageQuoteRequest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a mortgage quote request with all fields', async () => {
    const result = await createMortgageQuoteRequest(testInput);

    // Basic field validation
    expect(result.loan_amount).toEqual(400000);
    expect(result.property_value).toEqual(500000);
    expect(result.down_payment).toEqual(100000);
    expect(result.credit_score).toEqual(750);
    expect(result.loan_type).toEqual('conventional');
    expect(result.loan_term).toEqual('30');
    expect(result.property_type).toEqual('single_family');
    expect(result.occupancy_type).toEqual('primary');
    expect(result.zip_code).toEqual('12345');
    expect(result.debt_to_income_ratio).toEqual(28.5);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify numeric field types
    expect(typeof result.loan_amount).toBe('number');
    expect(typeof result.property_value).toBe('number');
    expect(typeof result.down_payment).toBe('number');
    expect(typeof result.debt_to_income_ratio).toBe('number');
  });

  it('should create a mortgage quote request with null debt_to_income_ratio', async () => {
    const result = await createMortgageQuoteRequest(testInputWithNullDTI);

    // Basic field validation
    expect(result.loan_amount).toEqual(300000);
    expect(result.property_value).toEqual(400000);
    expect(result.down_payment).toEqual(60000);
    expect(result.credit_score).toEqual(680);
    expect(result.loan_type).toEqual('fha');
    expect(result.loan_term).toEqual('15');
    expect(result.property_type).toEqual('condo');
    expect(result.occupancy_type).toEqual('secondary');
    expect(result.zip_code).toEqual('54321-1234');
    expect(result.debt_to_income_ratio).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify numeric field types
    expect(typeof result.loan_amount).toBe('number');
    expect(typeof result.property_value).toBe('number');
    expect(typeof result.down_payment).toBe('number');
  });

  it('should save mortgage quote request to database', async () => {
    const result = await createMortgageQuoteRequest(testInput);

    // Query using proper drizzle syntax
    const quoteRequests = await db.select()
      .from(mortgageQuoteRequestsTable)
      .where(eq(mortgageQuoteRequestsTable.id, result.id))
      .execute();

    expect(quoteRequests).toHaveLength(1);
    const savedRequest = quoteRequests[0];
    
    // Verify stored values (note: numeric fields are stored as strings in DB)
    expect(parseFloat(savedRequest.loan_amount)).toEqual(400000);
    expect(parseFloat(savedRequest.property_value)).toEqual(500000);
    expect(parseFloat(savedRequest.down_payment)).toEqual(100000);
    expect(savedRequest.credit_score).toEqual(750);
    expect(savedRequest.loan_type).toEqual('conventional');
    expect(savedRequest.loan_term).toEqual('30');
    expect(savedRequest.property_type).toEqual('single_family');
    expect(savedRequest.occupancy_type).toEqual('primary');
    expect(savedRequest.zip_code).toEqual('12345');
    expect(parseFloat(savedRequest.debt_to_income_ratio!)).toEqual(28.5);
    expect(savedRequest.created_at).toBeInstanceOf(Date);
  });

  it('should handle various loan types correctly', async () => {
    const loanTypes = ['conventional', 'fha', 'va', 'usda', 'jumbo'] as const;
    
    for (const loanType of loanTypes) {
      const input = {
        ...testInput,
        loan_type: loanType
      };
      
      const result = await createMortgageQuoteRequest(input);
      expect(result.loan_type).toEqual(loanType);
    }
  });

  it('should handle various loan terms correctly', async () => {
    const loanTerms = ['15', '20', '25', '30'] as const;
    
    for (const loanTerm of loanTerms) {
      const input = {
        ...testInput,
        loan_term: loanTerm
      };
      
      const result = await createMortgageQuoteRequest(input);
      expect(result.loan_term).toEqual(loanTerm);
    }
  });

  it('should handle various property types correctly', async () => {
    const propertyTypes = ['single_family', 'condo', 'townhouse', 'multi_family'] as const;
    
    for (const propertyType of propertyTypes) {
      const input = {
        ...testInput,
        property_type: propertyType
      };
      
      const result = await createMortgageQuoteRequest(input);
      expect(result.property_type).toEqual(propertyType);
    }
  });

  it('should handle various occupancy types correctly', async () => {
    const occupancyTypes = ['primary', 'secondary', 'investment'] as const;
    
    for (const occupancyType of occupancyTypes) {
      const input = {
        ...testInput,
        occupancy_type: occupancyType
      };
      
      const result = await createMortgageQuoteRequest(input);
      expect(result.occupancy_type).toEqual(occupancyType);
    }
  });

  it('should handle different ZIP code formats', async () => {
    const zipCodes = ['12345', '54321-1234'];
    
    for (const zipCode of zipCodes) {
      const input = {
        ...testInput,
        zip_code: zipCode
      };
      
      const result = await createMortgageQuoteRequest(input);
      expect(result.zip_code).toEqual(zipCode);
    }
  });

  it('should handle zero down payment correctly', async () => {
    const input = {
      ...testInput,
      down_payment: 0
    };
    
    const result = await createMortgageQuoteRequest(input);
    expect(result.down_payment).toEqual(0);
    expect(typeof result.down_payment).toBe('number');
  });

  it('should handle edge case credit scores correctly', async () => {
    const creditScores = [300, 850]; // Min and max allowed credit scores
    
    for (const creditScore of creditScores) {
      const input = {
        ...testInput,
        credit_score: creditScore
      };
      
      const result = await createMortgageQuoteRequest(input);
      expect(result.credit_score).toEqual(creditScore);
    }
  });
});