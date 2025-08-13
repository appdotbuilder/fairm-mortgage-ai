import { db } from '../db';
import { lendersTable } from '../db/schema';
import { type UpdateLenderInput, type Lender } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateLender(input: UpdateLenderInput): Promise<Lender> {
  try {
    // First verify the lender exists
    const existingLender = await db.select()
      .from(lendersTable)
      .where(eq(lendersTable.id, input.id))
      .execute();

    if (existingLender.length === 0) {
      throw new Error(`Lender with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof lendersTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.logo_url !== undefined) updateData.logo_url = input.logo_url;
    if (input.website_url !== undefined) updateData.website_url = input.website_url;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;

    // Update the lender record
    const result = await db.update(lendersTable)
      .set(updateData)
      .where(eq(lendersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Lender update failed:', error);
    throw error;
  }
}