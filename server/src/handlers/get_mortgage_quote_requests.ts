import { db } from '../db';
import { mortgageQuoteRequestsTable } from '../db/schema';
import { type MortgageQuoteRequest } from '../schema';
import { desc } from 'drizzle-orm';

export const getMortgageQuoteRequests = async (): Promise<MortgageQuoteRequest[]> => {
  try {
    // Fetch all mortgage quote requests ordered by most recent first
    const results = await db.select()
      .from(mortgageQuoteRequestsTable)
      .orderBy(desc(mortgageQuoteRequestsTable.created_at))
      .execute();

    // Convert numeric fields back to numbers for proper type compliance
    return results.map(request => ({
      ...request,
      loan_amount: parseFloat(request.loan_amount),
      property_value: parseFloat(request.property_value),
      down_payment: parseFloat(request.down_payment),
      debt_to_income_ratio: request.debt_to_income_ratio ? parseFloat(request.debt_to_income_ratio) : null
    }));
  } catch (error) {
    console.error('Failed to fetch mortgage quote requests:', error);
    throw error;
  }
};