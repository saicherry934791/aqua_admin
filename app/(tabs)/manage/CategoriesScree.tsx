import { apiService } from '@/lib/api/api';
import SkeletonWrapper from '@/lib/components/skeltons/SkeltonScrollRefreshWrapper';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

type FilterType = 'all' | 'active' | 'inactive';

interface Category {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CategoryScreen = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const params = useLocalSearchParams();

  // Track if we need to refresh data
  const [shouldRefresh, setShouldRefresh] = useState(false);

  // Handle refresh when returning from forms
  useEffect(() => {
    if (params.refreshData) {
      try {
        const parsedData = JSON.parse(params.refreshData as string);
        if (parsedData.type === 'add') {
          // Add new category to the list
          setCategories(prev => [parsedData.data, ...prev]);
        } else if (parsedData.type === 'update') {
          // Update existing category in the list
          setCategories(prev => 
            prev.map(category => 
              category.id === parsedData.data.id ? parsedData.data : category
            )
          );
        }
        // Clear the refresh data parameter
        setTimeout(() => {
          router.setParams({ refreshData: undefined });
        }, 100);
      } catch (error) {
        console.log('Error parsing refresh data:', error);
      }
    }
  }, [params.refreshData]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Only refresh if we're returning from another screen
      if (shouldRefresh) {
        fetchCategories();
        setShouldRefresh(false);
      }
    }, [shouldRefresh])
  );

  // Set refresh flag when navigating away
  const handleAddCategory = () => {
    setShouldRefresh(true);
    router.push('/categories/add/new');
  };

  const handleEditCategory = (categoryId: string) => {
    setShouldRefresh(true);
    router.push(`/categories/add/${categoryId}`);
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const result = await apiService.get('/categories');
      console.log('Fetched categories:', JSON.stringify(result.data.categories, null, 2));
      setCategories(result.data.categories);
    } catch (err) {
      console.log('Error fetching categories:', err);
      Alert.alert('Error', 'Failed to fetch categories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateCategoryStatus = async (categoryId: string, newStatus: boolean) => {
    try {
      const response = await apiService.put(`/categories/${categoryId}`, { 
        isActive: newStatus 
      });
      
      if (response.success) {
        setCategories(prev =>
          prev.map(category =>
            category.id === categoryId
              ? { ...category, isActive: newStatus }
              : category
          )
        );
        setTimeout(() => {
          Alert.alert(
            'Success',
            `Category ${newStatus ? 'activated' : 'deactivated'} successfully`,
            [{ text: 'OK', onPress: () => { } }],
            { cancelable: true }
          );
        }, 100);
      } else {
        setTimeout(() => {
          Alert.alert(
            'Error',
            'Unable to update status, please try again later.',
            [{ text: 'OK', onPress: () => { } }],
            { cancelable: true }
          );
        }, 100);
      }
    } catch (error) {
      console.log('Error updating category status:', error);
      Alert.alert(
        'Error',
        'Failed to update category status',
        [{ text: 'OK', onPress: () => { } }],
        { cancelable: true }
      );
    }
  };

  const showActionSheet = (category: Category) => {
    const options = [
      'Edit Category',
      category.isActive ? 'Deactivate' : 'Activate',
      'Cancel'
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 3,
          destructiveButtonIndex: category.isActive ? 2 : undefined,
          title: `Manage ${category.name}`,
          message: 'Choose an action for this category'
        },
        (buttonIndex) => {
          if (buttonIndex !== 3) {
            handleActionSheetResponse(category, buttonIndex);
          }
        }
      );
    } else {
      Alert.alert(
        `Manage ${category.name}`,
        'Choose an action for this category',
        [
        //   { text: 'View Details', onPress: () => handleActionSheetResponse(category, 0) },
          { text: 'Edit Category', onPress: () => handleActionSheetResponse(category, 1) },
          {
            text: category.isActive ? 'Deactivate' : 'Activate',
            style: category.isActive ? 'destructive' : 'default',
            onPress: () => handleActionSheetResponse(category, 2)
          },
          { text: 'Cancel', style: 'cancel' }
        ],
        { cancelable: true }
      );
    }
  };

  const handleActionSheetResponse = (category: Category, buttonIndex: number) => {
    switch (buttonIndex) {
      case 0:
        router.push(`/category/${category.id}`);
        break;
      case 1:
        handleEditCategory(category.id);
        break;
      case 2:
        updateCategoryStatus(category.id, !category.isActive);
        break;
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const activeCategories = categories.filter(c => c.isActive).length;
  const inactiveCategories = categories.length - activeCategories;

  // Filter categories based on active filter
  const filteredCategories = categories.filter(category => {
    switch (activeFilter) {
      case 'active':
        return category.isActive;
      case 'inactive':
        return !category.isActive;
      default:
        return true;
    }
  });

  // Filter buttons data
  const filterButtons = [
    { key: 'all', icon: 'apps', label: 'All', value: categories.length, color: '#3B82F6', bgColor: '#EEF2FF' },
    { key: 'active', icon: 'checkmark-circle', label: 'Active', value: activeCategories, color: '#10B981', bgColor: '#ECFDF5' },
    { key: 'inactive', icon: 'close-circle', label: 'Inactive', value: inactiveCategories, color: '#EF4444', bgColor: '#FEF2F2' },
  ];

  const CategorySkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <View style={styles.skeletonHeader}>
            <View style={styles.skeletonAvatar} />
            <View style={styles.skeletonContent}>
              <View style={styles.skeletonTitle} />
              <View style={styles.skeletonSubtitle} />
            </View>
            <View style={styles.skeletonBadge} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <SkeletonWrapper
        loading={loading}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        skeleton={<CategorySkeleton />}
        style={styles.scrollContent}
      >
        {/* Filter Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContainer}
        >
          {filterButtons.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                { backgroundColor: filter.bgColor },
                activeFilter === filter.key && [styles.activeFilterButton, { borderColor: filter.color }]
              ]}
              onPress={() => setActiveFilter(filter.key as FilterType)}
              activeOpacity={0.7}
            >
              <View style={[styles.filterIcon, { backgroundColor: filter.color }]}>
                <Ionicons name={filter.icon as any} size={16} color="#fff" />
              </View>
              <Text style={[
                styles.filterValue,
                activeFilter === filter.key && { color: filter.color }
              ]}>
                {filter.value}
              </Text>
              <Text style={[
                styles.filterLabel,
                activeFilter === filter.key && { color: filter.color }
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredCategories.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="category" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>
              {activeFilter === 'all' ? 'No Categories Found' : `No ${activeFilter} categories`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'all'
                ? 'Add your first category to get started'
                : 'Try selecting a different filter'
              }
            </Text>
          </View>
        ) : (
          filteredCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => showActionSheet(category)}
              activeOpacity={0.7}
            >
              {/* Category Header */}
              <View style={styles.categoryHeader}>
                <View style={styles.categoryInfo}>
                  <View style={styles.avatarContainer}>
                    <MaterialIcons name="category" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.categoryDetails}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryDate}>
                      Created: {new Date(category.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.statusAndActions}>
                  <View
                    style={[
                      styles.statusBadge,
                      category.isActive ? styles.badgeActive : styles.badgeInactive
                    ]}
                  >
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: category.isActive ? '#10B981' : '#EF4444' }
                    ]} />
                    <Text style={[
                      styles.statusText,
                      { color: category.isActive ? '#047857' : '#DC2626' }
                    ]}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.editButton}>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </SkeletonWrapper>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddCategory}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default CategoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  filterScrollView: {
    marginTop: 16,
    marginBottom: 20,
  },
  filterContainer: {
    paddingHorizontal: 0,
    padding: 2,
    borderRadius: 100,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 2,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeFilterButton: {
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  filterIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  filterValue: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
    marginRight: 4,
  },
  filterLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#4B5563',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#9CA3AF',
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  categoryDate: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
  },
  statusAndActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeActive: {
    backgroundColor: '#ECFDF5',
  },
  badgeInactive: {
    backgroundColor: '#FEF2F2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
  },
  editButton: {
    padding: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Skeleton styles
  skeletonContainer: {
    paddingTop: 16,
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonTitle: {
    height: 18,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
    width: '70%',
  },
  skeletonSubtitle: {
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    width: '50%',
  },
  skeletonBadge: {
    width: 60,
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
  },
});