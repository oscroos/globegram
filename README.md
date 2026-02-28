# GlobeGram (React Native Shell)

Initial shell for a cross-platform social travel app with 4 tabs:
- Map
- Feed
- Friends
- My Profile

## Quick start

```bash
npm install
npm run start
```

Then launch on:
- iOS simulator: press `i`
- Android emulator: press `a`
- Expo Go: scan QR code

## Current folder structure

```text
globegram/
  App.tsx
  app.json
  babel.config.js
  package.json
  tsconfig.json
  src/
    components/
      ScreenContainer.tsx
    navigation/
      MainTabs.tsx
    screens/
      FeedScreen.tsx
      FriendsScreen.tsx
      MapScreen.tsx
      ProfileScreen.tsx
    theme/
      colors.ts
```

## Notes

- The `Map` tab currently includes a placeholder card for world map integration.
- Next step for map coloring is adding a world map data layer (SVG or map tiles).
