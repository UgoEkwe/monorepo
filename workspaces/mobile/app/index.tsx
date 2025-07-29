import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme'
import { AuthButton } from '@/components/AuthButton'
import { EntityCard } from '@/components/EntityCard'
import { PacmanGame } from '@/components/PacmanGame'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import type { User } from '@supabase/supabase-js'
import type { Entity } from '@/types'

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null)
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPacmanGame, setShowPacmanGame] = useState(true)
  const theme = useTheme()

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchEntities()
        } else {
          setEntities([])
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      fetchEntities()
    }
  }, [user])

  const fetchEntities = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch entities'
      setError(errorMessage)
      Alert.alert('Error', errorMessage)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    if (user) {
      fetchEntities(true)
    }
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text
          style={{
            marginTop: theme.spacing.md,
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.mutedForeground,
          }}
        >
          Loading...
        </Text>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Pac-Man Game Overlay */}
      {showPacmanGame && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
          <PacmanGame onGameComplete={() => setShowPacmanGame(false)} />
        </View>
      )}
      
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.lg }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Hero Section */}
        <View style={{ alignItems: 'center', marginBottom: theme.spacing['2xl'] }}>
          <View
            style={{
              width: 64,
              height: 64,
              backgroundColor: theme.colors.primary,
              borderRadius: theme.borderRadius.xl,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: theme.spacing.lg,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.primaryForeground,
              }}
            >
              🤖
            </Text>
          </View>
          <Text
            style={{
              fontSize: theme.typography.fontSize['3xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.foreground,
              textAlign: 'center',
              marginBottom: theme.spacing.md,
            }}
          >
            AI Content Generator
          </Text>
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.mutedForeground,
              textAlign: 'center',
              lineHeight: 24,
              paddingHorizontal: theme.spacing.md,
            }}
          >
            Welcome to the Modular AI Scaffold demo! This showcases a complete AI-powered 
            application with modular architecture and cross-platform support.
          </Text>
        </View>

        {/* Features Grid */}
        <View style={{ marginBottom: theme.spacing['2xl'] }}>
          {[
            {
              icon: '🤖',
              title: 'Modular AI Agents',
              desc: 'Extensible AI agents with tool integration and custom hooks for any use case.',
            },
            {
              icon: '🗄️',
              title: 'Abstract Data Models',
              desc: 'Generic Entity models that can represent any data type - posts, products, content.',
            },
            {
              icon: '🌐',
              title: 'Cross-Platform Ready',
              desc: 'Web, mobile, and API workspaces that can be mixed and matched as needed.',
            },
          ].map((feature, index) => (
            <Card key={index} style={{ marginBottom: theme.spacing.md }}>
              <CardHeader>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 32, marginBottom: theme.spacing.sm }}>
                    {feature.icon}
                  </Text>
                  <Text
                    style={{
                      fontSize: theme.typography.fontSize.lg,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.foreground,
                      textAlign: 'center',
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    {feature.title}
                  </Text>
                </View>
              </CardHeader>
              <CardContent>
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.mutedForeground,
                    textAlign: 'center',
                    lineHeight: 20,
                  }}
                >
                  {feature.desc}
                </Text>
              </CardContent>
            </Card>
          ))}
        </View>

        {/* Authentication Section */}
        {!user ? (
          <Card>
            <CardContent style={{ alignItems: 'center', paddingVertical: theme.spacing['2xl'] }}>
              <Text style={{ fontSize: 48, marginBottom: theme.spacing.lg }}>🔐</Text>
              <Text
                style={{
                  fontSize: theme.typography.fontSize['2xl'],
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.foreground,
                  marginBottom: theme.spacing.md,
                  textAlign: 'center',
                }}
              >
                Sign in to explore
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.mutedForeground,
                  textAlign: 'center',
                  marginBottom: theme.spacing.lg,
                  lineHeight: 24,
                }}
              >
                Sign in with GitHub to see generated content and explore the full demo experience.
              </Text>
              <AuthButton user={user} />
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Welcome Message */}
            <Card
              style={{
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.primary,
                marginBottom: theme.spacing.lg,
              }}
            >
              <CardContent style={{ paddingVertical: theme.spacing.lg }}>
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.xl,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.primaryForeground,
                    marginBottom: theme.spacing.sm,
                  }}
                >
                  Welcome back, {user.email}!
                </Text>
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.primaryForeground,
                    opacity: 0.9,
                    lineHeight: 20,
                  }}
                >
                  This dashboard shows content generated by the AI module. The same data is 
                  accessible from the web app and backend API, demonstrating the modular architecture.
                </Text>
              </CardContent>
            </Card>

            {/* Entities Section */}
            <View style={{ marginBottom: theme.spacing.lg }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: theme.spacing.lg,
                }}
              >
                <Text
                  style={{
                    fontSize: theme.typography.fontSize['2xl'],
                    fontWeight: theme.typography.fontWeight.bold,
                    color: theme.colors.foreground,
                  }}
                >
                  Generated Content
                </Text>
                <Button
                  title="Refresh"
                  onPress={handleRefresh}
                  variant="outline"
                  size="sm"
                  loading={refreshing}
                />
              </View>

              {error && (
                <Card style={{ marginBottom: theme.spacing.lg }}>
                  <CardContent>
                    <Text
                      style={{
                        color: theme.colors.destructive,
                        textAlign: 'center',
                        marginBottom: theme.spacing.md,
                      }}
                    >
                      Error: {error}
                    </Text>
                    <Button
                      title="Try Again"
                      onPress={() => fetchEntities()}
                      variant="outline"
                    />
                  </CardContent>
                </Card>
              )}

              {entities.length === 0 && !error ? (
                <Card style={{ borderStyle: 'dashed' }}>
                  <CardContent style={{ alignItems: 'center', paddingVertical: theme.spacing['2xl'] }}>
                    <Text style={{ fontSize: 48, marginBottom: theme.spacing.lg }}>📄</Text>
                    <Text
                      style={{
                        fontSize: theme.typography.fontSize.lg,
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.foreground,
                        marginBottom: theme.spacing.sm,
                        textAlign: 'center',
                      }}
                    >
                      No content yet
                    </Text>
                    <Text
                      style={{
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.mutedForeground,
                        textAlign: 'center',
                      }}
                    >
                      Generated content will appear here. Try running the AI content generator!
                    </Text>
                  </CardContent>
                </Card>
              ) : (
                <View>
                  {entities.map((entity) => (
                    <EntityCard
                      key={entity.id}
                      entity={entity}
                      onPress={() => {
                        // Could navigate to detail screen
                        Alert.alert('Entity Details', `Selected: ${entity.name}`)
                      }}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Sign Out Section */}
            <View style={{ alignItems: 'center', marginTop: theme.spacing.lg }}>
              <AuthButton user={user} />
            </View>
          </>
        )}

        {/* Footer */}
        <View
          style={{
            marginTop: theme.spacing['2xl'],
            paddingTop: theme.spacing.lg,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.mutedForeground,
              textAlign: 'center',
              lineHeight: 20,
            }}
          >
            This is a demo of the Modular AI Scaffold template.{'\n'}
            Extend it into any application type: blogs, e-commerce, dashboards, tools, and more.
          </Text>
        </View>
      </ScrollView>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
    </View>
  )
}
