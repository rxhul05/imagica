import { useRouter } from 'expo-router';
import { MoreHorizontal, Search, XCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { PRODUCTS } from '../../data/products';
import { getAllProducts } from '../../lib/db';
import { useThemeStore } from '../../store/themeStore';

const TABS = ['Top Results', 'Skincare', 'Makeup', 'Fragrance', 'Hair'];

export default function BrowseScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('Top Results');
    const { mode } = useThemeStore();
    const isDarkMode = mode === 'dark';
    const [firestoreProducts, setFirestoreProducts] = useState<any[]>([]);

    useEffect(() => {
        fetchAdminProducts();
    }, []);

    const fetchAdminProducts = async () => {
        try {
            const products = await getAllProducts();
            setFirestoreProducts(products);
        } catch (error) {
            console.error('Error fetching admin products:', error);
        }
    };

    // Merge static products with admin-added Firestore products
    const allProducts = [
        ...PRODUCTS,
        ...firestoreProducts.map(p => ({
            id: `fb_${p.id}`,
            name: p.name,
            brand: p.brand,
            price: p.price,
            image_url: p.image_url, // URL string from admin
            description: p.description,
            rating: p.rating || 4.5,
            reviews: p.reviews || 0,
            category: p.category,
            isFirestore: true, // flag to know it's a URL image
        })),
    ];

    const filteredProducts = allProducts.filter(p => {
        const matchesSearch = searchQuery === '' ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brand.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesTab = activeTab === 'Top Results' ||
            p.category?.toLowerCase() === activeTab.toLowerCase();

        return matchesSearch && matchesTab;
    });

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.listItem}
            onPress={() => router.push(`/product/${item.id}`)}
        >
            <Image
                source={item.isFirestore ? { uri: item.image_url } : item.image_url}
                style={styles.itemImage}
                resizeMode="contain"
            />
            <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, isDarkMode && styles.darkText]}>{item.name}</Text>
                <Text style={[styles.itemSubtitle, isDarkMode && styles.darkTextLight]}>{item.brand}</Text>
                <Text style={[styles.itemPrice, isDarkMode && styles.darkText]}>₹{item.price}</Text>
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
                <TouchableOpacity onPress={() => setSearchQuery('')}>
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

            {/* Results Count */}
            <View style={styles.resultsInfo}>
                <Text style={[styles.resultsCount, isDarkMode && styles.darkTextLight]}>
                    {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                </Text>
            </View>

            {/* Results List */}
            <FlatList
                data={filteredProducts}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ItemSeparatorComponent={() => <View style={[styles.separator, isDarkMode && styles.darkSeparator]} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Search size={40} color={isDarkMode ? '#444' : '#CCC'} />
                        <Text style={[styles.emptyText, isDarkMode && styles.darkTextLight]}>No products found</Text>
                    </View>
                }
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
        color: '#007AFF',
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
    resultsInfo: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    resultsCount: {
        fontSize: 12,
        color: '#999',
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
        marginBottom: 2,
    },
    itemSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
        marginTop: 2,
    },
    separator: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginLeft: 112,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyText: {
        fontSize: 15,
        color: '#999',
    },
});
