# {{WORKSPACE_NAME}}

{{DESCRIPTION}}

## Getting Started

This is a React Native/Expo mobile application workspace in the modular AI scaffold.

### Development

```bash
# Start development server
npm run dev:{{WORKSPACE_NAME}}

# Run on iOS simulator
npm run ios --workspace={{WORKSPACE_NAME}}

# Run on Android emulator
npm run android --workspace={{WORKSPACE_NAME}}

# Run tests
npm run test:{{WORKSPACE_NAME}}
```

### Features

- 📱 React Native with Expo
- 🧭 Expo Router for navigation
- 🎨 Native UI components
- 🔧 TypeScript support
- 🧪 Vitest for testing
- 📦 Shared utilities from @modular-ai-scaffold/core

### Optional Dependencies

This workspace supports optional integration with:

- **Supabase**: For authentication and database (via peer dependencies)
- **Expo Auth**: For authentication flows
- **Secure Store**: For secure storage

Enable these features by installing the peer dependencies:

```bash
npm install @supabase/supabase-js expo-auth-session expo-crypto expo-linking expo-secure-store expo-web-browser react-native-url-polyfill --workspace={{WORKSPACE_NAME}}
```

### Project Structure

```
app/
├── (tabs)/       # Tab-based navigation
├── _layout.tsx   # Root layout
└── index.tsx     # Home screen

src/
├── components/   # React Native components
├── lib/         # Utility functions
└── types/       # TypeScript type definitions
```

### Environment Variables

Create a `.env` file with your configuration:

```bash
# Optional: Supabase configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Building for Production

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```