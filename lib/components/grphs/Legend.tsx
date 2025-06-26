// components/Legend.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { chartStyles } from './ChartStyles';
import { Dataset, SeriesData, PieChartDataItem } from './ChartTypes';

interface LegendProps {
  data: Dataset[] | SeriesData[] | PieChartDataItem[];
  colors: string[];
  type?: 'line' | 'bar' | 'pie' | 'series';
  showPercentage?: boolean;
  isPieChart?: boolean;
}

export const Legend: React.FC<LegendProps> = ({ 
  data, 
  colors, 
  type = 'line', 
  showPercentage = false,
  isPieChart = false 
}) => {
  const renderLineBarLegend = () => {
    const datasets = data as Dataset[];
    return (
      <View style={chartStyles.legendContainer}>
        {datasets.map((dataset, index) => (
          <View key={index} style={chartStyles.legendItem}>
            <View 
              style={[
                chartStyles.legendColor, 
                { backgroundColor: colors[index % colors.length] }
              ]} 
            />
            <Text style={chartStyles.legendText}>
              {dataset.label || `Series ${index + 1}`}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderSeriesLegend = () => {
    const series = data as SeriesData[];
    return (
      <View style={chartStyles.legendContainer}>
        {series.map((serie, index) => (
          <View key={index} style={chartStyles.legendItem}>
            <View 
              style={[
                chartStyles.legendColor, 
                { backgroundColor: colors[index % colors.length] }
              ]} 
            />
            <Text style={chartStyles.legendText}>{serie.name}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderPieLegend = () => {
    const pieData = data as PieChartDataItem[];
    const total = pieData.reduce((sum, item) => sum + item.population, 0);
    
    return (
      <View style={chartStyles.pieChartLegend}>
        {pieData.map((item, index) => (
          <View key={index} style={chartStyles.legendItem}>
            <View 
              style={[
                chartStyles.legendColor, 
                { backgroundColor: item.color || colors[index % colors.length] }
              ]} 
            />
            <Text style={chartStyles.legendText}>
              {item.name}: {showPercentage 
                ? `${((item.population / total) * 100).toFixed(1)}%` 
                : item.population
              }
            </Text>
          </View>
        ))}
      </View>
    );
  };

  if (isPieChart || type === 'pie') {
    return renderPieLegend();
  }

  if (type === 'series') {
    return renderSeriesLegend();
  }

  return renderLineBarLegend();
};