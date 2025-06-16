// types/ChartTypes.ts

export interface Dataset {
    data: number[];
    label?: string;
    color?: string;
  }
  
  export interface LineChartData {
    labels: string[];
    datasets: Dataset[];
  }
  
  export interface BarChartData {
    labels: string[];
    datasets: Dataset[];
  }
  
  export interface PieChartDataItem {
    name: string;
    population: number;
    color?: string;
    legendFontColor?: string;
    legendFontSize?: number;
  }
  
  export type PieChartData = PieChartDataItem[];
  
  export interface SeriesData {
    name: string;
    data: number[];
  }
  
  export type ColorPalette = 'vibrant' | 'ocean' | 'sunset' | 'forest' | 'cosmic';
  
  export interface BaseChartProps {
    title?: string;
    colorPalette?: ColorPalette;
    height?: number;
  }
  
  export interface LineChartProps extends BaseChartProps {
    data: LineChartData;
    showGrid?: boolean;
    showLegend?: boolean;
    curved?: boolean;
    width?: number;
  }
  
  export interface BarChartProps extends BaseChartProps {
    data: BarChartData;
    showValues?: boolean;
    horizontal?: boolean;
    width?: number;
  }
  
  export interface PieChartProps extends BaseChartProps {
    data: PieChartData;
    showPercentage?: boolean;
    showLegend?: boolean;
    width?: number;
  }
  
  export interface MultiSeriesProps extends BaseChartProps {
    series: SeriesData[];
    labels: string[];
    width?: number;
  }
  
  export interface ChartDashboardProps {
    charts: React.ReactNode[];
  }
  
  export interface ChartConfig {
    backgroundGradientFrom: string;
    backgroundGradientTo: string;
    backgroundGradientFromOpacity: number;
    backgroundGradientToOpacity: number;
    color: (opacity?: number) => string;
    strokeWidth: number;
    barPercentage: number;
    useShadowColorFromDataset: boolean;
    decimalPlaces: number;
    propsForDots: {
      r: string;
      strokeWidth: string;
      stroke: string;
    };
    propsForBackgroundLines: {
      strokeDasharray: string;
      stroke: string;
      strokeWidth: number;
    };
    propsForLabels: {
      fontSize: number;
      fontWeight: string;
      fill: string;
    };
    fillShadowGradientFrom?: string;
    fillShadowGradientTo?: string;
    fillShadowGradientFromOpacity?: number;
    fillShadowGradientToOpacity?: number;
  }