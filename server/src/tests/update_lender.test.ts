import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { lendersTable } from '../db/schema';
import { type UpdateLenderInput, type CreateLenderInput } from '../schema';
import { updateLender } from '../handlers/update_lender';
import { eq } from 'drizzle-orm';

// Test helper to create a lender
const createTestLender = async (lenderData: CreateLenderInput) => {
  const result = await db.insert(lendersTable)
    .values({
      ...lenderData,
      created_at: new Date(),
      updated_at: new Date()
    })
    .returning()
    .execute();
  return result[0];
};

describe('updateLender', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a lender with all fields', async () => {
    // Create initial lender
    const initialLender = await createTestLender({
      name: 'Initial Lender',
      logo_url: 'https://example.com/logo.png',
      website_url: 'https://example.com',
      phone: '555-1234',
      email: 'contact@example.com',
      is_active: true
    });

    // Update all fields
    const updateInput: UpdateLenderInput = {
      id: initialLender.id,
      name: 'Updated Lender Name',
      logo_url: 'https://updated.com/logo.png',
      website_url: 'https://updated.com',
      phone: '555-9999',
      email: 'updated@example.com',
      is_active: false
    };

    const result = await updateLender(updateInput);

    // Verify all fields were updated
    expect(result.id).toBe(initialLender.id);
    expect(result.name).toBe('Updated Lender Name');
    expect(result.logo_url).toBe('https://updated.com/logo.png');
    expect(result.website_url).toBe('https://updated.com');
    expect(result.phone).toBe('555-9999');
    expect(result.email).toBe('updated@example.com');
    expect(result.is_active).toBe(false);
    expect(result.created_at).toEqual(initialLender.created_at);
    expect(result.updated_at.getTime()).toBeGreaterThan(initialLender.updated_at.getTime());
  });

  it('should update only provided fields', async () => {
    // Create initial lender
    const initialLender = await createTestLender({
      name: 'Initial Lender',
      logo_url: 'https://example.com/logo.png',
      website_url: 'https://example.com',
      phone: '555-1234',
      email: 'contact@example.com',
      is_active: true
    });

    // Update only name and email
    const updateInput: UpdateLenderInput = {
      id: initialLender.id,
      name: 'Partially Updated Lender',
      email: 'newemail@example.com'
    };

    const result = await updateLender(updateInput);

    // Verify only specified fields were updated
    expect(result.id).toBe(initialLender.id);
    expect(result.name).toBe('Partially Updated Lender');
    expect(result.logo_url).toBe('https://example.com/logo.png'); // Unchanged
    expect(result.website_url).toBe('https://example.com'); // Unchanged
    expect(result.phone).toBe('555-1234'); // Unchanged
    expect(result.email).toBe('newemail@example.com');
    expect(result.is_active).toBe(true); // Unchanged
    expect(result.created_at).toEqual(initialLender.created_at);
    expect(result.updated_at.getTime()).toBeGreaterThan(initialLender.updated_at.getTime());
  });

  it('should update fields to null values', async () => {
    // Create initial lender with all fields
    const initialLender = await createTestLender({
      name: 'Initial Lender',
      logo_url: 'https://example.com/logo.png',
      website_url: 'https://example.com',
      phone: '555-1234',
      email: 'contact@example.com',
      is_active: true
    });

    // Update nullable fields to null
    const updateInput: UpdateLenderInput = {
      id: initialLender.id,
      logo_url: null,
      website_url: null,
      phone: null,
      email: null
    };

    const result = await updateLender(updateInput);

    // Verify nullable fields were set to null
    expect(result.id).toBe(initialLender.id);
    expect(result.name).toBe('Initial Lender'); // Unchanged
    expect(result.logo_url).toBeNull();
    expect(result.website_url).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.is_active).toBe(true); // Unchanged
    expect(result.updated_at.getTime()).toBeGreaterThan(initialLender.updated_at.getTime());
  });

  it('should save updated lender to database', async () => {
    // Create initial lender
    const initialLender = await createTestLender({
      name: 'Initial Lender',
      logo_url: null,
      website_url: null,
      phone: null,
      email: null,
      is_active: true
    });

    // Update the lender
    const updateInput: UpdateLenderInput = {
      id: initialLender.id,
      name: 'Database Updated Lender',
      is_active: false
    };

    await updateLender(updateInput);

    // Query database directly to verify changes were persisted
    const savedLender = await db.select()
      .from(lendersTable)
      .where(eq(lendersTable.id, initialLender.id))
      .execute();

    expect(savedLender).toHaveLength(1);
    expect(savedLender[0].name).toBe('Database Updated Lender');
    expect(savedLender[0].is_active).toBe(false);
    expect(savedLender[0].updated_at.getTime()).toBeGreaterThan(initialLender.updated_at.getTime());
  });

  it('should throw error when lender does not exist', async () => {
    const updateInput: UpdateLenderInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent Lender'
    };

    await expect(updateLender(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update only updated_at timestamp when no other fields provided', async () => {
    // Create initial lender
    const initialLender = await createTestLender({
      name: 'Timestamp Test Lender',
      logo_url: null,
      website_url: null,
      phone: null,
      email: null,
      is_active: true
    });

    // Update with only ID (no other fields)
    const updateInput: UpdateLenderInput = {
      id: initialLender.id
    };

    const result = await updateLender(updateInput);

    // Verify all original fields remain unchanged except updated_at
    expect(result.id).toBe(initialLender.id);
    expect(result.name).toBe('Timestamp Test Lender');
    expect(result.logo_url).toBeNull();
    expect(result.website_url).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.is_active).toBe(true);
    expect(result.created_at).toEqual(initialLender.created_at);
    expect(result.updated_at.getTime()).toBeGreaterThan(initialLender.updated_at.getTime());
  });
});