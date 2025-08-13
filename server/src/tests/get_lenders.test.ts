import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { lendersTable } from '../db/schema';
import { type CreateLenderInput } from '../schema';
import { getLenders } from '../handlers/get_lenders';

// Test data
const activeLender1: CreateLenderInput = {
  name: 'First National Bank',
  logo_url: 'https://example.com/logo1.png',
  website_url: 'https://firstnational.com',
  phone: '555-0001',
  email: 'contact@firstnational.com',
  is_active: true
};

const activeLender2: CreateLenderInput = {
  name: 'Community Credit Union',
  logo_url: null,
  website_url: 'https://communityccu.com',
  phone: null,
  email: 'info@communityccu.com',
  is_active: true
};

const inactiveLender: CreateLenderInput = {
  name: 'Inactive Bank',
  logo_url: null,
  website_url: null,
  phone: null,
  email: null,
  is_active: false
};

describe('getLenders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all active lenders', async () => {
    // Create test lenders
    await db.insert(lendersTable).values([
      activeLender1,
      activeLender2,
      inactiveLender
    ]).execute();

    const result = await getLenders();

    // Should only return active lenders
    expect(result).toHaveLength(2);
    
    // Verify all returned lenders are active
    result.forEach(lender => {
      expect(lender.is_active).toBe(true);
    });

    // Check specific lender data
    const firstNational = result.find(lender => lender.name === 'First National Bank');
    const communityCU = result.find(lender => lender.name === 'Community Credit Union');

    expect(firstNational).toBeDefined();
    expect(firstNational!.logo_url).toEqual('https://example.com/logo1.png');
    expect(firstNational!.website_url).toEqual('https://firstnational.com');
    expect(firstNational!.phone).toEqual('555-0001');
    expect(firstNational!.email).toEqual('contact@firstnational.com');
    expect(firstNational!.id).toBeDefined();
    expect(firstNational!.created_at).toBeInstanceOf(Date);
    expect(firstNational!.updated_at).toBeInstanceOf(Date);

    expect(communityCU).toBeDefined();
    expect(communityCU!.logo_url).toBeNull();
    expect(communityCU!.website_url).toEqual('https://communityccu.com');
    expect(communityCU!.phone).toBeNull();
    expect(communityCU!.email).toEqual('info@communityccu.com');
  });

  it('should return empty array when no active lenders exist', async () => {
    // Create only inactive lenders
    await db.insert(lendersTable).values([
      inactiveLender
    ]).execute();

    const result = await getLenders();

    expect(result).toHaveLength(0);
  });

  it('should return empty array when no lenders exist', async () => {
    const result = await getLenders();

    expect(result).toHaveLength(0);
  });

  it('should handle multiple inactive lenders correctly', async () => {
    // Create multiple inactive lenders and one active
    await db.insert(lendersTable).values([
      { ...inactiveLender, name: 'Inactive Bank 1' },
      { ...inactiveLender, name: 'Inactive Bank 2' },
      { ...inactiveLender, name: 'Inactive Bank 3' },
      activeLender1
    ]).execute();

    const result = await getLenders();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('First National Bank');
    expect(result[0].is_active).toBe(true);
  });

  it('should handle lenders with null values correctly', async () => {
    // Create lender with all nullable fields as null
    const minimalLender: CreateLenderInput = {
      name: 'Minimal Lender',
      logo_url: null,
      website_url: null,
      phone: null,
      email: null,
      is_active: true
    };

    await db.insert(lendersTable).values([minimalLender]).execute();

    const result = await getLenders();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Minimal Lender');
    expect(result[0].logo_url).toBeNull();
    expect(result[0].website_url).toBeNull();
    expect(result[0].phone).toBeNull();
    expect(result[0].email).toBeNull();
    expect(result[0].is_active).toBe(true);
  });
});