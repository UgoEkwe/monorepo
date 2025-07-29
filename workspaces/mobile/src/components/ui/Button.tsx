import React from 'react'
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native'
import { useTheme } from '@/lib/theme'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const theme = useTheme()

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    }

    // Size styles
    const sizeStyles = {
      sm: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        minHeight: 36,
      },
      md: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        minHeight: 44,
      },
      lg: {
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.lg,
        minHeight: 52,
      },
    }

    // Variant styles
    const variantStyles = {
      primary: {
        backgroundColor: disabled ? theme.colors.muted : theme.colors.primary,
      },
      secondary: {
        backgroundColor: disabled ? theme.colors.muted : theme.colors.secondary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: disabled ? theme.colors.muted : theme.colors.border,
      },
      destructive: {
        backgroundColor: disabled ? theme.colors.muted : theme.colors.destructive,
      },
    }

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      opacity: disabled ? 0.6 : 1,
    }
  }

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: theme.typography.fontWeight.medium,
    }

    // Size styles
    const sizeStyles = {
      sm: { fontSize: theme.typography.fontSize.sm },
      md: { fontSize: theme.typography.fontSize.base },
      lg: { fontSize: theme.typography.fontSize.lg },
    }

    // Variant styles
    const variantStyles = {
      primary: {
        color: disabled ? theme.colors.mutedForeground : theme.colors.primaryForeground,
      },
      secondary: {
        color: disabled ? theme.colors.mutedForeground : theme.colors.secondaryForeground,
      },
      outline: {
        color: disabled ? theme.colors.mutedForeground : theme.colors.foreground,
      },
      destructive: {
        color: disabled ? theme.colors.mutedForeground : theme.colors.destructiveForeground,
      },
    }

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    }
  }

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? theme.colors.foreground : theme.colors.primaryForeground}
          style={{ marginRight: theme.spacing.sm }}
        />
      )}
      <Text style={[getTextStyle(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  )
}