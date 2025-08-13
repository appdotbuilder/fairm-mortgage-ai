import { db } from '../db';
import { lendersTable } from '../db/schema';
import { type Lender } from '../schema';
import { eq } from 'drizzle-orm';

export const getLenders = async (): Promise<Lender[]> => {
  try {
    // Fetch all active lenders from the database
    const result = await db.select()
      .from(lendersTable)
      .where(eq(lendersTable.is_active, true))
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch lenders:', error);
    throw error;
  }
};