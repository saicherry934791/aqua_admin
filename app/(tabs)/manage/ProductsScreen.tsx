import { apiService } from '@/lib/api/api';
import ProductSkeleton from '@/lib/components/skeltons/ProductSkeleton';
import SkeletonWrapper from '@/lib/components/skeltons/SkeltonScrollRefreshWrapper';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

type FilterType = 'all' | 'active' | 'inactive' | 'rentable' | 'purchasable';

const ProductScreen = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const result = await apiService.get('/products');
      console.log('Fetched products:', JSON.stringify(result.data.products, null, 2));

      const transformed = result.data.products.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: `₹${item.buyPrice ?? 0}`,
        rentPrice: `₹${item.rentPrice ?? 0}`,
        deposit: `₹${item.deposit ?? 0}`,
        isActive: item.isActive,
        isRentable: item.isRentable,
        isPurchasable: item.isPurchasable,
      }));

      setProducts(transformed);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateProductStatus = async (productId: string, newStatus: boolean) => {
    try {
      const formData = new FormData();
      formData.append('isActive', newStatus ? 'true' : 'false')
      const resp = await apiService.delete(`/products/${productId}`, { isActive: newStatus });
      console.log('resp ', resp)
      if (resp.success) {
        setProducts(prev =>
          prev.map(product =>
            product.id === productId
              ? { ...product, isActive: newStatus }
              : product
          )
        );
        setTimeout(() => {
          Alert.alert(
            'Success',
            `Product ${newStatus ? 'activated' : 'deactivated'} successfully`,
            [{ text: 'OK', onPress: () => { } }],
            { cancelable: true }
          );
        }, 100);
      }else{
        setTimeout(() => {
          Alert.alert(
            'Error',
            `Unable to update status,please try again later.`,
            [{ text: 'OK', onPress: () => { } }],
            { cancelable: true }
          );
        }, 100);
      }


    } catch (error) {
      console.error('Error updating product status:', error);
      Alert.alert(
        'Error',
        'Failed to update product status',
        [{ text: 'OK', onPress: () => { } }],
        { cancelable: true }
      );
    }
  };

  const showActionSheet = (product: any) => {
    const options = [
      'View Details',
      'Edit Product',
      product.isActive ? 'Deactivate' : 'Activate',
      'Cancel'
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 3,
          destructiveButtonIndex: product.isActive ? 2 : undefined,
          title: `Manage ${product.name}`,
          message: 'Choose an action for this product'
        },
        (buttonIndex) => {
          if (buttonIndex !== 3) {
            handleActionSheetResponse(product, buttonIndex);
          }
        }
      );
    } else {
      Alert.alert(
        `Manage ${product.name}`,
        'Choose an action for this product',
        [
          { text: 'View Details', onPress: () => handleActionSheetResponse(product, 0) },
          { text: 'Edit Product', onPress: () => handleActionSheetResponse(product, 1) },
          {
            text: product.isActive ? 'Deactivate' : 'Activate',
            style: product.isActive ? 'destructive' : 'default',
            onPress: () => handleActionSheetResponse(product, 2)
          },
          { text: 'Cancel', style: 'cancel' }
        ],
        { cancelable: true }
      );
    }
  };

  const handleActionSheetResponse = (product: any, buttonIndex: number) => {
    switch (buttonIndex) {
      case 0:
        router.push(`/product/${product.id}`);
        break;
      case 1:
        router.push(`/products/add/${product.id}`);
        break;
      case 2:
        updateProductStatus(product.id, !product.isActive);
        break;
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleAddProduct = () => {
    router.push('/products/add/new');
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const activeProducts = products.filter(p => p.isActive).length;
  const inactiveProducts = products.length - activeProducts;
  const rentableProducts = products.filter(p => p.isRentable).length;
  const purchasableProducts = products.filter(p => p.isPurchasable).length;

  // Filter products based on active filter
  const filteredProducts = products.filter(product => {
    switch (activeFilter) {
      case 'active':
        return product.isActive;
      case 'inactive':
        return !product.isActive;
      case 'rentable':
        return product.isRentable;
      case 'purchasable':
        return product.isPurchasable;
      default:
        return true;
    }
  });

  // Filter buttons data
  const filterButtons = [
    { key: 'all', icon: 'inventory', label: 'All', value: products.length, color: '#3B82F6', bgColor: '#EEF2FF' },
    { key: 'active', icon: 'checkmark-circle', label: 'Active', value: activeProducts, color: '#10B981', bgColor: '#ECFDF5' },
    { key: 'inactive', icon: 'close-circle', label: 'Inactive', value: inactiveProducts, color: '#EF4444', bgColor: '#FEF2F2' },
    { key: 'rentable', icon: 'trending-up', label: 'Rentable', value: rentableProducts, color: '#F59E0B', bgColor: '#FFFBEB' },
    { key: 'purchasable', icon: 'bag', label: 'Purchasable', value: purchasableProducts, color: '#8B5CF6', bgColor: '#F3E8FF' },
  ];

  return (
    <View style={styles.container}>
      <SkeletonWrapper
        loading={loading}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        skeleton={<ProductSkeleton />}
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
              // TODO: need to setup filter loader
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



        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="inventory" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>
              {activeFilter === 'all' ? 'No Products Found' : `No ${activeFilter} products`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'all'
                ? 'Add your first product to get started'
                : `Try selecting a different filter`
              }
            </Text>
          </View>
        ) : (
          filteredProducts.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.productCard}
              onPress={() => showActionSheet(item)}
              activeOpacity={0.7}
            >
              {/* Product Header */}
              <View style={styles.productHeader}>
                <View style={styles.productInfo}>
                  <View style={styles.avatarContainer}>
                    <MaterialIcons name="inventory" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.productDetails}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productDescription} numberOfLines={1}>
                      {item.description || 'No description available'}
                    </Text>
                  </View>
                </View>
                <View style={styles.statusAndActions}>
                  <View
                    style={[
                      styles.statusBadge,
                      item.isActive ? styles.badgeActive : styles.badgeInactive
                    ]}
                  >
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: item.isActive ? '#10B981' : '#EF4444' }
                    ]} />
                    <Text style={[
                      styles.statusText,
                      { color: item.isActive ? '#047857' : '#DC2626' }
                    ]}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.editButton}>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Product Details */}
              <View style={styles.productMetrics}>
                <View style={styles.featuresRow}>
                  <FeatureBadge
                    icon="checkmark-circle"
                    label="Rentable"
                    isActive={item.isRentable}
                  />
                  <FeatureBadge
                    icon="bag"
                    label="Purchasable"
                    isActive={item.isPurchasable}
                  />
                </View>

                <View style={styles.pricesRow}>
                  <View style={styles.priceBox}>
                    <Text style={styles.priceLabel}>Buy Price</Text>
                    <Text style={styles.priceValue}>{item.price}</Text>
                  </View>
                  <View style={styles.priceBox}>
                    <Text style={styles.priceLabel}>Rent Price</Text>
                    <Text style={styles.priceValue}>{item.rentPrice}</Text>
                  </View>
                  <View style={styles.priceBox}>
                    <Text style={styles.priceLabel}>Deposit</Text>
                    <Text style={styles.priceValue}>{item.deposit}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </SkeletonWrapper>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddProduct}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default ProductScreen;

const FeatureBadge = ({ icon, label, isActive }: {
  icon: string,
  label: string,
  isActive: boolean
}) => (
  <View style={[
    styles.featureBadge,
    isActive ? styles.featureActive : styles.featureInactive
  ]}>
    <Ionicons
      name={icon as any}
      size={12}
      color={isActive ? '#047857' : '#9CA3AF'}
    />
    <Text style={[
      styles.featureText,
      { color: isActive ? '#047857' : '#9CA3AF' }
    ]}>
      {label}
    </Text>
  </View>
);

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
    // backgroundColor:'white',
    // padding:12,
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
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
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
  productCard: {
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
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 24,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
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
  productMetrics: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  featureActive: {
    backgroundColor: '#ECFDF5',
  },
  featureInactive: {
    backgroundColor: '#F8FAFC',
  },
  featureText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    marginLeft: 4,
  },
  pricesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceBox: {
    alignItems: 'center',
    flex: 1,
  },
  priceLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});