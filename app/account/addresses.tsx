import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { addAddress, deleteAddress, getUserAddresses } from '../../lib/db';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

interface Address {
    id: string;
    label: string;
    full_address: string;
}

export default function AddressesScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { mode } = useThemeStore();
    const isDarkMode = mode === 'dark';

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [newAddress, setNewAddress] = useState('');
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<{ label?: string; address?: string }>({});

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        if (!user) return;
        try {
            const data = await getUserAddresses(user.uid);
            setAddresses(data as Address[]);
        } catch (error) {
            console.error('Error fetching addresses:', error);
        } finally {
            setLoading(false);
        }
    };

    const validateFields = (): boolean => {
        const newErrors: { label?: string; address?: string } = {};
        if (!newLabel.trim()) newErrors.label = 'Label is required';
        if (!newAddress.trim()) newErrors.address = 'Address is required';
        if (newAddress.trim().length < 10) newErrors.address = 'Please enter a complete address';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddAddress = async () => {
        if (!validateFields()) return;
        if (!user) return;

        setSaving(true);
        try {
            const docRef = await addAddress(user.uid, newLabel.trim(), newAddress.trim());
            setAddresses([{ id: docRef.id, label: newLabel.trim(), full_address: newAddress.trim() }, ...addresses]);
            setNewLabel('');
            setNewAddress('');
            setErrors({});
            setIsModalVisible(false);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert('Delete Address', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await deleteAddress(id);
                        setAddresses(addresses.filter(a => a.id !== id));
                    } catch (error: any) {
                        Alert.alert('Error', error.message);
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item }: { item: Address }) => (
        <View style={[styles.card, isDarkMode && styles.darkCard]}>
            <View style={styles.cardContent}>
                <Text style={[styles.cardLabel, isDarkMode && styles.darkText]}>{item.label}</Text>
                <Text style={[styles.cardText, isDarkMode && styles.darkTextLight]}>{item.full_address}</Text>
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
                <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>Addresses</Text>
                <TouchableOpacity onPress={() => setIsModalVisible(true)}>
                    <Plus size={24} color={isDarkMode ? '#FFF' : Colors.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={addresses}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={[styles.emptyText, isDarkMode && styles.darkTextLight]}>No addresses saved.</Text>}
            />

            <Modal visible={isModalVisible} animationType="slide" transparent>
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
                        <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>Add New Address</Text>
                        <View>
                            <TextInput
                                style={[styles.input, isDarkMode && styles.darkInput, errors.label && styles.inputError]}
                                placeholder="Label (e.g., Home)"
                                value={newLabel}
                                onChangeText={(t) => { setNewLabel(t); setErrors(prev => ({ ...prev, label: undefined })); }}
                                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                            />
                            {errors.label && <Text style={styles.errorText}>{errors.label}</Text>}
                        </View>
                        <View>
                            <TextInput
                                style={[styles.input, styles.textArea, isDarkMode && styles.darkInput, errors.address && styles.inputError]}
                                placeholder="Full Address"
                                value={newAddress}
                                onChangeText={(t) => { setNewAddress(t); setErrors(prev => ({ ...prev, address: undefined })); }}
                                multiline
                                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                            />
                            {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
                        </View>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.cancelButton, isDarkMode && styles.darkBorder]} onPress={() => { setIsModalVisible(false); setErrors({}); }}>
                                <Text style={[styles.buttonText, isDarkMode && styles.darkText]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={handleAddAddress} disabled={saving}>
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
    darkModalContent: {
        backgroundColor: '#1E1E1E',
    },
    darkInput: {
        backgroundColor: '#333333',
        borderColor: '#444444',
        color: '#FFFFFF',
    },
    darkBorder: {
        borderColor: '#444444',
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
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.lightGray,
    },
    cardContent: { flex: 1, marginRight: 16 },
    cardLabel: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
    cardText: { fontSize: 14, color: Colors.textLight },
    emptyText: { textAlign: 'center', color: Colors.textLight, marginTop: 40 },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 20,
    },
    modalContent: {
        backgroundColor: Colors.background,
        borderRadius: 20,
        padding: 24,
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: {
        borderWidth: 1,
        borderColor: Colors.lightGray,
        borderRadius: 8,
        padding: 12,
        marginBottom: 4,
        fontSize: 16,
    },
    inputError: {
        borderColor: '#D32F2F',
    },
    errorText: {
        color: '#D32F2F',
        fontSize: 12,
        marginBottom: 12,
        marginLeft: 4,
    },
    textArea: { height: 80, textAlignVertical: 'top' },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginTop: 12 },
    cancelButton: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.lightGray,
        alignItems: 'center',
    },
    saveButton: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        backgroundColor: Colors.primary,
        alignItems: 'center',
    },
    buttonText: { fontSize: 16, fontWeight: '600' },
});
