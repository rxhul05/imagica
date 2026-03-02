import { useRouter } from 'expo-router';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

const PREFERENCES = {
    skinType: ['Oily', 'Dry', 'Combination', 'Normal', 'Sensitive'],
    skinConcerns: ['Acne', 'Aging', 'Dark Spots', 'Dryness', 'Redness', 'Pores'],
    hairType: ['Straight', 'Wavy', 'Curly', 'Coily'],
    makeupStyle: ['Natural', 'Glam', 'Edgy', 'Classic'],
};

export default function PreferencesScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { mode } = useThemeStore();
    const isDarkMode = mode === 'dark';

    const [selected, setSelected] = useState<Record<string, string[]>>({
        skinType: [],
        skinConcerns: [],
        hairType: [],
        makeupStyle: [],
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        if (!user) return;
        try {
            const docRef = doc(db, 'preferences', user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setSelected({
                    skinType: data.skin_type || [],
                    skinConcerns: data.skin_concerns || [],
                    hairType: data.hair_type || [],
                    makeupStyle: data.makeup_style || [],
                });
            }
        } catch (error) {
            console.error('Error fetching preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (category: string, item: string) => {
        setSelected(prev => {
            const current = prev[category] || [];
            const updated = current.includes(item)
                ? current.filter(i => i !== item)
                : [...current, item];
            return { ...prev, [category]: updated };
        });
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const updates = {
                user_id: user.uid,
                skin_type: selected.skinType,
                skin_concerns: selected.skinConcerns,
                hair_type: selected.hairType,
                makeup_style: selected.makeupStyle,
                updated_at: serverTimestamp(),
            };

            await setDoc(doc(db, 'preferences', user.uid), updates, { merge: true });

            Alert.alert('Success', 'Beauty preferences updated!');
            router.back();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    const renderSection = (title: string, key: string, items: string[]) => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>{title}</Text>
            <View style={styles.chipsContainer}>
                {items.map(item => {
                    const isSelected = selected[key]?.includes(item);
                    return (
                        <TouchableOpacity
                            key={item}
                            style={[
                                styles.chip,
                                isDarkMode && styles.darkChip,
                                isSelected && styles.chipSelected
                            ]}
                            onPress={() => toggleSelection(key, item)}
                        >
                            <Text style={[
                                styles.chipText,
                                isDarkMode && styles.darkText,
                                isSelected && styles.chipTextSelected
                            ]}>
                                {item}
                            </Text>
                            {isSelected && <Check size={16} color="#FFF" style={{ marginLeft: 4 }} />}
                        </TouchableOpacity>
                    );
                })}
            </View>
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
                <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>Beauty Preferences</Text>
                <TouchableOpacity onPress={handleSave} disabled={saving}>
                    {saving ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                        <Text style={styles.saveButton}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.subtitle, isDarkMode && styles.darkTextLight]}>
                    Tell us about yourself to get personalized recommendations.
                </Text>

                {renderSection('Skin Type', 'skinType', PREFERENCES.skinType)}
                {renderSection('Skin Concerns', 'skinConcerns', PREFERENCES.skinConcerns)}
                {renderSection('Hair Type', 'hairType', PREFERENCES.hairType)}
                {renderSection('Makeup Style', 'makeupStyle', PREFERENCES.makeupStyle)}
            </ScrollView>
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
    darkChip: {
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
    saveButton: { fontSize: 16, fontWeight: '600', color: Colors.primary },
    content: { padding: 20 },
    subtitle: { fontSize: 14, color: Colors.textLight, marginBottom: 24, lineHeight: 20 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 12 },
    chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.lightGray,
        backgroundColor: Colors.surface,
    },
    chipSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    chipText: { fontSize: 14, color: Colors.text },
    chipTextSelected: { color: '#FFF', fontWeight: '600' },
});
