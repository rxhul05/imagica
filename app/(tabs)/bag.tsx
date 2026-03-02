import { useRouter } from 'expo-router';
import {
    CheckCircle,
    ChevronRight,
    CreditCard, MapPin, Minus, MoreHorizontal,
    Plus,
    Truck,
    Wallet, X
} from 'lucide-react-native';
import { useState } from 'react';
import {
    ActivityIndicator, Alert, FlatList, Image, Modal, ScrollView,
    StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { createOrder, getUserAddresses, getUserPayments } from '../../lib/db';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useThemeStore } from '../../store/themeStore';

type CheckoutStep = 'address' | 'payment' | 'confirm';

interface Address {
    id: string;
    label: string;
    full_address: string;
}

interface PaymentMethod {
    id: string;
    type: string;
    last4: string;
    expiry?: string;
}

export default function BagScreen() {
    const { items, removeItem, updateQuantity, total, clearCart } = useCartStore();
    const { user } = useAuthStore();
    const [showSuccess, setShowSuccess] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('address');
    const router = useRouter();
    const { mode } = useThemeStore();
    const isDarkMode = mode === 'dark';

    // Checkout selections
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [payments, setPayments] = useState<PaymentMethod[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<string>(''); // 'cod' or payment id
    const [selectedPaymentLabel, setSelectedPaymentLabel] = useState('');
    const [loadingData, setLoadingData] = useState(false);
    const [placingOrder, setPlacingOrder] = useState(false);

    const fetchCheckoutData = async () => {
        if (!user) return;
        setLoadingData(true);
        try {
            const [addr, pay] = await Promise.all([
                getUserAddresses(user.uid),
                getUserPayments(user.uid),
            ]);
            setAddresses(addr as Address[]);
            setPayments(pay as PaymentMethod[]);
        } catch (error) {
            console.error('Error fetching checkout data:', error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleCheckout = async () => {
        if (items.length === 0) return;
        if (!user) {
            Alert.alert('Sign In Required', 'Please sign in to complete your purchase.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign In', onPress: () => router.push('/auth') },
            ]);
            return;
        }

        // Reset checkout state
        setSelectedAddress(null);
        setSelectedPayment('');
        setSelectedPaymentLabel('');
        setCheckoutStep('address');
        setShowCheckout(true);
        fetchCheckoutData();
    };

    const handleSelectAddress = (addr: Address) => {
        setSelectedAddress(addr);
        setCheckoutStep('payment');
    };

    const handleSelectPayment = (method: string, label: string) => {
        setSelectedPayment(method);
        setSelectedPaymentLabel(label);
        setCheckoutStep('confirm');
    };

    const handlePlaceOrder = async () => {
        if (!user || !selectedAddress) return;
        setPlacingOrder(true);
        try {
            await createOrder({
                user_id: user.uid,
                user_email: user.email || '',
                items: JSON.stringify(items),
                total_amount: total(),
                payment_method: selectedPayment === 'cod' ? 'cod' : 'card',
            });

            setShowCheckout(false);
            setShowSuccess(true);
            setTimeout(() => {
                clearCart();
                setShowSuccess(false);
            }, 3000);
        } catch (error: any) {
            console.error('Checkout error:', error);
            Alert.alert('Error', 'Failed to place order. Please try again.');
        } finally {
            setPlacingOrder(false);
        }
    };

    // ============================
    // Render Cart Item
    // ============================

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

    // ============================
    // Checkout Modal Content
    // ============================

    const renderCheckoutContent = () => {
        if (loadingData) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={isDarkMode ? '#FFF' : Colors.primary} />
                    <Text style={[styles.loadingText, isDarkMode && styles.darkTextLight]}>Loading...</Text>
                </View>
            );
        }

        switch (checkoutStep) {
            case 'address':
                return (
                    <View>
                        <View style={styles.stepHeader}>
                            <View style={[styles.stepIcon, { backgroundColor: isDarkMode ? '#333' : '#E8F5E9' }]}>
                                <MapPin size={22} color="#2E7D32" />
                            </View>
                            <View>
                                <Text style={[styles.stepTitle, isDarkMode && styles.darkText]}>Delivery Address</Text>
                                <Text style={[styles.stepSubtitle, isDarkMode && styles.darkTextLight]}>
                                    Where should we deliver?
                                </Text>
                            </View>
                        </View>

                        {addresses.length === 0 ? (
                            <View style={styles.emptyCheckout}>
                                <MapPin size={40} color={isDarkMode ? '#444' : '#CCC'} />
                                <Text style={[styles.emptyCheckoutText, isDarkMode && styles.darkTextLight]}>
                                    No saved addresses
                                </Text>
                                <TouchableOpacity
                                    style={[styles.addNewBtn, isDarkMode && { borderColor: '#444' }]}
                                    onPress={() => {
                                        setShowCheckout(false);
                                        router.push('/account/addresses');
                                    }}
                                >
                                    <Plus size={16} color={isDarkMode ? '#FFF' : '#000'} />
                                    <Text style={[styles.addNewBtnText, isDarkMode && styles.darkText]}>Add Address</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
                                {addresses.map(addr => (
                                    <TouchableOpacity
                                        key={addr.id}
                                        style={[
                                            styles.selectionCard,
                                            isDarkMode && styles.darkSelectionCard,
                                            selectedAddress?.id === addr.id && styles.selectedCard,
                                        ]}
                                        onPress={() => handleSelectAddress(addr)}
                                    >
                                        <View style={[styles.selectionIconBox, { backgroundColor: isDarkMode ? '#333' : '#E8F5E9' }]}>
                                            <MapPin size={20} color="#2E7D32" />
                                        </View>
                                        <View style={styles.selectionContent}>
                                            <Text style={[styles.selectionTitle, isDarkMode && styles.darkText]}>{addr.label}</Text>
                                            <Text style={[styles.selectionDesc, isDarkMode && styles.darkTextLight]} numberOfLines={2}>
                                                {addr.full_address}
                                            </Text>
                                        </View>
                                        <ChevronRight size={18} color={isDarkMode ? '#666' : '#CCC'} />
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    style={[styles.addNewInline, isDarkMode && { borderColor: '#444' }]}
                                    onPress={() => {
                                        setShowCheckout(false);
                                        router.push('/account/addresses');
                                    }}
                                >
                                    <Plus size={16} color={isDarkMode ? '#AAA' : '#666'} />
                                    <Text style={[styles.addNewInlineText, isDarkMode && styles.darkTextLight]}>
                                        Add new address
                                    </Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                );

            case 'payment':
                return (
                    <View>
                        <View style={styles.stepHeader}>
                            <View style={[styles.stepIcon, { backgroundColor: isDarkMode ? '#333' : '#E3F2FD' }]}>
                                <CreditCard size={22} color="#1565C0" />
                            </View>
                            <View>
                                <Text style={[styles.stepTitle, isDarkMode && styles.darkText]}>Payment Method</Text>
                                <Text style={[styles.stepSubtitle, isDarkMode && styles.darkTextLight]}>
                                    How would you like to pay?
                                </Text>
                            </View>
                        </View>

                        {/* Selected Address Summary */}
                        <View style={[styles.summaryChip, isDarkMode && { backgroundColor: '#333' }]}>
                            <MapPin size={14} color="#2E7D32" />
                            <Text style={[styles.summaryChipText, isDarkMode && styles.darkText]} numberOfLines={1}>
                                {selectedAddress?.label} — {selectedAddress?.full_address}
                            </Text>
                            <TouchableOpacity onPress={() => setCheckoutStep('address')}>
                                <Text style={styles.changeText}>Change</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
                            {/* COD Option */}
                            <TouchableOpacity
                                style={[
                                    styles.selectionCard,
                                    isDarkMode && styles.darkSelectionCard,
                                    selectedPayment === 'cod' && styles.selectedCard,
                                ]}
                                onPress={() => handleSelectPayment('cod', 'Cash on Delivery')}
                            >
                                <View style={[styles.selectionIconBox, { backgroundColor: isDarkMode ? '#333' : '#E8F5E9' }]}>
                                    <Wallet size={20} color="#2E7D32" />
                                </View>
                                <View style={styles.selectionContent}>
                                    <Text style={[styles.selectionTitle, isDarkMode && styles.darkText]}>Cash on Delivery</Text>
                                    <Text style={[styles.selectionDesc, isDarkMode && styles.darkTextLight]}>
                                        Pay when you receive your order
                                    </Text>
                                </View>
                                <ChevronRight size={18} color={isDarkMode ? '#666' : '#CCC'} />
                            </TouchableOpacity>

                            {/* Saved Cards */}
                            {payments.map(card => (
                                <TouchableOpacity
                                    key={card.id}
                                    style={[
                                        styles.selectionCard,
                                        isDarkMode && styles.darkSelectionCard,
                                        selectedPayment === card.id && styles.selectedCard,
                                    ]}
                                    onPress={() => handleSelectPayment(card.id, `${card.type} •••• ${card.last4}`)}
                                >
                                    <View style={[styles.selectionIconBox, { backgroundColor: isDarkMode ? '#333' : '#E3F2FD' }]}>
                                        <CreditCard size={20} color="#1565C0" />
                                    </View>
                                    <View style={styles.selectionContent}>
                                        <Text style={[styles.selectionTitle, isDarkMode && styles.darkText]}>
                                            {card.type} •••• {card.last4}
                                        </Text>
                                        <Text style={[styles.selectionDesc, isDarkMode && styles.darkTextLight]}>
                                            Expires {card.expiry || 'N/A'}
                                        </Text>
                                    </View>
                                    <ChevronRight size={18} color={isDarkMode ? '#666' : '#CCC'} />
                                </TouchableOpacity>
                            ))}

                            <TouchableOpacity
                                style={[styles.addNewInline, isDarkMode && { borderColor: '#444' }]}
                                onPress={() => {
                                    setShowCheckout(false);
                                    router.push('/account/payments');
                                }}
                            >
                                <Plus size={16} color={isDarkMode ? '#AAA' : '#666'} />
                                <Text style={[styles.addNewInlineText, isDarkMode && styles.darkTextLight]}>
                                    Add new card
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                );

            case 'confirm':
                return (
                    <View>
                        <View style={styles.stepHeader}>
                            <View style={[styles.stepIcon, { backgroundColor: isDarkMode ? '#333' : '#FFF3E0' }]}>
                                <Truck size={22} color="#EF6C00" />
                            </View>
                            <View>
                                <Text style={[styles.stepTitle, isDarkMode && styles.darkText]}>Order Summary</Text>
                                <Text style={[styles.stepSubtitle, isDarkMode && styles.darkTextLight]}>
                                    Review and confirm your order
                                </Text>
                            </View>
                        </View>

                        {/* Address Summary */}
                        <View style={[styles.confirmRow, isDarkMode && { borderColor: '#333' }]}>
                            <View style={styles.confirmRowLeft}>
                                <MapPin size={16} color="#2E7D32" />
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Text style={[styles.confirmLabel, isDarkMode && styles.darkTextLight]}>Delivery to</Text>
                                    <Text style={[styles.confirmValue, isDarkMode && styles.darkText]}>{selectedAddress?.label}</Text>
                                    <Text style={[styles.confirmSub, isDarkMode && styles.darkTextLight]} numberOfLines={1}>
                                        {selectedAddress?.full_address}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setCheckoutStep('address')}>
                                <Text style={styles.changeText}>Edit</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Payment Summary */}
                        <View style={[styles.confirmRow, isDarkMode && { borderColor: '#333' }]}>
                            <View style={styles.confirmRowLeft}>
                                {selectedPayment === 'cod' ? (
                                    <Wallet size={16} color="#1565C0" />
                                ) : (
                                    <CreditCard size={16} color="#1565C0" />
                                )}
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Text style={[styles.confirmLabel, isDarkMode && styles.darkTextLight]}>Payment</Text>
                                    <Text style={[styles.confirmValue, isDarkMode && styles.darkText]}>{selectedPaymentLabel}</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setCheckoutStep('payment')}>
                                <Text style={styles.changeText}>Edit</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Items Summary */}
                        <View style={[styles.confirmRow, { borderBottomWidth: 0 }, isDarkMode && { borderColor: '#333' }]}>
                            <View style={styles.confirmRowLeft}>
                                <View style={{ flex: 1, marginLeft: 0 }}>
                                    <Text style={[styles.confirmLabel, isDarkMode && styles.darkTextLight]}>
                                        {items.length} item{items.length !== 1 ? 's' : ''}
                                    </Text>
                                    {items.map(i => (
                                        <Text key={i.id} style={[styles.confirmSub, isDarkMode && styles.darkTextLight]}>
                                            {i.quantity}x {i.name}
                                        </Text>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* Total */}
                        <View style={[styles.confirmTotal, isDarkMode && { backgroundColor: '#333' }]}>
                            <Text style={[styles.confirmTotalLabel, isDarkMode && styles.darkText]}>Total Amount</Text>
                            <Text style={[styles.confirmTotalValue, isDarkMode && styles.darkText]}>₹{total().toFixed(2)}</Text>
                        </View>

                        {/* Place Order Button */}
                        <TouchableOpacity
                            style={[styles.placeOrderBtn, isDarkMode && { backgroundColor: '#FFF' }]}
                            onPress={handlePlaceOrder}
                            disabled={placingOrder}
                        >
                            {placingOrder ? (
                                <ActivityIndicator color={isDarkMode ? '#000' : '#FFF'} />
                            ) : (
                                <Text style={[styles.placeOrderText, isDarkMode && { color: '#000' }]}>
                                    Place Order — ₹{total().toFixed(2)}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                );
        }
    };

    // ============================
    // Step Indicator
    // ============================

    const steps = [
        { key: 'address' as CheckoutStep, label: 'Address' },
        { key: 'payment' as CheckoutStep, label: 'Payment' },
        { key: 'confirm' as CheckoutStep, label: 'Confirm' },
    ];

    const currentStepIndex = steps.findIndex(s => s.key === checkoutStep);

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

            {/* Checkout Modal */}
            <Modal visible={showCheckout} transparent animationType="slide">
                <View style={styles.checkoutOverlay}>
                    <Animated.View
                        entering={ZoomIn.duration(300).springify()}
                        style={[styles.checkoutModal, isDarkMode && styles.darkCheckoutModal]}
                    >
                        {/* Header */}
                        <View style={styles.checkoutHeader}>
                            <Text style={[styles.checkoutTitle, isDarkMode && styles.darkText]}>Checkout</Text>
                            <TouchableOpacity onPress={() => setShowCheckout(false)}>
                                <X size={24} color={isDarkMode ? '#FFF' : '#000'} />
                            </TouchableOpacity>
                        </View>

                        {/* Step Indicator */}
                        <View style={styles.stepIndicator}>
                            {steps.map((step, i) => (
                                <View key={step.key} style={styles.stepDot}>
                                    <View style={[
                                        styles.dot,
                                        i <= currentStepIndex && styles.dotActive,
                                        isDarkMode && i <= currentStepIndex && { backgroundColor: '#FFF' },
                                    ]}>
                                        <Text style={[
                                            styles.dotNumber,
                                            i <= currentStepIndex && styles.dotNumberActive,
                                            isDarkMode && i <= currentStepIndex && { color: '#000' },
                                        ]}>{i + 1}</Text>
                                    </View>
                                    <Text style={[
                                        styles.stepLabel,
                                        i <= currentStepIndex && styles.stepLabelActive,
                                        isDarkMode && styles.darkTextLight,
                                        isDarkMode && i <= currentStepIndex && { color: '#FFF' },
                                    ]}>{step.label}</Text>
                                    {i < steps.length - 1 && (
                                        <View style={[
                                            styles.stepLine,
                                            i < currentStepIndex && styles.stepLineActive,
                                            isDarkMode && { backgroundColor: '#333' },
                                            isDarkMode && i < currentStepIndex && { backgroundColor: '#FFF' },
                                        ]} />
                                    )}
                                </View>
                            ))}
                        </View>

                        {/* Content */}
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {renderCheckoutContent()}
                        </ScrollView>
                    </Animated.View>
                </View>
            </Modal>

            {/* Success Modal */}
            <Modal visible={showSuccess} transparent animationType="fade">
                <View style={styles.checkoutOverlay}>
                    <Animated.View
                        entering={ZoomIn.duration(500).springify()}
                        exiting={ZoomOut.duration(300)}
                        style={[styles.successCard, isDarkMode && styles.darkSuccessCard]}
                    >
                        <Animated.View entering={ZoomIn.delay(300).springify()} style={styles.iconContainer}>
                            <CheckCircle size={64} color={Colors.secondary} fill={Colors.success} />
                        </Animated.View>
                        <Text style={[styles.successTitle, isDarkMode && styles.darkText]}>Order Confirmed!</Text>
                        <Text style={[styles.successMessage, isDarkMode && styles.darkTextLight]}>
                            Thank you for your purchase. Your order will be delivered soon!
                        </Text>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF', paddingBottom: 60 },
    darkContainer: { backgroundColor: '#121212' },
    darkText: { color: '#FFFFFF' },
    darkTextLight: { color: '#AAAAAA' },
    darkIconPlaceholder: { backgroundColor: '#333333', borderColor: '#444444' },
    darkQuantityContainer: { backgroundColor: '#1E1E1E', borderColor: '#333333' },
    darkQuantityBtn: { backgroundColor: '#333333' },
    darkMoreBtn: { backgroundColor: '#333333' },
    darkFooter: { backgroundColor: '#121212', borderTopColor: '#333333' },
    darkCheckoutButton: { backgroundColor: '#FFFFFF', shadowColor: '#FFFFFF' },
    darkCheckoutText: { color: '#000000' },
    darkSuccessCard: { backgroundColor: '#1E1E1E' },

    header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
    headerTitle: { fontSize: 42, fontWeight: 'bold', color: '#000', letterSpacing: -1 },
    list: { paddingHorizontal: 24, paddingBottom: 100 },

    // Cart Items
    itemContainer: { marginBottom: 40 },
    brandHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    brandName: { fontSize: 24, fontWeight: '500', color: '#000' },
    brandIconPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
    brandInitial: { fontSize: 18, fontWeight: '300', color: '#000' },
    itemContent: { flexDirection: 'row', marginBottom: 20 },
    itemImage: { width: 120, height: 150, borderRadius: 12, backgroundColor: '#F5F5F5' },
    itemDetails: { flex: 1, marginLeft: 20, justifyContent: 'space-between' },
    itemInfo: { gap: 4 },
    itemName: { fontSize: 16, fontWeight: '500', color: '#000', lineHeight: 22 },
    itemVariant: { fontSize: 14, color: '#666' },
    itemPrice: { fontSize: 16, fontWeight: '400', color: '#000' },
    itemActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    quantityContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 30, borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 6, paddingVertical: 6, height: 50 },
    quantityBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 18, backgroundColor: '#F5F5F5' },
    quantityText: { fontSize: 16, fontWeight: '600', marginHorizontal: 16, minWidth: 20, textAlign: 'center' },
    moreBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },

    footer: { position: 'absolute', bottom: 80, left: 0, right: 0, padding: 24 },
    checkoutButton: { backgroundColor: '#000', paddingVertical: 18, paddingHorizontal: 24, borderRadius: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
    checkoutButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    checkoutPrice: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 18, color: Colors.textLight },

    // Checkout Modal
    checkoutOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    checkoutModal: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '85%' },
    darkCheckoutModal: { backgroundColor: '#1E1E1E' },
    checkoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    checkoutTitle: { fontSize: 22, fontWeight: '700', color: '#000' },

    // Step Indicator
    stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24, gap: 0 },
    stepDot: { flexDirection: 'row', alignItems: 'center' },
    dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
    dotActive: { backgroundColor: '#000' },
    dotNumber: { fontSize: 12, fontWeight: '700', color: '#999' },
    dotNumberActive: { color: '#FFF' },
    stepLabel: { fontSize: 11, color: '#999', marginLeft: 4, fontWeight: '600' },
    stepLabelActive: { color: '#000' },
    stepLine: { width: 30, height: 2, backgroundColor: '#E0E0E0', marginHorizontal: 8 },
    stepLineActive: { backgroundColor: '#000' },

    // Step Content
    stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    stepIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    stepTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
    stepSubtitle: { fontSize: 13, color: '#999', marginTop: 1 },

    // Selection Cards
    selectionCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, backgroundColor: '#F9F9F9', marginBottom: 8, gap: 12, borderWidth: 2, borderColor: 'transparent' },
    darkSelectionCard: { backgroundColor: '#2A2A2A' },
    selectedCard: { borderColor: '#000' },
    selectionIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    selectionContent: { flex: 1 },
    selectionTitle: { fontSize: 15, fontWeight: '600', color: '#000' },
    selectionDesc: { fontSize: 12, color: '#999', marginTop: 2 },

    // Summary Chip
    summaryChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0F0F0', borderRadius: 10, padding: 10, marginBottom: 16 },
    summaryChipText: { flex: 1, fontSize: 12, color: '#000', fontWeight: '500' },
    changeText: { fontSize: 12, fontWeight: '700', color: '#007AFF' },

    // Confirm
    confirmRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    confirmRowLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
    confirmLabel: { fontSize: 11, color: '#999', textTransform: 'uppercase', fontWeight: '600', letterSpacing: 0.5 },
    confirmValue: { fontSize: 15, fontWeight: '600', color: '#000', marginTop: 2 },
    confirmSub: { fontSize: 12, color: '#999', marginTop: 1 },
    confirmTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, marginTop: 16, marginBottom: 8 },
    confirmTotalLabel: { fontSize: 16, fontWeight: '600', color: '#000' },
    confirmTotalValue: { fontSize: 20, fontWeight: '700', color: '#000' },

    placeOrderBtn: { backgroundColor: '#000', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
    placeOrderText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

    // Add New
    addNewBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, marginTop: 16 },
    addNewBtnText: { fontSize: 14, fontWeight: '600', color: '#000' },
    addNewInline: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: '#E0E0E0', borderRadius: 14, marginBottom: 8, marginTop: 4 },
    addNewInlineText: { fontSize: 13, color: '#666', fontWeight: '500' },

    // Loading
    loadingContainer: { alignItems: 'center', paddingVertical: 60, gap: 12 },
    loadingText: { fontSize: 14, color: '#999' },

    // Empty
    emptyCheckout: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    emptyCheckoutText: { fontSize: 15, color: '#999' },

    // Success
    successCard: { backgroundColor: '#FFF', padding: 40, borderRadius: 20, alignItems: 'center', width: '80%', alignSelf: 'center', marginBottom: '40%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
    iconContainer: { marginBottom: 20 },
    successTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.primary, marginBottom: 8 },
    successMessage: { fontSize: 16, color: Colors.textLight, textAlign: 'center' },
});
