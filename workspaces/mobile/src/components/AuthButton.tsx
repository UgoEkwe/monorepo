import React, { useState } from 'react'
import { View, Text, Alert } from 'react-native'
import { makeRedirectUri } from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/lib/theme'
import type { User } from '@supabase/supabase-js'

// Configure WebBrowser for auth
WebBrowser.maybeCompleteAuthSession()

interface AuthButtonProps {
  user: User | null
}

export function AuthButton({ user }: AuthButtonProps) {
  const [loading, setLoading] = useState(false)
  const theme = useTheme()

  const handleSignIn = async () => {
    setLoading(true)
    try {
      const redirectUrl = makeRedirectUri({
        scheme: 'modular-ai-scaffold',
        path: '/auth/callback',
      })

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: redirectUrl,
        },
      })

      if (error) {
        Alert.alert('Error', error.message)
        return
      }

      // Open the auth URL
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl)
        
        if (result.type === 'success') {
          // The session should be automatically handled by Supabase
          console.log('Auth session completed')
        }
      }
    } catch (error) {
      console.error('Error signing in:', error)
      Alert.alert('Error', 'Failed to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        Alert.alert('Error', error.message)
      }
    } catch (error) {
      console.error('Error signing out:', error)
      Alert.alert('Error', 'Failed to sign out. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (user) {
    return (
      <View style={{ alignItems: 'center', gap: theme.spacing.md }}>
        <Text
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.mutedForeground,
            textAlign: 'center',
          }}
        >
          Signed in as {user.email}
        </Text>
        <Button
          title={loading ? 'Signing out...' : 'Sign out'}
          onPress={handleSignOut}
          variant="destructive"
          size="sm"
          loading={loading}
          disabled={loading}
        />
      </View>
    )
  }

  return (
    <Button
      title={loading ? 'Signing in...' : 'Sign in with GitHub'}
      onPress={handleSignIn}
      loading={loading}
      disabled={loading}
    />
  )
}