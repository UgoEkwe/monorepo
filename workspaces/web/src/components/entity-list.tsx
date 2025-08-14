'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { validateWorkspaceEnvironment, featureFlags } from '@modular-ai-scaffold/core'
import { formatDateTime } from '@/lib/utils'
import { FileText, Calendar, User, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { motion } from 'framer-motion'

interface Entity {
  id: string
  name: string
  description: string | null
  status: string
  metadata: any
  createdAt: string
  updatedAt: string
  project: {
    id: string
    name: string
  }
}

interface EntityListProps {
  userId?: string
}

export function EntityList({ userId }: EntityListProps) {
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchEntities = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      // For demo purposes, we'll fetch all entities
      // In a real app, you'd filter by user/project
      const { data, error } = await supabase
        .from('entities')
        .select(`
          id,
          name,
          description,
          status,
          metadata,
          createdAt,
          updatedAt,
          project:projects!inner(id, name)
        `)
        .order('createdAt', { ascending: false })
        .limit(20)

      if (error) {
        // Handle fallback mode gracefully
        if (error.message.includes('not configured')) {
          console.info('Using fallback mode - showing demo entities')
          setEntities(generateDemoEntities())
          return
        }
        throw error
      }

      // Transform the data to match our Entity type
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        project: Array.isArray(item.project) ? item.project[0] : item.project
      }))

      setEntities(transformedData)
    } catch (err) {
      console.error('Error fetching entities:', err)
      
      // In development mode, show demo data instead of error
      if (process.env.NODE_ENV === 'development') {
        console.info('Development mode: showing demo entities instead of error')
        setEntities(generateDemoEntities())
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch entities')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Generate demo entities for fallback mode
  const generateDemoEntities = (): Entity[] => [
    {
      id: 'demo-1',
      name: 'Demo Article: Getting Started with AI',
      description: 'A comprehensive guide to understanding artificial intelligence and its applications in modern development.',
      status: 'published',
      metadata: { type: 'article', wordCount: 1200, tags: ['ai', 'tutorial'] },
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      project: { id: 'demo-project-1', name: 'Demo Blog Project' }
    },
    {
      id: 'demo-2',
      name: 'Demo Product: Smart Analytics Dashboard',
      description: 'An intelligent dashboard that provides real-time insights and predictive analytics for business metrics.',
      status: 'draft',
      metadata: { type: 'product', features: ['analytics', 'real-time', 'predictions'] },
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      project: { id: 'demo-project-2', name: 'Demo SaaS Project' }
    },
    {
      id: 'demo-3',
      name: 'Demo Content: API Documentation',
      description: 'Complete API documentation with examples, authentication guides, and best practices.',
      status: 'published',
      metadata: { type: 'documentation', endpoints: 25, examples: 50 },
      createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
      project: { id: 'demo-project-3', name: 'Demo API Project' }
    }
  ]

  useEffect(() => {
    fetchEntities()
  }, [userId])

  const handleRefresh = () => {
    fetchEntities(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading entities...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive mb-4">Error: {error}</div>
        <Button onClick={() => fetchEntities()} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Generated Content</h2>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {entities.length === 0 ? (
        <Card className="text-center py-12 border-dashed">
          <CardContent className="pt-6">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No content yet</h3>
            <p className="text-muted-foreground">
              Generated content will appear here. Try running the AI content generator!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {entities.map((entity, index) => (
            <motion.div
              key={entity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-foreground line-clamp-2">
                      {entity.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        entity.status === 'published'
                          ? 'bg-[hsl(var(--color-success))] text-white'
                          : entity.status === 'draft'
                          ? 'bg-[hsl(var(--color-warning))] text-white'
                          : 'bg-[hsl(var(--muted))] text-muted-foreground'
                      }`}
                    >
                      {entity.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {entity.description && (
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                      {entity.description}
                    </p>
                  )}

                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>Project: {entity.project?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>Created: {formatDateTime(entity.createdAt)}</span>
                    </div>
                  </div>

                  {entity.metadata && Object.keys(entity.metadata).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Metadata:</span>
                        <div className="mt-1 space-y-1">
                          {Object.entries(entity.metadata).slice(0, 3).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="capitalize">{key}:</span>
                              <span className="truncate ml-2">
                                {typeof value === 'string' ? value : JSON.stringify(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}