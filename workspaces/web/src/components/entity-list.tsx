'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
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
        throw error
      }

      // Transform the data to match our Entity type
      const transformedData = (data || []).map(item => ({
        ...item,
        project: Array.isArray(item.project) ? item.project[0] : item.project
      }))

      setEntities(transformedData)
    } catch (err) {
      console.error('Error fetching entities:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch entities')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

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