# Payments Workspace

Stripe integration with webhook handling and checkout utilities for the Modular AI Scaffold.

## Features

- **Stripe Checkout Sessions**: Create payment sessions for content purchases
- **Webhook Handling**: Process Stripe webhook events automatically
- **Entity Metadata Updates**: Update entity payment status in database
- **Subscription Management**: Stubs for future subscription functionality
- **Payment Flow Testing**: Comprehensive test suite for payment workflows

## Architecture

The payments workspace consists of several key components:

- `StripeClient`: Handles direct Stripe API interactions
- `WebhookHandler`: Processes incoming Stripe webhook events
- `PaymentService`: Orchestrates payment flows and database updates
- `Express Server`: HTTP server for webhook endpoints and API routes

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Configure the following environment variables in your `.env` file:

```bash
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
PAYMENTS_PORT="3004"
```

### 3. Database Integration
The PaymentService requires a database client that implements the following interface:

```typescript
interface DatabaseClient {
  entity: {
    findUnique: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any>;
  };
  $disconnect: () => Promise<void>;
}
```

## Usage

### Starting the Server
```bash
npm run dev
```

### Creating a Checkout Session
```typescript
import { PaymentService } from '@modular-ai-scaffold/payments';

const paymentService = new PaymentService(stripeSecretKey, databaseClient);

const result = await paymentService.createContentCheckout({
  entityId: 'entity_123',
  entityName: 'Premium Content',
  price: 9.99,
  successUrl: 'https://yourapp.com/success',
  cancelUrl: 'https://yourapp.com/cancel',
});
```

### Handling Webhooks
The server automatically handles Stripe webhooks at `/webhook` endpoint. When a payment is completed, it updates the entity metadata with payment information:

```json
{
  "payment": {
    "status": "completed",
    "paymentId": "cs_test_123",
    "amount": 9.99,
    "currency": "usd",
    "purchasedAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## API Endpoints

### POST /checkout
Create a new checkout session for content purchase.

**Request Body:**
```json
{
  "entityId": "entity_123",
  "price": 9.99,
  "successUrl": "https://yourapp.com/success",
  "cancelUrl": "https://yourapp.com/cancel",
  "metadata": {
    "custom": "data"
  }
}
```

### POST /webhook
Stripe webhook endpoint for processing payment events.

### GET /entity/:entityId/payment
Get payment status for a specific entity.

### GET /project/:projectId/entities
Get all entities with payment information for a project.

## Testing

Run the test suite:
```bash
npm test
```

The test suite includes:
- Unit tests for StripeClient
- Unit tests for WebhookHandler
- Unit tests for PaymentService
- Integration tests for the complete payment flow

## Extension Examples

### Adding Custom Payment Metadata
```typescript
const result = await paymentService.createContentCheckout({
  entityId: 'entity_123',
  entityName: 'Premium Content',
  price: 9.99,
  successUrl: 'https://yourapp.com/success',
  cancelUrl: 'https://yourapp.com/cancel',
  metadata: {
    userId: 'user_456',
    contentType: 'premium_article',
    accessLevel: 'full'
  }
});
```

### Subscription Management (Future)
The workspace includes stubs for subscription management:

```typescript
const subscriptionResult = await stripeClient.createSubscriptionSession({
  priceId: 'price_monthly_premium',
  customerId: 'cus_customer_123',
  metadata: {
    plan: 'premium',
    features: 'all'
  }
});
```

## Integration with Other Workspaces

- **Database**: Uses entity models to track payment status
- **Backend**: Can be called from FastAPI endpoints
- **Web/Mobile**: Frontend can redirect to checkout URLs
- **AI**: AI agents can trigger content purchases

## Deployment

The payments service can be deployed as a standalone Express server or integrated into the main backend service. For production deployment:

1. Set up Stripe webhook endpoints
2. Configure environment variables
3. Deploy with proper database connections
4. Set up monitoring for payment events

## Security Considerations

- Webhook signature verification is enforced
- Sensitive payment data is not stored locally
- All payment processing goes through Stripe
- Entity metadata updates are atomic operations