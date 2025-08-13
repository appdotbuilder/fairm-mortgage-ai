import { db } from '../db';
import { lendersTable, mortgageRatesTable } from '../db/schema';
import { type CreateMortgageQuoteRequestInput, type MortgageQuote } from '../schema';
import { eq, and, lte, gte, asc } from 'drizzle-orm';

export const getMortgageQuotes = async (input: CreateMortgageQuoteRequestInput): Promise<MortgageQuote[]> => {
  try {
    // Calculate derived values
    const downPaymentPercent = (input.down_payment / input.property_value) * 100;
    const loanToValueRatio = (input.loan_amount / input.property_value) * 100;

    // Query mortgage rates with lender information that match criteria
    const results = await db.select({
      rate_id: mortgageRatesTable.id,
      lender_id: mortgageRatesTable.lender_id,
      lender_name: lendersTable.name,
      lender_logo_url: lendersTable.logo_url,
      loan_type: mortgageRatesTable.loan_type,
      loan_term: mortgageRatesTable.loan_term,
      interest_rate: mortgageRatesTable.interest_rate,
      apr: mortgageRatesTable.apr,
      points: mortgageRatesTable.points,
      min_credit_score: mortgageRatesTable.min_credit_score,
      max_loan_amount: mortgageRatesTable.max_loan_amount,
      min_down_payment_percent: mortgageRatesTable.min_down_payment_percent,
      closing_costs: mortgageRatesTable.closing_costs
    })
    .from(mortgageRatesTable)
    .innerJoin(lendersTable, eq(mortgageRatesTable.lender_id, lendersTable.id))
    .where(and(
      eq(mortgageRatesTable.loan_type, input.loan_type),
      eq(mortgageRatesTable.loan_term, input.loan_term),
      lte(mortgageRatesTable.min_credit_score, input.credit_score),
      gte(mortgageRatesTable.max_loan_amount, input.loan_amount.toString()),
      lte(mortgageRatesTable.min_down_payment_percent, downPaymentPercent.toString()),
      eq(mortgageRatesTable.is_active, true),
      eq(lendersTable.is_active, true)
    ))
    .orderBy(asc(mortgageRatesTable.apr))
    .execute();

    // Transform results into mortgage quotes with calculations
    return results.map(result => {
      const interestRate = parseFloat(result.interest_rate);
      const apr = parseFloat(result.apr);
      const points = parseFloat(result.points);
      const closingCosts = result.closing_costs ? parseFloat(result.closing_costs) : null;
      
      const monthlyPayment = calculateMonthlyPayment(
        input.loan_amount, 
        interestRate, 
        parseInt(input.loan_term)
      );
      
      const totalInterest = calculateTotalInterest(
        input.loan_amount, 
        interestRate, 
        parseInt(input.loan_term)
      );

      return {
        rate_id: result.rate_id,
        lender_id: result.lender_id,
        lender_name: result.lender_name,
        lender_logo_url: result.lender_logo_url,
        loan_type: result.loan_type,
        loan_term: result.loan_term,
        interest_rate: interestRate,
        apr: apr,
        points: points,
        monthly_payment: monthlyPayment,
        total_interest: totalInterest,
        closing_costs: closingCosts,
        down_payment_percent: Math.round(downPaymentPercent * 100) / 100,
        loan_to_value_ratio: Math.round(loanToValueRatio * 100) / 100
      };
    });
  } catch (error) {
    console.error('Mortgage quotes retrieval failed:', error);
    throw error;
  }
};

// Calculate monthly payment using standard mortgage formula
// M = P [ r(1 + r)^n ] / [ (1 + r)^n – 1]
function calculateMonthlyPayment(loanAmount: number, interestRate: number, loanTermYears: number): number {
  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = loanTermYears * 12;
  
  if (monthlyRate === 0) {
    return loanAmount / numberOfPayments;
  }
  
  const monthlyPayment = loanAmount * 
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  
  return Math.round(monthlyPayment * 100) / 100;
}

// Calculate total interest paid over the life of the loan
function calculateTotalInterest(loanAmount: number, interestRate: number, loanTermYears: number): number {
  const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, loanTermYears);
  const totalPayments = monthlyPayment * loanTermYears * 12;
  
  return Math.round((totalPayments - loanAmount) * 100) / 100;
}