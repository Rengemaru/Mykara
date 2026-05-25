import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

const colors = {
  accent: '#5b4cf5',
  text3: '#9ca3af',
  border: 'rgba(0, 0, 0, 0.07)',
};

function NavIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={styles.navItem}>
      <Text style={styles.navEmoji}>{emoji}</Text>
      <Text style={[styles.navLabel, focused && styles.navLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <NavIcon emoji="♪" label="曲一覧" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <NavIcon emoji="⚙️" label="設定" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 60,
    paddingBottom: 0,
    paddingTop: 0,
  },
  navItem: {
    alignItems: 'center',
    gap: 3,
    paddingTop: 8,
  },
  navEmoji: {
    fontSize: 17,
    lineHeight: 20,
  },
  navLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: colors.text3,
  },
  navLabelActive: {
    color: colors.accent,
  },
});
