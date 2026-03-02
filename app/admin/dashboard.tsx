import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { ArrowLeft, DollarSign, ShoppingBag, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { db } from '../../lib/firebase';

import { useThemeStore } from '../../store/themeStore';

export default function AdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        revenue: 0,
        orders: 0,
        users: 0,
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [usersList, setUsersList] = useState<any[]>([]);
    const [filter, setFilter] = useState<'processing' | 'all'>('processing');
    const [activeTab, setActiveTab] = useState<'orders' | 'users'>('orders');
    const { mode } = useThemeStore();
    const isDarkMode = mode === 'dark';

    const fetchDashboardData = async () => {
        try {
            // Fetch Orders
            const ordersQuery = query(
                collection(db, 'orders'),
                orderBy('created_at', 'desc')
            );
            const ordersSnapshot = await getDocs(ordersQuery);
            const orders = ordersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            // Fetch Users from the users collection
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const users = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            // Calculate Stats
            const totalRevenue = orders.reduce((sum, order: any) => sum + (order.total_amount || 0), 0);
            const totalOrders = orders.length;
            const uniqueUsersCount = users.length;

            setStats({
                revenue: totalRevenue,
                orders: totalOrders,
                users: uniqueUsersCount,
            });

            setRecentOrders(orders);
            setUsersList(users);

        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (timestamp: any) => {
        let date: Date;
        if (timestamp?.toDate) {
            date = timestamp.toDate();
        } else if (timestamp) {
            date = new Date(timestamp);
        } else {
            return 'N/A';
        }

        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 172800) return `${Math.floor(diffInSeconds / 3600)}h ago`;

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, 'orders', orderId), { status: newStatus });

            // Update local state
            setRecentOrders(prev => prev.map(order =>
                order.id === orderId ? { ...order, status: newStatus } : order
            ));

            fetchDashboardData();

        } catch (error) {
            console.error('Error updating order status:', error);
            Alert.alert('Error', 'Failed to update order status');
        }
    };

    const deleteUser = async (userId: string) => {
        Alert.alert(
            "Delete User",
            "Are you sure you want to delete this user's data? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Delete user document from Firestore
                            await deleteDoc(doc(db, 'users', userId));

                            // Remove from local state
                            setUsersList(prev => prev.filter(u => u.id !== userId));
                            setStats(prev => ({ ...prev, users: prev.users - 1 }));
                            Alert.alert("Success", "User data deleted successfully");
                        } catch (err: any) {
                            Alert.alert("Error", err.message || "Failed to delete user");
                        }
                    }
                }
            ]
        );
    };

    const renderUser = ({ item }: { item: any }) => (
        <View style={[styles.orderCard, isDarkMode && styles.darkCard]}>
            <View style={styles.orderHeader}>
                <View style={[styles.orderIdContainer, { flex: 1 }]}>
                    <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#333' : '#F3E5F5' }]}>
                        <Users size={18} color={isDarkMode ? '#FFF' : '#7B1FA2'} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.orderId, isDarkMode && styles.darkText]} numberOfLines={1}>
                            {item.email}
                        </Text>
                        <Text style={[styles.orderTime, isDarkMode && styles.darkTextLight]}>
                            {item.full_name || 'No name'}
                        </Text>
                        <Text style={[styles.orderTime, isDarkMode && styles.darkTextLight]}>
                            {formatDate(item.created_at)}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => deleteUser(item.id)} style={styles.deleteUserBtn}>
                    <Text style={styles.deleteUserText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderOrder = ({ item }: { item: any }) => (
        <View style={[styles.orderCard, isDarkMode && styles.darkCard]}>
            <View style={styles.orderHeader}>
                <View style={styles.orderIdContainer}>
                    <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#333' : '#F5F5F5' }]}>
                        <ShoppingBag size={18} color={isDarkMode ? '#FFF' : '#333'} />
                    </View>
                    <View>
                        <Text style={[styles.orderId, isDarkMode && styles.darkText]}>Order #{item.id.slice(0, 6).toUpperCase()}</Text>
                        <Text style={[styles.orderTime, isDarkMode && styles.darkTextLight]}>{formatDate(item.created_at)}</Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, {
                    backgroundColor: item.status === 'delivered' ? (isDarkMode ? 'rgba(46, 125, 50, 0.2)' : '#E8F5E9') :
                        item.status === 'processing' ? (isDarkMode ? 'rgba(239, 108, 0, 0.2)' : '#FFF3E0') :
                            item.status === 'cancelled' ? (isDarkMode ? 'rgba(198, 40, 40, 0.2)' : '#FFEBEE') : (isDarkMode ? 'rgba(21, 101, 192, 0.2)' : '#E3F2FD')
                }]}>
                    <Text style={[styles.statusText, {
                        color: item.status === 'delivered' ? (isDarkMode ? '#81C784' : '#2E7D32') :
                            item.status === 'processing' ? (isDarkMode ? '#FFB74D' : '#EF6C00') :
                                item.status === 'cancelled' ? (isDarkMode ? '#E57373' : '#C62828') : (isDarkMode ? '#64B5F6' : '#1565C0')
                    }]}>{item.status || 'Pending'}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.orderDetails}>
                <Text style={[styles.detailLabel, isDarkMode && styles.darkTextLight]}>Customer</Text>
                <Text style={[styles.detailValue, isDarkMode && styles.darkText]}>{item.user_email}</Text>
            </View>

            <View style={styles.orderDetails}>
                <Text style={[styles.detailLabel, isDarkMode && styles.darkTextLight]}>Items</Text>
                <Text style={[styles.detailValue, isDarkMode && styles.darkText]} numberOfLines={1}>
                    {item.items ? JSON.parse(item.items).map((i: any) => `${i.quantity}x ${i.name}`).join(', ') : 'No items'}
                </Text>
            </View>

            <View style={styles.orderDetails}>
                <Text style={[styles.detailLabel, isDarkMode && styles.darkTextLight]}>Payment</Text>
                <Text style={[styles.detailValue, isDarkMode && styles.darkText]}>{item.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</Text>
            </View>

            <View style={[styles.totalContainer, isDarkMode && styles.darkBorder]}>
                <Text style={[styles.totalLabel, isDarkMode && styles.darkText]}>Total Amount</Text>
                <Text style={[styles.totalValue, isDarkMode && styles.darkText]}>{formatCurrency(item.total_amount)}</Text>
            </View>

            {/* Admin Actions */}
            {item.status === 'processing' && (
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.cancelBtn]}
                        onPress={() => updateOrderStatus(item.id, 'cancelled')}
                    >
                        <Text style={[styles.actionBtnText, styles.cancelBtnText]}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.deliverBtn]}
                        onPress={() => updateOrderStatus(item.id, 'delivered')}
                    >
                        <Text style={styles.actionBtnText}>
                            Mark Delivered
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
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
        <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]} edges={['top']}>
            <View style={[styles.header, isDarkMode && styles.darkHeader]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={isDarkMode ? '#FFF' : '#000'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>Dashboard</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDarkMode ? '#FFF' : undefined} />}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Stats Section */}
                <View style={styles.statsContainer}>
                    <Text style={[styles.sectionHeading, isDarkMode && styles.darkText]}>Overview</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
                        <View style={[styles.statCard, isDarkMode && styles.darkCard]}>
                            <View style={styles.statIconContainer}>
                                <View style={[styles.statIconBg, { backgroundColor: '#E8F5E9' }]}>
                                    <DollarSign size={22} color="#2E7D32" />
                                </View>
                            </View>
                            <View>
                                <Text style={[styles.statLabel, isDarkMode && styles.darkTextLight]}>Total Revenue</Text>
                                <Text style={[styles.statValue, isDarkMode && styles.darkText]}>{formatCurrency(stats.revenue)}</Text>
                            </View>
                        </View>

                        <View style={[styles.statCard, isDarkMode && styles.darkCard]}>
                            <View style={styles.statIconContainer}>
                                <View style={[styles.statIconBg, { backgroundColor: '#E3F2FD' }]}>
                                    <ShoppingBag size={22} color="#1565C0" />
                                </View>
                            </View>
                            <View>
                                <Text style={[styles.statLabel, isDarkMode && styles.darkTextLight]}>Total Orders</Text>
                                <Text style={[styles.statValue, isDarkMode && styles.darkText]}>{stats.orders}</Text>
                            </View>
                        </View>

                        <View style={[styles.statCard, isDarkMode && styles.darkCard]}>
                            <View style={styles.statIconContainer}>
                                <View style={[styles.statIconBg, { backgroundColor: '#F3E5F5' }]}>
                                    <Users size={22} color="#7B1FA2" />
                                </View>
                            </View>
                            <View>
                                <Text style={[styles.statLabel, isDarkMode && styles.darkTextLight]}>Active Users</Text>
                                <Text style={[styles.statValue, isDarkMode && styles.darkText]}>{stats.users}</Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>

                {/* Orders Section */}
                <View style={styles.ordersSection}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.tabContainer}>
                            <TouchableOpacity onPress={() => setActiveTab('orders')} style={[styles.mainTab, activeTab === 'orders' && styles.activeMainTab]}>
                                <Text style={[styles.mainTabText, activeTab === 'orders' && styles.activeMainTabText, isDarkMode && !activeTab && styles.darkText]}>Orders</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setActiveTab('users')} style={[styles.mainTab, activeTab === 'users' && styles.activeMainTab]}>
                                <Text style={[styles.mainTabText, activeTab === 'users' && styles.activeMainTabText, isDarkMode && !activeTab && styles.darkText]}>Users</Text>
                            </TouchableOpacity>
                        </View>

                        {activeTab === 'orders' && (
                            <View style={[styles.filterContainer, isDarkMode && styles.darkFilterContainer]}>
                                <TouchableOpacity
                                    onPress={() => setFilter('processing')}
                                    style={[styles.filterTab, filter === 'processing' && styles.activeFilterTab]}
                                >
                                    <Text style={[
                                        styles.filterText,
                                        isDarkMode && styles.darkTextLight,
                                        filter === 'processing' && styles.activeFilterText
                                    ]}>Pending</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setFilter('all')}
                                    style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
                                >
                                    <Text style={[
                                        styles.filterText,
                                        isDarkMode && styles.darkTextLight,
                                        filter === 'all' && styles.activeFilterText
                                    ]}>All</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {activeTab === 'orders' ? (
                        recentOrders.filter(order => filter === 'all' ? true : (order.status === 'processing' || !order.status)).length === 0 ? (
                            <View style={styles.emptyState}>
                                <ShoppingBag size={48} color={isDarkMode ? '#333' : '#E0E0E0'} />
                                <Text style={[styles.emptyText, isDarkMode && styles.darkTextLight]}>No orders found</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={recentOrders.filter(order => filter === 'all' ? true : (order.status === 'processing' || !order.status))}
                                renderItem={renderOrder}
                                keyExtractor={item => item.id}
                                scrollEnabled={false}
                                contentContainerStyle={styles.ordersList}
                            />
                        )
                    ) : (
                        usersList.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Users size={48} color={isDarkMode ? '#333' : '#E0E0E0'} />
                                <Text style={[styles.emptyText, isDarkMode && styles.darkTextLight]}>No users found</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={usersList}
                                renderItem={renderUser}
                                keyExtractor={item => item.id}
                                scrollEnabled={false}
                                contentContainerStyle={styles.ordersList}
                            />
                        )
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    darkContainer: {
        backgroundColor: '#121212',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#F7F7F7',
    },
    darkHeader: {
        backgroundColor: '#121212',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statsContainer: {
        marginBottom: 24,
    },
    statsScroll: {
        paddingHorizontal: 20,
        gap: 16,
    },
    sectionHeading: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
        marginLeft: 20,
        marginBottom: 16,
    },
    statCard: {
        width: 160,
        padding: 16,
        backgroundColor: '#FFF',
        borderRadius: 20,
        marginRight: 0,
    },
    statIconContainer: {
        marginBottom: 16,
    },
    statIconBg: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    ordersSection: {
        paddingHorizontal: 20,
    },

    filterContainer: {
        flexDirection: 'row',
        backgroundColor: '#EDEFF2',
        borderRadius: 12,
        padding: 4,
    },
    darkFilterContainer: {
        backgroundColor: '#1E1E1E',
    },
    filterTab: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    activeFilterTab: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    filterText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    activeFilterText: {
        color: '#000',
        fontWeight: '600',
    },
    ordersList: {
        gap: 20,
    },
    orderCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'column',
        gap: 12,
        marginBottom: 16,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#E0E0E0',
        borderRadius: 12,
        padding: 4,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    mainTab: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 10,
    },
    activeMainTab: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    mainTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    activeMainTabText: {
        color: '#000',
    },
    orderIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderId: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
        marginBottom: 2,
    },
    orderTime: {
        fontSize: 12,
        color: '#888',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 12,
    },
    orderDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#888',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: '#000',
        fontWeight: '500',
        maxWidth: '60%',
        textAlign: 'right',
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.primary,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    actionBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: '#FFEBEE',
    },
    deliverBtn: {
        backgroundColor: '#000',
    },
    actionBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    cancelBtnText: {
        color: '#D32F2F',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        marginTop: 12,
        color: '#888',
        fontSize: 16,
    },
    darkText: {
        color: '#FFF',
    },
    darkTextLight: {
        color: '#AAA',
    },
    darkCard: {
        backgroundColor: '#1E1E1E',
    },
    darkBorder: {
        borderTopColor: '#333',
    },
    deleteUserBtn: {
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    deleteUserText: {
        color: '#D32F2F',
        fontSize: 12,
        fontWeight: '600',
    },
});
