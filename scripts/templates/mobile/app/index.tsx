import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to {{WORKSPACE_NAME}}</Text>
      <Text style={styles.subtitle}>{{DESCRIPTION}}</Text>
      
      <View style={styles.featuresContainer}>
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>🚀 Get Started</Text>
          <Text style={styles.featureText}>
            This workspace is ready for mobile development. Start building your app!
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>📦 Features</Text>
          <Text style={styles.featureText}>
            • React Native with Expo{'\n'}
            • Expo Router navigation{'\n'}
            • TypeScript support{'\n'}
            • Shared core utilities
          </Text>
        </View>
      </View>
      
      <Text style={styles.editText}>
        Edit app/index.tsx to get started
      </Text>
      
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  featuresContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
    marginBottom: 32,
  },
  featureCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  editText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});