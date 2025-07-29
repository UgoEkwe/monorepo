'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { LogIn, LogOut, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AuthButtonProps {
  user: User | null
}

export function AuthButton({ user }: AuthButtonProps) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSignIn = async () => {
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
