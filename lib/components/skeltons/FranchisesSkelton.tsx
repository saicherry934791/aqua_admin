import React from 'react';
import { View, StyleSheet } from 'react-native';

const FranchiseSkeleton = () => {
  return (
    <>
      {/* Stats Skeleton */}
      <View style={styles.statsContainer}>
        {[1, 2, 3].map((_, index) => (
          <View key={index} style={styles.statCard}>
            <View style={styles.skeletonNumber} />
            <View style={styles.skeletonLabel} />
          </View>
        ))}
      </View>

      {/* Card Skeletons */}
      {[1, 2, 3, 4, 5].map((_, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardInfo}>
              <View style={styles.skeletonTitle} />
              <View style={styles.skeletonSubtitle} />
            </View>
            <View style={[styles.statusBadge, styles.skeletonBadge]} />
          </View>
          <View style={styles.cardDetails}>
            <View style={styles.skeletonLine} />
            <View style={styles.skeletonLine} />
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.skeletonFooter} />
            <View style={styles.skeletonFooter} />
          </View>
        </View>
      ))}
    </>
  );
};

export default FranchiseSkeleton;

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
    paddingHorizontal: 4,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  skeletonNumber: {
    width: 50,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonLabel: {
    width: 70,
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  skeletonTitle: {
    width: '70%',
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonSubtitle: {
    width: '50%',
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonBadge: {
    width: 60,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
  },
  cardDetails: {
    marginTop: 8,
    marginBottom: 8,
  },
  skeletonLine: {
    width: '100%',
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonFooter: {
    width: '45%',
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
});
