import { Button } from '@react-navigation/elements';
import { router, useNavigation } from 'expo-router';
import { LocationEdit as Edit3, TrendingUp, Users, Package, DollarSign, Wrench, MapPin, Calendar, Bell, Activity, BarChart3, PieChart } from 'lucide-react-native';
import React, { useContext, useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { SheetManager } from 'react-native-actions-sheet';
import { useAuth, UserRole } from '@/lib/contexts/AuthContext';
import { DistributionPieChart } from '@/lib/components/grphs/DistributionPieChart';
import { ComparisonLineChart } from '@/lib/components/grphs/ComparisonLineChart';
import { ComparisonBarChart } from '@/lib/components/grphs/ComparisonBarChart';
import { BarChartData, LineChartData } from '@/lib/components/grphs/ChartTypes';

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
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const { user } = useAuth();
  
  const navigation = useNavigation();

  // Sample data for charts - replace with real data
  const pieChartData = [
    { name: 'Active Orders', population: 45, color: '#007bff' },
    { name: 'Completed', population: 30, color: '#10B981' },
    { name: 'Pending', population: 15, color: '#F59E0B' },
    { name: 'Cancelled', population: 10, color: '#EF4444' }
  ];

  const lineChartData: LineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [4000, 3000, 2000, 2780, 1890, 2390],
      },
      {
        label: 'Orders',
        data: [240, 139, 980, 390, 480, 380],
      },
    ],
  };

  const barChartData: BarChartData = {
    labels: ['Products', 'Services', 'Rentals', 'Sales'],
    datasets: [
      {
        label: 'Values',
        data: [25, 15, 30, 20],
      },
    ],
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShadowVisible: false,
      headerTitle: () => (
        <View style={styles.headerContainer}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              {user?.role === UserRole.ADMIN ? 'ADMIN DASHBOARD' :
                user?.role === UserRole.FRANCHISE_OWNER ? 'FRANCHISE DASHBOARD' :
                  'SERVICE DASHBOARD'}
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
    });
  }, [navigation, startDate, endDate, user?.role]);

  const handleDateRangeSelect = (newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const openDateRangeSheet = () => {
    SheetManager.show('date-range-sheet', {
      payload: {
        onDateRangeSelect: handleDateRangeSelect,
      },
    });
  };

  // Get tabs based on user role - Generalized structure
  const getTabs = () => {
    switch (user?.role) {
      case UserRole.ADMIN:
        return [
          { key: 'overview', title: 'Overview', icon: Activity },
          { key: 'trends', title: 'Trends', icon: BarChart3 },
          { key: 'finance', title: 'Finance', icon: DollarSign }
        ];
      case UserRole.FRANCHISE_OWNER:
        return [
          { key: 'overview', title: 'Overview', icon: Activity },
          { key: 'trends', title: 'Trends', icon: BarChart3 },
          { key: 'finance', title: 'Finance', icon: DollarSign }
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
    switch (activeTab) {
      case 'overview':
        return (
          <View style={styles.contentContainer}>
            {/* Key Metrics */}
            <View style={styles.statsGrid}>
              <StatCard
                title="Total Revenue"
                value="₹2.5L"
                icon={DollarSign}
                trend="+12.5%"
                color="#10B981"
                onPress={() => router.push('/finance')}
              />
              <StatCard
                title="Active Franchises"
                value="15"
                icon={MapPin}
                trend="+2"
                color="#007bff"
                onPress={() => router.push({
                  pathname: '/manage',
                  params: { tab: 'Franchises' },
                })}
              />
              <StatCard
                title="Total Orders"
                value="342"
                icon={Package}
                trend="+8.3%"
                color="#F59E0B"
                onPress={() => router.push('/orders')}
              />
              <StatCard
                title="Service Requests"
                value="28"
                icon={Wrench}
                trend="-2.1%"
                color="#EF4444"
                onPress={() => router.push('/service')}
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
                  onPress={() => router.push('/analytics')}
                />
              </View>
            </View>
          </View>
        );

      case 'trends':
        return (
          <View style={styles.contentContainer}>
            {/* Charts Section */}
            <View style={styles.chartsSection}>
              <DistributionPieChart
                data={pieChartData}
                title="Order Distribution"
                height={200}
              />
              <View style={styles.chartSpacing} />
              <ComparisonLineChart
                data={lineChartData}
                title="Revenue & Orders Trend"
                height={220}
              />
              <View style={styles.chartSpacing} />
              <ComparisonBarChart
                data={barChartData}
                title="Performance by Category"
                height={220}
              />
            </View>
          </View>
        );

      case 'finance':
        return (
          <View style={styles.contentContainer}>
            <View style={styles.statsGrid}>
              <StatCard title="Total Income" value="₹7.5L" icon={DollarSign} color="#10B981" />
              <StatCard title="Expenses" value="₹2.5L" icon={DollarSign} color="#EF4444" />
              <StatCard title="Net Profit" value="₹5L" icon={TrendingUp} color="#007bff" />
              <StatCard title="Franchise Revenue" value="₹4.2L" icon={MapPin} color="#F59E0B" />
            </View>
            <ComparisonBarChart
              data={barChartData}
              title="Revenue by Category"
              height={220}
            />
            <View style={styles.chartSpacing} />
            <ComparisonLineChart
              data={lineChartData}
              title="Financial Trends"
              height={220}
            />
          </View>
        );

      default:
        return null;
    }
  };

  const renderFranchiseContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <View style={styles.contentContainer}>
            <View style={styles.statsGrid}>
              <StatCard
                title="Monthly Revenue"
                value="₹45K"
                icon={DollarSign}
                trend="+15.2%"
                color="#10B981"
              />
              <StatCard
                title="Active Orders"
                value="42"
                icon={Package}
                trend="+5"
                color="#007bff"
              />
              <StatCard
                title="New Customers"
                value="15"
                icon={Users}
                trend="+8"
                color="#F59E0B"
              />
              <StatCard
                title="Service Tasks"
                value="12"
                icon={Wrench}
                trend="-2"
                color="#EF4444"
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
                  title="Order Management"
                  subtitle="Track all orders"
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
              <DistributionPieChart
                data={pieChartData}
                title="Customer Distribution"
                height={200}
              />
              <View style={styles.chartSpacing} />
              <ComparisonLineChart
                data={lineChartData}
                title="Franchise Performance"
                height={220}
              />
              <View style={styles.chartSpacing} />
              <ComparisonBarChart
                data={barChartData}
                title="Service Categories"
                height={220}
              />
            </View>
          </View>
        );

      case 'finance':
        return (
          <View style={styles.contentContainer}>
            <View style={styles.statsGrid}>
              <StatCard title="Total Orders" value="156" icon={Package} />
              <StatCard title="Order Revenue" value="₹45K" icon={DollarSign} color="#10B981" />
              <StatCard title="Service Revenue" value="₹12K" icon={Wrench} color="#8B5CF6" />
              <StatCard title="Monthly Growth" value="+15%" icon={TrendingUp} color="#F59E0B" />
            </View>
            <ComparisonLineChart
              data={lineChartData}
              title="Revenue Trends"
              height={220}
            />
            <View style={styles.chartSpacing} />
            <ComparisonBarChart
              data={barChartData}
              title="Revenue Sources"
              height={220}
            />
          </View>
        );

      default:
        return null;
    }
  };

  const renderServiceAgentContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <View style={styles.contentContainer}>
            <View style={styles.statsGrid}>
              <StatCard
                title="Today's Tasks"
                value="8"
                icon={Wrench}
                color="#007bff"
              />
              <StatCard
                title="Completed"
                value="5"
                icon={Activity}
                color="#10B981"
              />
              <StatCard
                title="Pending"
                value="3"
                icon={Calendar}
                color="#F59E0B"
              />
              <StatCard
                title="This Week"
                value="32"
                icon={TrendingUp}
                color="#8B5CF6"
              />
            </View>

            <View style={styles.quickActionsSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <QuickActionCard
                  title="View Tasks"
                  subtitle="Check assigned work"
                  icon={Wrench}
                  color="#007bff"
                  onPress={() => router.push('/service')}
                />
                <QuickActionCard
                  title="Check Orders"
                  subtitle="View order status"
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
              <DistributionPieChart
                data={pieChartData}
                title="Task Distribution"
                height={200}
              />
              <View style={styles.chartSpacing} />
              <ComparisonLineChart
                data={lineChartData}
                title="Weekly Performance"
                height={220}
              />
            </View>
          </View>
        );

      case 'tasks':
        return (
          <View style={styles.contentContainer}>
            <View style={styles.statsGrid}>
              <StatCard title="All Tasks" value="45" icon={Wrench} />
              <StatCard title="In Progress" value="8" icon={Activity} />
              <StatCard title="Overdue" value="2" icon={Bell} />
              <StatCard title="Completed" value="35" icon={TrendingUp} />
            </View>
            
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
        {renderDashboardContent()}
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
    flex: 1,
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
});