import { useRouter } from 'expo-router';
import { ArrowLeft, CreditCard, Plus, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { addPayment, deletePayment, getUserPayments } from '../../lib/db';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

interface PaymentMethod {
    id: string;
    type: string;
    last4: string;
    expiry: string;
}

export default function PaymentsScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { mode } = useThemeStore();
    const isDarkMode = mode === 'dark';

    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<{ card?: string; expiry?: string; cvc?: string }>({});

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        if (!user) return;
        try {
            const data = await getUserPayments(user.uid);
            setMethods(data as PaymentMethod[]);
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const validateFields = (): boolean => {
        const newErrors: { card?: string; expiry?: string; cvc?: string } = {};
        if (!cardNumber.trim()) newErrors.card = 'Card number is required';
        else if (cardNumber.replace(/\s/g, '').length < 13) newErrors.card = 'Enter a valid card number';
        if (!expiry.trim()) newErrors.expiry = 'Required';
        else if (!/^\d{2}\/\d{2}$/.test(expiry)) newErrors.expiry = 'Use MM/YY';
        if (!cvc.trim()) newErrors.cvc = 'Required';
        else if (cvc.length < 3) newErrors.cvc = 'Invalid';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddCard = async () => {
        if (!validateFields()) return;
        if (!user) return;

        setSaving(true);
        try {
            const last4 = cardNumber.slice(-4);
            const type = 'MasterCard';

            const docRef = await addPayment(user.uid, type, last4, expiry);
            setMethods([{ id: docRef.id, type, last4, expiry }, ...methods]);
            setCardNumber('');
            setExpiry('');
            setCvc('');
            setErrors({});
            setIsModalVisible(false);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert('Remove Card', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove', style: 'destructive', onPress: async () => {
                    try {
                        await deletePayment(id);
                        setMethods(methods.filter(m => m.id !== id));
                    } catch (error: any) {
                        Alert.alert('Error', error.message);
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item }: { item: PaymentMethod }) => (
        <View style={[styles.card, isDarkMode && styles.darkCard]}>
            <View style={styles.cardLeft}>
                <CreditCard size={24} color={Colors.primary} />
                <View style={styles.cardInfo}>
                    <Text style={[styles.cardType, isDarkMode && styles.darkText]}>{item.type} ending in {item.last4}</Text>
                    <Text style={[styles.cardExpiry, isDarkMode && styles.darkTextLight]}>Expires {item.expiry}</Text>
                </View>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Trash2 size={20} color={Colors.error} />
            </TouchableOpacity>
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
                <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>Payments & Payouts</Text>
                <TouchableOpacity onPress={() => setIsModalVisible(true)}>
                    <Plus size={24} color={isDarkMode ? '#FFF' : Colors.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={methods}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={[styles.emptyText, isDarkMode && styles.darkTextLight]}>No payment methods saved.</Text>}
            />

            <Modal visible={isModalVisible} animationType="slide" transparent>
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
                        <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>Add New Card</Text>
                        <View>
                            <TextInput
                                style={[styles.input, isDarkMode && styles.darkInput, errors.card && styles.inputError]}
                                placeholder="Card Number"
                                value={cardNumber}
                                onChangeText={(t) => { setCardNumber(t); setErrors(prev => ({ ...prev, card: undefined })); }}
                                keyboardType="number-pad"
                                maxLength={16}
                                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                            />
                            {errors.card && <Text style={styles.errorText}>{errors.card}</Text>}
                        </View>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <TextInput
                                    style={[styles.input, isDarkMode && styles.darkInput, errors.expiry && styles.inputError]}
                                    placeholder="MM/YY"
                                    value={expiry}
                                    onChangeText={(t) => { setExpiry(t); setErrors(prev => ({ ...prev, expiry: undefined })); }}
                                    maxLength={5}
                                    placeholderTextColor={isDarkMode ? '#666' : '#999'}
                                />
                                {errors.expiry && <Text style={styles.errorText}>{errors.expiry}</Text>}
                            </View>
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <TextInput
                                    style={[styles.input, isDarkMode && styles.darkInput, errors.cvc && styles.inputError]}
                                    placeholder="CVC"
                                    value={cvc}
                                    onChangeText={(t) => { setCvc(t); setErrors(prev => ({ ...prev, cvc: undefined })); }}
                                    keyboardType="number-pad"
                                    maxLength={3}
                                    secureTextEntry
                                    placeholderTextColor={isDarkMode ? '#666' : '#999'}
                                />
                                {errors.cvc && <Text style={styles.errorText}>{errors.cvc}</Text>}
                            </View>
                        </View>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.cancelButton, isDarkMode && styles.darkBorder]} onPress={() => { setIsModalVisible(false); setErrors({}); }}>
                                <Text style={[styles.buttonText, isDarkMode && styles.darkText]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={handleAddCard} disabled={saving}>
                                {saving ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={[styles.buttonText, { color: Colors.secondary }]}>Save</Text>
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
    container: { flex: 1, backgroundColor: Colors.background },
    darkContainer: { backgroundColor: '#121212' },
    darkHeader: { borderBottomColor: '#333333' },
    darkText: { color: '#FFFFFF' },
    darkTextLight: { color: '#AAAAAA' },
    darkCard: { backgroundColor: '#1E1E1E', borderColor: '#333333' },
    darkModalContent: { backgroundColor: '#1E1E1E' },
    darkInput: { backgroundColor: '#333333', borderColor: '#444444', color: '#FFFFFF' },
    darkBorder: { borderColor: '#444444' },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
    list: { padding: 20 },
    card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.lightGray },
    cardLeft: { flexDirection: 'row', alignItems: 'center' },
    cardInfo: { marginLeft: 16 },
    cardType: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
    cardExpiry: { fontSize: 14, color: Colors.textLight },
    emptyText: { textAlign: 'center', color: Colors.textLight, marginTop: 40 },
    modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
    modalContent: { backgroundColor: Colors.background, borderRadius: 20, padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 8, padding: 12, marginBottom: 4, fontSize: 16 },
    inputError: { borderColor: '#D32F2F' },
    errorText: { color: '#D32F2F', fontSize: 12, marginBottom: 8, marginLeft: 4 },
    row: { flexDirection: 'row', marginBottom: 8 },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginTop: 8 },
    cancelButton: { flex: 1, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: Colors.lightGray, alignItems: 'center' },
    saveButton: { flex: 1, padding: 16, borderRadius: 8, backgroundColor: Colors.primary, alignItems: 'center' },
    buttonText: { fontSize: 16, fontWeight: '600' },
});
