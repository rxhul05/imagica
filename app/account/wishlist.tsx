import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { ArrowLeft, Heart } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { PRODUCTS } from '../../data/products';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useThemeStore } from '../../store/themeStore';

export default function WishlistScreen() {
    const router = useRouter();
    const { addItem } = useCartStore();
    const { user } = useAuthStore();
    const { mode } = useThemeStore();
    const isDarkMode = mode === 'dark';

    const [wishlistItems, setWishlistItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        if (!user) return;
        try {
            const q = query(
                collection(db, 'wishlist'),
                where('user_id', '==', user.uid)
            );
            const querySnapshot = await getDocs(q);
            const wishlistData = querySnapshot.docs.map(docSnap => ({
                docId: docSnap.id,
                ...(docSnap.data() as any),
            }));

            const items = wishlistData
                .map(item => {
                    const product = PRODUCTS.find(p => p.id === item.product_id);
                    return product ? { ...product, docId: item.docId } : null;
                })
                .filter(Boolean);

            setWishlistItems(items);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveItem = async (id: string) => {
        if (!user) return;
        try {
            // Find the Firestore document for this product
            const q = query(
                collection(db, 'wishlist'),
                where('user_id', '==', user.uid),
                where('product_id', '==', id)
            );
            const querySnapshot = await getDocs(q);

            const deletePromises = querySnapshot.docs.map(docSnap =>
                deleteDoc(doc(db, 'wishlist', docSnap.id))
            );
            await Promise.all(deletePromises);

            setWishlistItems(prev => prev.filter(item => item.id !== id));
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const handleAddToCart = (product: any) => {
        addItem(product);
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.card, isDarkMode && styles.darkCard]}
            onPress={() => router.push(`/product/${item.id}`)}
        >
            <Image source={{ uri: item.image_url }} style={styles.image} />
            <View style={styles.content}>
                <Text style={[styles.brand, isDarkMode && styles.darkTextLight]}>{item.brand}</Text>
                <Text style={[styles.name, isDarkMode && styles.darkText]} numberOfLines={2}>{item.name}</Text>
                <Text style={[styles.price, isDarkMode && styles.darkText]}>₹{item.price}</Text>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.addToCartBtn}
                        onPress={(e) => {
                            e.stopPropagation();
                            handleAddToCart(item);
                        }}
                    >
                        <Text style={styles.addToCartText}>Add to Bag</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(item.id);
                        }}
                    >
                        <Heart size={20} color={Colors.accent} fill={Colors.accent} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
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
                <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>My Wishlist</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={wishlistItems}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Heart size={48} color={isDarkMode ? '#666' : Colors.textLight} />
                        <Text style={[styles.emptyText, isDarkMode && styles.darkTextLight]}>Your wishlist is empty.</Text>
                        <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/')}>
                            <Text style={styles.shopBtnText}>Start Shopping</Text>
                        </TouchableOpacity>
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
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: 12,
        marginBottom: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.lightGray,
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 8,
        backgroundColor: Colors.gray,
    },
    content: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'space-between',
    },
    brand: { fontSize: 12, color: Colors.textLight, fontWeight: '600' },
    name: { fontSize: 14, color: Colors.text, fontWeight: '500', marginBottom: 4 },
    price: { fontSize: 16, fontWeight: 'bold', color: Colors.primary },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
    },
    addToCartBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    addToCartText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
    removeBtn: {
        padding: 8,
    },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100, gap: 16 },
    emptyText: { fontSize: 16, color: Colors.textLight },
    shopBtn: {
        marginTop: 16,
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: Colors.primary,
        borderRadius: 24,
    },
    shopBtnText: { color: '#FFF', fontWeight: 'bold' },
});
