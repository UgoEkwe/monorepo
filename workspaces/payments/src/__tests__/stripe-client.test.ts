import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StripeClient } from '../stripe-client';
import Stripe from 'stripe';

// Mock Stripe
vi.mock('stripe');

describe('StripeClient', () => {
  let stripeClient: StripeClient;
  let mockStripe: any;

  beforeEach(() => {
    mockStripe = {
      checkout: {
        sessions: {
          create: vi.fn(),
          retrieve: vi.fn(),
        },
      },
      customers: {
        create: vi.fn(),
        retrieve: vi.fn(),
      },
      webhooks: {
        constructEvent: vi.fn(),
      },
    };

    (Stripe as any).mockImplementation(() => mockStripe);
    stripeClient = new StripeClient('test_key');
  });

  describe('createCheckoutSession', () => {
    it('should create a checkout session successfully', async () => {
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      };

      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      const config = {
        entityId: 'entity_123',
        entityName: 'Test Content',
        price: 9.99,
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      const result = await stripeClient.createCheckoutSession(config);

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe('cs_test_123');
      expect(result.url).toBe('https://checkout.stripe.com/pay/cs_test_123');

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Test Content',
                description: 'Purchase access to Test Content',
              },
              unit_amount: 999, // 9.99 * 100
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        metadata: {
          entityId: 'entity_123',
        },
      });
    });

    it('should handle errors when creating checkout session', async () => {
      mockStripe.checkout.sessions.create.mockRejectedValue(new Error('Stripe error'));

      const config = {
        entityId: 'entity_123',
        entityName: 'Test Content',
        price: 9.99,
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      const result = await stripeClient.createCheckoutSession(config);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Stripe error');
    });
  });

  describe('createSubscriptionSession', () => {
    it('should create a subscription session successfully', async () => {
      const mockSession = {
        id: 'cs_sub_123',
        url: 'https://checkout.stripe.com/pay/cs_sub_123',
      };

      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      const config = {
        priceId: 'price_123',
        customerId: 'cus_123',
        metadata: { plan: 'premium' },
      };

      const result = await stripeClient.createSubscriptionSession(config);

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe('cs_sub_123');
      expect(result.url).toBe('https://checkout.stripe.com/pay/cs_sub_123');
    });
  });

  describe('getCheckoutSession', () => {
    it('should retrieve a checkout session', async () => {
      const mockSession = { id: 'cs_test_123', status: 'complete' };
      mockStripe.checkout.sessions.retrieve.mockResolvedValue(mockSession);

      const result = await stripeClient.getCheckoutSession('cs_test_123');

      expect(result).toEqual(mockSession);
      expect(mockStripe.checkout.sessions.retrieve).toHaveBeenCalledWith('cs_test_123');
    });

    it('should return null on error', async () => {
      mockStripe.checkout.sessions.retrieve.mockRejectedValue(new Error('Not found'));

      const result = await stripeClient.getCheckoutSession('cs_invalid');

      expect(result).toBeNull();
    });
  });

  describe('constructWebhookEvent', () => {
    it('should construct webhook event', () => {
      const mockEvent = { id: 'evt_123', type: 'checkout.session.completed' };
      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = stripeClient.constructWebhookEvent('payload', 'signature', 'secret');

      expect(result).toEqual(mockEvent);
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith('payload', 'signature', 'secret');
    });
  });
});