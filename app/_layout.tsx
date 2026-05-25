import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { initDatabase } from '../src/db/client';
import { seedIfEmpty } from '../src/db/seed';

export default function RootLayout() {
  useEffect(() => {
    initDatabase();
    seedIfEmpty();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="song/new" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="song/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
