import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PaymentService } from './payment-service';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PAYMENTS_PORT || 3004;

// Security middleware
app.use(helmet());
app.use(cors());

// Webhook endpoint needs raw body
app.use('/webhook', express.raw({ type: 'application/json' }));

// JSON middleware for other endpoints
app.use(express.json());

// Mock database client for standalone operation
const mockDatabaseClient = {
  entity: {
    findUnique: async (args: any) => ({ id: args.where.id, name: 'Mock Entity', metadata: {} }),
    update: async (args: any) => ({ id: args.where.id, ...args.data }),
    findMany: async (args: any) => [{ id: '1', name: 'Mock Entity', metadata: {} }],
  },
  $disconnect: async () => {},
};

// Initialize payment service
const paymentService = new PaymentService(
  process.env.STRIPE_SECRET_KEY || '',
  mockDatabaseClient
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'payments' });
});

// Create checkout session
app.post('/checkout', async (req, res) => {
  try {
    const { entityId, price, successUrl, cancelUrl, metadata } = req.body;

    if (!entityId || !price || !successUrl || !cancelUrl) {
      return res.status(400).json({
        error: 'Missing required fields: entityId, price, successUrl, cancelUrl',
      });
    }

    const result = await paymentService.createContentCheckout({
      entityId,
      entityName: 'Unknown',
      price: parseFloat(price),
      successUrl,
      cancelUrl,
      metadata,
    });

    if (result.success) {
      res.json({
        success: true,
        sessionId: result.sessionId,
        url: result.url,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Stripe webhook endpoint
app.post('/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  if (!signature || !endpointSecret) {
    return res.status(400).json({
      error: 'Missing webhook signature or secret',
    });
  }

  try {
    const success = await paymentService.handleWebhook(
      req.body,
      signature,
      endpointSecret
    );

    if (success) {
      res.json({ received: true });
    } else {
      res.status(400).json({ error: 'Webhook processing failed' });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({
      error: 'Webhook signature verification failed',
    });
  }
});

// Get payment status for entity
app.get('/entity/:entityId/payment', async (req, res) => {
  try {
    const { entityId } = req.params;
    const paymentStatus = await paymentService.getEntityPaymentStatus(entityId);
    
    res.json({
      entityId,
      payment: paymentStatus,
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Get entities with payment information
app.get('/project/:projectId/entities', async (req, res) => {
  try {
    const { projectId } = req.params;
    const entities = await paymentService.getEntitiesWithPayments(projectId);
    
    res.json({
      projectId,
      entities,
    });
  } catch (error) {
    console.error('Get entities with payments error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
  });
});

// Start server
app.listen(port, () => {
  console.log(`Payments service running on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await paymentService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await paymentService.disconnect();
  process.exit(0);
});

export default app;