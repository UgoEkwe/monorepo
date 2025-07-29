import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhookHandler } from '../webhook-handler';
import { StripeClient } from '../stripe-client';
import Stripe from 'stripe';

describe('WebhookHandler', () => {
  let webhookHandler: WebhookHandler;
  let mockStripeClient: any;

  beforeEach(() => {
    mockStripeClient = {
      getCheckoutSession: vi.fn(),
    };
    webhookHandler = new WebhookHandler(mockStripeClient);
  });

  describe('processWebhookEvent', () => {
    it('should handle checkout.session.completed event', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            amount_total: 999,
            currency: 'usd',
            metadata: {
              entityId: 'entity_123',
            },
          } as Stripe.Checkout.Session,
        },
        created: Date.now(),
        api_version: '2023-10-16',
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        request: { id: null, idempotency_key: null },
      };

      const result = await webhookHandler.processWebhookEvent(mockEvent);

      expect(result).toEqual({
        eventType: 'checkout.session.completed',
        sessionId: 'cs_test_123',
        entityId: 'entity_123',
        amount: 999,
        currency: 'usd',
        status: 'completed',
        metadata: {
          entityId: 'entity_123',
        },
      });
    });

    it('should handle payment_intent.succeeded event', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_456',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            amount: 999,
            currency: 'usd',
            metadata: {
              entityId: 'entity_123',
            },
          } as Stripe.PaymentIntent,
        },
        created: Date.now(),
        api_version: '2023-10-16',
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        request: { id: null, idempotency_key: null },
      };

      const result = await webhookHandler.processWebhookEvent(mockEvent);

      expect(result).toEqual({
        eventType: 'payment_intent.succeeded',
        sessionId: 'pi_test_123',
        amount: 999,
        currency: 'usd',
        status: 'succeeded',
        metadata: {
          entityId: 'entity_123',
        },
      });
    });

    it('should return null for unhandled event types', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_789',
        type: 'customer.created',
        data: {
          object: {} as Stripe.Customer,
        },
        created: Date.now(),
        api_version: '2023-10-16',
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        request: { id: null, idempotency_key: null },
      };

      const result = await webhookHandler.processWebhookEvent(mockEvent);

      expect(result).toBeNull();
    });
  });

  describe('createEntityMetadataUpdate', () => {
    it('should create metadata update for completed payment', () => {
      const eventData = {
        eventType: 'checkout.session.completed',
        sessionId: 'cs_test_123',
        entityId: 'entity_123',
        amount: 999,
        currency: 'usd',
        status: 'completed',
        metadata: {},
      };

      const result = WebhookHandler.createEntityMetadataUpdate(eventData);

      expect(result).toEqual({
        entityId: 'entity_123',
        paymentStatus: 'completed',
        paymentId: 'cs_test_123',
        amount: 9.99, // Converted from cents
        currency: 'usd',
        purchasedAt: expect.any(Date),
      });
    });

    it('should create metadata update for failed payment', () => {
      const eventData = {
        eventType: 'payment_intent.payment_failed',
        sessionId: 'pi_test_123',
        entityId: 'entity_123',
        amount: 999,
        currency: 'usd',
        status: 'failed',
        metadata: {},
      };

      const result = WebhookHandler.createEntityMetadataUpdate(eventData);

      expect(result).toEqual({
        entityId: 'entity_123',
        paymentStatus: 'failed',
        paymentId: 'pi_test_123',
        amount: 9.99,
        currency: 'usd',
        purchasedAt: undefined,
      });
    });

    it('should return null when entityId is missing', () => {
      const eventData = {
        eventType: 'checkout.session.completed',
        sessionId: 'cs_test_123',
        amount: 999,
        currency: 'usd',
        status: 'completed',
        metadata: {},
      };

      const result = WebhookHandler.createEntityMetadataUpdate(eventData);

      expect(result).toBeNull();
    });
  });
});