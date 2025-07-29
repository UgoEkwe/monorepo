import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { useTheme } from '@/lib/theme'
import { formatDateTime, truncateText } from '@/lib/utils'
import type { Entity } from '@/types'

interface EntityCardProps {
  entity: Entity
  onPress?: () => void
}

export function EntityCard({ entity, onPress }: EntityCardProps) {
  const theme = useTheme()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return '#10b981' // green
      case 'draft':
        return '#f59e0b' // yellow
      default:
        return theme.colors.mutedForeground
    }
  }

  const content = (
      <Card variant="elevated" style={{ marginBottom: theme.spacing.md }}>
        <CardHeader>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: theme.spacing.sm,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.foreground,
                flex: 1,
                marginRight: theme.spacing.sm,
              }}
              numberOfLines={2}
            >
              {entity.name}
            </Text>
            <View
              style={{
                backgroundColor: getStatusColor(entity.status),
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: theme.spacing.xs,
                borderRadius: theme.borderRadius.full,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.fontSize.xs,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: '#ffffff',
                  textTransform: 'capitalize',
                }}
              >
                {entity.status}
              </Text>
            </View>
          </View>
        </CardHeader>

        <CardContent>
          {entity.description && (
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.mutedForeground,
                lineHeight: 20,
                marginBottom: theme.spacing.md,
              }}
              numberOfLines={3}
            >
              {truncateText(entity.description, 150)}
            </Text>
          )}

          <View style={{ gap: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.mutedForeground,
                  fontWeight: theme.typography.fontWeight.medium,
                }}
              >
                Project: 
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.mutedForeground,
                  marginLeft: theme.spacing.xs,
                }}
              >
                {entity.project?.name || 'Unknown'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.mutedForeground,
                  fontWeight: theme.typography.fontWeight.medium,
                }}
              >
                Created: 
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.mutedForeground,
                  marginLeft: theme.spacing.xs,
                }}
              >
                {formatDateTime(entity.createdAt)}
              </Text>
            </View>
          </View>

          {entity.metadata && Object.keys(entity.metadata).length > 0 && (
            <View
              style={{
                marginTop: theme.spacing.md,
                paddingTop: theme.spacing.md,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.mutedForeground,
                  fontWeight: theme.typography.fontWeight.medium,
                  marginBottom: theme.spacing.sm,
                }}
              >
                Metadata:
              </Text>
              <View style={{ gap: theme.spacing.xs }}>
                {Object.entries(entity.metadata)
                  .slice(0, 3)
                  .map(([key, value]) => (
                    <View
                      key={key}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: theme.typography.fontSize.xs,
                          color: theme.colors.mutedForeground,
                          textTransform: 'capitalize',
                          flex: 1,
                        }}
                      >
                        {key}:
                      </Text>
                      <Text
                        style={{
                          fontSize: theme.typography.fontSize.xs,
                          color: theme.colors.mutedForeground,
                          flex: 2,
                          textAlign: 'right',
                        }}
                        numberOfLines={1}
                      >
                        {typeof value === 'string' ? value : JSON.stringify(value)}
                      </Text>
                    </View>
                  ))}
              </View>
            </View>
          )}
        </CardContent>
      </Card>
  )

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    )
  }

  return content
}