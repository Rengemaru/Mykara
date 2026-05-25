import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { initDatabase } from '../src/db/client';

export default function RootLayout() {
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
