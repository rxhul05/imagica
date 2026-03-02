import { useRouter } from 'expo-router';
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';

const MOCK_CATEGORIES = [
    { id: '1', name: 'Makeup' },
    { id: '2', name: 'Skincare' },
    { id: '3', name: 'Fragrance' },
    { id: '4', name: 'Hair' },
];

import { PRODUCTS } from '../../data/products';


import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const HERO_BANNERS = [
    { id: '1', image: require('../../assets/images/hero_fenty.png'), title: 'Fenty Beauty', subtitle: 'Shine bright like a diamond' },
    { id: '2', image: require('../../assets/images/hero_rare.png'), title: 'Rare Beauty', subtitle: 'Makeup made to feel good in' },
    { id: '3', image: require('../../assets/images/hero_kylie.png'), title: 'Kylie Cosmetics', subtitle: 'The new era of glam' },
];

const PREMIUM_COLLECTIONS = [
    { id: '1', image: require('../../assets/images/premium_fenty.png'), title: 'Fenty Beauty' },
    { id: '2', image: require('../../assets/images/premium_rare.png'), title: 'Rare Beauty' },
    { id: '3', image: require('../../assets/images/premium_kylie.png'), title: 'Kylie Cosmetics' },
];

import { useEffect, useRef, useState } from 'react';

import { useThemeStore } from '../../store/themeStore';

export default function HomeScreen() {
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const { mode } = useThemeStore();
    const isDarkMode = mode === 'dark';

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % HERO_BANNERS.length;
                flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
                return nextIndex;
            });
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    const renderProduct = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.productCard, isDarkMode && styles.darkCard]}
            onPress={() => router.push(`/product/${item.id}`)}
        >
            <Image source={item.image_url} style={styles.productImage} resizeMode="contain" />
            <View style={styles.productInfo}>
                <Text style={[styles.productBrand, isDarkMode && styles.darkText]}>{item.brand}</Text>
                <Text style={[styles.productName, isDarkMode && styles.darkTextLight]} numberOfLines={2}>{item.name}</Text>
                <Text style={[styles.productPrice, isDarkMode && styles.darkText]}>₹{item.price}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderHeroItem = ({ item }: { item: any }) => (
        <View style={styles.heroItem}>
            <Image source={item.image} style={styles.heroImage} resizeMode="cover" />
            <View style={styles.heroOverlay}>
                <Text style={styles.heroTitle}>{item.title}</Text>
                <Text style={styles.heroSubtitle}>{item.subtitle}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>Discover</Text>
                </View>

                {/* Hero Banner Carousel */}
                <View style={styles.heroContainer}>
                    <FlatList
                        ref={flatListRef}
                        data={HERO_BANNERS}
                        renderItem={renderHeroItem}
                        keyExtractor={(item) => item.id}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        snapToAlignment="center"
                        decelerationRate="fast"
                        onScrollToIndexFailed={(info) => {
                            const wait = new Promise((resolve) => setTimeout(resolve, 500));
                            wait.then(() => {
                                flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                            });
                        }}
                    />
                </View>

                {/* Categories */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Shop by Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
                        {MOCK_CATEGORIES.map((cat) => (
                            <TouchableOpacity key={cat.id} style={[styles.categoryPill, isDarkMode && styles.darkPill]}>
                                <Text style={[styles.categoryText, isDarkMode && styles.darkText]}>{cat.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Premium Collections */}
                <View style={[styles.premiumSection, isDarkMode && styles.darkPremiumSection]}>
                    <Text style={styles.premiumTitle}>Exclusive Collections</Text>
                    <Text style={styles.premiumSubtitle}>Curated by Icons</Text>
                    <FlatList
                        data={PREMIUM_COLLECTIONS}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.premiumCard}
                                onPress={() => router.push(`/brand/${item.title}`)}
                            >
                                <Image source={item.image} style={styles.premiumImage} />
                                <View style={styles.premiumOverlay}>
                                    <Text style={styles.premiumCardTitle}>{item.title}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.premiumList}
                    />
                </View>

                {/* Body Lotions & Care */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Body Lotions & Care</Text>
                    <FlatList
                        data={PRODUCTS.filter(p => p.category === 'Skincare' || p.category === 'Body Care')}
                        renderItem={renderProduct}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.productsList}
                    />
                </View>

                {/* Perfumes */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Trending Perfumes</Text>
                    <FlatList
                        data={PRODUCTS.filter(p => p.category === 'Fragrance')}
                        renderItem={renderProduct}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.productsList}
                    />
                </View>

                {/* Facial Cleansers */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Facial Cleansers</Text>
                    <FlatList
                        data={PRODUCTS.filter(p => p.category === 'Cleanser')}
                        renderItem={renderProduct}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.productsList}
                    />
                </View>

                {/* Masks & Packs */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Masks & Packs</Text>
                    <FlatList
                        data={PRODUCTS.filter(p => p.category === 'Masks')}
                        renderItem={renderProduct}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.productsList}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
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
    darkCard: {
        backgroundColor: '#1E1E1E',
    },
    darkPill: {
        backgroundColor: '#333333',
        borderColor: '#444444',
    },
    darkPremiumSection: {
        backgroundColor: '#000000',
    },
    header: {
        padding: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    heroContainer: {
        marginHorizontal: 20,
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: Colors.gray,
        marginBottom: 24,
    },
    heroItem: {
        width: width - 40, // Full width minus margins
        height: 200,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.secondary,
        marginBottom: 4,
    },
    heroSubtitle: {
        fontSize: 14,
        color: Colors.secondary,
        opacity: 0.9,
    },
    heroPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    heroText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    heroSubText: {
        fontSize: 16,
        color: Colors.textLight,
        marginTop: 8,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.primary,
        marginLeft: 20,
        marginBottom: 16,
    },
    categoriesList: {
        paddingHorizontal: 20,
        gap: 12,
    },
    categoryPill: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: Colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.lightGray,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text,
    },
    productsList: {
        paddingHorizontal: 20,
        gap: 16,
    },
    productCard: {
        width: 160,
        backgroundColor: Colors.background,
        borderRadius: 8,
        // shadowColor: '#000',
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.1,
        // shadowRadius: 4,
        // elevation: 2,
    },
    productImage: {
        width: '100%',
        height: 160,
        borderRadius: 8,
        backgroundColor: Colors.gray,
        marginBottom: 8,
    },
    productInfo: {
        padding: 4,
    },
    productBrand: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 2,
    },
    productName: {
        fontSize: 14,
        color: Colors.textLight,
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    premiumSection: {
        marginBottom: 24,
        backgroundColor: Colors.gray,
        paddingVertical: 24,
    },
    premiumTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#D4AF37', // Gold
        textAlign: 'center',
        marginBottom: 4,
        letterSpacing: 1,
    },
    premiumSubtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginBottom: 20,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    premiumList: {
        paddingHorizontal: 20,
        gap: 16,
    },
    premiumCard: {
        width: 200,
        height: 250,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    premiumImage: {
        width: '100%',
        height: '100%',
    },
    premiumOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
    },
    premiumCardTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});
