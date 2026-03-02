import { useRouter } from 'expo-router';
import { ArrowLeft, Heart, ShoppingBag } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { PRODUCTS } from '../../data/products';
import { getUserWishlist, removeFromWishlist } from '../../lib/db';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useThemeStore } from '../../store/themeStore';
import { useWishlistStore } from '../../store/wishlistStore';

export default function WishlistScreen() {
    const router = useRouter();
    const { addItem: addToCart } = useCartStore();
    const { user } = useAuthStore();
    const { mode } = useThemeStore();
    const isDarkMode = mode === 'dark';
    const wishlistStore = useWishlistStore();

    const [firestoreItems, setFirestoreItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchWishlist = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        try {
            const wishlistData = await getUserWishlist(user.uid);

            // Map Firestore wishlist entries to product data
            const items = wishlistData
                .map(item => {
                    // Check static products first
                    const staticProduct = PRODUCTS.find(p => p.id === item.product_id);
                    if (staticProduct) {
                        return { ...staticProduct, docId: item.docId, isFirestore: false, tags: [] };
                    }
                    // Check if it's a Firestore product (fb_ prefix stored without prefix)
                    return null;
                })
                .filter(Boolean);

            setFirestoreItems(items);

            // Also sync local wishlist store with Firestore data
            const localItems = wishlistStore.items;
            const firestoreIds = wishlistData.map(w => w.product_id);

            // Add products from Firestore that aren't in local store
            for (const id of firestoreIds) {
                if (!localItems.some(i => i.id === id)) {
                    const product = PRODUCTS.find(p => p.id === id);
                    if (product) {
                        wishlistStore.addItem({ ...product, tags: [] });
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    // Combine: Use Firestore items for logged-in users, local store for guests
    const displayItems = user ? firestoreItems : wishlistStore.items.map(item => ({
        ...item,
        isFirestore: false,
    }));

    const handleRemoveItem = async (item: any) => {
        if (user) {
            try {
                await removeFromWishlist(user.uid, item.id);
                setFirestoreItems(prev => prev.filter(i => i.id !== item.id));
                // Also remove from local store
                wishlistStore.removeItem(item.id);
            } catch (error: any) {
                Alert.alert('Error', error.message);
            }
        } else {
            wishlistStore.removeItem(item.id);
        }
    };

    const handleAddToCart = (product: any) => {
        addToCart({
            id: product.id,
            name: product.name,
            brand: product.brand,
            category: product.category || 'Makeup',
            price: product.price,
            rating: product.rating || 4.5,
            description: product.description || '',
            image_url: product.image_url,
            tags: [],
        });
        Alert.alert('Added to Bag', `${product.name} has been added to your bag.`);
    };

    const renderItem = ({ item }: { item: any }) => {
        const imageSource = typeof item.image_url === 'string'
            ? { uri: item.image_url }
            : item.image_url;

        return (
            <TouchableOpacity
                style={[styles.card, isDarkMode && styles.darkCard]}
                onPress={() => {
                    const productId = item.id.startsWith('fb_') ? item.id : item.id;
                    router.push(`/product/${productId}`);
                }}
            >
                <Image source={imageSource} style={styles.image} resizeMode="contain" />
                <View style={styles.content}>
                    <Text style={[styles.brand, isDarkMode && styles.darkTextLight]}>{item.brand}</Text>
                    <Text style={[styles.name, isDarkMode && styles.darkText]} numberOfLines={2}>{item.name}</Text>
                    <Text style={[styles.price, isDarkMode && styles.darkText]}>₹{item.price}</Text>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.addToCartBtn, isDarkMode && { backgroundColor: '#FFF' }]}
                            onPress={(e) => {
                                e.stopPropagation();
                                handleAddToCart(item);
                            }}
                        >
                            <ShoppingBag size={14} color={isDarkMode ? '#000' : '#FFF'} />
                            <Text style={[styles.addToCartText, isDarkMode && { color: '#000' }]}>Add to Bag</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.removeBtn}
                            onPress={(e) => {
                                e.stopPropagation();
                                handleRemoveItem(item);
                            }}
                        >
                            <Heart size={20} color={Colors.accent} fill={Colors.accent} />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

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
                <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>My Wishlist</Text>
                <Text style={[styles.countText, isDarkMode && styles.darkTextLight]}>{displayItems.length} items</Text>
            </View>

            <FlatList
                data={displayItems}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Heart size={56} color={isDarkMode ? '#444' : '#E0E0E0'} />
                        <Text style={[styles.emptyTitle, isDarkMode && styles.darkText]}>Your wishlist is empty</Text>
                        <Text style={[styles.emptySubtitle, isDarkMode && styles.darkTextLight]}>
                            Save items you love by tapping the heart icon
                        </Text>
                        <TouchableOpacity
                            style={[styles.shopBtn, isDarkMode && { backgroundColor: '#FFF' }]}
                            onPress={() => router.push('/(tabs)/browse')}
                        >
                            <Text style={[styles.shopBtnText, isDarkMode && { color: '#000' }]}>Start Shopping</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    darkContainer: { backgroundColor: '#121212' },
    darkHeader: { borderBottomColor: '#333' },
    darkText: { color: '#FFF' },
    darkTextLight: { color: '#AAA' },
    darkCard: { backgroundColor: '#1E1E1E', borderColor: '#333' },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
    countText: { fontSize: 14, color: Colors.textLight },
    list: { padding: 16 },
    card: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 16, marginBottom: 12, padding: 12, borderWidth: 1, borderColor: Colors.lightGray },
    image: { width: 100, height: 100, borderRadius: 12, backgroundColor: Colors.gray },
    content: { flex: 1, marginLeft: 14, justifyContent: 'space-between' },
    brand: { fontSize: 12, color: Colors.textLight, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    name: { fontSize: 14, color: Colors.text, fontWeight: '500', marginVertical: 2 },
    price: { fontSize: 16, fontWeight: '700', color: Colors.primary },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
    addToCartBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
    addToCartText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
    removeBtn: { padding: 6 },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 12, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
    emptySubtitle: { fontSize: 14, color: Colors.textLight, textAlign: 'center', lineHeight: 20 },
    shopBtn: { marginTop: 12, paddingVertical: 14, paddingHorizontal: 32, backgroundColor: Colors.primary, borderRadius: 24 },
    shopBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
