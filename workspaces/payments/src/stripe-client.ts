import Stripe from 'stripe';
import { CheckoutSessionConfig, SubscriptionConfig, PaymentResult } from './types';

export class StripeClient {
  private stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Create a checkout session for content purchase
   */
  async createCheckoutSession(config: CheckoutSessionConfig): Promise<PaymentResult> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: config.currency || 'usd',
              product_data: {
                name: config.entityName,
                description: `Purchase access to ${config.entityName}`,
              },
              unit_amount: Math.round(config.price * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: config.successUrl,
        cancel_url: config.cancelUrl,
        metadata: {
          entityId: config.entityId,
          ...config.metadata,
        },
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url || undefined,
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a subscription checkout session (stub for future extensibility)
   */
  async createSubscriptionSession(config: SubscriptionConfig): Promise<PaymentResult> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: config.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        customer: config.customerId,
        metadata: config.metadata,
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url || undefined,
      };
    } catch (error) {
      console.error('Error creating subscription session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Retrieve a checkout session
   */
  async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session | null> {
    try {
      return await this.stripe.checkout.sessions.retrieve(sessionId);
    } catch (error) {
      console.error('Error retrieving checkout session:', error);
      return null;
    }
  }

  /**
   * Construct webhook event from raw body and signature
   */
  constructWebhookEvent(payload: string | Buffer, signature: string, endpointSecret: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  }

  /**
   * Get customer by ID (for subscription management)
   */
  async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return customer as Stripe.Customer;
    } catch (error) {
      console.error('Error retrieving customer:', error);
      return null;
    }
  }

  /**
   * Create a customer (for subscription management)
   */
  async createCustomer(email: string, name?: string): Promise<Stripe.Customer | null> {
    try {
      return await this.stripe.customers.create({
        email,
        name,
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      return null;
    }
  }
}