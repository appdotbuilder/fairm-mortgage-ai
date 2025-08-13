import { db } from '../db';
import { mortgageRatesTable, lendersTable } from '../db/schema';
import { type MortgageRate } from '../schema';
import { eq } from 'drizzle-orm';

export const getMortgageRates = async (): Promise<MortgageRate[]> => {
  try {
    // Join mortgage rates with lenders to get complete information
    // Only fetch active rates from active lenders
    const results = await db.select()
      .from(mortgageRatesTable)
      .innerJoin(lendersTable, eq(mortgageRatesTable.lender_id, lendersTable.id))
      .where(eq(mortgageRatesTable.is_active, true))
      .execute();

    // Convert numeric fields back to numbers and flatten the joined structure
    return results.map(result => ({
      id: result.mortgage_rates.id,
      lender_id: result.mortgage_rates.lender_id,
      loan_type: result.mortgage_rates.loan_type,
      loan_term: result.mortgage_rates.loan_term,
      interest_rate: parseFloat(result.mortgage_rates.interest_rate),
      apr: parseFloat(result.mortgage_rates.apr),
      points: parseFloat(result.mortgage_rates.points),
      min_credit_score: result.mortgage_rates.min_credit_score,
      max_loan_amount: parseFloat(result.mortgage_rates.max_loan_amount),
      min_down_payment_percent: parseFloat(result.mortgage_rates.min_down_payment_percent),
      closing_costs: result.mortgage_rates.closing_costs ? parseFloat(result.mortgage_rates.closing_costs) : null,
      is_active: result.mortgage_rates.is_active,
      created_at: result.mortgage_rates.created_at,
      updated_at: result.mortgage_rates.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch mortgage rates:', error);
    throw error;
  }
};