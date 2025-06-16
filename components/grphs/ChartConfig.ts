// config/ChartConfig.ts
import { Dimensions } from 'react-native';
import { ChartConfig } from '../types/ChartTypes';

export const screenWidth = Dimensions.get('window').width;

// Beautiful color palettes
export const colorPalettes: Record<string, string[]> = {
  vibrant: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'],
  ocean: ['#667eea', '#764ba2', '#6B73FF', '#9bafd9', '#103783', '#667eea', '#764ba2'],
  sunset: ['#fa709a', '#fee140', '#ff9068', '#fd746c', '#ff7b7b', '#feb47b', '#ff9a8b'],
  forest: ['#134e5e', '#71b280', '#a8e6cf', '#88d8a3', '#4fc3f7', '#29b6f6', '#26a69a'],
  cosmic: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b']
};

// Base chart configuration
export const baseChartConfig: ChartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#f8f9fa',
  backgroundGradientFromOpacity: 0,
  backgroundGradientToOpacity: 0,
  color: (opacity = 1) => `rgba(70, 130, 180, ${opacity})`,
  strokeWidth: 3,
  barPercentage: 0.7,
  useShadowColorFromDataset: false,
  decimalPlaces: 0,
  propsForDots: {
    r: '6',
    strokeWidth: '3',
    stroke: '#ffffff'
  },
  propsForBackgroundLines: {
    strokeDasharray: '',
    stroke: '#e3e3e3',
    strokeWidth: 1
  },
  propsForLabels: {
    fontSize: 12,
    fontWeight: 'bold',
    fill: '#333333'
  }
};

// Get enhanced config for specific chart type
export const getEnhancedConfig = (
  colorPalette: string, 
  chartType: 'line' | 'bar' | 'pie' = 'line'
): ChartConfig => {
  const colors = colorPalettes[colorPalette] || colorPalettes.vibrant;
  
  const config: ChartConfig = {
    ...baseChartConfig,
    color: (opacity = 1) => colors[0],
    propsForDots: {
      ...baseChartConfig.propsForDots,
      stroke: colors[0]
    }
  };

  if (chartType === 'bar') {
    config.fillShadowGradientFrom = colors[0];
    config.fillShadowGradientTo = colors[1];
    config.fillShadowGradientFromOpacity = 0.8;
    config.fillShadowGradientToOpacity = 0.4;
  }

  return config;
};