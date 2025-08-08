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
  width = screenWidth 
}) => {
  const colors = colorPalettes[colorPalette] || colorPalettes.sunset;
  
  // Option 1: Hide built-in labels by setting transparent colors
  const enhancedData: PieChartDataItem[] = data.map((item, index) => ({
    ...item,
    color: item.color || colors[index % colors.length],
    legendFontColor: 'transparent', // Hide the built-in labels
    legendFontSize: 0 // Make labels invisible
  }));

  // Option 2: Calculate total for percentage display
  const total = data.reduce((sum, item) => sum + item.population, 0);

  // Custom bottom legend component
  const renderBottomLegend = () => {
    return (
      <View style={styles.bottomLegendContainer}>
        {enhancedData.map((item, index) => {
          const percentage = ((item.population / total) * 100).toFixed(1);
          return (
            <View key={index} style={styles.legendItem}>
              <View 
                style={[
                  styles.legendColor, 
                  { backgroundColor: item.color }
                ]} 
              />
              <Text style={styles.legendText}>
                {item.name}: {showPercentage ? `${percentage}%` : item.population}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={chartStyles.chartContainer}>
      <Text style={chartStyles.chartTitle}>{title}</Text>
      
      <View style={styles.pieChartContainer}>
        <PieChart
          data={enhancedData}
          width={width}
          height={height}
          chartConfig={baseChartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="0" // Remove left padding
          style={styles.centeredChart}
          absolute={!showPercentage}
          hasLegend={false} // Disable built-in legend completely
        />
      </View>
      
      {/* Custom bottom legend */}
      {showLegend && renderBottomLegend()}
      
      {/* Alternative: Use your existing Legend component */}
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

// Add these styles to your chartStyles or create them inline
const styles = {
  pieChartContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '100%',
  },
  centeredChart: {
    alignSelf: 'center' as const,
  },
  bottomLegendContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: 15,
    paddingHorizontal: 10,
  },
  legendItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginRight: 15,
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#333333',
  },
};