import { useRouter } from 'expo-router';
import { ArrowLeft, DollarSign, Package, Plus, Shield, ShieldOff, ShoppingBag, Trash2, Users, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, FlatList, Modal, RefreshControl, ScrollView,
    StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import {
    addProduct, deleteProduct as deleteProductDb, deleteUser as deleteUserDb,
    getAllOrders, getAllProducts, getAllUsers, toggleAdmin,
    updateOrderStatus as updateOrderStatusDb,
} from '../../lib/db';
import { useThemeStore } from '../../store/themeStore';

const CATEGORIES = ['Skincare', 'Fragrance', 'Makeup', 'Hair', 'Body Care', 'Cleanser', 'Masks'];

export default function AdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ revenue: 0, orders: 0, users: 0, products: 0 });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [usersList, setUsersList] = useState<any[]>([]);
    const [productsList, setProductsList] = useState<any[]>([]);
    const [filter, setFilter] = useState<'processing' | 'all'>('processing');
    const [activeTab, setActiveTab] = useState<'orders' | 'users' | 'products'>('orders');
    const { mode } = useThemeStore();
    const isDarkMode = mode === 'dark';

    // Add Product Modal State
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [productForm, setProductForm] = useState({
        name: '', brand: '', price: '', category: CATEGORIES[0],
        description: '', image_url: '', rating: '4.5',
    });
    const [productErrors, setProductErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const fetchDashboardData = async () => {
        try {
            const [orders, users, products] = await Promise.all([
                getAllOrders(),
                getAllUsers(),
                getAllProducts(),
            ]);

            const totalRevenue = orders.reduce((sum, order: any) => sum + (order.total_amount || 0), 0);

            setStats({
                revenue: totalRevenue,
                orders: orders.length,
                users: users.length,
                products: products.length,
            });

            setRecentOrders(orders);
            setUsersList(users);
            setProductsList(products);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchDashboardData(); }, []);

    const onRefresh = () => { setRefreshing(true); fetchDashboardData(); };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

    const formatDate = (timestamp: any) => {
        let date: Date;
        if (timestamp?.toDate) date = timestamp.toDate();
        else if (timestamp) date = new Date(timestamp);
        else return 'N/A';

        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 172800) return `${Math.floor(diff / 3600)}h ago`;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    // ============================
    // Order Actions
    // ============================

    const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            await updateOrderStatusDb(orderId, newStatus);
            setRecentOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (error) {
            Alert.alert('Error', 'Failed to update order status');
        }
    };

    // ============================
    // User Actions
    // ============================

    const handleDeleteUser = (userId: string) => {
        Alert.alert('Delete User', "This will permanently delete this user's data.", [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await deleteUserDb(userId);
                        setUsersList(prev => prev.filter(u => u.uid !== userId));
                        setStats(prev => ({ ...prev, users: prev.users - 1 }));
                    } catch (err: any) {
                        Alert.alert('Error', err.message || 'Failed to delete user');
                    }
                }
            }
        ]);
    };

    const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
        const action = currentIsAdmin ? 'remove admin rights from' : 'grant admin rights to';
        Alert.alert('Change Role', `Are you sure you want to ${action} this user?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Confirm', onPress: async () => {
                    try {
                        await toggleAdmin(userId, !currentIsAdmin);
                        setUsersList(prev => prev.map(u =>
                            u.uid === userId ? { ...u, isAdmin: !currentIsAdmin } : u
                        ));
                    } catch (err: any) {
                        Alert.alert('Error', err.message || 'Failed to change role');
                    }
                }
            }
        ]);
    };

    // ============================
    // Product Actions
    // ============================

    const validateProduct = () => {
        const errors: Record<string, string> = {};
        if (!productForm.name.trim()) errors.name = 'Product name is required';
        if (!productForm.brand.trim()) errors.brand = 'Brand is required';
        if (!productForm.price.trim() || isNaN(Number(productForm.price)) || Number(productForm.price) <= 0)
            errors.price = 'Enter a valid price';
        if (!productForm.description.trim()) errors.description = 'Description is required';
        if (!productForm.image_url.trim()) errors.image_url = 'Image URL is required';
        setProductErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddProduct = async () => {
        if (!validateProduct()) return;
        setSaving(true);
        try {
            const docRef = await addProduct({
                name: productForm.name.trim(),
                brand: productForm.brand.trim(),
                price: Number(productForm.price),
                category: productForm.category,
                description: productForm.description.trim(),
                image_url: productForm.image_url.trim(),
                rating: Number(productForm.rating) || 4.5,
            });
            setProductsList(prev => [{
                id: docRef.id,
                ...productForm,
                price: Number(productForm.price),
                rating: Number(productForm.rating) || 4.5,
                reviews: 0,
            }, ...prev]);
            setStats(prev => ({ ...prev, products: prev.products + 1 }));
            setProductForm({ name: '', brand: '', price: '', category: CATEGORIES[0], description: '', image_url: '', rating: '4.5' });
            setProductErrors({});
            setShowAddProduct(false);
            Alert.alert('Success', 'Product added successfully!');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to add product');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProduct = (productId: string, productName: string) => {
        Alert.alert('Delete Product', `Delete "${productName}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await deleteProductDb(productId);
                        setProductsList(prev => prev.filter(p => p.id !== productId));
                        setStats(prev => ({ ...prev, products: prev.products - 1 }));
                    } catch (err: any) {
                        Alert.alert('Error', err.message);
                    }
                }
            }
        ]);
    };

    // ============================
    // Render Functions
    // ============================

    const renderUser = ({ item }: { item: any }) => (
        <View style={[styles.card, isDarkMode && styles.darkCard]}>
            <View style={styles.cardHeader}>
                <View style={[styles.cardHeaderLeft, { flex: 1 }]}>
                    <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#333' : '#F3E5F5' }]}>
                        <Users size={18} color={isDarkMode ? '#FFF' : '#7B1FA2'} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.cardTitle, isDarkMode && styles.darkText]} numberOfLines={1}>
                                {item.full_name || 'No name'}
                            </Text>
                            {item.isAdmin && (
                                <View style={styles.adminBadge}>
                                    <Text style={styles.adminBadgeText}>ADMIN</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.cardSubtitle, isDarkMode && styles.darkTextLight]} numberOfLines={1}>
                            {item.email}
                        </Text>
                        <Text style={[styles.cardMeta, isDarkMode && styles.darkTextLight]}>
                            Joined {formatDate(item.created_at)}
                        </Text>
                    </View>
                </View>
            </View>
            <View style={styles.cardActions}>
                <TouchableOpacity
                    style={[styles.actionChip, item.isAdmin ? styles.removeAdminChip : styles.makeAdminChip]}
                    onPress={() => handleToggleAdmin(item.uid, item.isAdmin)}
                >
                    {item.isAdmin ? (
                        <ShieldOff size={14} color="#C62828" />
                    ) : (
                        <Shield size={14} color="#1565C0" />
                    )}
                    <Text style={[styles.actionChipText, item.isAdmin ? styles.removeAdminText : styles.makeAdminText]}>
                        {item.isAdmin ? 'Remove Admin' : 'Make Admin'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionChip, styles.deleteChip]}
                    onPress={() => handleDeleteUser(item.uid)}
                >
                    <Trash2 size={14} color="#C62828" />
                    <Text style={[styles.actionChipText, styles.deleteChipText]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderOrder = ({ item }: { item: any }) => (
        <View style={[styles.card, isDarkMode && styles.darkCard]}>
            <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                    <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#333' : '#F5F5F5' }]}>
                        <ShoppingBag size={18} color={isDarkMode ? '#FFF' : '#333'} />
                    </View>
                    <View>
                        <Text style={[styles.cardTitle, isDarkMode && styles.darkText]}>Order #{item.id.slice(0, 6).toUpperCase()}</Text>
                        <Text style={[styles.cardMeta, isDarkMode && styles.darkTextLight]}>{formatDate(item.created_at)}</Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, {
                    backgroundColor: item.status === 'delivered' ? (isDarkMode ? 'rgba(46,125,50,0.2)' : '#E8F5E9') :
                        item.status === 'cancelled' ? (isDarkMode ? 'rgba(198,40,40,0.2)' : '#FFEBEE') :
                            (isDarkMode ? 'rgba(239,108,0,0.2)' : '#FFF3E0')
                }]}>
                    <Text style={[styles.statusText, {
                        color: item.status === 'delivered' ? (isDarkMode ? '#81C784' : '#2E7D32') :
                            item.status === 'cancelled' ? (isDarkMode ? '#E57373' : '#C62828') :
                                (isDarkMode ? '#FFB74D' : '#EF6C00')
                    }]}>{item.status || 'Pending'}</Text>
                </View>
            </View>

            <View style={[styles.divider, isDarkMode && styles.darkDivider]} />

            <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, isDarkMode && styles.darkTextLight]}>Customer</Text>
                <Text style={[styles.detailValue, isDarkMode && styles.darkText]}>{item.user_email}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, isDarkMode && styles.darkTextLight]}>Items</Text>
                <Text style={[styles.detailValue, isDarkMode && styles.darkText]} numberOfLines={1}>
                    {item.items ? JSON.parse(item.items).map((i: any) => `${i.quantity}x ${i.name}`).join(', ') : 'N/A'}
                </Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, isDarkMode && styles.darkTextLight]}>Payment</Text>
                <Text style={[styles.detailValue, isDarkMode && styles.darkText]}>{item.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</Text>
            </View>

            <View style={[styles.totalRow, isDarkMode && styles.darkDivider]}>
                <Text style={[styles.totalLabel, isDarkMode && styles.darkText]}>Total</Text>
                <Text style={[styles.totalValue, isDarkMode && styles.darkText]}>{formatCurrency(item.total_amount)}</Text>
            </View>

            {item.status === 'processing' && (
                <View style={styles.orderActions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.rejectBtn]}
                        onPress={() => handleUpdateOrderStatus(item.id, 'cancelled')}
                    >
                        <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.deliverBtn]}
                        onPress={() => handleUpdateOrderStatus(item.id, 'delivered')}
                    >
                        <Text style={styles.deliverBtnText}>Mark Delivered</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const renderProduct = ({ item }: { item: any }) => (
        <View style={[styles.card, isDarkMode && styles.darkCard]}>
            <View style={styles.cardHeader}>
                <View style={[styles.cardHeaderLeft, { flex: 1 }]}>
                    <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#333' : '#FFF3E0' }]}>
                        <Package size={18} color={isDarkMode ? '#FFF' : '#EF6C00'} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, isDarkMode && styles.darkText]} numberOfLines={1}>{item.name}</Text>
                        <Text style={[styles.cardSubtitle, isDarkMode && styles.darkTextLight]}>{item.brand}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                            <Text style={[styles.cardMeta, { fontWeight: 'bold', color: Colors.primary }]}>
                                ₹{item.price}
                            </Text>
                            <View style={[styles.categoryTag, isDarkMode && { backgroundColor: '#333' }]}>
                                <Text style={[styles.categoryTagText, isDarkMode && { color: '#AAA' }]}>{item.category}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={() => handleDeleteProduct(item.id, item.name)}
                    style={styles.deleteIconBtn}
                >
                    <Trash2 size={18} color={Colors.error} />
                </TouchableOpacity>
            </View>
        </View>
    );

    // ============================
    // Main Render
    // ============================

    if (loading) {
        return (
            <View style={[styles.container, styles.center, isDarkMode && styles.darkContainer]}>
                <ActivityIndicator size="large" color={isDarkMode ? '#FFF' : Colors.primary} />
            </View>
        );
    }

    const filteredOrders = recentOrders.filter(order =>
        filter === 'all' ? true : (order.status === 'processing' || !order.status)
    );

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]} edges={['top']}>
            <View style={[styles.header, isDarkMode && styles.darkHeader]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={isDarkMode ? '#FFF' : '#000'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>Admin Dashboard</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDarkMode ? '#FFF' : undefined} />}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Stats Cards */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
                    {[
                        { label: 'Revenue', value: formatCurrency(stats.revenue), icon: DollarSign, iconColor: '#2E7D32', bg: '#E8F5E9' },
                        { label: 'Orders', value: stats.orders, icon: ShoppingBag, iconColor: '#1565C0', bg: '#E3F2FD' },
                        { label: 'Users', value: stats.users, icon: Users, iconColor: '#7B1FA2', bg: '#F3E5F5' },
                        { label: 'Products', value: stats.products, icon: Package, iconColor: '#EF6C00', bg: '#FFF3E0' },
                    ].map((stat, i) => (
                        <View key={i} style={[styles.statCard, isDarkMode && styles.darkCard]}>
                            <View style={[styles.statIconBg, { backgroundColor: isDarkMode ? '#333' : stat.bg }]}>
                                <stat.icon size={20} color={isDarkMode ? '#FFF' : stat.iconColor} />
                            </View>
                            <Text style={[styles.statLabel, isDarkMode && styles.darkTextLight]}>{stat.label}</Text>
                            <Text style={[styles.statValue, isDarkMode && styles.darkText]}>{stat.value}</Text>
                        </View>
                    ))}
                </ScrollView>

                {/* Tabs */}
                <View style={styles.tabRow}>
                    {(['orders', 'users', 'products'] as const).map(tab => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={[styles.tab, activeTab === tab && styles.activeTab]}
                        >
                            <Text style={[
                                styles.tabText,
                                isDarkMode && styles.darkTextLight,
                                activeTab === tab && styles.activeTabText
                            ]}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Sub-filters for Orders */}
                {activeTab === 'orders' && (
                    <View style={[styles.filterRow, isDarkMode && { backgroundColor: '#1E1E1E' }]}>
                        {(['processing', 'all'] as const).map(f => (
                            <TouchableOpacity
                                key={f}
                                onPress={() => setFilter(f)}
                                style={[styles.filterChip, filter === f && styles.activeFilterChip]}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    isDarkMode && styles.darkTextLight,
                                    filter === f && styles.activeFilterChipText
                                ]}>
                                    {f === 'processing' ? 'Pending' : 'All'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Add Product Button */}
                {activeTab === 'products' && (
                    <TouchableOpacity
                        style={[styles.addProductBtn, isDarkMode && { backgroundColor: '#FFF' }]}
                        onPress={() => setShowAddProduct(true)}
                    >
                        <Plus size={20} color={isDarkMode ? '#000' : '#FFF'} />
                        <Text style={[styles.addProductBtnText, isDarkMode && { color: '#000' }]}>Add New Product</Text>
                    </TouchableOpacity>
                )}

                {/* Content */}
                <View style={styles.contentSection}>
                    {activeTab === 'orders' && (
                        filteredOrders.length === 0 ? (
                            <View style={styles.emptyState}>
                                <ShoppingBag size={48} color={isDarkMode ? '#333' : '#E0E0E0'} />
                                <Text style={[styles.emptyText, isDarkMode && styles.darkTextLight]}>No orders found</Text>
                            </View>
                        ) : (
                            <FlatList data={filteredOrders} renderItem={renderOrder} keyExtractor={item => item.id} scrollEnabled={false} />
                        )
                    )}

                    {activeTab === 'users' && (
                        usersList.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Users size={48} color={isDarkMode ? '#333' : '#E0E0E0'} />
                                <Text style={[styles.emptyText, isDarkMode && styles.darkTextLight]}>No users found</Text>
                            </View>
                        ) : (
                            <FlatList data={usersList} renderItem={renderUser} keyExtractor={item => item.uid} scrollEnabled={false} />
                        )
                    )}

                    {activeTab === 'products' && (
                        productsList.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Package size={48} color={isDarkMode ? '#333' : '#E0E0E0'} />
                                <Text style={[styles.emptyText, isDarkMode && styles.darkTextLight]}>No products added yet</Text>
                            </View>
                        ) : (
                            <FlatList data={productsList} renderItem={renderProduct} keyExtractor={item => item.id} scrollEnabled={false} />
                        )
                    )}
                </View>
            </ScrollView>

            {/* Add Product Modal */}
            <Modal visible={showAddProduct} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>Add New Product</Text>
                            <TouchableOpacity onPress={() => { setShowAddProduct(false); setProductErrors({}); }}>
                                <X size={24} color={isDarkMode ? '#FFF' : '#000'} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 450 }}>
                            {/* Product Name */}
                            <Text style={[styles.fieldLabel, isDarkMode && styles.darkTextLight]}>Product Name *</Text>
                            <TextInput
                                style={[styles.input, isDarkMode && styles.darkInput, productErrors.name && styles.inputError]}
                                placeholder="e.g. Hydrating Face Cream"
                                value={productForm.name}
                                onChangeText={t => { setProductForm(p => ({ ...p, name: t })); setProductErrors(e => ({ ...e, name: '' })); }}
                                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                            />
                            {productErrors.name ? <Text style={styles.errorText}>{productErrors.name}</Text> : null}

                            {/* Brand */}
                            <Text style={[styles.fieldLabel, isDarkMode && styles.darkTextLight]}>Brand *</Text>
                            <TextInput
                                style={[styles.input, isDarkMode && styles.darkInput, productErrors.brand && styles.inputError]}
                                placeholder="e.g. Neutrogena"
                                value={productForm.brand}
                                onChangeText={t => { setProductForm(p => ({ ...p, brand: t })); setProductErrors(e => ({ ...e, brand: '' })); }}
                                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                            />
                            {productErrors.brand ? <Text style={styles.errorText}>{productErrors.brand}</Text> : null}

                            {/* Price & Rating Row */}
                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={[styles.fieldLabel, isDarkMode && styles.darkTextLight]}>Price (₹) *</Text>
                                    <TextInput
                                        style={[styles.input, isDarkMode && styles.darkInput, productErrors.price && styles.inputError]}
                                        placeholder="2500"
                                        value={productForm.price}
                                        onChangeText={t => { setProductForm(p => ({ ...p, price: t })); setProductErrors(e => ({ ...e, price: '' })); }}
                                        keyboardType="numeric"
                                        placeholderTextColor={isDarkMode ? '#666' : '#999'}
                                    />
                                    {productErrors.price ? <Text style={styles.errorText}>{productErrors.price}</Text> : null}
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text style={[styles.fieldLabel, isDarkMode && styles.darkTextLight]}>Rating</Text>
                                    <TextInput
                                        style={[styles.input, isDarkMode && styles.darkInput]}
                                        placeholder="4.5"
                                        value={productForm.rating}
                                        onChangeText={t => setProductForm(p => ({ ...p, rating: t }))}
                                        keyboardType="numeric"
                                        placeholderTextColor={isDarkMode ? '#666' : '#999'}
                                    />
                                </View>
                            </View>

                            {/* Category */}
                            <Text style={[styles.fieldLabel, isDarkMode && styles.darkTextLight]}>Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                                <View style={styles.categoryChips}>
                                    {CATEGORIES.map(cat => (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[
                                                styles.catChip,
                                                isDarkMode && styles.darkCatChip,
                                                productForm.category === cat && styles.activeCatChip,
                                            ]}
                                            onPress={() => setProductForm(p => ({ ...p, category: cat }))}
                                        >
                                            <Text style={[
                                                styles.catChipText,
                                                isDarkMode && styles.darkTextLight,
                                                productForm.category === cat && styles.activeCatChipText,
                                            ]}>{cat}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>

                            {/* Image URL */}
                            <Text style={[styles.fieldLabel, isDarkMode && styles.darkTextLight]}>Image URL *</Text>
                            <TextInput
                                style={[styles.input, isDarkMode && styles.darkInput, productErrors.image_url && styles.inputError]}
                                placeholder="https://example.com/product.jpg"
                                value={productForm.image_url}
                                onChangeText={t => { setProductForm(p => ({ ...p, image_url: t })); setProductErrors(e => ({ ...e, image_url: '' })); }}
                                autoCapitalize="none"
                                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                            />
                            {productErrors.image_url ? <Text style={styles.errorText}>{productErrors.image_url}</Text> : null}

                            {/* Description */}
                            <Text style={[styles.fieldLabel, isDarkMode && styles.darkTextLight]}>Description *</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, isDarkMode && styles.darkInput, productErrors.description && styles.inputError]}
                                placeholder="Product description..."
                                value={productForm.description}
                                onChangeText={t => { setProductForm(p => ({ ...p, description: t })); setProductErrors(e => ({ ...e, description: '' })); }}
                                multiline
                                numberOfLines={3}
                                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                            />
                            {productErrors.description ? <Text style={styles.errorText}>{productErrors.description}</Text> : null}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.cancelBtn, isDarkMode && { borderColor: '#444' }]}
                                onPress={() => { setShowAddProduct(false); setProductErrors({}); }}
                            >
                                <Text style={[styles.cancelBtnText, isDarkMode && styles.darkText]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleAddProduct} disabled={saving}>
                                {saving ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.saveBtnText}>Add Product</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F7F7' },
    darkContainer: { backgroundColor: '#121212' },
    center: { justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: 40 },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#F7F7F7' },
    darkHeader: { backgroundColor: '#121212' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    darkText: { color: '#FFFFFF' },
    darkTextLight: { color: '#999' },

    // Stats
    statsRow: { paddingHorizontal: 20, gap: 12, paddingBottom: 20 },
    statCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, width: 140, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    darkCard: { backgroundColor: '#1E1E1E' },
    statIconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
    statValue: { fontSize: 18, fontWeight: '700', color: '#000' },

    // Tabs
    tabRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
    tab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, backgroundColor: 'transparent' },
    activeTab: { backgroundColor: '#000' },
    tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
    activeTabText: { color: '#FFF' },

    // Filters
    filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F0F0F0' },
    activeFilterChip: { backgroundColor: '#E3F2FD' },
    filterChipText: { fontSize: 12, fontWeight: '600', color: '#666' },
    activeFilterChipText: { color: '#1565C0' },

    // Cards
    card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    cardTitle: { fontSize: 15, fontWeight: '600', color: '#000' },
    cardSubtitle: { fontSize: 13, color: '#666', marginTop: 1 },
    cardMeta: { fontSize: 12, color: '#999', marginTop: 2 },

    // Status Badge
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },

    // Divider
    divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
    darkDivider: { backgroundColor: '#333' },

    // Detail Rows
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
    detailLabel: { fontSize: 13, color: '#999' },
    detailValue: { fontSize: 13, color: '#000', fontWeight: '500', flex: 1, textAlign: 'right', marginLeft: 12 },

    // Total Row
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F0F0F0', marginTop: 12, paddingTop: 12 },
    totalLabel: { fontSize: 15, fontWeight: '600', color: '#000' },
    totalValue: { fontSize: 16, fontWeight: '700', color: '#000' },

    // Order Actions
    orderActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
    actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    rejectBtn: { backgroundColor: '#FFEBEE' },
    rejectBtnText: { color: '#C62828', fontWeight: '600', fontSize: 14 },
    deliverBtn: { backgroundColor: '#E8F5E9' },
    deliverBtnText: { color: '#2E7D32', fontWeight: '600', fontSize: 14 },

    // User Actions
    cardActions: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
    actionChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
    actionChipText: { fontSize: 12, fontWeight: '600' },
    makeAdminChip: { backgroundColor: '#E3F2FD', borderColor: '#BBDEFB' },
    makeAdminText: { color: '#1565C0' },
    removeAdminChip: { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' },
    removeAdminText: { color: '#C62828' },
    deleteChip: { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' },
    deleteChipText: { color: '#C62828' },
    adminBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    adminBadgeText: { fontSize: 9, fontWeight: '700', color: '#2E7D32', letterSpacing: 0.5 },

    // Product
    categoryTag: { backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    categoryTagText: { fontSize: 11, color: '#666', fontWeight: '500' },
    deleteIconBtn: { padding: 8 },
    addProductBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#000', marginHorizontal: 20, padding: 14, borderRadius: 12, marginBottom: 16 },
    addProductBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

    // Content
    contentSection: { paddingBottom: 20 },
    emptyState: { alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12 },
    emptyText: { fontSize: 15, color: '#999' },

    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
    darkModalContent: { backgroundColor: '#1E1E1E' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 6, marginTop: 4 },
    input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, fontSize: 15, color: '#000', backgroundColor: '#FAFAFA', marginBottom: 4 },
    darkInput: { backgroundColor: '#2A2A2A', borderColor: '#444', color: '#FFF' },
    inputError: { borderColor: '#D32F2F' },
    errorText: { color: '#D32F2F', fontSize: 11, marginBottom: 8, marginLeft: 4, fontWeight: '500' },
    textArea: { height: 80, textAlignVertical: 'top' },
    row: { flexDirection: 'row' },
    categoryChips: { flexDirection: 'row', gap: 8 },
    catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FFF' },
    darkCatChip: { backgroundColor: '#2A2A2A', borderColor: '#444' },
    activeCatChip: { backgroundColor: '#000', borderColor: '#000' },
    catChipText: { fontSize: 13, color: '#666', fontWeight: '500' },
    activeCatChipText: { color: '#FFF' },
    modalFooter: { flexDirection: 'row', gap: 12, marginTop: 16 },
    cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center' },
    cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#000' },
    saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#000', alignItems: 'center' },
    saveBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
