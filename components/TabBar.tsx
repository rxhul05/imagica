import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Home, Search, ShoppingBag, User } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/themeStore';

const { width } = Dimensions.get('window');

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { bottom } = useSafeAreaInsets();
    const { mode } = useThemeStore();
    const isDarkMode = mode === 'dark';

    const icons = {
        index: (props: any) => <Home size={24} {...props} />,
        browse: (props: any) => <Search size={24} {...props} />,
        bag: (props: any) => <ShoppingBag size={24} {...props} />,
        account: (props: any) => <User size={24} {...props} />,
    };

    return (
        <View style={[styles.container, { paddingBottom: bottom + 10 }, isDarkMode ? styles.darkContainer : styles.lightContainer]}>
            <View style={[styles.content, isDarkMode ? styles.darkContent : styles.lightContent]}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    return (
                        <TabItem
                            key={route.key}
                            name={route.name}
                            isFocused={isFocused}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            icon={icons[route.name as keyof typeof icons]}
                            isDarkMode={isDarkMode}
                            label={options.title || route.name}
                        />
                    );
                })}
            </View>
        </View>
    );
}

const TabItem = ({ name, isFocused, onPress, onLongPress, icon: Icon, isDarkMode, label }: any) => {
    const scale = useSharedValue(0);

    useEffect(() => {
        scale.value = withSpring(isFocused ? 1 : 0, { duration: 350 });
    }, [isFocused]);

    const animatedIconStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: withSpring(isFocused ? 1.2 : 1) }],
            top: withTiming(isFocused ? -5 : 0, { duration: 200 })
        };
    });

    const animatedContainerStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(isFocused ? 1 : 0.5, { duration: 200 })
        };
    });

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
        >
            <Animated.View style={[animatedIconStyle, styles.iconContainer]}>
                <Icon color={isFocused ? (isDarkMode ? '#FFF' : '#000') : (isDarkMode ? '#888' : '#999')} />
                {isFocused && (
                    <Animated.View style={[styles.activeDot, { backgroundColor: isDarkMode ? '#FFF' : '#000' }]} />
                )}
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    lightContainer: {},
    darkContainer: {},
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        width: width * 0.9,
        height: 70,
        borderRadius: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10, // for Android
    },
    lightContent: {
        backgroundColor: '#FFFFFF',
    },
    darkContent: {
        backgroundColor: '#1E1E1E',
        shadowColor: '#000',
        shadowOpacity: 0.3,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 4,
        position: 'absolute',
        bottom: -10,
    }
});
