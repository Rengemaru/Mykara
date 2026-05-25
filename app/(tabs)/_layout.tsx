import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{ title: '曲一覧', tabBarLabel: '♪ 曲一覧' }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: '設定', tabBarLabel: '⚙️ 設定' }}
      />
    </Tabs>
  );
}
