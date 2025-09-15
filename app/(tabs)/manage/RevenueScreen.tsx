import { apiService } from '@/lib/api/api'
import SkeletonWrapper from '@/lib/components/skeltons/SkeltonScrollRefreshWrapper'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type PaymentStatus = 'completed' | 'pending' | 'failed' | 'refunded' | string

interface RevenueItem {
  id: string
  amount: number
  type: string
  status: PaymentStatus
  paymentMethod?: string
  razorpayPaymentId?: string
  paidDate?: string
  dueDate?: string
  createdAt?: string
  customer?: { id: string; name: string; phone: string; city?: string } | null
  subscription?: { id: string; planName?: string; monthlyAmount?: number } | null
  franchise?: { id: string; name?: string; city?: string } | null
}

const PAGE_LIMIT = 20

const RevenueScreen = () => {
  const [items, setItems] = useState<RevenueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [activeStatus, setActiveStatus] = useState<'all' | PaymentStatus>('all')

  const formatCurrency = (amount?: number) => `₹${(amount ?? 0).toLocaleString('en-IN')}`
  const formatDate = (date?: string) => {
    if (!date) return 'N/A'
    try {
      return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
      return 'N/A'
    }
  }

  const fetchRevenue = async (append = false, startOffset = 0) => {
    try {
      if (!append) setLoading(true)
      const params = new URLSearchParams()
      params.append('limit', String(PAGE_LIMIT))
      params.append('offset', String(startOffset))
      if (activeStatus !== 'all') params.append('status', activeStatus)

      const res = await apiService.get(`/payments/admin/revenue?${params.toString()}`)
      if (!res.success) {
        setItems([])
        setHasMore(false)
        return
      }
      const list: RevenueItem[] = (res.data as any)?.revenueList || []
      const totalCount: number = (res.data as any)?.totalCount || 0
      setItems(prev => (append ? [...prev, ...list] : list))
      setHasMore(startOffset + PAGE_LIMIT < totalCount)
      setOffset(startOffset)
    } catch (e) {
      console.log('Failed to fetch revenue:', e)
      Alert.alert('Error', 'Failed to load revenue list')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchRevenue(false, 0)
  }, [activeStatus])

  const onRefresh = () => {
    setRefreshing(true)
    fetchRevenue(false, 0)
  }

  const loadMore = () => {
    if (!hasMore) return
    const next = offset + PAGE_LIMIT
    fetchRevenue(true, next)
  }

  const statusChips: { key: 'all' | PaymentStatus; label: string; color: string; bg: string }[] = [
    { key: 'all', label: 'All', color: '#3B82F6', bg: '#EEF2FF' },
    { key: 'completed', label: 'Completed', color: '#10B981', bg: '#ECFDF5' },
    { key: 'pending', label: 'Pending', color: '#F59E0B', bg: '#FFFBEB' },
    { key: 'failed', label: 'Failed', color: '#EF4444', bg: '#FEF2F2' },
  ]

  const getStatusStyle = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'completed':
        return { bg: '#ECFDF5', color: '#047857' }
      case 'pending':
        return { bg: '#FFFBEB', color: '#92400E' }
      case 'failed':
      case 'cancelled':
        return { bg: '#FEF2F2', color: '#DC2626' }
      default:
        return { bg: '#F3F4F6', color: '#6B7280' }
    }
  }

  return (
    <View style={styles.container}>
      <SkeletonWrapper
        loading={loading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        skeleton={<View style={styles.skeleton} />}
        style={styles.scrollContent}
      >
        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
          {statusChips.map(chip => (
            <TouchableOpacity
              key={chip.key}
              style={[styles.chip, { backgroundColor: chip.bg }, activeStatus === chip.key && [styles.chipActive, { borderColor: chip.color }]]}
              onPress={() => setActiveStatus(chip.key)}
            >
              <Text style={[styles.chipText, activeStatus === chip.key && { color: chip.color }]}>{chip.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="payments" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Revenue Found</Text>
            <Text style={styles.emptySubtitle}>Try changing filters or date range</Text>
          </View>
        ) : (
          items.map((it) => {
            const st = getStatusStyle(it.status)
            return (
              <TouchableOpacity key={it.id} style={styles.card} activeOpacity={0.7} onPress={() => router.push(`/revenue/${it.id}`)}>
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <View style={styles.avatar}><Ionicons name="cash" size={18} color="#fff" /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.title}>{it.subscription?.planName || it.type || 'Payment'}</Text>
                      <Text style={styles.subtitle} numberOfLines={1}>{it.franchise?.name || it.customer?.name || '—'}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.statusText, { color: st.color }]}>{(it.status || 'N/A').toString().toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Amount</Text>
                  <Text style={styles.value}>{formatCurrency(it.amount)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Paid</Text>
                  <Text style={styles.value}>{formatDate(it.paidDate)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Method</Text>
                  <Text style={styles.value}>{it.paymentMethod || 'N/A'}</Text>
                </View>
              </TouchableOpacity>
            )
          })
        )}

        {hasMore && (
          <TouchableOpacity style={styles.loadMore} onPress={loadMore}>
            <Text style={styles.loadMoreText}>Load More</Text>
          </TouchableOpacity>
        )}
      </SkeletonWrapper>
    </View>
  )
}

export default RevenueScreen

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  skeleton: { height: 80, backgroundColor: '#E5E7EB', borderRadius: 12, marginBottom: 12 },
  filterScroll: { marginBottom: 12 },
  filterContainer: { gap: 8, paddingRight: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  chipActive: { transform: [{ scale: 1.02 }] },
  chipText: { fontSize: 12, color: '#111827', fontFamily: 'Outfit_600SemiBold' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontFamily: 'Outfit_600SemiBold', color: '#4B5563', marginTop: 12 },
  emptySubtitle: { fontSize: 14, fontFamily: 'Outfit_400Regular', color: '#9CA3AF' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontFamily: 'Outfit_600SemiBold', color: '#111827' },
  subtitle: { fontSize: 12, fontFamily: 'Outfit_400Regular', color: '#6B7280' },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12 },
  statusText: { fontSize: 10, fontFamily: 'Outfit_600SemiBold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  label: { fontSize: 12, color: '#6B7280', fontFamily: 'Outfit_500Medium' },
  value: { fontSize: 13, color: '#111827', fontFamily: 'Outfit_600SemiBold' },
  loadMore: { alignItems: 'center', justifyContent: 'center', padding: 12 },
  loadMoreText: { color: '#3B82F6', fontFamily: 'Outfit_600SemiBold' },
})


