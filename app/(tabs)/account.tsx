import { useRouter } from 'expo-router';
import { ChevronRight, CreditCard, Heart, LayoutDashboard, LogOut, MapPin, Moon, Package, Settings, Sparkles, Sun, User } from 'lucide-react-native';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

export default function AccountScreen() {
    const { user, appUser, isAdmin, signOut } = useAuthStore();
    const { mode, setMode } = useThemeStore();
    const router = useRouter();
    const isDarkMode = mode === 'dark';

    const toggleTheme = () => {
        setMode(isDarkMode ? 'light' : 'dark');
    };

    const handleSignOut = async () => {
        await signOut();
        router.replace('/auth');
    };

    const handleSignIn = () => {
        router.push('/auth');
    };

    const menuGroups = [
        ...(isAdmin ? [{
            title: 'Admin Panel',
            items: [
                { icon: LayoutDashboard, label: 'Admin Dashboard', route: '/admin/dashboard' },
            ]
        }] : []),
        {
            title: 'Account Settings',
            items: [
                { icon: User, label: 'Personal Information', route: '/account/personal-info' },
                { icon: MapPin, label: 'Addresses', route: '/account/addresses' },
                { icon: CreditCard, label: 'Payments & Payouts', route: '/account/payments' },
            ]
        },
        {
            title: 'My Beauty',
            items: [
                { icon: Package, label: 'My Orders', route: '/account/orders' },
                { icon: Heart, label: 'Wishlist', route: '/account/wishlist' },
                { icon: Sparkles, label: 'Beauty Preferences', route: '/account/preferences' },
            ]
        },
        {
            title: 'App Settings',
            items: [
                {
                    icon: isDarkMode ? Moon : Sun,
                    label: 'Dark Mode',
                    type: 'toggle',
                    value: isDarkMode,
                    onToggle: toggleTheme
                },
                { icon: Settings, label: 'General Settings', route: '' },
            ]
        }
    ];

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>Profile</Text>
                </View>

                {/* User Profile Card */}
                <TouchableOpacity style={[styles.profileCard, isDarkMode && styles.darkBorder]} onPress={user ? () => router.push('/account/profile') : handleSignIn}>
                    <View style={[styles.avatarContainer, isDarkMode && styles.darkAvatarContainer]}>
                        {user?.email ? (
                            <Text style={styles.avatarText}>{user.email.charAt(0).toUpperCase()}</Text>
                        ) : (
                            <User size={32} color={isDarkMode ? '#FFF' : Colors.textLight} />
                        )}
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={[styles.profileName, isDarkMode && styles.darkText]}>{appUser?.full_name || user?.email?.split('@')[0] || 'Guest User'}</Text>
                        <Text style={[styles.profileAction, isDarkMode && styles.darkTextLight]}>{user ? 'Show profile' : 'Sign in to your account'}</Text>
                    </View>
                    <ChevronRight size={20} color={isDarkMode ? '#FFF' : Colors.textLight} />
                </TouchableOpacity>

                {/* Beauty Insider Banner */}
                <View style={styles.bannerContainer}>
                    <View style={styles.bannerContent}>
                        <View>
                            <Text style={styles.bannerTitle}>Beauty Insider</Text>
                            <Text style={styles.bannerText}>Earn points & get exclusive rewards.</Text>
                        </View>
                        <Sparkles size={32} color={Colors.secondary} fill={Colors.secondary} />
                    </View>
                </View>

                {/* Menu Items */}
                <View style={styles.menuContainer}>
                    {menuGroups.map((group, groupIndex) => (
                        <View key={groupIndex} style={styles.menuGroup}>
                            <Text style={[styles.groupTitle, isDarkMode && styles.darkText]}>{group.title}</Text>
                            {group.items.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.menuItem, isDarkMode && styles.darkBorder]}
                                    onPress={() => {
                                        if (item.type === 'toggle') {
                                            item.onToggle();
                                        } else if (!user && item.route !== '/account/preferences') {
                                            handleSignIn();
                                        } else if (item.route) {
                                            router.push(item.route as any);
                                        }
                                    }}
                                >
                                    <View style={styles.menuItemLeft}>
                                        <item.icon size={24} color={isDarkMode ? '#FFF' : Colors.text} strokeWidth={1.5} />
                                        <Text style={[styles.menuLabel, isDarkMode && styles.darkText]}>{item.label}</Text>
                                    </View>
                                    {item.type === 'toggle' ? (
                                        <Switch
                                            value={item.value}
                                            onValueChange={item.onToggle}
                                            trackColor={{ false: '#767577', true: Colors.primary }}
                                            thumbColor={item.value ? '#FFF' : '#f4f3f4'}
                                        />
                                    ) : (
                                        <ChevronRight size={20} color={isDarkMode ? '#FFF' : Colors.textLight} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}

                    {user ? (
                        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                            <LogOut size={24} color={Colors.error} />
                            <Text style={styles.signOutText}>Log Out</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.signOutButton} onPress={handleSignIn}>
                            <LogOut size={24} color={Colors.primary} />
                            <Text style={[styles.signOutText, { color: Colors.primary }]}>Sign In</Text>
                        </TouchableOpacity>
                    )}
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
    header: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.text,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '600',
        color: Colors.primary,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4,
    },
    profileAction: {
        fontSize: 14,
        color: Colors.textLight,
    },
    bannerContainer: {
        padding: 24,
    },
    bannerContent: {
        backgroundColor: Colors.primary, // Using primary color for banner
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    bannerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.secondary,
        marginBottom: 4,
    },
    bannerText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        maxWidth: 200,
    },
    menuContainer: {
        paddingHorizontal: 24,
    },
    menuGroup: {
        marginBottom: 24,
    },
    groupTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuLabel: {
        fontSize: 16,
        color: Colors.text,
        marginLeft: 16,
        fontWeight: '400',
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        marginBottom: 40,
    },
    signOutText: {
        fontSize: 16,
        color: Colors.error,
        marginLeft: 16,
        fontWeight: '600',
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
    darkBorder: {
        borderBottomColor: '#333333',
    },
    darkAvatarContainer: {
        backgroundColor: '#333333',
    },
});
