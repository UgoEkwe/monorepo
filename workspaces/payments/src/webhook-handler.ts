import Stripe from 'stripe';
import { PaymentEventData, EntityMetadataUpdate } from './types';
import { StripeClient } from './stripe-client';

export class WebhookHandler {
  private stripeClient: StripeClient;

  constructor(stripeClient: StripeClient) {
    this.stripeClient = stripeClient;
  }

  /**
   * Process Stripe webhook events
   */
  async processWebhookEvent(event: Stripe.Event): Promise<PaymentEventData | null> {
    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        return this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      
      case 'payment_intent.succeeded':
        return this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      
      case 'payment_intent.payment_failed':
        return this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      
      case 'invoice.payment_succeeded':
        return this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
      
      case 'customer.subscription.created':
        return this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
      
      case 'customer.subscription.deleted':
        return this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
        return null;
    }
  }

  /**
   * Handle successful checkout session completion
   */
  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<PaymentEventData> {
    const entityId = session.metadata?.entityId;
    
    return {
      eventType: 'checkout.session.completed',
      sessionId: session.id,
      entityId,
      amount: session.amount_total || 0,
      currency: session.currency || 'usd',
      status: 'completed',
      metadata: session.metadata || {},
    };
  }

  /**
   * Handle successful payment intent
   */
  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<PaymentEventData> {
    return {
      eventType: 'payment_intent.succeeded',
      sessionId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'succeeded',
      metadata: paymentIntent.metadata,
    };
  }

  /**
   * Handle failed payment intent
   */
  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<PaymentEventData> {
    return {
      eventType: 'payment_intent.payment_failed',
      sessionId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'failed',
      metadata: paymentIntent.metadata,
    };
  }

  /**
   * Handle successful invoice payment (for subscriptions)
   */
  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<PaymentEventData> {
    return {
      eventType: 'invoice.payment_succeeded',
      sessionId: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      metadata: invoice.metadata || {},
    };
  }

  /**
   * Handle subscription creation
   */
  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<PaymentEventData> {
    return {
      eventType: 'customer.subscription.created',
      sessionId: subscription.id,
      status: subscription.status,
      metadata: subscription.metadata,
    };
  }

  /**
   * Handle subscription deletion
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<PaymentEventData> {
    return {
      eventType: 'customer.subscription.deleted',
      sessionId: subscription.id,
      status: 'canceled',
      metadata: subscription.metadata,
    };
  }

  /**
   * Convert payment event data to entity metadata update
   */
  static createEntityMetadataUpdate(eventData: PaymentEventData): EntityMetadataUpdate | null {
    if (!eventData.entityId) {
      return null;
    }

    let paymentStatus: EntityMetadataUpdate['paymentStatus'];
    
    switch (eventData.status) {
      case 'completed':
      case 'succeeded':
        paymentStatus = 'completed';
        break;
      case 'failed':
        paymentStatus = 'failed';
        break;
      case 'canceled':
      case 'cancelled':
        paymentStatus = 'failed';
        break;
      default:
        paymentStatus = 'pending';
    }

    return {
      entityId: eventData.entityId,
      paymentStatus,
      paymentId: eventData.sessionId,
      amount: eventData.amount ? eventData.amount / 100 : undefined, // Convert from cents
      currency: eventData.currency,
      purchasedAt: paymentStatus === 'completed' ? new Date() : undefined,
    };
  }
}