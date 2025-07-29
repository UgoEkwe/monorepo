import React, { useEffect } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme'

export default function AuthScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const theme = useTheme()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback
        const { error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
        }
        
        // Navigate back to home
        router.replace('/')
      } catch (error) {
        console.error('Auth callback error:', error)
        router.replace('/')
      }
    }

    handleAuthCallback()
  }, [params, router])

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
        Completing authentication...
      </Text>
    </View>
  )
}