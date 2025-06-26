import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const ProductSkeleton = () => {
  return (
    <View style={styles.wrapper}>
      {[...Array(3)].map((_, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.title} />
            <View style={styles.status} />
          </View>
          <View style={styles.description} />
          <View style={styles.footerRow}>
            <View style={styles.footerItem} />
            <View style={styles.footerItem} />
          </View>
        </View>
      ))}
    </View>
  );
};

export default ProductSkeleton;

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    width: '60%',
    height: 20,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  status: {
    width: 60,
    height: 20,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  description: {
    width: '100%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerItem: {
    width: '45%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
});