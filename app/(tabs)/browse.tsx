import { useRouter } from 'expo-router';
import { MoreHorizontal, Search, XCircle } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { PRODUCTS } from '../../data/products';

const TABS = ['Top Results', 'Skincare', 'Makeup', 'Fragrance', 'Hair'];

import { useThemeStore } from '../../store/themeStore';

export default function BrowseScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('Top Results');
    const { mode } = useThemeStore();
    const isDarkMode = mode === 'dark';

    const filteredProducts = PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.listItem}
            onPress={() => router.push(`/product/${item.id}`)}
        >
            <Image source={item.image_url} style={styles.itemImage} resizeMode="contain" />
            <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, isDarkMode && styles.darkText]}>{item.name}</Text>
                <Text style={[styles.itemSubtitle, isDarkMode && styles.darkTextLight]}>{item.brand}</Text>
            </View>
            <TouchableOpacity>
                <MoreHorizontal size={20} color={isDarkMode ? '#FFF' : Colors.primary} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, isDarkMode && styles.darkSearchBar]}>
                    <Search size={20} color={isDarkMode ? '#AAA' : '#666'} />
                    <TextInput
                        style={[styles.searchInput, isDarkMode && styles.darkText]}
                        placeholder="Search products, brands..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={isDarkMode ? '#AAA' : '#666'}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <XCircle size={20} color={isDarkMode ? '#AAA' : '#666'} />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={[styles.tabsContainer, isDarkMode && styles.darkBorder]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
                    {TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[
                                styles.tab,
                                isDarkMode && styles.darkTab,
                                activeTab === tab && styles.activeTab
                            ]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[
                                styles.tabText,
                                isDarkMode && styles.darkText,
                                activeTab === tab && styles.activeTabText
                            ]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Results List */}
            <FlatList
                data={filteredProducts}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ItemSeparatorComponent={() => <View style={[styles.separator, isDarkMode && styles.darkSeparator]} />}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
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
    darkSearchBar: {
        backgroundColor: '#333333',
    },
    darkTab: {
        backgroundColor: '#1E1E1E',
        borderColor: '#333333',
    },
    darkBorder: {
        borderBottomColor: '#333333',
    },
    darkSeparator: {
        backgroundColor: '#333333',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 40,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#000',
    },
    cancelText: {
        fontSize: 16,
        color: '#007AFF', // iOS blue
    },
    tabsContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    tabsContent: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    activeTab: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    activeTabText: {
        color: '#FFF',
    },
    list: {
        paddingHorizontal: 16,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    itemImage: {
        width: 100,
        height: 60,
        borderRadius: 6,
        backgroundColor: '#F0F0F0',
    },
    itemContent: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
        marginBottom: 4,
    },
    itemSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    separator: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginLeft: 112, // Indent separator to match text start
    },
});
