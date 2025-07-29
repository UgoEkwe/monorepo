import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PaymentService } from '../payment-service';

// Mock dependencies
vi.mock('../stripe-client');
vi.mock('../webhook-handler');

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockPrisma: any;
  let mockStripeClient: any;
  let mockWebhookHandler: any;

  beforeEach(() => {
    mockPrisma = {
      entity: {
        findUnique: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      $disconnect: vi.fn(),
    };

    mockStripeClient = {
      createCheckoutSession: vi.fn(),
      constructWebhookEvent: vi.fn(),
    };

    mockWebhookHandler = {
      processWebhookEvent: vi.fn(),
    };

    // Mock the constructors
    const { StripeClient } = require('../stripe-client');
    const { WebhookHandler } = require('../webhook-handler');
    
    StripeClient.mockImplementation(() => mockStripeClient);
    WebhookHandler.mockImplementation(() => mockWebhookHandler);
    WebhookHandler.createEntityMetadataUpdate = vi.fn();

    // Mock Prisma client is created in beforeEach

    paymentService = new PaymentService('test_key', mockPrisma);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createContentCheckout', () => {
    it('should create checkout session for existing entity', async () => {
      const mockEntity = {
        id: 'entity_123',
        name: 'Test Content',
        description: 'Test description',
      };

      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);
      mockStripeClient.createCheckoutSession.mockResolvedValue({
        success: true,
        sessionId: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      });

      const config = {
        entityId: 'entity_123',
        entityName: 'Test Content',
        price: 9.99,
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      const result = await paymentService.createContentCheckout(config);

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe('cs_test_123');
      expect(mockPrisma.entity.update).toHaveBeenCalledWith({
        where: { id: 'entity_123' },
        data: {
          metadata: expect.objectContaining({
            payment: expect.objectContaining({
              status: 'pending',
              paymentId: 'cs_test_123',
            }),
          }),
        },
      });
    });

    it('should return error for non-existent entity', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(null);

      const config = {
        entityId: 'nonexistent',
        entityName: 'Test Content',
        price: 9.99,
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      const result = await paymentService.createContentCheckout(config);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Entity not found');
    });
  });

  describe('handleWebhook', () => {
    it('should process webhook successfully', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
      };

      const mockEventData = {
        eventType: 'checkout.session.completed',
        sessionId: 'cs_test_123',
        entityId: 'entity_123',
        status: 'completed',
      };

      const mockMetadataUpdate = {
        entityId: 'entity_123',
        paymentStatus: 'completed',
        paymentId: 'cs_test_123',
      };

      mockStripeClient.constructWebhookEvent.mockReturnValue(mockEvent);
      mockWebhookHandler.processWebhookEvent.mockResolvedValue(mockEventData);
      const { WebhookHandler } = require('../webhook-handler');
      WebhookHandler.createEntityMetadataUpdate.mockReturnValue(mockMetadataUpdate);

      mockPrisma.entity.findUnique.mockResolvedValue({
        id: 'entity_123',
        metadata: {},
      });

      const result = await paymentService.handleWebhook('raw_body', 'signature', 'secret');

      expect(result).toBe(true);
      expect(mockStripeClient.constructWebhookEvent).toHaveBeenCalledWith('raw_body', 'signature', 'secret');
      expect(mockWebhookHandler.processWebhookEvent).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle webhook errors gracefully', async () => {
      mockStripeClient.constructWebhookEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const result = await paymentService.handleWebhook('raw_body', 'invalid_signature', 'secret');

      expect(result).toBe(false);
    });
  });

  describe('updateEntityPaymentStatus', () => {
    it('should update entity metadata with payment information', async () => {
      const mockEntity = {
        id: 'entity_123',
        metadata: { existing: 'data' },
      };

      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);

      const update = {
        entityId: 'entity_123',
        paymentStatus: 'completed' as const,
        paymentId: 'cs_test_123',
        amount: 9.99,
        currency: 'usd',
        purchasedAt: new Date('2024-01-01'),
      };

      await paymentService.updateEntityPaymentStatus(update);

      expect(mockPrisma.entity.update).toHaveBeenCalledWith({
        where: { id: 'entity_123' },
        data: {
          metadata: {
            existing: 'data',
            payment: {
              status: 'completed',
              paymentId: 'cs_test_123',
              amount: 9.99,
              currency: 'usd',
              purchasedAt: '2024-01-01T00:00:00.000Z',
              updatedAt: expect.any(String),
            },
          },
        },
      });
    });

    it('should handle missing entity gracefully', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue(null);

      const update = {
        entityId: 'nonexistent',
        paymentStatus: 'completed' as const,
        paymentId: 'cs_test_123',
      };

      await expect(paymentService.updateEntityPaymentStatus(update)).resolves.not.toThrow();
      expect(mockPrisma.entity.update).not.toHaveBeenCalled();
    });
  });

  describe('getEntityPaymentStatus', () => {
    it('should return payment status for entity', async () => {
      const mockEntity = {
        metadata: {
          payment: {
            status: 'completed',
            paymentId: 'cs_test_123',
          },
        },
      };

      mockPrisma.entity.findUnique.mockResolvedValue(mockEntity);

      const result = await paymentService.getEntityPaymentStatus('entity_123');

      expect(result).toEqual({
        status: 'completed',
        paymentId: 'cs_test_123',
      });
    });

    it('should return null for entity without payment data', async () => {
      mockPrisma.entity.findUnique.mockResolvedValue({
        metadata: {},
      });

      const result = await paymentService.getEntityPaymentStatus('entity_123');

      expect(result).toBeNull();
    });
  });

  describe('getEntitiesWithPayments', () => {
    it('should return entities with payment information', async () => {
      const mockEntities = [
        {
          id: 'entity_1',
          name: 'Entity 1',
          description: 'Description 1',
          metadata: {
            payment: { status: 'completed' },
          },
          createdAt: new Date(),
        },
        {
          id: 'entity_2',
          name: 'Entity 2',
          description: 'Description 2',
          metadata: null,
          createdAt: new Date(),
        },
      ];

      mockPrisma.entity.findMany.mockResolvedValue(mockEntities);

      const result = await paymentService.getEntitiesWithPayments('project_123');

      expect(result).toEqual([
        {
          ...mockEntities[0],
          payment: { status: 'completed' },
        },
        {
          ...mockEntities[1],
          payment: null,
        },
      ]);
    });
  });
});