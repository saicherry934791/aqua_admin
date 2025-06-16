// components/MultiSeriesLineChart.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MultiSeriesProps, LineChartData } from './ChartTypes';
import { chartStyles } from './ChartStyles';
import { colorPalettes, baseChartConfig, screenWidth } from './ChartConfig';
import { Legend } from './Legend';

export const MultiSeriesLineChart: React.FC<MultiSeriesProps> = ({ 
  series = [], 
  labels = [], 
  title = "Multi-Series Comparison",
  colorPalette = 'cosmic',
  height = 250,
  width = screenWidth - 32
}) => {
  const colors = colorPalettes[colorPalette] || colorPalettes.cosmic;
  
  const data: LineChartData = {
    labels: labels,
    datasets: series.map((serie, index) => ({
      data: serie.data,
      color: (opacity = 1) => colors[index % colors.length],
      strokeWidth: 3,
      label: serie.name
    }))
  };

  return (
    <View style={chartStyles.chartContainer}>
      <Text style={chartStyles.chartTitle}>{title}</Text>
      
      <Legend 
        data={series} 
        colors={colors} 
        type="series" 
      />

      <LineChart
        data={data}
        width={width}
        height={height}
        chartConfig={baseChartConfig}
        bezier={true}
        style={chartStyles.chartStyle}
        withInnerLines={true}
        withOuterLines={true}
        withVerticalLines={true}
        withHorizontalLines={true}
        fromZero={true}
      />
    </View>
  );
};