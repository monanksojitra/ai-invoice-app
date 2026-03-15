import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart as RNLineChart } from 'react-native-chart-kit';
import Colors from '../../constants/Colors';

const screenWidth = Dimensions.get('window').width;

interface LineChartProps {
  title: string;
  labels: string[];
  data: number[];
  yAxisSuffix?: string;
  testID?: string;
}

export const LineChart = React.memo<LineChartProps>(({
  title,
  labels,
  data,
  yAxisSuffix = '',
  testID = 'line-chart'
}) => {
  const chartData = useMemo(() => ({
    labels,
    datasets: [{ 
      data,
      color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
      strokeWidth: 2,
    }],
    legend: []
  }), [labels, data]);

  const chartConfig = useMemo(() => ({
    backgroundColor: Colors.surface,
    backgroundGradientFrom: Colors.surface,
    backgroundGradientTo: Colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(117, 117, 117, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: Colors.primary,
    },
    propsForLabels: {
      fontSize: 10,
    },
  }), []);

  if (data.length === 0) {
    return (
      <View testID={testID} style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View testID={testID} style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <RNLineChart
        data={chartData}
        width={screenWidth - 48}
        height={220}
        yAxisLabel=""
        yAxisSuffix={yAxisSuffix}
        chartConfig={chartConfig}
        style={styles.chart}
        bezier={true}
        withVerticalLines={false}
        withHorizontalLines={true}
        withInnerLines={true}
        withOuterLines={false}
        fromZero={true}
      />
    </View>
  );
});

LineChart.displayName = 'LineChart';

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textMain,
    marginBottom: 12,
  },
  chart: {
    borderRadius: 16,
  },
  emptyState: {
    height: 220,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
