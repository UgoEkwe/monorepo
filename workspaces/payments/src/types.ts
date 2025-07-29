import Stripe from 'stripe';

export interface CheckoutSessionConfig {
  entityId: string;
  entityName: string;
  price: number;
  currency?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface PaymentEventData {
  eventType: string;
  sessionId: string;
  entityId?: string;
  amount?: number;
  currency?: string;
  status: string;
  metadata?: Record<string, any>;
}

export interface SubscriptionConfig {
  priceId: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: Stripe.Event.Data.Object;
  };
  created: number;
}

export interface PaymentResult {
  success: boolean;
  sessionId?: string;
  url?: string;
  error?: string;
}

export interface EntityMetadataUpdate {
  entityId: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentId?: string;
  amount?: number;
  currency?: string;
  purchasedAt?: Date;
}