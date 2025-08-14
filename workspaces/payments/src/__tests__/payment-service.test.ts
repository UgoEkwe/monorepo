import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock payment service for testing
class MockPaymentService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async processPayment(amount: number, currency: string = 'USD') {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    
    return {
      id: 'payment_123',
      amount,
      currency,
      status: 'succeeded'
    };
  }
}

describe('Payment Service', () => {
  let paymentService: MockPaymentService;

  beforeEach(() => {
    paymentService = new MockPaymentService('test_key');
  });

  it('should process valid payments', async () => {
    const result = await paymentService.processPayment(100);
    
    expect(result).toEqual({
      id: 'payment_123',
      amount: 100,
      currency: 'USD',
      status: 'succeeded'
    });
  });

  it('should reject negative amounts', async () => {
    await expect(paymentService.processPayment(-10))
      .rejects.toThrow('Amount must be positive');
  });

  it('should handle different currencies', async () => {
    const result = await paymentService.processPayment(50, 'EUR');
    expect(result.currency).toBe('EUR');
  });
});