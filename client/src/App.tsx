import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { CreateMortgageQuoteRequestInput, MortgageQuote, Lender } from '../../server/src/schema';

function App() {
  const [formData, setFormData] = useState<CreateMortgageQuoteRequestInput>({
    loan_amount: 400000,
    property_value: 500000,
    down_payment: 100000,
    credit_score: 750,
    loan_type: 'conventional',
    loan_term: '30',
    property_type: 'single_family',
    occupancy_type: 'primary',
    zip_code: '',
    debt_to_income_ratio: null
  });

  const [quotes, setQuotes] = useState<MortgageQuote[]>([]);
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Load lenders on mount
  const loadLenders = useCallback(async () => {
    try {
      const result = await trpc.getLenders.query();
      setLenders(result);
    } catch (error) {
      console.error('Failed to load lenders:', error);
    }
  }, []);

  useEffect(() => {
    loadLenders();
  }, [loadLenders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      // Make API call to get mortgage quotes
      const fetchedQuotes = await trpc.getMortgageQuotes.query(formData);
      
      // Sort by APR for best rates first
      const sortedQuotes = fetchedQuotes.sort((a, b) => a.apr - b.apr);
      setQuotes(sortedQuotes);
    } catch (error) {
      console.error('Failed to get quotes:', error);
      // Set empty array on error to show "no rates found" message
      setQuotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatRate = (rate: number) => {
    return `${rate.toFixed(3)}%`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <h1 className="text-xl font-semibold text-slate-900">FAIRM</h1>
            </div>
            <div className="text-sm text-slate-600">
              AI-Powered Mortgage Platform
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Find the perfect mortgage rate
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Compare rates from top lenders and get pre-qualified in minutes. 
            Our AI-powered platform finds you the best deals.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Quote Form */}
          <div className="lg:col-span-5">
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl">Get Your Rates</CardTitle>
                <CardDescription>
                  Tell us about your loan needs and we'll find the best rates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Loan Amount & Property Value */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="loan_amount">Loan Amount</Label>
                      <Input
                        id="loan_amount"
                        type="number"
                        value={formData.loan_amount}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateMortgageQuoteRequestInput) => ({ 
                            ...prev, 
                            loan_amount: parseInt(e.target.value) || 0 
                          }))
                        }
                        className="text-lg"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="property_value">Property Value</Label>
                      <Input
                        id="property_value"
                        type="number"
                        value={formData.property_value}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateMortgageQuoteRequestInput) => ({ 
                            ...prev, 
                            property_value: parseInt(e.target.value) || 0 
                          }))
                        }
                        className="text-lg"
                        required
                      />
                    </div>
                  </div>

                  {/* Down Payment & Credit Score */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="down_payment">Down Payment</Label>
                      <Input
                        id="down_payment"
                        type="number"
                        value={formData.down_payment}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateMortgageQuoteRequestInput) => ({ 
                            ...prev, 
                            down_payment: parseInt(e.target.value) || 0 
                          }))
                        }
                        className="text-lg"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="credit_score">Credit Score</Label>
                      <Input
                        id="credit_score"
                        type="number"
                        min="300"
                        max="850"
                        value={formData.credit_score}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateMortgageQuoteRequestInput) => ({ 
                            ...prev, 
                            credit_score: parseInt(e.target.value) || 0 
                          }))
                        }
                        className="text-lg"
                        required
                      />
                    </div>
                  </div>

                  {/* Loan Type & Term */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Loan Type</Label>
                      <Select
                        value={formData.loan_type}
                        onValueChange={(value: 'conventional' | 'fha' | 'va' | 'usda' | 'jumbo') =>
                          setFormData((prev: CreateMortgageQuoteRequestInput) => ({ 
                            ...prev, 
                            loan_type: value 
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conventional">Conventional</SelectItem>
                          <SelectItem value="fha">FHA</SelectItem>
                          <SelectItem value="va">VA</SelectItem>
                          <SelectItem value="usda">USDA</SelectItem>
                          <SelectItem value="jumbo">Jumbo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Loan Term</Label>
                      <Select
                        value={formData.loan_term}
                        onValueChange={(value: '15' | '20' | '25' | '30') =>
                          setFormData((prev: CreateMortgageQuoteRequestInput) => ({ 
                            ...prev, 
                            loan_term: value 
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 years</SelectItem>
                          <SelectItem value="20">20 years</SelectItem>
                          <SelectItem value="25">25 years</SelectItem>
                          <SelectItem value="30">30 years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Property & Occupancy Type */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Property Type</Label>
                      <Select
                        value={formData.property_type}
                        onValueChange={(value: 'single_family' | 'condo' | 'townhouse' | 'multi_family') =>
                          setFormData((prev: CreateMortgageQuoteRequestInput) => ({ 
                            ...prev, 
                            property_type: value 
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single_family">Single Family</SelectItem>
                          <SelectItem value="condo">Condo</SelectItem>
                          <SelectItem value="townhouse">Townhouse</SelectItem>
                          <SelectItem value="multi_family">Multi Family</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Occupancy</Label>
                      <Select
                        value={formData.occupancy_type}
                        onValueChange={(value: 'primary' | 'secondary' | 'investment') =>
                          setFormData((prev: CreateMortgageQuoteRequestInput) => ({ 
                            ...prev, 
                            occupancy_type: value 
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primary Residence</SelectItem>
                          <SelectItem value="secondary">Second Home</SelectItem>
                          <SelectItem value="investment">Investment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* ZIP Code */}
                  <div className="space-y-2">
                    <Label htmlFor="zip_code">ZIP Code</Label>
                    <Input
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateMortgageQuoteRequestInput) => ({ 
                          ...prev, 
                          zip_code: e.target.value 
                        }))
                      }
                      placeholder="12345"
                      pattern="\d{5}(-\d{4})?"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg py-6"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Finding Rates...' : 'Get My Rates'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-7">
            {hasSearched ? (
              <div className="space-y-6">
                {isLoading ? (
                  <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardContent className="p-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">
                        Searching for the best rates...
                      </h3>
                      <p className="text-slate-600">
                        Our AI is analyzing thousands of loan options
                      </p>
                    </CardContent>
                  </Card>
                ) : quotes.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-slate-900">
                        Your Mortgage Quotes
                      </h3>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {quotes.length} rates found
                      </Badge>
                    </div>
                    
                    <div className="space-y-4">
                      {quotes.map((quote: MortgageQuote) => (
                        <Card key={quote.rate_id} className="shadow-lg border-0 bg-white/70 backdrop-blur-sm hover:shadow-xl transition-shadow">
                          <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                                  <span className="text-slate-700 font-semibold text-lg">
                                    {quote.lender_name.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="text-lg font-semibold text-slate-900">
                                    {quote.lender_name}
                                  </h4>
                                  <p className="text-sm text-slate-600 capitalize">
                                    {quote.loan_type.replace('_', ' ')} • {quote.loan_term} year
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-3xl font-bold text-slate-900">
                                  {formatRate(quote.interest_rate)}
                                </div>
                                <div className="text-sm text-slate-600">
                                  APR {formatRate(quote.apr)}
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                              <div className="bg-slate-50 rounded-lg p-3">
                                <div className="text-sm text-slate-600 mb-1">Monthly Payment</div>
                                <div className="text-lg font-semibold text-slate-900">
                                  {formatCurrency(quote.monthly_payment)}
                                </div>
                              </div>
                              <div className="bg-slate-50 rounded-lg p-3">
                                <div className="text-sm text-slate-600 mb-1">Total Interest</div>
                                <div className="text-lg font-semibold text-slate-900">
                                  {formatCurrency(quote.total_interest)}
                                </div>
                              </div>
                              <div className="bg-slate-50 rounded-lg p-3">
                                <div className="text-sm text-slate-600 mb-1">Points</div>
                                <div className="text-lg font-semibold text-slate-900">
                                  {quote.points}
                                </div>
                              </div>
                              <div className="bg-slate-50 rounded-lg p-3">
                                <div className="text-sm text-slate-600 mb-1">Closing Costs</div>
                                <div className="text-lg font-semibold text-slate-900">
                                  {quote.closing_costs ? formatCurrency(quote.closing_costs) : 'TBD'}
                                </div>
                              </div>
                            </div>
                            
                            <Separator className="my-4" />
                            
                            <div className="flex justify-between items-center">
                              <div className="text-sm text-slate-600">
                                LTV: {quote.loan_to_value_ratio.toFixed(1)}% • 
                                Down: {quote.down_payment_percent.toFixed(1)}%
                              </div>
                              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                Get Pre-Qualified
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                ) : (
                  <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardContent className="p-12 text-center">
                      <div className="text-6xl mb-4">🏠</div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">
                        No rates found
                      </h3>
                      <p className="text-slate-600">
                        Try adjusting your search criteria and search again
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Ready to find your perfect rate?
                  </h3>
                  <p className="text-slate-600">
                    Fill out the form to get personalized mortgage quotes from top lenders
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 py-12 border-t border-slate-200">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Why choose FAIRM?
            </h3>
            <p className="text-lg text-slate-600">
              We make mortgage shopping transparent, fast, and fair
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white/50 rounded-2xl">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h4 className="text-xl font-semibold text-slate-900 mb-2">Instant Results</h4>
              <p className="text-slate-600">
                Get personalized rates in seconds, not days
              </p>
            </div>
            
            <div className="text-center p-6 bg-white/50 rounded-2xl">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h4 className="text-xl font-semibold text-slate-900 mb-2">Secure & Private</h4>
              <p className="text-slate-600">
                Your information is protected with bank-level security
              </p>
            </div>
            
            <div className="text-center p-6 bg-white/50 rounded-2xl">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h4 className="text-xl font-semibold text-slate-900 mb-2">AI-Powered Matching</h4>
              <p className="text-slate-600">
                Our AI finds the perfect lender for your unique situation
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;