import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { initDatabase } from '../src/db/client';
import { seedIfEmpty } from '../src/db/seed';

export default function RootLayout() {
  useEffect(() => {
    initDatabase();
    seedIfEmpty();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="song/new" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="song/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="tabs" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
