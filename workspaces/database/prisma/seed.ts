import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@modular-ai-scaffold.com' },
    update: {},
    create: {
      email: 'demo@modular-ai-scaffold.com',
      name: 'Demo User',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      metadata: {
        role: 'admin',
        preferences: {
          theme: 'light',
          notifications: true
        }
      }
    }
  })

  console.log('✅ Created demo user:', demoUser.email)

  // Create AI Content Generator demo project
  const aiProject = await prisma.project.upsert({
    where: { slug: 'ai-content-generator' },
    update: {},
    create: {
      name: 'AI Content Generator',
      description: 'Showcase project demonstrating AI-powered content generation capabilities',
      slug: 'ai-content-generator',
      ownerId: demoUser.id,
      metadata: {
        type: 'demo',
        features: ['ai-generation', 'content-management', 'multi-platform'],
        settings: {
          aiModel: 'anthropic/claude-3-haiku',
          maxTokens: 1000,
          temperature: 0.7
        }
      }
    }
  })

  console.log('✅ Created AI Content Generator project')

  // Create sample blog posts (demonstrating blog use case)
  const blogPosts = [
    {
      name: 'The Future of AI in Content Creation',
      description: 'Artificial Intelligence is revolutionizing how we create and consume content. From automated writing assistants to sophisticated image generators, AI tools are becoming indispensable for creators across industries. This post explores the current landscape and future possibilities of AI-powered content creation.',
      slug: 'future-of-ai-content-creation',
      status: 'published',
      metadata: {
        type: 'blog_post',
        category: 'technology',
        tags: ['ai', 'content', 'future', 'automation'],
        readTime: 5,
        featured: true,
        seo: {
          title: 'The Future of AI in Content Creation | AI Blog',
          description: 'Discover how AI is transforming content creation and what the future holds for creators and businesses.'
        }
      }
    },
    {
      name: 'Building Modular Applications with Modern Tools',
      description: 'Modern application development requires flexible, scalable architectures. This guide covers best practices for building modular applications using contemporary tools and frameworks, focusing on maintainability and extensibility.',
      slug: 'building-modular-applications',
      status: 'published',
      metadata: {
        type: 'blog_post',
        category: 'development',
        tags: ['architecture', 'modular', 'development', 'best-practices'],
        readTime: 8,
        featured: false,
        seo: {
          title: 'Building Modular Applications | Development Guide',
          description: 'Learn how to build scalable, modular applications with modern development practices.'
        }
      }
    },
    {
      name: 'Getting Started with Monorepo Architecture',
      description: 'Monorepos offer powerful advantages for managing multiple related projects. This comprehensive guide walks through setting up and managing a monorepo using modern tools like Turborepo, including best practices for code sharing and deployment strategies.',
      slug: 'monorepo-architecture-guide',
      status: 'draft',
      metadata: {
        type: 'blog_post',
        category: 'development',
        tags: ['monorepo', 'turborepo', 'architecture', 'guide'],
        readTime: 12,
        featured: false,
        author: 'AI Assistant',
        lastEdited: new Date().toISOString()
      }
    }
  ]

  // Create sample products (demonstrating e-commerce use case)
  const products = [
    {
      name: 'AI Writing Assistant Pro',
      description: 'Professional AI-powered writing tool that helps you create compelling content faster. Features advanced grammar checking, style suggestions, and content optimization for various formats including blogs, emails, and marketing copy.',
      slug: 'ai-writing-assistant-pro',
      status: 'published',
      metadata: {
        type: 'product',
        category: 'software',
        price: 29.99,
        currency: 'USD',
        inventory: 999,
        sku: 'AI-WRITE-PRO-001',
        features: ['Grammar checking', 'Style suggestions', 'Content optimization', 'Multiple formats'],
        images: [
          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop'
        ],
        rating: 4.8,
        reviews: 127
      }
    },
    {
      name: 'Content Strategy Toolkit',
      description: 'Complete digital toolkit for content strategists and marketers. Includes templates, frameworks, and AI-powered insights to help you plan, create, and optimize your content marketing efforts.',
      slug: 'content-strategy-toolkit',
      status: 'published',
      metadata: {
        type: 'product',
        category: 'digital-product',
        price: 49.99,
        currency: 'USD',
        inventory: 500,
        sku: 'CONTENT-TOOLKIT-001',
        includes: ['Strategy templates', 'Content calendar', 'Analytics dashboard', 'AI insights'],
        downloadable: true,
        rating: 4.6,
        reviews: 89
      }
    }
  ]

  // Create sample tasks/todos (demonstrating productivity app use case)
  const tasks = [
    {
      name: 'Implement user authentication system',
      description: 'Set up secure user authentication with email/password and social login options. Include password reset functionality and email verification.',
      status: 'published',
      metadata: {
        type: 'task',
        priority: 'high',
        category: 'development',
        assignee: 'demo@modular-ai-scaffold.com',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        estimatedHours: 8,
        tags: ['authentication', 'security', 'backend'],
        checklist: [
          { item: 'Set up Supabase auth', completed: true },
          { item: 'Implement login/signup forms', completed: false },
          { item: 'Add password reset flow', completed: false },
          { item: 'Test social login integration', completed: false }
        ]
      }
    },
    {
      name: 'Design mobile app wireframes',
      description: 'Create comprehensive wireframes for the mobile application, focusing on user experience and responsive design principles.',
      status: 'published',
      metadata: {
        type: 'task',
        priority: 'medium',
        category: 'design',
        assignee: 'demo@modular-ai-scaffold.com',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        estimatedHours: 12,
        tags: ['design', 'mobile', 'wireframes', 'ux'],
        attachments: [
          'wireframe-v1.fig',
          'user-flow-diagram.png'
        ]
      }
    }
  ]

  // Insert all entities
  const allEntities = [...blogPosts, ...products, ...tasks]
  
  for (const entityData of allEntities) {
    await prisma.entity.upsert({
      where: { 
        projectId_slug: {
          projectId: aiProject.id,
          slug: entityData.slug || entityData.name.toLowerCase().replace(/\s+/g, '-')
        }
      },
      update: {},
      create: {
        ...entityData,
        projectId: aiProject.id,
        slug: entityData.slug || entityData.name.toLowerCase().replace(/\s+/g, '-')
      }
    })
  }

  console.log(`✅ Created ${allEntities.length} demo entities`)

  // Create additional sample project for extensibility demonstration
  const portfolioProject = await prisma.project.upsert({
    where: { slug: 'personal-portfolio' },
    update: {},
    create: {
      name: 'Personal Portfolio',
      description: 'Showcase project demonstrating how the scaffold can be extended for portfolio websites',
      slug: 'personal-portfolio',
      ownerId: demoUser.id,
      metadata: {
        type: 'portfolio',
        theme: 'minimal',
        features: ['project-showcase', 'blog', 'contact-form']
      }
    }
  })

  // Add some portfolio items
  const portfolioItems = [
    {
      name: 'E-commerce Platform Redesign',
      description: 'Complete redesign of a major e-commerce platform, focusing on user experience improvements and conversion optimization.',
      status: 'published',
      metadata: {
        type: 'portfolio_item',
        category: 'web-design',
        client: 'TechCorp Inc.',
        year: 2024,
        technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Stripe'],
        images: ['https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop'],
        featured: true
      }
    },
    {
      name: 'Mobile Banking App',
      description: 'Secure mobile banking application with biometric authentication and real-time transaction monitoring.',
      status: 'published',
      metadata: {
        type: 'portfolio_item',
        category: 'mobile-app',
        client: 'SecureBank',
        year: 2024,
        technologies: ['React Native', 'Node.js', 'PostgreSQL', 'Biometric Auth'],
        images: ['https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop'],
        featured: true
      }
    }
  ]

  for (const item of portfolioItems) {
    await prisma.entity.create({
      data: {
        ...item,
        projectId: portfolioProject.id,
        slug: item.name.toLowerCase().replace(/\s+/g, '-')
      }
    })
  }

  console.log('✅ Created portfolio project with sample items')

  const totalUsers = await prisma.user.count()
  const totalProjects = await prisma.project.count()
  const totalEntities = await prisma.entity.count()

  console.log('\n🎉 Database seeding completed!')
  console.log(`📊 Final counts:`)
  console.log(`   Users: ${totalUsers}`)
  console.log(`   Projects: ${totalProjects}`)
  console.log(`   Entities: ${totalEntities}`)
  console.log('\n💡 The database now contains demo data showcasing:')
  console.log('   • Blog posts (content management use case)')
  console.log('   • Products (e-commerce use case)')
  console.log('   • Tasks (productivity app use case)')
  console.log('   • Portfolio items (portfolio website use case)')
  console.log('\n🚀 Ready to demonstrate the AI Content Generator!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })