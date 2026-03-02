import { useRouter } from 'expo-router';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { ArrowLeft, Package } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

export default function OrdersScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { mode } = useThemeStore();
    const isDarkMode = mode === 'dark';

    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        if (!user) return;
        try {
            const q = query(
                collection(db, 'orders'),
                where('user_id', '==', user.uid),
                orderBy('created_at', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.card, isDarkMode && styles.darkCard]}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={[styles.orderId, isDarkMode && styles.darkText]}>#{item.id.slice(0, 8).toUpperCase()}</Text>
                    <Text style={[styles.orderDate, isDarkMode && styles.darkTextLight]}>
                        {item.created_at?.toDate ? new Date(item.created_at.toDate()).toLocaleDateString() : 'N/A'}
                    </Text>
                </View>
                <View style={[styles.statusBadge, {
                    backgroundColor: item.status === 'delivered' ? (isDarkMode ? '#1B5E20' : '#E8F5E9') :
                        item.status === 'processing' ? (isDarkMode ? '#E65100' : '#FFF3E0') : (isDarkMode ? '#0D47A1' : '#E3F2FD')
                }]}>
                    <Text style={[styles.statusText, {
                        color: item.status === 'delivered' ? (isDarkMode ? '#A5D6A7' : '#2E7D32') :
                            item.status === 'processing' ? (isDarkMode ? '#FFCC80' : '#EF6C00') : (isDarkMode ? '#90CAF9' : '#1565C0')
                    }]}>
                        {item.status || 'Pending'}
                    </Text>
                </View>
            </View>

            <View style={[styles.divider, isDarkMode && styles.darkDivider]} />

            <View style={styles.itemsList}>
                {item.items && JSON.parse(item.items).map((prod: any, index: number) => (
                    <Text key={index} style={[styles.itemText, isDarkMode && styles.darkText]}>
                        {prod.quantity}x {prod.name}
                    </Text>
                ))}
            </View>

            <View style={[styles.divider, isDarkMode && styles.darkDivider]} />

            <View style={styles.cardFooter}>
                <Text style={[styles.totalLabel, isDarkMode && styles.darkTextLight]}>Total Amount</Text>
                <Text style={[styles.totalAmount, isDarkMode && styles.darkText]}>₹{item.total_amount}</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.center, isDarkMode && styles.darkContainer]}>
                <ActivityIndicator size="large" color={isDarkMode ? '#FFF' : Colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
            <View style={[styles.header, isDarkMode && styles.darkHeader]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={isDarkMode ? '#FFF' : Colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>My Orders</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={orders}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Package size={48} color={isDarkMode ? '#666' : Colors.textLight} />
                        <Text style={[styles.emptyText, isDarkMode && styles.darkTextLight]}>No orders yet.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    darkContainer: {
        backgroundColor: '#121212',
    },
    darkHeader: {
        borderBottomColor: '#333333',
    },
    darkText: {
        color: '#FFFFFF',
    },
    darkTextLight: {
        color: '#AAAAAA',
    },
    darkCard: {
        backgroundColor: '#1E1E1E',
        borderColor: '#333333',
    },
    darkDivider: {
        backgroundColor: '#333333',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.lightGray,
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
    list: { padding: 20 },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.lightGray,
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    orderId: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
    orderDate: { fontSize: 14, color: Colors.textLight, marginTop: 2 },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusText: { fontSize: 12, fontWeight: '600' },
    divider: { height: 1, backgroundColor: Colors.lightGray, marginVertical: 12 },
    itemsList: { gap: 4 },
    itemText: { fontSize: 14, color: Colors.text },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: { fontSize: 14, color: Colors.textLight },
    totalAmount: { fontSize: 16, fontWeight: 'bold', color: Colors.primary },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100, gap: 16 },
    emptyText: { fontSize: 16, color: Colors.textLight },
});
