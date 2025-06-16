// components/DistributionPieChart.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { PieChartProps, PieChartDataItem } from './ChartTypes';
import { chartStyles } from './ChartStyles';
import { colorPalettes, baseChartConfig, screenWidth } from './ChartConfig';
import { Legend } from './Legend';

export const DistributionPieChart: React.FC<PieChartProps> = ({ 
  data, 
  title = "Distribution Chart", 
  colorPalette = 'sunset',
  height = 220,
  showPercentage = true,
  showLegend = true,
  width = screenWidth - 32
}) => {
  const colors = colorPalettes[colorPalette] || colorPalettes.sunset;
  
  // Enhance data with colors
  const enhancedData: PieChartDataItem[] = data.map((item, index) => ({
    ...item,
    color: item.color || colors[index % colors.length],
    legendFontColor: '#333333',
    legendFontSize: 12
  }));

  return (
    <View style={chartStyles.chartContainer}>
      <Text style={chartStyles.chartTitle}>{title}</Text>
      
      <PieChart
        data={enhancedData}
        width={width}
        height={height}
        chartConfig={baseChartConfig}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        style={chartStyles.chartStyle}
        absolute={!showPercentage}
      />
      
      {/* {showLegend && (
        <Legend 
          data={enhancedData} 
          colors={colors} 
          type="pie" 
          showPercentage={showPercentage}
          isPieChart={true}
        />
      )} */}
    </View>
  );
};