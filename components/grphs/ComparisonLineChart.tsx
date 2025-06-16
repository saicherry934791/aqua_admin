// components/ComparisonLineChart.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { LineChartProps } from './ChartTypes';
import { chartStyles } from './ChartStyles';
import { colorPalettes, getEnhancedConfig, screenWidth } from './ChartConfig';
import { Legend } from './Legend';

export const ComparisonLineChart: React.FC<LineChartProps> = ({ 
  data, 
  title = "Comparison Chart", 
  colorPalette = 'vibrant',
  height = 220,
  showGrid = true,
  showLegend = true,
  curved = true,
  width = screenWidth - 32
}) => {
  const colors = colorPalettes[colorPalette] || colorPalettes.vibrant;
  const enhancedConfig = getEnhancedConfig(colorPalette, 'line');

  return (
    <View style={chartStyles.chartContainer}>
      <Text style={chartStyles.chartTitle}>{title}</Text>
      
      {showLegend && data.datasets && data.datasets.length > 1 && (
        <Legend 
          data={data.datasets} 
          colors={colors} 
          type="line" 
        />
      )}

      <LineChart
        data={data}
        width={width}
        height={height}
        chartConfig={enhancedConfig}
        bezier={curved}
        style={chartStyles.chartStyle}
        withInnerLines={showGrid}
        withOuterLines={showGrid}
        withVerticalLines={showGrid}
        withHorizontalLines={showGrid}
        fromZero={true}
      />
    </View>
  );
};