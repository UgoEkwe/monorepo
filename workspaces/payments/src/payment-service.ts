// Database interface for dependency injection
interface DatabaseClient {
  entity: {
    findUnique: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any>;
  };
  $disconnect: () => Promise<void>;
}
import { StripeClient } from './stripe-client';
import { WebhookHandler } from './webhook-handler';
import { CheckoutSessionConfig, PaymentResult, EntityMetadataUpdate } from './types';

export class PaymentService {
  private prisma: DatabaseClient;
  private stripeClient: StripeClient;
  private webhookHandler: WebhookHandler;

  constructor(stripeSecretKey: string, prisma?: DatabaseClient) {
    if (!prisma) {
      throw new Error('Database client is required');
    }
    this.prisma = prisma;
    this.stripeClient = new StripeClient(stripeSecretKey);
    this.webhookHandler = new WebhookHandler(this.stripeClient);
  }

  /**
   * Create a checkout session for purchasing content
   */
  async createContentCheckout(config: CheckoutSessionConfig): Promise<PaymentResult> {
    // Verify entity exists
    const entity = await this.prisma.entity.findUnique({
      where: { id: config.entityId },
    });

    if (!entity) {
      return {
        success: false,
        error: 'Entity not found',
      };
    }

    // Create checkout session
    const result = await this.stripeClient.createCheckoutSession({
      ...config,
      entityName: entity.name,
    });

    if (result.success && result.sessionId) {
      // Update entity metadata to track pending payment
      await this.updateEntityPaymentStatus({
        entityId: config.entityId,
        paymentStatus: 'pending',
        paymentId: result.sessionId,
      });
    }

    return result;
  }

  /**
   * Handle webhook events and update entity metadata
   */
  async handleWebhook(rawBody: string | Buffer, signature: string, endpointSecret: string): Promise<boolean> {
    try {
      // Construct and verify webhook event
      const event = this.stripeClient.constructWebhookEvent(rawBody, signature, endpointSecret);
      
      // Process the event
      const eventData = await this.webhookHandler.processWebhookEvent(event);
      
      if (eventData) {
        // Convert to entity metadata update
        const metadataUpdate = WebhookHandler.createEntityMetadataUpdate(eventData);
        
        if (metadataUpdate) {
          await this.updateEntityPaymentStatus(metadataUpdate);
        }
      }

      return true;
    } catch (error) {
      console.error('Webhook handling error:', error);
      return false;
    }
  }

  /**
   * Update entity metadata with payment information
   */
  async updateEntityPaymentStatus(update: EntityMetadataUpdate): Promise<void> {
    try {
      const entity = await this.prisma.entity.findUnique({
        where: { id: update.entityId },
      });

      if (!entity) {
        console.error(`Entity ${update.entityId} not found for payment update`);
        return;
      }

      // Merge payment data with existing metadata
      const currentMetadata = (entity.metadata as Record<string, any>) || {};
      const paymentMetadata = {
        ...currentMetadata,
        payment: {
          status: update.paymentStatus,
          paymentId: update.paymentId,
          amount: update.amount,
          currency: update.currency,
          purchasedAt: update.purchasedAt?.toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      await this.prisma.entity.update({
        where: { id: update.entityId },
        data: {
          metadata: paymentMetadata,
        },
      });

      console.log(`Updated payment status for entity ${update.entityId}: ${update.paymentStatus}`);
    } catch (error) {
      console.error('Error updating entity payment status:', error);
      throw error;
    }
  }

  /**
   * Get payment status for an entity
   */
  async getEntityPaymentStatus(entityId: string): Promise<any> {
    const entity = await this.prisma.entity.findUnique({
      where: { id: entityId },
      select: { metadata: true },
    });

    if (!entity || !entity.metadata) {
      return null;
    }

    const metadata = entity.metadata as Record<string, any>;
    return metadata.payment || null;
  }

  /**
   * List all entities with payment information
   */
  async getEntitiesWithPayments(projectId: string): Promise<any[]> {
    const entities = await this.prisma.entity.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        description: true,
        metadata: true,
        createdAt: true,
      },
    });

    return entities.map(entity => ({
      ...entity,
      payment: entity.metadata ? (entity.metadata as any).payment : null,
    }));
  }

  /**
   * Cleanup - close database connection
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}