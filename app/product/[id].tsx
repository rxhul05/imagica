import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { CheckCircle, Heart, Share2, Star } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { PRODUCTS } from '../../data/products';
import { COLLECTIONS } from '../../lib/db';
import { db } from '../../lib/firebase';
import { useCartStore } from '../../store/cartStore';
import { useThemeStore } from '../../store/themeStore';
import { useWishlistStore } from '../../store/wishlistStore';

export default function ProductDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { addItem } = useCartStore();
    const { mode } = useThemeStore();
    const isDarkMode = mode === 'dark';
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const wishlistItems = useWishlistStore((state) => state.items);
    const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

    useEffect(() => {
        loadProduct();
    }, [id]);

    const loadProduct = async () => {
        const idStr = String(id);

        // Check if it's a Firestore product (prefixed with fb_)
        if (idStr.startsWith('fb_')) {
            const firestoreId = idStr.replace('fb_', '');
            try {
                const docSnap = await getDoc(doc(db, COLLECTIONS.PRODUCTS, firestoreId));
                if (docSnap.exists()) {
                    setProduct({
                        id: idStr,
                        ...docSnap.data(),
                        isFirestore: true,
                        reviews: docSnap.data().reviews || 0,
                        tags: [],
                    });
                }
            } catch (error) {
                console.error('Error fetching product:', error);
            }
        } else {
            // Static product from local data
            const found = PRODUCTS.find((p) => p.id === idStr);
            if (found) {
                setProduct({ ...found, isFirestore: false, tags: [] });
            }
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center, isDarkMode && styles.darkContainer]}>
                <ActivityIndicator size="large" color={isDarkMode ? '#FFF' : Colors.primary} />
            </View>
        );
    }

    if (!product) {
        return (
            <View style={[styles.container, styles.center, isDarkMode && styles.darkContainer]}>
                <Text style={[styles.notFoundText, isDarkMode && styles.darkText]}>Product not found</Text>
                <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}>
                    <Text style={styles.goBackText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isLiked = wishlistItems.some((item) => item.id === product.id);

    const imageSource = product.isFirestore
        ? { uri: product.image_url }
        : product.image_url;

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out this amazing product: ${product.name} by ${product.brand} for only ₹${product.price}!`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddToCart = () => {
        addItem({
            id: product.id,
            name: product.name,
            brand: product.brand,
            category: product.category || 'Makeup',
            price: product.price,
            rating: product.rating,
            description: product.description,
            image_url: product.isFirestore ? product.image_url : product.image_url,
            tags: [],
        });
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 3000);
    };

    return (
        <View style={[styles.container, isDarkMode && styles.darkContainer]}>
            <ScrollView>
                <Image source={imageSource} style={styles.image} resizeMode="cover" />

                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={{ flex: 1, marginRight: 16 }}>
                            <Text style={[styles.brand, isDarkMode && styles.darkTextLight]}>{product.brand}</Text>
                            <Text style={[styles.name, isDarkMode && styles.darkText]}>{product.name}</Text>
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity style={[styles.iconButton, isDarkMode && styles.darkIconButton]} onPress={() => toggleWishlist({ ...product, tags: [] })}>
                                <Heart
                                    size={24}
                                    color={isLiked ? Colors.accent : (isDarkMode ? '#FFF' : Colors.text)}
                                    fill={isLiked ? Colors.accent : 'transparent'}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.iconButton, isDarkMode && styles.darkIconButton]} onPress={handleShare}>
                                <Share2 size={24} color={isDarkMode ? '#FFF' : Colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.ratingContainer}>
                        <Star size={16} color="#FFD700" fill="#FFD700" />
                        <Text style={[styles.rating, isDarkMode && styles.darkText]}>{product.rating}</Text>
                        <Text style={[styles.reviews, isDarkMode && styles.darkTextLight]}>({product.reviews || 0} reviews)</Text>
                    </View>

                    <Text style={[styles.price, isDarkMode && styles.darkText]}>₹{product.price}</Text>

                    {product.category && (
                        <View style={[styles.categoryBadge, isDarkMode && { backgroundColor: '#333' }]}>
                            <Text style={[styles.categoryBadgeText, isDarkMode && { color: '#AAA' }]}>{product.category}</Text>
                        </View>
                    )}

                    <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Description</Text>
                    <Text style={[styles.description, isDarkMode && styles.darkTextLight]}>{product.description}</Text>
                </View>
            </ScrollView>

            <View style={[styles.footer, isDarkMode && styles.darkFooter]}>
                <TouchableOpacity style={[styles.addToCartButton, isDarkMode && styles.darkButton]} onPress={handleAddToCart}>
                    <Text style={[styles.addToCartText, isDarkMode && styles.darkButtonText]}>Add to Bag - ₹{product.price}</Text>
                </TouchableOpacity>
            </View>

            {/* Success Modal */}
            <Modal visible={showSuccessModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <Animated.View
                        entering={ZoomIn.duration(500).springify()}
                        exiting={ZoomOut.duration(300)}
                        style={[styles.modalContent, isDarkMode && styles.darkModalContent]}
                    >
                        <Animated.View entering={ZoomIn.delay(300).springify()} style={styles.modalIconContainer}>
                            <CheckCircle size={64} color={Colors.secondary} fill={Colors.success} />
                        </Animated.View>
                        <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>Added to Bag!</Text>
                        <Text style={[styles.modalMessage, isDarkMode && styles.darkTextLight]}>
                            {product.name} has been added to your bag.
                        </Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.secondaryButton, isDarkMode && styles.darkSecondaryButton]}
                                onPress={() => setShowSuccessModal(false)}
                            >
                                <Text style={[styles.modalButtonText, styles.secondaryButtonText, isDarkMode && styles.darkText]}>Continue Shopping</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.primaryButton]}
                                onPress={() => {
                                    setShowSuccessModal(false);
                                    router.push('/(tabs)/bag');
                                }}
                            >
                                <Text style={[styles.modalButtonText, styles.primaryButtonText]}>View Bag</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    darkContainer: {
        backgroundColor: '#121212',
    },
    darkText: {
        color: '#FFFFFF',
    },
    darkTextLight: {
        color: '#AAAAAA',
    },
    darkIconButton: {
        backgroundColor: '#333333',
    },
    darkFooter: {
        backgroundColor: '#121212',
        borderTopColor: '#333333',
    },
    darkButton: {
        backgroundColor: '#FFFFFF',
    },
    darkButtonText: {
        color: '#000000',
    },
    notFoundText: {
        fontSize: 18,
        color: Colors.textLight,
        marginBottom: 16,
    },
    goBackBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: Colors.primary,
        borderRadius: 24,
    },
    goBackText: {
        color: '#FFF',
        fontWeight: '600',
    },
    image: {
        width: '100%',
        height: 400,
        backgroundColor: Colors.gray,
    },
    content: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    brand: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textLight,
        marginBottom: 4,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    iconButton: {
        padding: 8,
        backgroundColor: Colors.surface,
        borderRadius: 20,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 4,
    },
    rating: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    reviews: {
        fontSize: 14,
        color: Colors.textLight,
    },
    price: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: 16,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 20,
    },
    categoryBadgeText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.primary,
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        color: Colors.textLight,
        lineHeight: 24,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: Colors.lightGray,
        backgroundColor: Colors.background,
    },
    addToCartButton: {
        backgroundColor: Colors.primary,
        padding: 18,
        borderRadius: 30,
        alignItems: 'center',
    },
    addToCartText: {
        color: Colors.secondary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFF',
        padding: 40,
        borderRadius: 20,
        alignItems: 'center',
        width: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    darkModalContent: {
        backgroundColor: '#1E1E1E',
    },
    modalIconContainer: {
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: 8,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 16,
        color: Colors.textLight,
        textAlign: 'center',
        marginBottom: 30,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButton: {
        backgroundColor: Colors.primary,
    },
    secondaryButton: {
        backgroundColor: '#F5F5F5',
    },
    darkSecondaryButton: {
        backgroundColor: '#333333',
    },
    modalButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    primaryButtonText: {
        color: '#FFF',
    },
    secondaryButtonText: {
        color: Colors.text,
    },
});
