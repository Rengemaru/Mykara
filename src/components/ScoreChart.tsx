import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { colors } from '../constants/colors';
import { ScoreRow } from '../types';

interface Props {
  scores: ScoreRow[];
}

export function ScoreChart({ scores }: Props) {
  const { width: screenWidth } = useWindowDimensions();

  const chronological = [...scores].reverse();
  const values = chronological.map((s) => s.score);
  const minVal = Math.max(0, Math.floor(Math.min(...values)) - 5);
  const maxVal = Math.min(100, Math.ceil(Math.max(...values)) + 5);

  const data = chronological.map((s) => ({
    value: s.score,
    label: s.scored_at.slice(5).replace('-', '/'),
  }));

  const chartWidth = screenWidth - 36 - 60;

  return (
    <View style={styles.container}>
      <LineChart
        data={data}
        width={chartWidth}
        height={80}
        color={colors.accent}
        thickness={2.5}
        curved
        dataPointsColor={colors.accent}
        dataPointsRadius={4}
        maxValue={maxVal}
        minValue={minVal}
        noOfSections={3}
        hideYAxisText
        rulesColor={colors.border}
        xAxisColor={colors.border}
        yAxisColor="transparent"
        xAxisLabelTextStyle={styles.xLabel}
        initialSpacing={20}
        endSpacing={20}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: -14,
  },
  xLabel: {
    fontSize: 9,
    color: colors.text3,
  },
});
