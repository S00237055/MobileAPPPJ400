# Fuel Track

The mobile app for my fitness tracking project. Built with React Native and Expo.

It talks to my FitnessAPI backend, which is in a separate repo and deployed to
Azure.

## What's in it

- Login and registration
- Workout logging with a rest timer and a searchable exercise list
- Barcode scanning for food, using the phone camera and Open Food Facts
- A food diary with daily, weekly and monthly views, and charts
- Workout history with volume, reps and duration charts
- AI coaching on both diet and training
- Profile editing

## Requirements

- Node.js
- The Expo Go app on your phone, or an Android emulator

## Running it

```
npm install
npx expo start
```

Then scan the QR code with Expo Go.

If your phone can't connect (this happens on university or hotel wifi, or if
your phone is on mobile data), use tunnel mode instead:

```
npx expo start --tunnel
```

You don't need to run the backend locally. The app points at the deployed API on
Azure.

## Tests

15 tests using Jest. They cover the calculation logic in `lib/metrics.ts`, which
is where the weekly food totals, training volume and duration parsing live.

```
npm test
```

With coverage:

```
npm run test:coverage
```

## Building an APK

I used EAS Build to make a standalone Android app that runs without the Expo
development server.

```
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

The build runs on Expo's servers and takes about 15 to 25 minutes. When it's
done you get a download link. Open it on your phone, download the APK and
install it. Android will warn you about installing from an unknown source, which
you need to allow.

The build settings are in `eas.json`. The `preview` profile is the one that
produces an APK.

## Project structure

```
app/            screens, using Expo Router file based routing
  (tabs)/       the main tabbed screens
lib/            api client, session storage and calculation logic
components/     shared UI components
__tests__/      Jest tests
```

Authentication tokens are stored using expo-secure-store, which uses the Android
keystore, rather than plain storage. The token is attached to every API request
by the wrapper in `lib/api.ts`, so individual screens don't have to deal with it.
