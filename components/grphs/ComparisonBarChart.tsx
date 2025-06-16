// components/ComparisonBarChart.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { BarChartProps } from './ChartTypes';
import { chartStyles } from './ChartStyles';
import { colorPalettes, getEnhancedConfig, screenWidth } from './ChartConfig';
import { Legend } from './Legend';

export const ComparisonBarChart: React.FC<BarChartProps> = ({ 
  data, 
  title = "Bar Comparison", 
  colorPalette = 'ocean',
  height = 220,
  showValues = true,
  horizontal = false,
  width = screenWidth - 32
}) => {
  const colors = colorPalettes[colorPalette] || colorPalettes.ocean;
  const enhancedConfig = getEnhancedConfig(colorPalette, 'bar');

  return (
    <View style={chartStyles.chartContainer}>
      <Text style={chartStyles.chartTitle}>{title}</Text>
      
      <BarChart
        data={data}
        width={width}
        height={height}
        chartConfig={enhancedConfig}
        style={chartStyles.chartStyle}
        showValuesOnTopOfBars={showValues}
        fromZero={true}
        showBarTops={false}
      />
      
      {data.datasets && data.datasets.length > 1 && (
        <Legend 
          data={data.datasets} 
          colors={colors} 
          type="bar" 
        />
      )}
    </View>
  );
};