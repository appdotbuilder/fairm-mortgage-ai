import { db } from '../db';
import { lendersTable } from '../db/schema';
import { type CreateLenderInput, type Lender } from '../schema';

export const createLender = async (input: CreateLenderInput): Promise<Lender> => {
  try {
    // Insert lender record
    const result = await db.insert(lendersTable)
      .values({
        name: input.name,
        logo_url: input.logo_url,
        website_url: input.website_url,
        phone: input.phone,
        email: input.email,
        is_active: input.is_active
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Lender creation failed:', error);
    throw error;
  }
};