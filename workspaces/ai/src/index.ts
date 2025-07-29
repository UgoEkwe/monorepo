import 'dotenv/config';

// Export main classes
export { ModularAgent } from './modular-agent';
export { DemoContentGenerator } from './demo-content-generator';

// Export types
export * from './types';

// Export tools
export * from './agent-tools';

// Main demo function for testing
export async function runDemo(): Promise<void> {
  const { DemoContentGenerator } = await import('./demo-content-generator');
  const { prisma } = await import('./database');

  try {
    console.log('🚀 Starting AI workspace demo...');

    // Check for required environment variables
    if (!process.env.OPENROUTER_API_KEY) {
      console.log('⚠️  OPENROUTER_API_KEY not found. Please set up your API key to run the full demo.');
      console.log('📝 The AI workspace is properly configured and ready to use once credentials are provided.');
      return;
    }

    if (!process.env.DATABASE_URL) {
      console.log('⚠️  DATABASE_URL not found. Please set up your database connection.');
      return;
    }

    // Find or create a demo project
    let project = await prisma.project.findFirst({
      where: { name: 'AI Demo Project' }
    });

    if (!project) {
      // Create a demo user first
      let user = await prisma.user.findFirst({
        where: { email: 'demo@example.com' }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: 'demo@example.com',
            name: 'Demo User',
            metadata: {
              role: 'demo',
              createdBy: 'ai-workspace'
            }
          }
        });
      }

      // Create demo project
      project = await prisma.project.create({
        data: {
          name: 'AI Demo Project',
          description: 'A demo project showcasing the AI content generation capabilities',
          slug: 'ai-demo-project',
          ownerId: user.id,
          metadata: {
            type: 'demo',
            features: ['ai-generation', 'content-management'],
            createdBy: 'ai-workspace'
          }
        }
      });

      console.log(`✅ Created demo project: ${project.name} (ID: ${project.id})`);
    }

    // Initialize and run content generator
    const generator = new DemoContentGenerator();
    await generator.initialize();
    await generator.generateDemoData(project.id);

    // Show generated entities
    const entities = await prisma.entity.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log(`\n📊 Generated ${entities.length} entities:`);
    entities.forEach((entity, index) => {
      console.log(`${index + 1}. ${entity.name} (${entity.status})`);
    });

  } catch (error) {
    console.error('❌ Demo failed:', error);
    throw error;
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}