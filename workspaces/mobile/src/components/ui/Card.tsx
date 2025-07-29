import React from 'react'
import { View, ViewStyle } from 'react-native'
import { useTheme } from '@/lib/theme'

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  variant?: 'default' | 'elevated'
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  const theme = useTheme()

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    }

    const variantStyles = {
      default: {},
      elevated: {
        shadowColor: theme.isDark ? '#000' : '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: theme.isDark ? 0.3 : 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }

    return {
      ...baseStyle,
      ...variantStyles[variant],
    }
  }

  return <View style={[getCardStyle(), style]}>{children}</View>
}

interface CardHeaderProps {
  children: React.ReactNode
  style?: ViewStyle
}

export function CardHeader({ children, style }: CardHeaderProps) {
  const theme = useTheme()

  return (
    <View
      style={[
        {
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

interface CardContentProps {
  children: React.ReactNode
  style?: ViewStyle
}

export function CardContent({ children, style }: CardContentProps) {
  const theme = useTheme()

  return (
    <View
      style={[
        {
          padding: theme.spacing.lg,
          paddingTop: 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}