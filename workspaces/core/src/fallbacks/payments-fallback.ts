/**
 * Fallback implementations for payments workspace
 * Provides no-op implementations when payments are not available
 */

export interface PaymentsFallback {
  PaymentService: PaymentServiceFallback;
  StripeClient: StripeClientFallback;
  WebhookHandler: WebhookHandlerFallback;
}

export interface PaymentServiceFallback {
  new (stripeKey?: string, database?: any): PaymentServiceInstanceFallback;
}

export interface PaymentServiceInstanceFallback {
  createCheckoutSession(params: any): Promise<any>;
  createPaymentIntent(params: any): Promise<any>;
  retrieveSession(sessionId: string): Promise<any>;
  handleWebhook(payload: string, signature: string): Promise<any>;
}

export interface StripeClientFallback {
  new (apiKey?: string): StripeInstanceFallback;
}

export interface StripeInstanceFallback {
  checkout: {
    sessions: {
      create(params: any): Promise<any>;
      retrieve(sessionId: string): Promise<any>;
    };
  };
  paymentIntents: {
    create(params: any): Promise<any>;
    retrieve(paymentIntentId: string): Promise<any>;
  };
  webhooks: {
    constructEvent(payload: string, signature: string, secret: string): any;
  };
}

export interface WebhookHandlerFallback {
  new (stripeClient: any, database?: any): WebhookHandlerInstanceFallback;
}

export interface WebhookHandlerInstanceFallback {
  handleEvent(event: any): Promise<void>;
}

function createPaymentServiceFallback(): PaymentServiceFallback {
  return class PaymentServiceFallback implements PaymentServiceInstanceFallback {
    constructor(stripeKey?: string, database?: any) {
      console.warn('Payments not available - using fallback PaymentService');
    }
    
    async createCheckoutSession(params: any) {
      console.warn('Payments not available - createCheckoutSession() called');
      throw new Error('Payments service not available');
    }
    
    async createPaymentIntent(params: any) {
      console.warn('Payments not available - createPaymentIntent() called');
      throw new Error('Payments service not available');
    }
    
    async retrieveSession(sessionId: string) {
      console.warn('Payments not available - retrieveSession() called');
      return null;
    }
    
    async handleWebhook(payload: string, signature: string) {
      console.warn('Payments not available - handleWebhook() called');
      throw new Error('Payments service not available');
    }
  };
}

function createStripeClientFallback(): StripeClientFallback {
  return class StripeClientFallback implements StripeInstanceFallback {
    checkout = {
      sessions: {
        async create(params: any) {
          console.warn('Stripe not available - checkout.sessions.create() called');
          throw new Error('Stripe not available');
        },
        async retrieve(sessionId: string) {
          console.warn('Stripe not available - checkout.sessions.retrieve() called');
          return null;
        }
      }
    };
    
    paymentIntents = {
      async create(params: any) {
        console.warn('Stripe not available - paymentIntents.create() called');
        throw new Error('Stripe not available');
      },
      async retrieve(paymentIntentId: string) {
        console.warn('Stripe not available - paymentIntents.retrieve() called');
        return null;
      }
    };
    
    webhooks = {
      constructEvent(payload: string, signature: string, secret: string) {
        console.warn('Stripe not available - webhooks.constructEvent() called');
        throw new Error('Stripe not available');
      }
    };
    
    constructor(apiKey?: string) {
      console.warn('Stripe not available - using fallback StripeClient');
    }
  };
}

function createWebhookHandlerFallback(): WebhookHandlerFallback {
  return class WebhookHandlerFallback implements WebhookHandlerInstanceFallback {
    constructor(stripeClient: any, database?: any) {
      console.warn('Payments not available - using fallback WebhookHandler');
    }
    
    async handleEvent(event: any) {
      console.warn('Payments not available - handleEvent() called');
    }
  };
}

export function createPaymentsFallback(): PaymentsFallback {
  return {
    PaymentService: createPaymentServiceFallback(),
    StripeClient: createStripeClientFallback(),
    WebhookHandler: createWebhookHandlerFallback()
  };
}