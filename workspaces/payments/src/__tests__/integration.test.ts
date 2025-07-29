import { describe, it, expect } from 'vitest';

describe('Payments Integration', () => {
  it('should export main components', () => {
    // Test that the main modules can be imported
    expect(() => {
      const { PaymentService } = require('../payment-service');
      const { StripeClient } = require('../stripe-client');
      const { WebhookHandler } = require('../webhook-handler');
      
      expect(PaymentService).toBeDefined();
      expect(StripeClient).toBeDefined();
      expect(WebhookHandler).toBeDefined();
    }).not.toThrow();
  });

  it('should have correct type definitions', () => {
    const types = require('../types');
    
    expect(types).toBeDefined();
    // Types are compile-time constructs, so we just verify the module loads
  });

  it('should create payment service with required parameters', () => {
    const { PaymentService } = require('../payment-service');
    
    const mockDb = {
      entity: {
        findUnique: async () => ({}),
        update: async () => ({}),
        findMany: async () => ([]),
      },
      $disconnect: async () => {},
    };

    expect(() => {
      new PaymentService('test_key', mockDb);
    }).not.toThrow();
  });

  it('should throw error when database client is missing', () => {
    const { PaymentService } = require('../payment-service');
    
    expect(() => {
      new PaymentService('test_key');
    }).toThrow('Database client is required');
  });
});