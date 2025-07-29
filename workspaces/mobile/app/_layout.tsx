import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'react-native'
import 'react-native-url-polyfill/auto'

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#ffffff',
          },
          headerTintColor: colorScheme === 'dark' ? '#ffffff' : '#0a0a0a',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'AI Content Generator',
            headerShown: true
          }} 
        />
        <Stack.Screen 
          name="auth" 
          options={{ 
            title: 'Authentication',
            presentation: 'modal'
          }} 
        />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </>
  )
}