import { db } from '../db';
import { mortgageQuoteRequestsTable } from '../db/schema';
import { type CreateMortgageQuoteRequestInput, type MortgageQuoteRequest } from '../schema';

export const createMortgageQuoteRequest = async (input: CreateMortgageQuoteRequestInput): Promise<MortgageQuoteRequest> => {
  try {
    // Insert mortgage quote request record
    const result = await db.insert(mortgageQuoteRequestsTable)
      .values({
        loan_amount: input.loan_amount.toString(),
        property_value: input.property_value.toString(),
        down_payment: input.down_payment.toString(),
        credit_score: input.credit_score,
        loan_type: input.loan_type,
        loan_term: input.loan_term,
        property_type: input.property_type,
        occupancy_type: input.occupancy_type,
        zip_code: input.zip_code,
        debt_to_income_ratio: input.debt_to_income_ratio?.toString() || null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const quoteRequest = result[0];
    return {
      ...quoteRequest,
      loan_amount: parseFloat(quoteRequest.loan_amount),
      property_value: parseFloat(quoteRequest.property_value),
      down_payment: parseFloat(quoteRequest.down_payment),
      debt_to_income_ratio: quoteRequest.debt_to_income_ratio 
        ? parseFloat(quoteRequest.debt_to_income_ratio) 
        : null
    };
  } catch (error) {
    console.error('Mortgage quote request creation failed:', error);
    throw error;
  }
};