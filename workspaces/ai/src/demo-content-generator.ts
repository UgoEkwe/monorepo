import { ModularAgent } from './modular-agent';
import { prisma } from './database';
import { AgentHooks } from './types';

export interface ContentGenerationOptions {
  projectId: string;
  contentType?: string;
  topic?: string;
  count?: number;
}

export class DemoContentGenerator {
  private agent: ModularAgent;

  constructor() {
    // Set up hooks for content generation
    const hooks: AgentHooks = {
      preChat: async (prompt: string) => {
        console.log(`🤖 Starting content generation with prompt: ${prompt.substring(0, 100)}...`);
        return prompt;
      },
      postChat: async (response: string) => {
        console.log(`✅ Content generation completed. Response length: ${response.length} characters`);
      },
      preToolCall: async (tool: string, args: any) => {
        console.log(`🔧 Executing tool: ${tool}`);
        return args;
      },
      postToolCall: async (tool: string, result: any) => {
        if (result.success) {
          console.log(`✅ Tool ${tool} executed successfully`);
        } else {
          console.log(`❌ Tool ${tool} failed: ${result.error}`);
        }
      }
    };

    this.agent = new ModularAgent({ hooks });
  }

  async initialize(): Promise<void> {
    await this.agent.initialize();
  }

  async generateContent(options: ContentGenerationOptions): Promise<string[]> {
    const { projectId, contentType = 'blog post', topic = 'technology', count = 1 } = options;

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    const generatedIds: string[] = [];

    for (let i = 0; i < count; i++) {
      try {
        // Generate content using the AI agent
        const prompt = `Generate a ${contentType} about ${topic}. 
        
        Please create engaging content with:
        1. A compelling title (max 100 characters)
        2. A detailed description/body (300-500 words)
        3. Relevant metadata including tags, category, and any other relevant information
        
        Format your response as JSON with the following structure:
        {
          "title": "Your title here",
          "description": "Your detailed content here",
          "metadata": {
            "type": "${contentType}",
            "topic": "${topic}",
            "tags": ["tag1", "tag2", "tag3"],
            "category": "category_name",
            "wordCount": 123,
            "readingTime": "2 min read"
          }
        }`;

        console.log(`\n📝 Generating ${contentType} ${i + 1}/${count} about ${topic}...`);
        
        const result = await this.agent.runLoop(prompt, projectId);
        
        // Parse the AI response to extract structured content
        let contentData;
        try {
          // Try to extract JSON from the response
          const jsonMatch = result.response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            contentData = JSON.parse(jsonMatch[0]);
          } else {
            // Fallback: create structured data from plain text response
            contentData = {
              title: `Generated ${contentType} about ${topic} #${i + 1}`,
              description: result.response,
              metadata: {
                type: contentType,
                topic: topic,
                tags: [topic, contentType, 'ai-generated'],
                category: 'general',
                wordCount: result.response.split(' ').length,
                readingTime: `${Math.ceil(result.response.split(' ').length / 200)} min read`
              }
            };
          }
        } catch (parseError) {
          console.warn('Failed to parse AI response as JSON, using fallback structure');
          contentData = {
            title: `Generated ${contentType} about ${topic} #${i + 1}`,
            description: result.response,
            metadata: {
              type: contentType,
              topic: topic,
              tags: [topic, contentType, 'ai-generated'],
              category: 'general',
              wordCount: result.response.split(' ').length,
              readingTime: `${Math.ceil(result.response.split(' ').length / 200)} min read`
            }
          };
        }

        // Create a URL-friendly slug
        const slug = contentData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .substring(0, 50);

        // Save to database using the Entity model
        const entity = await prisma.entity.create({
          data: {
            name: contentData.title,
            description: contentData.description,
            slug: `${slug}-${Date.now()}`, // Add timestamp to ensure uniqueness
            status: 'published',
            metadata: {
              ...contentData.metadata,
              generatedAt: new Date().toISOString(),
              generatedBy: 'ai-agent',
              toolCalls: result.toolCalls.length
            },
            projectId
          }
        });

        generatedIds.push(entity.id);
        console.log(`✅ Created entity: ${entity.name} (ID: ${entity.id})`);

      } catch (error) {
        console.error(`❌ Failed to generate content ${i + 1}:`, error);
        // Continue with next iteration instead of failing completely
      }
    }

    return generatedIds;
  }

  async generateDemoData(projectId: string): Promise<void> {
    console.log(`\n🚀 Generating demo content for project ${projectId}...`);

    const contentTypes = [
      { type: 'blog post', topic: 'artificial intelligence' },
      { type: 'article', topic: 'web development' },
      { type: 'tutorial', topic: 'database design' },
      { type: 'guide', topic: 'API development' }
    ];

    for (const { type, topic } of contentTypes) {
      try {
        await this.generateContent({
          projectId,
          contentType: type,
          topic,
          count: 1
        });
      } catch (error) {
        console.error(`Failed to generate ${type} about ${topic}:`, error);
      }
    }

    console.log(`\n🎉 Demo content generation completed!`);
  }
}