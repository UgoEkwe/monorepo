'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { validateWorkspaceEnvironment, featureFlags } from '@modular-ai-scaffold/core'
import { LogIn, LogOut, User as UserIcon, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  const supabase = createClient()

  useEffect(() => {
    const validation = validateWorkspaceEnvironment('web')
    setAuthEnabled(validation.valid && featureFlags.isEnabled('supabase'))
  }, [])

  const handleSignIn = async () => {
    if (!authEnabled) {
      console.warn('Authentication is disabled - Supabase not configured')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        console.error('Error signing in:', error.message)
        // Don't show error to user in fallback mode
        if (error.message.includes('not configured')) {
          console.info('Using fallback mode - authentication disabled')
        }
      }
    } catch (error) {
      console.error('Error signing in:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error.message)
      }
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  // Show disabled state when auth is not available
  if (!authEnabled) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4" />
        <span>Auth disabled</span>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserIcon className="h-4 w-4" />
          <span>{user.email}</span>
        </div>
        <Button
          onClick={handleSignOut}
          disabled={loading}
          variant="destructive"
          size="sm"
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          {loading ? 'Signing out...' : 'Sign out'}
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={handleSignIn}
      disabled={loading}
      className="flex items-center gap-2"
      size="sm"
    >
      <LogIn className="h-4 w-4" />
      {loading ? 'Logging in...' : 'Log In'}
    </Button>
  )
}
