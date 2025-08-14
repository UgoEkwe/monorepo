import React, { useState, useEffect } from 'react'
import { View, Text, Alert } from 'react-native'
import { safeImport, featureFlags } from '@modular-ai-scaffold/core/utils/optional-deps'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/lib/theme'

// Conditional imports for mobile-specific dependencies
const expoAuthSession = safeImport('expo-auth-session')
const webBrowser = safeImport('expo-web-browser')

// Configure WebBrowser for auth if available
if (webBrowser.available && webBrowser.module) {
  webBrowser.module.maybeCompleteAuthSession()
}

// Local type definition to avoid dependency on Supabase types
type User = {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
};

interface AuthButtonProps {
  user: User | null
}

export function AuthButton({ user }: AuthButtonProps) {
  const [loading, setLoading] = useState(false)
  const [authEnabled, setAuthEnabled] = useState(true)
  const theme = useTheme()

  useEffect(() => {
    // Check if authentication is available
    const supabaseEnabled = featureFlags.isEnabled('supabase')
    const depsAvailable = expoAuthSession.available && webBrowser.available
    setAuthEnabled(supabaseEnabled && depsAvailable)
  }, [])

  const handleSignIn = async () => {
    if (!authEnabled) {
      Alert.alert('Authentication Disabled', 'Supabase or required dependencies are not configured.')
      return
    }

    if (!expoAuthSession.available || !webBrowser.available) {
      Alert.alert('Error', 'Required authentication dependencies are not available.')
      return
    }

    setLoading(true)
    try {
      const redirectUrl = expoAuthSession.module.makeRedirectUri({
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
        // Handle fallback mode gracefully
        if (error.message.includes('not configured')) {
          Alert.alert('Demo Mode', 'Authentication is disabled in demo mode.')
          return
        }
        Alert.alert('Error', error.message)
        return
      }

      // Open the auth URL
      if (data.url) {
        const result = await webBrowser.module.openAuthSessionAsync(data.url, redirectUrl)
        
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

  // Show disabled state when auth is not available
  if (!authEnabled) {
    return (
      <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
        <Text
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.mutedForeground,
            textAlign: 'center',
          }}
        >
          Authentication disabled
        </Text>
      </View>
    )
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
      disabled={loading || !authEnabled}
    />
  )
}