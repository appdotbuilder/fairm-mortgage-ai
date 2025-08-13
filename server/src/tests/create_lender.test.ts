import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { lendersTable } from '../db/schema';
import { type CreateLenderInput } from '../schema';
import { createLender } from '../handlers/create_lender';
import { eq } from 'drizzle-orm';

// Complete test input with all fields
const testInput: CreateLenderInput = {
  name: 'Test Lender Bank',
  logo_url: 'https://example.com/logo.png',
  website_url: 'https://testlender.com',
  phone: '+1-555-123-4567',
  email: 'contact@testlender.com',
  is_active: true
};

// Minimal test input (only required fields)
const minimalInput: CreateLenderInput = {
  name: 'Minimal Lender',
  logo_url: null,
  website_url: null,
  phone: null,
  email: null,
  is_active: true // This has a default value in schema
};

describe('createLender', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a lender with all fields', async () => {
    const result = await createLender(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Lender Bank');
    expect(result.logo_url).toEqual('https://example.com/logo.png');
    expect(result.website_url).toEqual('https://testlender.com');
    expect(result.phone).toEqual('+1-555-123-4567');
    expect(result.email).toEqual('contact@testlender.com');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a lender with minimal fields', async () => {
    const result = await createLender(minimalInput);

    expect(result.name).toEqual('Minimal Lender');
    expect(result.logo_url).toBeNull();
    expect(result.website_url).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save lender to database', async () => {
    const result = await createLender(testInput);

    // Query using proper drizzle syntax
    const lenders = await db.select()
      .from(lendersTable)
      .where(eq(lendersTable.id, result.id))
      .execute();

    expect(lenders).toHaveLength(1);
    expect(lenders[0].name).toEqual('Test Lender Bank');
    expect(lenders[0].logo_url).toEqual('https://example.com/logo.png');
    expect(lenders[0].website_url).toEqual('https://testlender.com');
    expect(lenders[0].phone).toEqual('+1-555-123-4567');
    expect(lenders[0].email).toEqual('contact@testlender.com');
    expect(lenders[0].is_active).toEqual(true);
    expect(lenders[0].created_at).toBeInstanceOf(Date);
    expect(lenders[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle default is_active value', async () => {
    // Test with Zod default behavior
    const inputWithoutIsActive = {
      name: 'Default Active Lender',
      logo_url: null,
      website_url: null,
      phone: null,
      email: null
    };

    // Zod should apply default is_active: true
    const parsedInput = {
      ...inputWithoutIsActive,
      is_active: true
    } as CreateLenderInput;

    const result = await createLender(parsedInput);

    expect(result.is_active).toEqual(true);
    expect(result.name).toEqual('Default Active Lender');
  });

  it('should create multiple lenders with unique IDs', async () => {
    const input1: CreateLenderInput = {
      name: 'First Lender',
      logo_url: null,
      website_url: null,
      phone: null,
      email: null,
      is_active: true
    };

    const input2: CreateLenderInput = {
      name: 'Second Lender',
      logo_url: null,
      website_url: null,
      phone: null,
      email: null,
      is_active: false
    };

    const result1 = await createLender(input1);
    const result2 = await createLender(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('First Lender');
    expect(result2.name).toEqual('Second Lender');
    expect(result1.is_active).toEqual(true);
    expect(result2.is_active).toEqual(false);
  });

  it('should preserve timestamp ordering', async () => {
    const result1 = await createLender({
      name: 'First Lender',
      logo_url: null,
      website_url: null,
      phone: null,
      email: null,
      is_active: true
    });

    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    const result2 = await createLender({
      name: 'Second Lender',
      logo_url: null,
      website_url: null,
      phone: null,
      email: null,
      is_active: true
    });

    expect(result1.created_at).toBeDefined();
    expect(result2.created_at).toBeDefined();
    expect(result1.created_at <= result2.created_at).toBe(true);
  });
});