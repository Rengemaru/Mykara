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
  const damScores = chronological.filter((s) => s.machine === 'DAM');
  const joyScores = chronological.filter((s) => s.machine === 'JOYSOUND');

  const hasDam = damScores.length > 0;
  const hasJoy = joyScores.length > 0;

  const allValues = chronological.map((s) => s.score);
  const minVal = Math.max(0, Math.floor(Math.min(...allValues)) - 5);
  const maxVal = Math.min(100, Math.ceil(Math.max(...allValues)) + 5);

  const primaryScores = hasDam ? damScores : joyScores;
  const primaryData = primaryScores.map((s) => ({
    value: s.score,
    label: s.scored_at.slice(5).replace('-', '/'),
  }));
  const secondaryData = hasDam && hasJoy
    ? joyScores.map((s) => ({ value: s.score }))
    : undefined;

  const primaryColor = hasDam ? colors.dam : colors.joy;
  const chartWidth = screenWidth - 36 - 60;

  return (
    <View style={styles.container}>
      <LineChart
        data={primaryData}
        data2={secondaryData}
        width={chartWidth}
        height={80}
        color={primaryColor}
        color2={colors.joy}
        thickness={2.5}
        thickness2={2.5}
        curved
        dataPointsColor={primaryColor}
        dataPointsColor2={colors.joy}
        dataPointsRadius={4}
        dataPointsRadius2={4}
        maxValue={maxVal - minVal}
        yAxisOffset={minVal}
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
