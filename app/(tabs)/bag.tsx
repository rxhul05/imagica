import { useRouter } from 'expo-router';
import { CheckCircle, CreditCard, Minus, MoreHorizontal, Plus, Wallet } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { createOrder } from '../../lib/db';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useThemeStore } from '../../store/themeStore';

export default function BagScreen() {
    const { items, removeItem, updateQuantity, total, clearCart } = useCartStore();
    const { user } = useAuthStore();
    const [showSuccess, setShowSuccess] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const router = useRouter();
    const { mode } = useThemeStore();
    const isDarkMode = mode === 'dark';

    const handleCheckout = async () => {
        if (items.length === 0) return;

        if (!user) {
            Alert.alert(
                'Sign In Required',
                'Please sign in to complete your purchase.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Sign In', onPress: () => router.push('/auth') }
                ]
            );
            return;
        }

        // Show payment method selection modal
        setShowPaymentModal(true);
    };

    const handlePaymentMethodSelect = async (paymentMethod: 'cod' | 'online') => {
        if (!user) return;

        setShowPaymentModal(false);

        try {
            await createOrder({
                user_id: user.uid,
                user_email: user.email || '',
                items: JSON.stringify(items),
                total_amount: total(),
                payment_method: paymentMethod,
            });

            setShowSuccess(true);

            setTimeout(() => {
                clearCart();
                setShowSuccess(false);
            }, 3000);
        } catch (error: any) {
            console.error('Checkout error:', error);
            Alert.alert('Error', 'Failed to place order. Please try again.');
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.itemContainer}>
            <View style={styles.brandHeader}>
                <Text style={[styles.brandName, isDarkMode && styles.darkText]}>{item.brand}</Text>
                <View style={[styles.brandIconPlaceholder, isDarkMode && styles.darkIconPlaceholder]}>
                    <Text style={[styles.brandInitial, isDarkMode && styles.darkText]}>{item.brand.charAt(0)}</Text>
                </View>
            </View>

            <View style={styles.itemContent}>
                <Image source={typeof item.image_url === 'string' ? { uri: item.image_url } : item.image_url} style={styles.itemImage} resizeMode="contain" />

                <View style={styles.itemDetails}>
                    <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, isDarkMode && styles.darkText]}>{item.name}</Text>
                        <Text style={[styles.itemVariant, isDarkMode && styles.darkTextLight]}>Default Size</Text>
                    </View>
                    <Text style={[styles.itemPrice, isDarkMode && styles.darkText]}>₹{item.price}</Text>
                </View>
            </View>

            <View style={styles.itemActions}>
                <View style={[styles.quantityContainer, isDarkMode && styles.darkQuantityContainer]}>
                    <TouchableOpacity
                        style={[styles.quantityBtn, isDarkMode && styles.darkQuantityBtn]}
                        onPress={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                    >
                        <Minus size={18} color={isDarkMode ? '#FFF' : Colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.quantityText, isDarkMode && styles.darkText]}>{item.quantity}</Text>
                    <TouchableOpacity
                        style={[styles.quantityBtn, isDarkMode && styles.darkQuantityBtn]}
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                        <Plus size={18} color={isDarkMode ? '#FFF' : Colors.text} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.moreBtn, isDarkMode && styles.darkMoreBtn]} onPress={() => removeItem(item.id)}>
                    <MoreHorizontal size={20} color={isDarkMode ? '#FFF' : Colors.text} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>Bag</Text>
            </View>

            {items.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={[styles.emptyText, isDarkMode && styles.darkTextLight]}>Your bag is empty</Text>
                </View>
            ) : (
                <>
                    <FlatList
                        data={items}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                    />
                    <View style={[styles.footer, isDarkMode && styles.darkFooter]}>
                        <TouchableOpacity style={[styles.checkoutButton, isDarkMode && styles.darkCheckoutButton]} onPress={handleCheckout}>
                            <Text style={[styles.checkoutButtonText, isDarkMode && styles.darkCheckoutText]}>Continue to checkout</Text>
                            <Text style={[styles.checkoutPrice, isDarkMode && styles.darkCheckoutText]}>₹{total().toFixed(2)}</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}

            {/* Payment Method Selection Modal */}
            <Modal visible={showPaymentModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <Animated.View
                        entering={ZoomIn.duration(300).springify()}
                        style={[styles.paymentModal, isDarkMode && styles.darkPaymentModal]}
                    >
                        <Text style={[styles.paymentModalTitle, isDarkMode && styles.darkText]}>Select Payment Method</Text>
                        <Text style={[styles.paymentModalSubtitle, isDarkMode && styles.darkTextLight]}>
                            Choose how you'd like to pay
                        </Text>

                        <View style={styles.paymentOptions}>
                            <TouchableOpacity
                                style={[styles.paymentOption, isDarkMode && styles.darkPaymentOption]}
                                onPress={() => handlePaymentMethodSelect('cod')}
                            >
                                <View style={[styles.paymentIconContainer, { backgroundColor: '#E8F5E9' }]}>
                                    <Wallet size={32} color="#2E7D32" />
                                </View>
                                <Text style={[styles.paymentOptionTitle, isDarkMode && styles.darkText]}>Cash on Delivery</Text>
                                <Text style={[styles.paymentOptionDesc, isDarkMode && styles.darkTextLight]}>
                                    Pay when you receive your order
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.paymentOption, isDarkMode && styles.darkPaymentOption]}
                                onPress={() => handlePaymentMethodSelect('online')}
                            >
                                <View style={[styles.paymentIconContainer, { backgroundColor: '#E3F2FD' }]}>
                                    <CreditCard size={32} color="#1565C0" />
                                </View>
                                <Text style={[styles.paymentOptionTitle, isDarkMode && styles.darkText]}>Online Payment</Text>
                                <Text style={[styles.paymentOptionDesc, isDarkMode && styles.darkTextLight]}>
                                    Pay now with card or UPI
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.cancelPaymentBtn, isDarkMode && styles.darkCancelPaymentBtn]}
                            onPress={() => setShowPaymentModal(false)}
                        >
                            <Text style={[styles.cancelPaymentText, isDarkMode && styles.darkText]}>Cancel</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>

            <Modal visible={showSuccess} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <Animated.View
                        entering={ZoomIn.duration(500).springify()}
                        exiting={ZoomOut.duration(300)}
                        style={[styles.successCard, isDarkMode && styles.darkSuccessCard]}
                    >
                        <Animated.View entering={ZoomIn.delay(300).springify()} style={styles.iconContainer}>
                            <CheckCircle size={64} color={Colors.secondary} fill={Colors.success} />
                        </Animated.View>
                        <Text style={[styles.successTitle, isDarkMode && styles.darkText]}>Order Confirmed!</Text>
                        <Text style={[styles.successMessage, isDarkMode && styles.darkTextLight]}>Thank you for your purchase.</Text>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF', // Pure white background
        paddingBottom: 60,
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
    darkIconPlaceholder: {
        backgroundColor: '#333333',
        borderColor: '#444444',
    },
    darkQuantityContainer: {
        backgroundColor: '#1E1E1E',
        borderColor: '#333333',
    },
    darkQuantityBtn: {
        backgroundColor: '#333333',
    },
    darkMoreBtn: {
        backgroundColor: '#333333',
    },
    darkFooter: {
        backgroundColor: '#121212',
        borderTopColor: '#333333',
    },
    darkCheckoutButton: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#FFFFFF',
    },
    darkCheckoutText: {
        color: '#000000',
    },
    darkSuccessCard: {
        backgroundColor: '#1E1E1E',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#000',
        letterSpacing: -1,
    },
    list: {
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    itemContainer: {
        marginBottom: 40,
    },
    brandHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    brandName: {
        fontSize: 24,
        fontWeight: '500',
        color: '#000',
    },
    brandIconPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    brandInitial: {
        fontSize: 18,
        fontWeight: '300',
        color: '#000',
    },
    itemContent: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    itemImage: {
        width: 120,
        height: 150,
        borderRadius: 12,
        backgroundColor: '#F5F5F5',
    },
    itemDetails: {
        flex: 1,
        marginLeft: 20,
        justifyContent: 'space-between',
    },
    itemInfo: {
        gap: 4,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
        lineHeight: 22,
    },
    itemVariant: {
        fontSize: 14,
        color: '#666',
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: '400',
        color: '#000',
    },
    itemActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingHorizontal: 6,
        paddingVertical: 6,
        height: 50,
    },
    quantityBtn: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 18,
        backgroundColor: '#F5F5F5',
    },
    quantityText: {
        fontSize: 16,
        fontWeight: '600',
        marginHorizontal: 16,
        minWidth: 20,
        textAlign: 'center',
    },
    moreBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        padding: 24,
    },
    checkoutButton: {
        backgroundColor: '#000',
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    checkoutButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    checkoutPrice: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        color: Colors.textLight,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successCard: {
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
    iconContainer: {
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: 8,
    },
    successMessage: {
        fontSize: 16,
        color: Colors.textLight,
        textAlign: 'center',
    },
    paymentModal: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        width: '85%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    darkPaymentModal: {
        backgroundColor: '#1E1E1E',
    },
    paymentModalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
        textAlign: 'center',
    },
    paymentModalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 24,
        textAlign: 'center',
    },
    paymentOptions: {
        gap: 16,
        marginBottom: 20,
    },
    paymentOption: {
        backgroundColor: '#F9F9F9',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    darkPaymentOption: {
        backgroundColor: '#2A2A2A',
    },
    paymentIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    paymentOptionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    paymentOptionDesc: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
    },
    cancelPaymentBtn: {
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: '#F5F5F5',
    },
    darkCancelPaymentBtn: {
        backgroundColor: '#333333',
    },
    cancelPaymentText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
});
