import { apiService } from '@/lib/api/api'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'

interface RevenueDetails {
  id: string
  amount: number
  type: string
  status: string
  paymentMethod?: string
  razorpayPaymentId?: string
  razorpayOrderId?: string
  razorpaySubscriptionId?: string
  dueDate?: string
  paidDate?: string
  createdAt?: string
  updatedAt?: string
  customer?: { id: string; name?: string; phone?: string; city?: string; joinedDate?: string } | null
  subscription?: { id: string; planName?: string; monthlyAmount?: number; depositAmount?: number; status?: string } | null
  franchise?: { id: string; name?: string; city?: string; ownerName?: string; ownerPhone?: string } | null
  product?: { id: string; name?: string; description?: string; rentPrice?: number; buyPrice?: number; deposit?: number } | null
}

const formatCurrency = (n?: number) => `₹${(n ?? 0).toLocaleString('en-IN')}`
const formatDate = (d?: string) => {
  if (!d) return 'N/A'
  try { return new Date(d).toLocaleString('en-IN') } catch { return 'N/A' }
}

const RevenueDetailsScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [details, setDetails] = useState<RevenueDetails | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDetails = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await apiService.get(`/payments/admin/revenue/${id}`)
      if (res.success) {
        setDetails((res.data as any)?.revenueDetails || null)
      } else {
        setDetails(null)
      }
    } catch (e) {
      console.log('Failed to fetch revenue details:', e)
      Alert.alert('Error', 'Failed to load payment details')
      setDetails(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDetails() }, [id])

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  if (!details) {
    return (
      <View style={styles.empty}>
        <MaterialIcons name="payments" size={48} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>Payment Not Found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <TouchableWithoutFeedback>
        <View style={{}}>
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.avatar}><Ionicons name="cash" size={18} color="#fff" /></View>
                <View>
                  <Text style={styles.title}>{details.subscription?.planName || details.type || 'Payment'}</Text>
                  <Text style={styles.subTitle}>{(details.status || 'N/A').toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.amount}>{formatCurrency(details.amount)}</Text>
            </View>

            <View style={styles.row}><Text style={styles.label}>Paid</Text><Text style={styles.value}>{formatDate(details.paidDate)}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Due</Text><Text style={styles.value}>{formatDate(details.dueDate)}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Method</Text><Text style={styles.value}>{details.paymentMethod || 'N/A'}</Text></View>
            {details.razorpayPaymentId && <View style={styles.row}><Text style={styles.label}>RZP Payment</Text><Text style={styles.value}>{details.razorpayPaymentId}</Text></View>}
            {details.razorpayOrderId && <View style={styles.row}><Text style={styles.label}>RZP Order</Text><Text style={styles.value}>{details.razorpayOrderId}</Text></View>}
            {details.razorpaySubscriptionId && <View style={styles.row}><Text style={styles.label}>RZP Sub</Text><Text style={styles.value}>{details.razorpaySubscriptionId}</Text></View>}
          </View>

          {/* Customer */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}><Ionicons name="person" size={18} color="#3B82F6" /><Text style={styles.sectionTitle}>Customer</Text></View>
            <View style={styles.row}><Text style={styles.label}>Name</Text><Text style={styles.value}>{details.customer?.name || 'N/A'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Phone</Text><Text style={styles.value}>{details.customer?.phone || 'N/A'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>City</Text><Text style={styles.value}>{details.customer?.city || 'N/A'}</Text></View>
          </View>

          {/* Franchise */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}><Ionicons name="business" size={18} color="#8B5CF6" /><Text style={styles.sectionTitle}>Franchise</Text></View>
            <View style={styles.row}><Text style={styles.label}>Name</Text><Text style={styles.value}>{details.franchise?.name || 'N/A'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>City</Text><Text style={styles.value}>{details.franchise?.city || 'N/A'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Owner</Text><Text style={styles.value}>{details.franchise?.ownerName || 'N/A'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Owner Phone</Text><Text style={styles.value}>{details.franchise?.ownerPhone || 'N/A'}</Text></View>
          </View>

          {/* Subscription */}
          {details.subscription && (
            <View style={styles.card}>
              <View style={styles.sectionHeader}><Ionicons name="albums" size={18} color="#06B6D4" /><Text style={styles.sectionTitle}>Subscription</Text></View>
              <View style={styles.row}><Text style={styles.label}>Plan</Text><Text style={styles.value}>{details.subscription?.planName || 'N/A'}</Text></View>
              <View style={styles.row}><Text style={styles.label}>Monthly</Text><Text style={styles.value}>{formatCurrency(details.subscription?.monthlyAmount)}</Text></View>
              <View style={styles.row}><Text style={styles.label}>Deposit</Text><Text style={styles.value}>{formatCurrency(details.subscription?.depositAmount)}</Text></View>
              <View style={styles.row}><Text style={styles.label}>Status</Text><Text style={styles.value}>{details.subscription?.status || 'N/A'}</Text></View>
            </View>
          )}

          {/* Product */}
          {details.product && (
            <View style={styles.card}>
              <View style={styles.sectionHeader}><Ionicons name="cube" size={18} color="#10B981" /><Text style={styles.sectionTitle}>Product</Text></View>
              <View style={styles.row}><Text style={styles.label}>Name</Text><Text style={styles.value}>{details.product?.name || 'N/A'}</Text></View>
              <View style={styles.row}><Text style={styles.label}>Rent</Text><Text style={styles.value}>{formatCurrency(details.product?.rentPrice)}</Text></View>
              <View style={styles.row}><Text style={styles.label}>Buy</Text><Text style={styles.value}>{formatCurrency(details.product?.buyPrice)}</Text></View>
              <View style={styles.row}><Text style={styles.label}>Deposit</Text><Text style={styles.value}>{formatCurrency(details.product?.deposit)}</Text></View>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </ScrollView>
  )
}

export default RevenueDetailsScreen

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { fontSize: 16, color: '#6B7280', fontFamily: 'Outfit_500Medium' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { marginTop: 8, fontSize: 16, color: '#4B5563', fontFamily: 'Outfit_600SemiBold' },
  backBtn: { marginTop: 16, backgroundColor: '#3B82F6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  backBtnText: { color: '#fff', fontFamily: 'Outfit_600SemiBold' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontFamily: 'Outfit_700Bold', color: '#111827' },
  subTitle: { fontSize: 12, fontFamily: 'Outfit_500Medium', color: '#6B7280' },
  amount: { fontSize: 18, fontFamily: 'Outfit_700Bold', color: '#111827' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  sectionTitle: { fontSize: 14, fontFamily: 'Outfit_600SemiBold', color: '#111827' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  label: { fontSize: 12, color: '#6B7280', fontFamily: 'Outfit_500Medium' },
  value: { fontSize: 13, color: '#111827', fontFamily: 'Outfit_600SemiBold' },
})


