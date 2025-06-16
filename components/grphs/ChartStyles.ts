// styles/ChartStyles.ts
import { StyleSheet } from 'react-native';

export const chartStyles = StyleSheet.create({
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    // padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 4,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 8,
    // elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    // fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#2c3e50',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  chartStyle: {
    borderRadius: 12,
    marginVertical: 8,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pieChartLegend: {
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#333333',
    // fontWeight: '500',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  dashboard: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  dashboardItem: {
    marginBottom: 8,
  },
});