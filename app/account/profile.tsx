import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    ChevronRight, CreditCard, Heart, MapPin,
    Package, Palette, Phone, Settings, Shield, User
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { getProfile, saveProfile } from '../../lib/db';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, appUser, isAdmin, refreshProfile } = useAuthStore();
    const { mode } = useThemeStore();
    const isDarkMode = mode === 'dark';

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        if (!user) return;
        try {
            const profile = await getProfile(user.uid);
            if (profile) {
                setFullName(profile.full_name || '');
                setPhone(profile.phone || '');
            } else {
                setFullName(appUser?.full_name || user.email?.split('@')[0] || '');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            setFullName(appUser?.full_name || '');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        if (!fullName.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }
        setSaving(true);
        try {
            await saveProfile(user.uid, {
                full_name: fullName.trim(),
                phone: phone.trim(),
            });
            await refreshProfile();
            setIsEditing(false);
            Alert.alert('Success', 'Profile updated successfully!');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    const getInitials = () => {
        if (fullName) {
            const parts = fullName.trim().split(' ');
            return parts.length > 1
                ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
                : parts[0][0].toUpperCase();
        }
        return user?.email?.charAt(0).toUpperCase() || 'U';
    };

    const menuItems = [
        { icon: Package, label: 'My Orders', route: '/account/orders', color: '#1565C0' },
        { icon: Heart, label: 'Wishlist', route: '/account/wishlist', color: '#C62828' },
        { icon: MapPin, label: 'Addresses', route: '/account/addresses', color: '#2E7D32' },
        { icon: CreditCard, label: 'Payment Methods', route: '/account/payments', color: '#EF6C00' },
        { icon: Palette, label: 'Beauty Preferences', route: '/account/preferences', color: '#7B1FA2' },
        { icon: User, label: 'Personal Info', route: '/account/personal-info', color: '#00838F' },
    ];

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
                <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>My Profile</Text>
                <TouchableOpacity onPress={() => isEditing ? handleSaveProfile() : setIsEditing(true)}>
                    {saving ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                        <Text style={styles.editButton}>{isEditing ? 'Save' : 'Edit'}</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <View style={[styles.avatarContainer, isDarkMode && { backgroundColor: '#333' }]}>
                        <Text style={styles.avatarText}>{getInitials()}</Text>
                    </View>
                    {isAdmin && (
                        <View style={styles.adminTag}>
                            <Shield size={12} color="#2E7D32" />
                            <Text style={styles.adminTagText}>Admin</Text>
                        </View>
                    )}
                </View>

                {/* Profile Info */}
                <View style={[styles.infoCard, isDarkMode && styles.darkCard]}>
                    <View style={styles.infoRow}>
                        <View style={[styles.infoIconBox, { backgroundColor: isDarkMode ? '#333' : '#F3E5F5' }]}>
                            <User size={18} color={isDarkMode ? '#FFF' : '#7B1FA2'} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={[styles.infoLabel, isDarkMode && styles.darkTextLight]}>Full Name</Text>
                            {isEditing ? (
                                <TextInput
                                    style={[styles.infoInput, isDarkMode && styles.darkInput]}
                                    value={fullName}
                                    onChangeText={setFullName}
                                    placeholder="Enter your name"
                                    placeholderTextColor={isDarkMode ? '#666' : '#999'}
                                />
                            ) : (
                                <Text style={[styles.infoValue, isDarkMode && styles.darkText]}>
                                    {fullName || 'Not set'}
                                </Text>
                            )}
                        </View>
                    </View>

                    <View style={[styles.divider, isDarkMode && styles.darkDivider]} />

                    <View style={styles.infoRow}>
                        <View style={[styles.infoIconBox, { backgroundColor: isDarkMode ? '#333' : '#E3F2FD' }]}>
                            <Settings size={18} color={isDarkMode ? '#FFF' : '#1565C0'} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={[styles.infoLabel, isDarkMode && styles.darkTextLight]}>Email</Text>
                            <Text style={[styles.infoValue, isDarkMode && styles.darkText]}>
                                {user?.email || 'Not set'}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.divider, isDarkMode && styles.darkDivider]} />

                    <View style={styles.infoRow}>
                        <View style={[styles.infoIconBox, { backgroundColor: isDarkMode ? '#333' : '#E8F5E9' }]}>
                            <Phone size={18} color={isDarkMode ? '#FFF' : '#2E7D32'} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={[styles.infoLabel, isDarkMode && styles.darkTextLight]}>Phone</Text>
                            {isEditing ? (
                                <TextInput
                                    style={[styles.infoInput, isDarkMode && styles.darkInput]}
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="Enter phone number"
                                    keyboardType="phone-pad"
                                    placeholderTextColor={isDarkMode ? '#666' : '#999'}
                                />
                            ) : (
                                <Text style={[styles.infoValue, isDarkMode && styles.darkText]}>
                                    {phone || 'Not set'}
                                </Text>
                            )}
                        </View>
                    </View>

                    {isAdmin && (
                        <>
                            <View style={[styles.divider, isDarkMode && styles.darkDivider]} />
                            <View style={styles.infoRow}>
                                <View style={[styles.infoIconBox, { backgroundColor: isDarkMode ? '#333' : '#E8F5E9' }]}>
                                    <Shield size={18} color={isDarkMode ? '#FFF' : '#2E7D32'} />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={[styles.infoLabel, isDarkMode && styles.darkTextLight]}>Role</Text>
                                    <Text style={[styles.infoValue, { color: '#2E7D32', fontWeight: '700' }]}>
                                        Administrator
                                    </Text>
                                </View>
                            </View>
                        </>
                    )}
                </View>

                {/* Quick Links */}
                <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Quick Links</Text>
                <View style={[styles.menuCard, isDarkMode && styles.darkCard]}>
                    {menuItems.map((item, index) => (
                        <View key={item.label}>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => router.push(item.route as any)}
                            >
                                <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? '#333' : `${item.color}15` }]}>
                                    <item.icon size={20} color={item.color} />
                                </View>
                                <Text style={[styles.menuLabel, isDarkMode && styles.darkText]}>{item.label}</Text>
                                <ChevronRight size={18} color={isDarkMode ? '#666' : '#CCC'} />
                            </TouchableOpacity>
                            {index < menuItems.length - 1 && (
                                <View style={[styles.menuDivider, isDarkMode && styles.darkDivider]} />
                            )}
                        </View>
                    ))}
                </View>

                {/* Member Since */}
                <View style={[styles.memberCard, isDarkMode && styles.darkCard]}>
                    <Text style={[styles.memberLabel, isDarkMode && styles.darkTextLight]}>Member Since</Text>
                    <Text style={[styles.memberValue, isDarkMode && styles.darkText]}>
                        {user?.metadata?.creationTime
                            ? new Date(user.metadata.creationTime).toLocaleDateString('en-IN', {
                                year: 'numeric', month: 'long', day: 'numeric'
                            })
                            : 'N/A'}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F7F7' },
    darkContainer: { backgroundColor: '#121212' },
    center: { justifyContent: 'center', alignItems: 'center' },
    darkText: { color: '#FFF' },
    darkTextLight: { color: '#AAA' },
    darkCard: { backgroundColor: '#1E1E1E' },
    darkHeader: { borderBottomColor: '#333' },
    darkDivider: { backgroundColor: '#333' },
    darkInput: { color: '#FFF', borderBottomColor: '#444' },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
    editButton: { fontSize: 15, fontWeight: '600', color: '#007AFF' },

    scrollContent: { paddingBottom: 40 },

    // Avatar
    avatarSection: { alignItems: 'center', paddingVertical: 28 },
    avatarContainer: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    avatarText: { fontSize: 32, fontWeight: '700', color: '#FFF' },
    adminTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
    adminTagText: { fontSize: 12, fontWeight: '600', color: '#2E7D32' },

    // Info Card
    infoCard: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 16, padding: 4, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    infoRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
    infoIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: 12, color: '#999', marginBottom: 2 },
    infoValue: { fontSize: 15, fontWeight: '500', color: '#000' },
    infoInput: { fontSize: 15, fontWeight: '500', color: '#000', borderBottomWidth: 1, borderBottomColor: '#E0E0E0', paddingVertical: 4 },
    divider: { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 14 },

    // Section Title
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#000', paddingHorizontal: 20, marginBottom: 12 },

    // Menu Card
    menuCard: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 16, padding: 4, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
    menuIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#000' },
    menuDivider: { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 14 },

    // Member Card
    memberCard: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    memberLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
    memberValue: { fontSize: 15, fontWeight: '600', color: '#000' },
});
