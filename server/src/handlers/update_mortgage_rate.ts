import { db } from '../db';
import { mortgageRatesTable, lendersTable } from '../db/schema';
import { type UpdateMortgageRateInput, type MortgageRate } from '../schema';
import { eq } from 'drizzle-orm';

export const updateMortgageRate = async (input: UpdateMortgageRateInput): Promise<MortgageRate> => {
  try {
    // First, check if the mortgage rate exists
    const existingRate = await db.select()
      .from(mortgageRatesTable)
      .where(eq(mortgageRatesTable.id, input.id))
      .execute();

    if (existingRate.length === 0) {
      throw new Error(`Mortgage rate with ID ${input.id} not found`);
    }

    // If lender_id is being updated, verify the lender exists
    if (input.lender_id !== undefined) {
      const lender = await db.select()
        .from(lendersTable)
        .where(eq(lendersTable.id, input.lender_id))
        .execute();

      if (lender.length === 0) {
        throw new Error(`Lender with ID ${input.lender_id} not found`);
      }
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date()
    };

    if (input.lender_id !== undefined) {
      updateData['lender_id'] = input.lender_id;
    }
    if (input.loan_type !== undefined) {
      updateData['loan_type'] = input.loan_type;
    }
    if (input.loan_term !== undefined) {
      updateData['loan_term'] = input.loan_term;
    }
    if (input.interest_rate !== undefined) {
      updateData['interest_rate'] = input.interest_rate.toString();
    }
    if (input.apr !== undefined) {
      updateData['apr'] = input.apr.toString();
    }
    if (input.points !== undefined) {
      updateData['points'] = input.points.toString();
    }
    if (input.min_credit_score !== undefined) {
      updateData['min_credit_score'] = input.min_credit_score;
    }
    if (input.max_loan_amount !== undefined) {
      updateData['max_loan_amount'] = input.max_loan_amount.toString();
    }
    if (input.min_down_payment_percent !== undefined) {
      updateData['min_down_payment_percent'] = input.min_down_payment_percent.toString();
    }
    if (input.closing_costs !== undefined) {
      updateData['closing_costs'] = input.closing_costs !== null ? input.closing_costs.toString() : null;
    }
    if (input.is_active !== undefined) {
      updateData['is_active'] = input.is_active;
    }

    // Update the mortgage rate record
    const result = await db.update(mortgageRatesTable)
      .set(updateData)
      .where(eq(mortgageRatesTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const updatedRate = result[0];
    return {
      ...updatedRate,
      interest_rate: parseFloat(updatedRate.interest_rate),
      apr: parseFloat(updatedRate.apr),
      points: parseFloat(updatedRate.points),
      max_loan_amount: parseFloat(updatedRate.max_loan_amount),
      min_down_payment_percent: parseFloat(updatedRate.min_down_payment_percent),
      closing_costs: updatedRate.closing_costs !== null ? parseFloat(updatedRate.closing_costs) : null
    };
  } catch (error) {
    console.error('Mortgage rate update failed:', error);
    throw error;
  }
};