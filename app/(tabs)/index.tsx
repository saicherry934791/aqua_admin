import { apiService } from '@/lib/api/api';
import { ComparisonBarChart } from '@/lib/components/grphs/ComparisonBarChart';
import { ComparisonLineChart } from '@/lib/components/grphs/ComparisonLineChart';
import { DistributionPieChart } from '@/lib/components/grphs/DistributionPieChart';
import { useAuth, UserRole } from '@/lib/contexts/AuthContext';
import { router, useNavigation } from 'expo-router';
import { Activity, ChartBar as BarChart3, Bell, Calendar, DollarSign, LocationEdit as Edit3, MapPin, Package, TrendingUp, Users, Wrench } from 'lucide-react-native';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SheetManager } from 'react-native-actions-sheet';

const { width: screenWidth } = Dimensions.get('window');

// Enhanced Reusable Components
const DashboardTab = ({ title, active, onPress, icon: Icon }: {
  title: string,
  active: boolean,
  onPress: () => void,
  icon?: any
}) => (
  <TouchableOpacity
    style={[
      styles.tab,
      active ? styles.activeTab : {}
    ]}
    onPress={onPress}
  >
    <View style={styles.tabContent}>
      {Icon && <Icon size={16} color={active ? '#007bff' : '#666'} style={styles.tabIcon} />}
      <Text style={[
        styles.tabText,
        active ? styles.activeTabText : {}
      ]}>
        {title}
      </Text>
    </View>
  </TouchableOpacity>
);

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  color = '#007bff',
  onPress
}: {
  title: string,
  value: string,
  icon?: any,
  trend?: string,
  color?: string,
  onPress?: () => void
}) => (
  <TouchableOpacity
    style={[styles.statCard, onPress && styles.clickableCard]}
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={styles.statCardHeader}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        {Icon && <Icon size={20} color={color} />}
      </View>
      {trend && (
        <View style={[styles.trendContainer, { backgroundColor: trend.startsWith('+') ? '#10B98115' : '#EF444415' }]}>
          <Text style={[styles.trendText, { color: trend.startsWith('+') ? '#10B981' : '#EF4444' }]}>
            {trend}
          </Text>
        </View>
      )}
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </TouchableOpacity>
);

const QuickActionCard = ({
  title,
  subtitle,
  icon: Icon,
  color,
  onPress
}: {
  title: string,
  subtitle: string,
  icon: any,
  color: string,
  onPress: () => void
}) => (
  <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
    <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
      <Icon size={24} color="white" />
    </View>
    <View style={styles.quickActionContent}>
      <Text style={styles.quickActionTitle}>{title}</Text>
      <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
    </View>
  </TouchableOpacity>
);

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState('overview');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30 days ago
  const [endDate, setEndDate] = useState(new Date());
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);

  const { user } = useAuth();

  const navigation = useNavigation();

  function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Helper function to format trend values
  const formatTrend = (change: number | null | undefined) => {
    if (change === null || change === undefined || change === 0) return null;
    return change > 0 ? `+${change}%` : `${change}%`;
  };

  // Helper function to format currency
  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(0)}K`;
    }
    return `₹${value}`;
  };

  // Transform API data for pie charts
  const transformPieChartData = (apiData: any[], valueKey: string, nameKey: string) => {
    const colors = ['#007bff', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
    return apiData.map((item, index) => ({
      name: item[nameKey].replace(/_/g, ' '),
      population: item[valueKey],
      color: colors[index % colors.length]
    }));
  };

  // Transform time series data for line charts
  const transformTimeSeriesData = (timeSeriesData: any) => {
    // Extract dates from all time series
    const allDates = new Set();
    Object.values(timeSeriesData).forEach((series: any[]) => {
      series.forEach(item => allDates.add(item.date));
    });

    const sortedDates = Array.from(allDates).sort();
    const labels = sortedDates.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const datasets = [];

    // Revenue data
    if (timeSeriesData.revenue) {
      const revenueData = sortedDates.map(date => {
        const item = timeSeriesData.revenue.find(r => r.date === date);
        return item ? item.revenue : 0;
      });
      datasets.push({
        label: 'Revenue',
        data: revenueData
      });
    }

    // Installation requests
    if (timeSeriesData.installationRequests) {
      const installationData = sortedDates.map(date => {
        const item = timeSeriesData.installationRequests.find(r => r.date === date);
        return item ? item.count : 0;
      });
      datasets.push({
        label: 'Installations',
        data: installationData
      });
    }

    // Subscriptions
    if (timeSeriesData.subscriptions) {
      const subscriptionData = sortedDates.map(date => {
        const item = timeSeriesData.subscriptions.find(r => r.date === date);
        return item ? item.count : 0;
      });
      datasets.push({
        label: 'Subscriptions',
        data: subscriptionData
      });
    }

    // Service completions for agents
    if (timeSeriesData.dailyCompletions) {
      const completionData = sortedDates.map(date => {
        const item = timeSeriesData.dailyCompletions.find(r => r.date === date);
        return item ? item.count : 0;
      });
      datasets.push({
        label: 'Completions',
        data: completionData
      });
    }

    return { labels, datasets };
  };

  // Fetch dashboard data from API
  const fetchDashboardData = async () => {
    if (!user) return;

    setIsDashboardLoading(true);
    try {
      const params = new URLSearchParams({
        from: getLocalDateString(startDate),
        to: getLocalDateString(endDate),
      });
      console.log('Fetching dashboard data with params:', params.toString());

      const result = await apiService.get(`/dashboard?${params}`);
      console.log('Dashboard response:', JSON.stringify(result, null, 2));

      if (result.success) {
        setDashboardData(result.data);
      } else {
        // Fallback to mock data if API fails
        setDashboardData(getMockDashboardData());
      }
    } catch (error) {
      console.error('Dashboard API error:', error);
      // Fallback to mock data
      setDashboardData(getMockDashboardData());
    } finally {
      setIsDashboardLoading(false);
    }
  };

  // Mock data fallback
  const getMockDashboardData = () => ({
    stats: {
      revenue: 250000,
      revenueChange: 12.5,
      totalFranchises: 15,
      totalInstallationRequests: 342,
      installationRequestsChange: 8.3,
      totalServiceRequests: 28,
      serviceRequestsChange: -2.1,
      totalCustomers: 156,
      customersChange: 15,
      totalSubscriptions: 89,
      subscriptionsChange: 12,
      activeSubscriptions: 76,
      completedInstallationRequests: 280,
      completedServiceRequests: 20,
      assignedServiceRequests: 8,
      scheduledServiceRequests: 5,
      inProgressServiceRequests: 3
    },
    pieCharts: {
      usersByRole: [
        { role: 'admin', count: 5 },
        { role: 'franchise_owner', count: 15 },
        { role: 'service_agent', count: 25 },
        { role: 'customer', count: 156 }
      ],
      installationRequestsByStatus: [
        { status: 'COMPLETED', count: 280 },
        { status: 'IN_PROGRESS', count: 42 },
        { status: 'PENDING', count: 20 }
      ],
      serviceRequestsByStatus: [
        { status: 'COMPLETED', count: 20 },
        { status: 'IN_PROGRESS', count: 5 },
        { status: 'CANCELLED', count: 3 }
      ],
      subscriptionsByStatus: [
        { status: 'ACTIVE', count: 76 },
        { status: 'CANCELLED', count: 13 }
      ]
    },
    timeSeriesData: {
      revenue: [
        { date: '2025-08-01', revenue: 4000 },
        { date: '2025-08-02', revenue: 3000 },
        { date: '2025-08-03', revenue: 2000 },
        { date: '2025-08-04', revenue: 2780 },
        { date: '2025-08-05', revenue: 1890 },
        { date: '2025-08-06', revenue: 2390 }
      ],
      installationRequests: [
        { date: '2025-08-01', count: 24 },
        { date: '2025-08-02', count: 13 },
        { date: '2025-08-03', count: 98 },
        { date: '2025-08-04', count: 39 },
        { date: '2025-08-05', count: 48 },
        { date: '2025-08-06', count: 38 }
      ]
    }
  });

  useEffect(() => {
    fetchDashboardData();
  }, [user, startDate, endDate]);

  const openDateRangeSheet = () => {
    SheetManager.show('date-range-sheet', {
      payload: {
        onDateRangeSelect: handleDateRangeSelect,
      },
    });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerContainer}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              {user?.role === UserRole.ADMIN ? 'ADMIN ' :
                user?.role === UserRole.FRANCHISE_OWNER ? 'FRANCHISE ' :
                  'AGENT '}
            </Text>
            <TouchableOpacity
              onPress={openDateRangeSheet}
              style={styles.headerDateContainer}
            >
              <Text style={styles.headerDateText}>
                {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
              </Text>
              <Edit3 size={16} color="#007bff" style={styles.headerDateIcon} />
            </TouchableOpacity>
          </View>
        </View>
      ),
      headerTitleAlign: 'left',
      headerShadowVisible: false
    });
  }, [navigation, startDate, endDate, user?.role]);

  const handleDateRangeSelect = (newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  // Get tabs based on user role
  const getTabs = () => {
    switch (user?.role) {
      case UserRole.ADMIN:
        return [
          { key: 'overview', title: 'Overview', icon: Activity },
          { key: 'trends', title: 'Trends', icon: BarChart3 },
          { key: 'analytics', title: 'Analytics', icon: DollarSign }
        ];
      case UserRole.FRANCHISE_OWNER:
        return [
          { key: 'overview', title: 'Overview', icon: Activity },
          { key: 'trends', title: 'Trends', icon: BarChart3 },
          { key: 'performance', title: 'Performance', icon: TrendingUp }
        ];
      case UserRole.SERVICE_AGENT:
        return [
          { key: 'overview', title: 'Overview', icon: Activity },
          { key: 'trends', title: 'Trends', icon: BarChart3 },
          { key: 'tasks', title: 'My Tasks', icon: Wrench }
        ];
      default:
        return [{ key: 'overview', title: 'Overview', icon: Activity }];
    }
  };

  // Render content based on user role and active tab
  const renderDashboardContent = () => {
    const userRole = user?.role;

    if (isDashboardLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading dashboard data...</Text>
        </View>
      );
    }

    if (!dashboardData) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>No data available</Text>
        </View>
      );
    }

    if (userRole === UserRole.ADMIN) {
      return renderAdminContent();
    } else if (userRole === UserRole.FRANCHISE_OWNER) {
      return renderFranchiseContent();
    } else if (userRole === UserRole.SERVICE_AGENT) {
      return renderServiceAgentContent();
    }

    return <Text>Access Denied</Text>;
  };

  const renderAdminContent = () => {
    const { stats, pieCharts, timeSeriesData } = dashboardData;

    switch (activeTab) {
      case 'overview':
        return (
          <View style={styles.contentContainer}>
            {/* Key Metrics */}
            <View style={styles.statsGrid}>
              <StatCard
                title="Total Revenue"
                value={formatCurrency(stats.revenue || 0)}
                icon={DollarSign}
                trend={formatTrend(stats.revenueChange)}
                color="#10B981"
                onPress={() => router.push('/finance')}
              />
              <StatCard
                title="Active Franchises"
                value={(stats.totalFranchises || 0).toString()}
                icon={MapPin}
                color="#007bff"
                onPress={() => router.push({
                  pathname: '/manage',
                  params: { tab: 'Franchises' },
                })}
              />
              <StatCard
                title="Installation Requests"
                value={(stats.totalInstallationRequests || 0).toString()}
                icon={Package}
                trend={formatTrend(stats.installationRequestsChange)}
                color="#F59E0B"
                onPress={() => router.push('/orders')}
              />
              <StatCard
                title="Service Requests"
                value={(stats?.totalServiceRequests || 0).toString()}
                icon={Wrench}
                trend={formatTrend(stats.serviceRequestsChange)}
                color="#EF4444"
                onPress={() => router.push('/service')}
              />
            </View>

            {/* Additional Stats */}
            <View style={styles.statsGrid}>
              <StatCard
                title="Total Customers"
                value={(stats.totalCustomers || 0).toString()}
                icon={Users}
                trend={formatTrend(stats.customersChange)}
                color="#8B5CF6"
              />
              <StatCard
                title="Active Subscriptions"
                value={(stats.activeSubscriptions || 0).toString()}
                icon={Activity}
                trend={formatTrend(stats.subscriptionsChange)}
                color="#06B6D4"
              />
              <StatCard
                title="Service Agents"
                value={(stats.totalServiceAgents || 0).toString()}
                icon={Users}
                color="#F97316"
              />
              <StatCard
                title="Completed Installs"
                value={(stats.completedInstallationRequests || 0).toString()}
                icon={TrendingUp}
                color="#10B981"
              />
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <QuickActionCard
                  title="Manage Franchises"
                  subtitle="View & assign areas"
                  icon={MapPin}
                  color="#007bff"
                  onPress={() => router.push({
                    pathname: '/manage',
                    params: { tab: 'Franchises' },
                  })}
                />
                <QuickActionCard
                  title="System Analytics"
                  subtitle="Performance insights"
                  icon={TrendingUp}
                  color="#10B981"
                  onPress={() => setActiveTab('analytics')}
                />
              </View>
            </View>
          </View>
        );

      case 'trends':
        return (
          <View style={styles.contentContainer}>
            <View style={styles.chartsSection}>
              {/* Users by Role */}
              {pieCharts.usersByRole && (
                <>
                  <DistributionPieChart
                    data={transformPieChartData(pieCharts.usersByRole, 'count', 'role')}
                    title="Users by Role"
                    height={200}
                  />
                  <View style={styles.chartSpacing} />
                </>
              )}

              {/* Installation Requests Status */}
              {pieCharts.installationRequestsByStatus && (
                <>
                  <DistributionPieChart
                    data={transformPieChartData(pieCharts.installationRequestsByStatus, 'count', 'status')}
                    title="Installation Requests"
                    height={200}
                  />
                  <View style={styles.chartSpacing} />
                </>
              )}

              {/* Time Series Charts */}
              {timeSeriesData && (
                <>
                  <ComparisonLineChart
                    data={transformTimeSeriesData(timeSeriesData)}
                    title="Trends Over Time"
                    height={220}
                  />
                  <View style={styles.chartSpacing} />
                </>
              )}
            </View>
          </View>
        );

      case 'analytics':
        return (
          <View style={styles.contentContainer}>
            <View style={styles.statsGrid}>
              <StatCard
                title="Total Revenue"
                value={formatCurrency(stats.revenue || 0)}
                icon={DollarSign}
                trend={formatTrend(stats.revenueChange)}
                color="#10B981"
              />
              <StatCard
                title="Revenue Growth"
                value={`${stats.revenueChange || 0}%`}
                icon={TrendingUp}
                color="#007bff"
              />
              <StatCard
                title="Customer Growth"
                value={`${stats.customersChange || 0}%`}
                icon={Users}
                color="#F59E0B"
              />
              <StatCard
                title="Service Efficiency"
                value={`${Math.round(((stats.completedServiceRequests || 0) / (stats?.totalServiceRequests || 1)) * 100)}%`}
                icon={Activity}
                color="#8B5CF6"
              />
            </View>

            {/* Service Requests Distribution */}
            {pieCharts.serviceRequestsByStatus && (
              <>
                <View style={styles.chartSpacing} />
                <DistributionPieChart
                  data={transformPieChartData(pieCharts.serviceRequestsByStatus, 'count', 'status')}
                  title="Service Requests Status"
                  height={200}
                />
              </>
            )}

            {/* Subscription Status */}
            {pieCharts.subscriptionsByStatus && (
              <>
                <View style={styles.chartSpacing} />
                <DistributionPieChart
                  data={transformPieChartData(pieCharts.subscriptionsByStatus, 'count', 'status')}
                  title="Subscription Status"
                  height={200}
                />
              </>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  const renderFranchiseContent = () => {
    const { stats, pieCharts, timeSeriesData, franchiseInfo } = dashboardData;

    switch (activeTab) {
      case 'overview':
        return (
          <View style={styles.contentContainer}>
            {/* Franchise Info */}
            {franchiseInfo && (
              <View style={styles.franchiseInfoCard}>
                <Text style={styles.franchiseTitle}>{franchiseInfo.name}</Text>
                <Text style={styles.franchiseCity}>{franchiseInfo.city}</Text>
              </View>
            )}

            <View style={styles.statsGrid}>
              <StatCard
                title="Revenue"
                value={formatCurrency(stats.revenue || 0)}
                icon={DollarSign}
                trend={formatTrend(stats.revenueChange)}
                color="#10B981"
              />
              <StatCard
                title="Installation Requests"
                value={(stats.totalInstallationRequests || 0).toString()}
                icon={Package}
                trend={formatTrend(stats.installationRequestsChange)}
                color="#007bff"
              />
              <StatCard
                title="Customers"
                value={(stats.totalCustomers || 0).toString()}
                icon={Users}
                color="#F59E0B"
              />
              <StatCard
                title="Service Requests"
                value={(stats?.totalServiceRequests || 0).toString()}
                icon={Wrench}
                trend={formatTrend(stats.serviceRequestsChange)}
                color="#EF4444"
              />
            </View>

            <View style={styles.statsGrid}>
              <StatCard
                title="Active Subscriptions"
                value={(stats.activeSubscriptions || 0).toString()}
                icon={Activity}
                color="#8B5CF6"
              />
              <StatCard
                title="Completed Installs"
                value={(stats.completedInstallationRequests || 0).toString()}
                icon={TrendingUp}
                color="#10B981"
              />
              <StatCard
                title="Cancel Requests"
                value={(stats.cancelSubscriptionRequestsActive || 0).toString()}
                icon={Bell}
                color="#EF4444"
              />
              <StatCard
                title="Total Subscriptions"
                value={(stats.totalSubscriptions || 0).toString()}
                icon={Package}
                trend={formatTrend(stats.subscriptionsChange)}
                color="#06B6D4"
              />
            </View>

            <View style={styles.quickActionsSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <QuickActionCard
                  title="Manage Customers"
                  subtitle="View customer list"
                  icon={Users}
                  color="#007bff"
                  onPress={() => router.push({
                    pathname: '/manage',
                    params: { tab: 'Customers' },
                  })}
                />
                <QuickActionCard
                  title="Installation Tracking"
                  subtitle="Track installations"
                  icon={Package}
                  color="#10B981"
                  onPress={() => router.push('/orders')}
                />
              </View>
            </View>
          </View>
        );

      case 'trends':
        return (
          <View style={styles.contentContainer}>
            <View style={styles.chartsSection}>
              {/* Installation Status */}
              {pieCharts.installationRequestsByStatus && (
                <>
                  <DistributionPieChart
                    data={transformPieChartData(pieCharts.installationRequestsByStatus, 'count', 'status')}
                    title="Installation Status"
                    height={200}
                  />
                  <View style={styles.chartSpacing} />
                </>
              )}

              {/* Service Requests */}
              {pieCharts.serviceRequestsByStatus && (
                <>
                  <DistributionPieChart
                    data={transformPieChartData(pieCharts.serviceRequestsByStatus, 'count', 'status')}
                    title="Service Requests"
                    height={200}
                  />
                  <View style={styles.chartSpacing} />
                </>
              )}

              {/* Time Series */}
              {timeSeriesData && (
                <ComparisonLineChart
                  data={transformTimeSeriesData(timeSeriesData)}
                  title="Franchise Performance"
                  height={220}
                />
              )}
            </View>
          </View>
        );

      case 'performance':
        return (
          <View style={styles.contentContainer}>
            <View style={styles.statsGrid}>
              <StatCard
                title="Installation Rate"
                value={`${Math.round(((stats.completedInstallationRequests || 0) / (stats.totalInstallationRequests || 1)) * 100)}%`}
                icon={Package}
                color="#10B981"
              />
              <StatCard
                title="Service Rate"
                value={`${Math.round(((stats.completedServiceRequests || 0) / (stats?.totalServiceRequests || 1)) * 100)}%`}
                icon={Wrench}
                color="#007bff"
              />
              <StatCard
                title="Customer Retention"
                value={`${Math.round(((stats.activeSubscriptions || 0) / (stats.totalSubscriptions || 1)) * 100)}%`}
                icon={Users}
                color="#F59E0B"
              />
              <StatCard
                title="Revenue Growth"
                value={`${stats.revenueChange || 0}%`}
                icon={TrendingUp}
                color="#8B5CF6"
              />
            </View>

            {/* Subscription Status */}
            {pieCharts.subscriptionsByStatus && (
              <>
                <View style={styles.chartSpacing} />
                <DistributionPieChart
                  data={transformPieChartData(pieCharts.subscriptionsByStatus, 'count', 'status')}
                  title="Subscription Distribution"
                  height={200}
                />
              </>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  const renderServiceAgentContent = () => {
    const { stats, pieCharts, timeSeriesData, upcomingRequests } = dashboardData;

    switch (activeTab) {
      case 'overview':
        return (
          <View style={styles.contentContainer}>
            <View style={styles.statsGrid}>
              <StatCard
                title="Total Requests"
                value={(stats?.totalServiceRequests || 0).toString()}
                icon={Wrench}
                trend={formatTrend(stats.serviceRequestsChange)}
                color="#007bff"
              />
              <StatCard
                title="Assigned"
                value={(stats.assignedServiceRequests || 0).toString()}
                icon={Activity}
                color="#F59E0B"
              />
              <StatCard
                title="Completed"
                value={(stats.completedServiceRequests || 0).toString()}
                icon={TrendingUp}
                trend={formatTrend(stats.completedRequestsChange)}
                color="#10B981"
              />


              <StatCard
                title="Scheduled"
                value={(stats.scheduledServiceRequests || 0).toString()}
                icon={Calendar}
                color="#06B6D4"
              />

              <StatCard
                title="Completion Rate"
                value={`${Math.round(((stats.completedServiceRequests || 0) / (stats?.totalServiceRequests || 1)) * 100)}%`}
                icon={Activity}
                color="#10B981"
              />
              <StatCard
                title="Weekly Target"
                value="20"
                icon={TrendingUp}
                color="#EF4444"
              />
            </View>

            <View style={styles.quickActionsSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <QuickActionCard
                  title="View Requests"
                  subtitle="Check assigned work"
                  icon={Wrench}
                  color="#007bff"
                  onPress={() => router.push('/service')}
                />
                <QuickActionCard
                  title="Today's Schedule"
                  subtitle="View today's tasks"
                  icon={Calendar}
                  color="#10B981"
                  onPress={() => router.push('/schedule')}
                />
              </View>
            </View>
          </View>
        );

      case 'trends':
        return (
          <View style={styles.contentContainer}>
            <View style={styles.chartsSection}>
              {/* Service Requests by Status */}
              {pieCharts.serviceRequestsByStatus && (
                <>
                  <DistributionPieChart
                    data={transformPieChartData(pieCharts.serviceRequestsByStatus, 'count', 'status')}
                    title="Service Requests Status"
                    height={200}
                  />
                  <View style={styles.chartSpacing} />
                </>
              )}

              {/* Service Requests by Type */}
              {pieCharts.serviceRequestsByType && (
                <>
                  <DistributionPieChart
                    data={transformPieChartData(pieCharts.serviceRequestsByType, 'count', 'type')}
                    title="Service Requests by Type"
                    height={200}
                  />
                  <View style={styles.chartSpacing} />
                </>
              )}

              {/* Daily Completions Trend */}
              {timeSeriesData && timeSeriesData.dailyCompletions && timeSeriesData.dailyCompletions.length > 0 && (
                <ComparisonLineChart
                  data={transformTimeSeriesData(timeSeriesData)}
                  title="Daily Performance"
                  height={220}
                />
              )}
            </View>
          </View>
        );

      case 'tasks':
        return (
          <View style={styles.contentContainer}>
            <View style={styles.statsGrid}>
              <StatCard
                title="All Tasks"
                value={(stats?.totalServiceRequests || 0).toString()}
                icon={Wrench}
                color="#007bff"
              />
              <StatCard
                title="In Progress"
                value={(stats.inProgressServiceRequests || 0).toString()}
                icon={Activity}
                color="#F59E0B"
              />
              <StatCard
                title="Scheduled"
                value={(stats.scheduledServiceRequests || 0).toString()}
                icon={Calendar}
                color="#06B6D4"
              />
              <StatCard
                title="Completed"
                value={(stats.completedServiceRequests || 0).toString()}
                icon={TrendingUp}
                color="#10B981"
              />
            </View>

            {/* Upcoming Requests */}
            {upcomingRequests && upcomingRequests.length > 0 && (
              <View style={styles.upcomingSection}>
                <Text style={styles.sectionTitle}>Upcoming Requests</Text>
                {upcomingRequests.slice(0, 3).map((request, index) => (
                  <View key={index} style={styles.upcomingCard}>
                    <View style={styles.upcomingHeader}>
                      <Text style={styles.upcomingTitle}>{request.type || 'Service Request'}</Text>
                      <Text style={styles.upcomingTime}>{request.scheduledTime || 'TBD'}</Text>
                    </View>
                    <Text style={styles.upcomingDescription}>
                      {request.description || 'Service request details'}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.quickActionsSection}>
              <Text style={styles.sectionTitle}>Task Management</Text>
              <View style={styles.quickActionsGrid}>
                <QuickActionCard
                  title="Service Requests"
                  subtitle="View all assignments"
                  icon={Wrench}
                  color="#007bff"
                  onPress={() => router.push('/service')}
                />
                <QuickActionCard
                  title="Schedule"
                  subtitle="Check today's schedule"
                  icon={Calendar}
                  color="#10B981"
                  onPress={() => router.push('/schedule')}
                />
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const tabs = getTabs();

  return (
    <View style={styles.container}>
      {/* Dashboard Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >

          {tabs.map((tab) => (
            <DashboardTab
              key={tab.key}
              title={tab.title}
              icon={tab.icon}
              active={activeTab === tab.key}
              onPress={() => setActiveTab(tab.key)}
            />
          ))}

        </ScrollView>
      </View>

      {/* Dashboard Content */}
      <ScrollView
        style={styles.dashboardContent}
        contentContainerStyle={styles.dashboardContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <TouchableWithoutFeedback>
          <View style={{}}>
            {renderDashboardContent()}
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#111618',
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    flex: 1,
  },
  headerDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginLeft: 10,
  },
  headerDateText: {
    fontSize: 12,
    color: '#475569',
    marginRight: 4,
    fontFamily: 'Outfit_500Medium',
  },
  headerDateIcon: {
    marginLeft: 4,
  },
  tabContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tabScrollContent: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#007bff',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    color: '#64748b',
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
  },
  activeTabText: {
    color: '#007bff',
    fontFamily: 'Outfit_700Bold',
  },
  dashboardContent: {
    flex: 1,
  },
  dashboardContentContainer: {
    padding: 16,
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
    marginTop: 16,
  },
  franchiseInfoCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  franchiseTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  franchiseCity: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Outfit_500Medium',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: (screenWidth - 48) / 2,
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  clickableCard: {
    transform: [{ scale: 1 }],
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Outfit_500Medium',
  },
  chartsSection: {
    marginBottom: 24,
  },
  chartSpacing: {
    height: 20,
  },
  quickActionsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1e293b',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Outfit_400Regular',
  },
  upcomingSection: {
    marginBottom: 20,
  },
  upcomingCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  upcomingTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1e293b',
    flex: 1,
  },
  upcomingTime: {
    fontSize: 12,
    color: '#007bff',
    fontFamily: 'Outfit_500Medium',
  },
  upcomingDescription: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Outfit_400Regular',
  },
});