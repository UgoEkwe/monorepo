# Mobile Workspace

Expo React Native mobile application with entity listing and management capabilities.

## Features
- **Expo React Native** with modern navigation using Expo Router
- **Supabase Authentication** integration with GitHub OAuth
- **Entity Listing** and management interface with real-time data
- **Cross-platform Support** (iOS/Android/Web)
- **Design System Integration** for consistent UI across platforms
- **Mobile-optimized Components** with touch-friendly interactions

## Design System

This workspace follows the **[Design System Documentation](../../docs/design-system.md)** for consistent styling, theming, and component guidelines.

**Key Design Principles:**
- Uses design tokens adapted for React Native StyleSheet
- Implements consistent navigation patterns with Expo Router
- Follows mobile-first accessibility guidelines
- Maintains visual consistency with web workspace
- Responsive design that works across different screen sizes

**Components:**
- `Button` - Consistent button styling with variants
- `Card` - Container component with elevation and borders
- `EntityCard` - Mobile-optimized entity display component
- `AuthButton` - Authentication component with OAuth flow

## Setup

### Prerequisites
- Node.js 18+ and npm
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio and emulator (for Android development)

### Installation
```bash
# Navigate to mobile workspace
cd workspaces/mobile

# Install dependencies
npm install

# Start development server
npx expo start

# Run on specific platforms
npx expo run:ios      # iOS simulator
npx expo run:android  # Android emulator
npx expo start --web  # Web browser
```

## Environment Variables
Create a `.env.local` file in the mobile workspace:
```bash
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_APP_NAME="Modular AI Scaffold"
```

Copy values from the main `.env.example` file in the project root.

## Architecture

### Navigation
- **Expo Router** for file-based routing
- Stack navigation with modal support
- Deep linking support for authentication callbacks

### Authentication
- **Supabase Auth** with GitHub OAuth provider
- Secure token storage using Expo SecureStore
- Automatic session management and refresh

### Data Management
- **Supabase Client** for real-time data fetching
- Shared Entity types from database workspace
- Optimistic updates and error handling

### Styling
- **Custom theme system** with light/dark mode support
- **Design tokens** adapted from web workspace
- **Responsive components** that work across screen sizes

## Build and Deployment

### Development Build
```bash
# Create development build
npx expo build:ios --type simulator
npx expo build:android --type apk
```

### Production Build
```bash
# Using EAS Build (recommended)
npx eas build --platform all

# Or local builds
npx expo build:ios --type archive
npx expo build:android --type app-bundle
```

## Project Structure
```
workspaces/mobile/
├── app/                    # Expo Router pages
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Home screen
│   └── auth.tsx           # Auth callback
├── src/
│   ├── components/        # Reusable components
│   │   ├── ui/           # Base UI components
│   │   ├── AuthButton.tsx
│   │   └── EntityCard.tsx
│   ├── lib/              # Utilities and config
│   │   ├── supabase.ts   # Supabase client
│   │   ├── theme.ts      # Theme system
│   │   └── utils.ts      # Helper functions
│   └── types/            # TypeScript types
├── assets/               # Static assets
├── app.json             # Expo configuration
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript config
```

## Development Tips

### Testing on Device
1. Install Expo Go app on your device
2. Run `npx expo start`
3. Scan QR code with camera (iOS) or Expo Go (Android)

### Debugging
- Use Flipper for advanced debugging
- React Native Debugger for component inspection
- Expo DevTools for logs and performance

### Common Issues
- **Metro bundler issues**: Clear cache with `npx expo start --clear`
- **iOS simulator not found**: Ensure Xcode is installed
- **Android emulator issues**: Check Android Studio AVD setup