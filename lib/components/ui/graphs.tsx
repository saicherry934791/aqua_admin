// examples/ChartExamples.tsx
import { BarChartData, LineChartData, PieChartData, SeriesData } from '@/lib/components/grphs/ChartTypes';
import { ComparisonBarChart } from '@/lib/components/grphs/ComparisonBarChart';
import { ComparisonLineChart } from '@/lib/components/grphs/ComparisonLineChart';
import { DistributionPieChart } from '@/lib/components/grphs/DistributionPieChart';
import { MultiSeriesLineChart } from '@/lib/components/grphs/MultiSeriesLineChart';
import React from 'react';
import { ScrollView } from 'react-native-actions-sheet';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';



export const ChartExamples: React.FC = () => {
  // Sample data for line chart
  const lineData: LineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43],
        label: "Sales"
      },
      {
        data: [30, 55, 38, 70, 89, 53],
        label: "Revenue"
      }
    ]
  };

  // Sample data for bar chart
  const barData: BarChartData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [{
      data: [20, 45, 28, 80],
      label: "Performance"
    }]
  };

  // Sample data for pie chart
  const pieData: PieChartData = [
    { name: 'Mobile', population: 45 },
    { name: 'Desktop', population: 30 },
    { name: 'Tablet', population: 15 },
    { name: 'Other', population: 10 }
  ];

  // Multi-series data
  const multiSeriesData: SeriesData[] = [
    { name: 'Product A', data: [65, 59, 80, 81, 56, 55, 40] },
    { name: 'Product B', data: [28, 48, 40, 19, 86, 27, 90] },
    { name: 'Product C', data: [18, 25, 33, 72, 41, 65, 78] }
  ];
  const multiLabels: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{flex:1, backgroundColor:'white'}}>
        <ScrollView>
          <ComparisonLineChart
            key="line-chart"
            data={lineData}
            title="Sales vs Revenue Comparison"
            colorPalette="vibrant"
            curved={true}
          />,
          <ComparisonBarChart
            key="bar-chart"
            data={barData}
            title="Quarterly Performance"
            colorPalette="ocean"
            showValues={true}
          />,
          <DistributionPieChart
            key="pie-chart"
            data={pieData}
            title="Device Usage Distribution"
            colorPalette="sunset"
            showPercentage={true}
          />,
          <MultiSeriesLineChart
            key="multi-series-chart"
            series={multiSeriesData}
            labels={multiLabels}
            title="Weekly Product Performance"
            colorPalette="cosmic"
          />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>

  );
};

// Individual component usage examples
export const IndividualChartExamples = {
  // Line Chart Example
  LineChartExample: () => (
    <ComparisonLineChart
      data={{
        labels: ['Jan', 'Feb', 'Mar', 'Apr'],
        datasets: [
          { data: [20, 45, 28, 80], label: "Sales" },
          { data: [30, 35, 48, 70], label: "Target" }
        ]
      }}
      title="Monthly Sales vs Target"
      colorPalette="vibrant"
      curved={true}
      showLegend={true}
    />
  ),

  // Bar Chart Example
  BarChartExample: () => (
    <ComparisonBarChart
      data={{
        labels: ['North', 'South', 'East', 'West'],
        datasets: [{ data: [20, 45, 28, 80] }]
      }}
      title="Regional Performance"
      colorPalette="ocean"
      showValues={true}
    />
  ),

  // Pie Chart Example
  PieChartExample: () => (
    <DistributionPieChart
      data={[
        { name: 'iOS', population: 60 },
        { name: 'Android', population: 35 },
        { name: 'Other', population: 5 }
      ]}
      title="Platform Distribution"
      colorPalette="sunset"
      showPercentage={true}
    />
  ),

  // Multi-Series Example
  MultiSeriesExample: () => (
    <MultiSeriesLineChart
      series={[
        { name: 'Revenue', data: [100, 120, 150, 180, 200] },
        { name: 'Profit', data: [20, 25, 35, 45, 60] },
        { name: 'Expenses', data: [80, 95, 115, 135, 140] }
      ]}
      labels={['Q1', 'Q2', 'Q3', 'Q4', 'Q5']}
      title="Financial Overview"
      colorPalette="forest"
    />
  )
};

export default ChartExamples;