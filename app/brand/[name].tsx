import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { PRODUCTS } from '../../data/products';

import { useThemeStore } from '../../store/themeStore';

export default function BrandCollectionScreen() {
    const { name } = useLocalSearchParams();
    const router = useRouter();
    const { mode } = useThemeStore();
    const isDarkMode = mode === 'dark';

    // Filter products by brand name (case-insensitive partial match)
    const brandProducts = PRODUCTS.filter(p =>
        p.brand.toLowerCase().includes((name as string).toLowerCase())
    );

    const renderProduct = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.productCard, isDarkMode && styles.darkCard]}
            onPress={() => router.push(`/product/${item.id}`)}
        >
            <Image source={item.image_url} style={styles.productImage} />
            <View style={styles.productInfo}>
                <Text style={[styles.productBrand, isDarkMode && styles.darkTextLight]}>{item.brand}</Text>
                <Text style={[styles.productName, isDarkMode && styles.darkText]} numberOfLines={2}>{item.name}</Text>
                <Text style={[styles.productPrice, isDarkMode && styles.darkText]}>₹{item.price}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
            <View style={[styles.header, isDarkMode && styles.darkHeader]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={isDarkMode ? '#FFF' : Colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>{name} Collection</Text>
            </View>

            <FlatList
                data={brandProducts}
                renderItem={renderProduct}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.list}
                columnWrapperStyle={styles.row}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyText, isDarkMode && styles.darkTextLight]}>No products found for this collection.</Text>
                    </View>
                }
            />
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
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.lightGray,
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    list: {
        padding: 20,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    productCard: {
        width: '48%',
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    productImage: {
        width: '100%',
        height: 160,
        borderRadius: 8,
        backgroundColor: Colors.gray,
        marginBottom: 12,
    },
    productInfo: {
    },
    productBrand: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textLight,
        marginBottom: 4,
    },
    productName: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text,
        marginBottom: 8,
        height: 40,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: Colors.textLight,
    },
});
