import { LineChart } from 'react-native-gifted-charts';
import { StyleSheet, Text, View } from 'react-native';

const DATA = [
  { value: 85 },
  { value: 90 },
  { value: 88 },
  { value: 93 },
  { value: 97 },
];

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>グラフ表示テスト</Text>
      <LineChart
        data={DATA}
        color="#5b4cf5"
        thickness={3}
        dataPointsColor="#5b4cf5"
      />
      <Text style={styles.label}>react-native-gifted-charts 動作確認</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2f7',
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
  },
  label: {
    marginTop: 24,
    fontSize: 13,
    color: '#6b7280',
  },
});
