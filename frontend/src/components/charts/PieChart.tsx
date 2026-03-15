import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart as RNPieChart } from 'react-native-chart-kit';
import Colors from '../../constants/Colors';

const screenWidth = Dimensions.get('window').width;

interface PieChartData {
  name: string;
  amount: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

interface PieChartProps {
  title: string;
  data: Array<{ name: string; amount: number }>;
  testID?: string;
}

const CHART_COLORS = [
  Colors.primary,
  Colors.info,
  Colors.success,
  Colors.warning,
  Colors.error,
  '#9333ea',
  '#ec4899',
  '#f97316',
];

export const PieChart = React.memo<PieChartProps>(({
  title,
  data,
  testID = 'pie-chart'
}) => {
  const chartData: PieChartData[] = useMemo(() => 
    data.map((item, index) => ({
      name: item.name,
      amount: item.amount,
      color: CHART_COLORS[index % CHART_COLORS.length],
      legendFontColor: Colors.textMuted,
      legendFontSize: 12,
    })),
    [data]
  );

  const chartConfig = useMemo(() => ({
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
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
      <RNPieChart
        data={chartData}
        width={screenWidth - 48}
        height={220}
        chartConfig={chartConfig}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="15"
        center={[10, 0]}
        absolute={false}
      />
    </View>
  );
});

PieChart.displayName = 'PieChart';

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
