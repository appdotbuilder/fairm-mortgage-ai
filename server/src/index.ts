import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schema types
import { 
  createLenderInputSchema,
  updateLenderInputSchema,
  createMortgageRateInputSchema,
  updateMortgageRateInputSchema,
  createMortgageQuoteRequestInputSchema
} from './schema';

// Import handlers
import { createLender } from './handlers/create_lender';
import { getLenders } from './handlers/get_lenders';
import { updateLender } from './handlers/update_lender';
import { createMortgageRate } from './handlers/create_mortgage_rate';
import { getMortgageRates } from './handlers/get_mortgage_rates';
import { updateMortgageRate } from './handlers/update_mortgage_rate';
import { createMortgageQuoteRequest } from './handlers/create_mortgage_quote_request';
import { getMortgageQuotes } from './handlers/get_mortgage_quotes';
import { getMortgageQuoteRequests } from './handlers/get_mortgage_quote_requests';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Lender management endpoints
  createLender: publicProcedure
    .input(createLenderInputSchema)
    .mutation(({ input }) => createLender(input)),
  
  getLenders: publicProcedure
    .query(() => getLenders()),
  
  updateLender: publicProcedure
    .input(updateLenderInputSchema)
    .mutation(({ input }) => updateLender(input)),

  // Mortgage rate management endpoints
  createMortgageRate: publicProcedure
    .input(createMortgageRateInputSchema)
    .mutation(({ input }) => createMortgageRate(input)),
  
  getMortgageRates: publicProcedure
    .query(() => getMortgageRates()),
  
  updateMortgageRate: publicProcedure
    .input(updateMortgageRateInputSchema)
    .mutation(({ input }) => updateMortgageRate(input)),

  // Quote request and comparison endpoints
  createMortgageQuoteRequest: publicProcedure
    .input(createMortgageQuoteRequestInputSchema)
    .mutation(({ input }) => createMortgageQuoteRequest(input)),
  
  getMortgageQuotes: publicProcedure
    .input(createMortgageQuoteRequestInputSchema)
    .query(({ input }) => getMortgageQuotes(input)),
  
  getMortgageQuoteRequests: publicProcedure
    .query(() => getMortgageQuoteRequests()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`FAIRM TRPC server listening at port: ${port}`);
}

start();