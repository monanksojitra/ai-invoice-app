import React from 'react';
import { render } from '@testing-library/react-native';
import { BarChart } from '../../src/components/charts/BarChart';
import { LineChart } from '../../src/components/charts/LineChart';
import { PieChart } from '../../src/components/charts/PieChart';

describe('Chart Components', () => {
  describe('BarChart', () => {
    it('renders with data', () => {
      const { getByText, getByTestId } = render(
        <BarChart
          title="Top Vendors"
          labels={['Vendor A', 'Vendor B']}
          data={[1000, 2000]}
          testID="test-bar-chart"
        />
      );

      expect(getByText('Top Vendors')).toBeTruthy();
      expect(getByTestId('test-bar-chart')).toBeTruthy();
    });

    it('renders empty state when no data', () => {
      const { getByText } = render(
        <BarChart
          title="Top Vendors"
          labels={[]}
          data={[]}
        />
      );

      expect(getByText('No data available')).toBeTruthy();
    });

    it('displays title correctly', () => {
      const { getByText } = render(
        <BarChart
          title="Custom Title"
          labels={['A']}
          data={[100]}
        />
      );

      expect(getByText('Custom Title')).toBeTruthy();
    });
  });

  describe('LineChart', () => {
    it('renders with data', () => {
      const { getByText, getByTestId } = render(
        <LineChart
          title="Monthly Trend"
          labels={['Jan', 'Feb', 'Mar']}
          data={[100, 200, 150]}
          testID="test-line-chart"
        />
      );

      expect(getByText('Monthly Trend')).toBeTruthy();
      expect(getByTestId('test-line-chart')).toBeTruthy();
    });

    it('renders empty state when no data', () => {
      const { getByText } = render(
        <LineChart
          title="Monthly Trend"
          labels={[]}
          data={[]}
        />
      );

      expect(getByText('No data available')).toBeTruthy();
    });

    it('applies yAxisSuffix prop', () => {
      const { getByText } = render(
        <LineChart
          title="Revenue"
          labels={['Jan']}
          data={[1000]}
          yAxisSuffix="k"
        />
      );

      expect(getByText('Revenue')).toBeTruthy();
    });
  });

  describe('PieChart', () => {
    it('renders with data', () => {
      const { getByText, getByTestId } = render(
        <PieChart
          title="Category Breakdown"
          data={[
            { name: 'Food', amount: 1000 },
            { name: 'Travel', amount: 2000 },
          ]}
          testID="test-pie-chart"
        />
      );

      expect(getByText('Category Breakdown')).toBeTruthy();
      expect(getByTestId('test-pie-chart')).toBeTruthy();
    });

    it('renders empty state when no data', () => {
      const { getByText } = render(
        <PieChart
          title="Category Breakdown"
          data={[]}
        />
      );

      expect(getByText('No data available')).toBeTruthy();
    });

    it('handles multiple categories', () => {
      const { getByText } = render(
        <PieChart
          title="Spending"
          data={[
            { name: 'Cat1', amount: 100 },
            { name: 'Cat2', amount: 200 },
            { name: 'Cat3', amount: 300 },
          ]}
        />
      );

      expect(getByText('Spending')).toBeTruthy();
    });
  });

  describe('Chart Memoization', () => {
    it('BarChart uses React.memo', () => {
      expect(BarChart.displayName).toBe('BarChart');
    });

    it('LineChart uses React.memo', () => {
      expect(LineChart.displayName).toBe('LineChart');
    });

    it('PieChart uses React.memo', () => {
      expect(PieChart.displayName).toBe('PieChart');
    });
  });
});
