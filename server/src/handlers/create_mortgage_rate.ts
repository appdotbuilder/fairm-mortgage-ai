import { db } from '../db';
import { mortgageRatesTable, lendersTable } from '../db/schema';
import { type CreateMortgageRateInput, type MortgageRate } from '../schema';
import { eq } from 'drizzle-orm';

export const createMortgageRate = async (input: CreateMortgageRateInput): Promise<MortgageRate> => {
  try {
    // First, verify that the lender exists
    const lender = await db.select()
      .from(lendersTable)
      .where(eq(lendersTable.id, input.lender_id))
      .execute();

    if (lender.length === 0) {
      throw new Error(`Lender with ID ${input.lender_id} not found`);
    }

    // Insert mortgage rate record
    const result = await db.insert(mortgageRatesTable)
      .values({
        lender_id: input.lender_id,
        loan_type: input.loan_type,
        loan_term: input.loan_term,
        interest_rate: input.interest_rate.toString(), // Convert number to string for numeric column
        apr: input.apr.toString(), // Convert number to string for numeric column
        points: input.points.toString(), // Convert number to string for numeric column
        min_credit_score: input.min_credit_score,
        max_loan_amount: input.max_loan_amount.toString(), // Convert number to string for numeric column
        min_down_payment_percent: input.min_down_payment_percent.toString(), // Convert number to string for numeric column
        closing_costs: input.closing_costs?.toString() || null, // Convert number to string for numeric column
        is_active: input.is_active
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const mortgageRate = result[0];
    return {
      ...mortgageRate,
      interest_rate: parseFloat(mortgageRate.interest_rate), // Convert string back to number
      apr: parseFloat(mortgageRate.apr), // Convert string back to number
      points: parseFloat(mortgageRate.points), // Convert string back to number
      max_loan_amount: parseFloat(mortgageRate.max_loan_amount), // Convert string back to number
      min_down_payment_percent: parseFloat(mortgageRate.min_down_payment_percent), // Convert string back to number
      closing_costs: mortgageRate.closing_costs ? parseFloat(mortgageRate.closing_costs) : null // Convert string back to number
    };
  } catch (error) {
    console.error('Mortgage rate creation failed:', error);
    throw error;
  }
};