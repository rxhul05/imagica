import { useRouter } from 'expo-router';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

export default function PersonalInfoScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { mode } = useThemeStore();
    const isDarkMode = mode === 'dark';

    const [name, setName] = useState('');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        if (!user) return;
        try {
            const docRef = doc(db, 'profiles', user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setName(data.full_name || '');
                setPhone(data.phone || '');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const updates = {
                full_name: name,
                phone: phone,
                updated_at: serverTimestamp(),
            };

            await setDoc(doc(db, 'profiles', user.uid), updates, { merge: true });

            // Also update the users table
            await setDoc(doc(db, 'users', user.uid), {
                full_name: name,
                phone: phone,
                updated_at: serverTimestamp(),
            }, { merge: true });

            Alert.alert('Success', 'Personal information updated successfully!');
            router.back();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
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
                <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>Personal Information</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                        <Text style={styles.saveButton}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, isDarkMode && styles.darkTextLight]}>Full Name</Text>
                    <TextInput
                        style={[styles.input, isDarkMode && styles.darkInput]}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter your full name"
                        placeholderTextColor={isDarkMode ? '#666' : '#999'}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, isDarkMode && styles.darkTextLight]}>Email Address</Text>
                    <TextInput
                        style={[styles.input, isDarkMode && styles.darkInput, styles.disabledInput]}
                        value={email}
                        editable={false}
                        placeholder="Enter your email"
                        placeholderTextColor={isDarkMode ? '#666' : '#999'}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, isDarkMode && styles.darkTextLight]}>Phone Number</Text>
                    <TextInput
                        style={[styles.input, isDarkMode && styles.darkInput]}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Enter your phone number"
                        placeholderTextColor={isDarkMode ? '#666' : '#999'}
                        keyboardType="phone-pad"
                    />
                </View>
            </View>
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
    darkInput: {
        backgroundColor: '#1E1E1E',
        borderColor: '#333333',
        color: '#FFFFFF',
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
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    saveButton: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.primary,
    },
    form: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: Colors.textLight,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.lightGray,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: Colors.text,
        backgroundColor: Colors.surface,
    },
    disabledInput: {
        opacity: 0.7,
        backgroundColor: '#F5F5F5',
    },
});
