import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../lib/firebase';

import { useThemeStore } from '../store/themeStore';

export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'signin' | 'signup'>('signin');
    const router = useRouter();
    const { mode } = useThemeStore();
    const isDarkMode = mode === 'dark';

    async function handleAuth() {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (view === 'signup' && !fullName) {
            Alert.alert('Error', 'Please enter your full name');
            return;
        }

        setLoading(true);
        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out. Please check your internet connection.')), 15000)
            );

            if (view === 'signup') {
                const result = await Promise.race([
                    createUserWithEmailAndPassword(auth, email, password),
                    timeoutPromise
                ]) as any;

                // Save user data to 'users' collection in Firestore
                const user = result.user;
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    email: user.email,
                    full_name: fullName,
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp(),
                });

                Alert.alert('Success', 'Account created successfully!');
                router.replace('/(tabs)');
            } else {
                await Promise.race([
                    signInWithEmailAndPassword(auth, email, password),
                    timeoutPromise
                ]);

                router.replace('/(tabs)');
            }
        } catch (error: any) {
            console.error('Auth error:', error);
            let message = 'An unexpected error occurred';
            if (error.code === 'auth/email-already-in-use') {
                message = 'This email is already registered. Please sign in.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Please enter a valid email address.';
            } else if (error.code === 'auth/weak-password') {
                message = 'Password should be at least 6 characters.';
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                message = 'Invalid email or password.';
            } else if (error.message) {
                message = error.message;
            }
            Alert.alert('Error', message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <Text style={[styles.welcomeText, isDarkMode && styles.darkText]}>WELCOME</Text>
                        <Text style={[styles.title, isDarkMode && styles.darkText]}>
                            {view === 'signin' ? 'Sign In for the Best Experience' : 'Create Your Account'}
                        </Text>
                        <Text style={[styles.description, isDarkMode && styles.darkTextLight]}>
                            Get <Text style={[styles.bold, isDarkMode && styles.darkText]}>FREE standard shipping</Text>, manage orders, and access rewards, discounts, and personalized recommendations when you log in to your Beauty Insider account.
                        </Text>
                    </View>

                    <View style={styles.form}>
                        {view === 'signup' && (
                            <TextInput
                                style={[styles.input, isDarkMode && styles.darkInput]}
                                placeholder="Full Name"
                                value={fullName}
                                onChangeText={setFullName}
                                autoCapitalize="words"
                                placeholderTextColor={isDarkMode ? '#AAA' : '#666'}
                            />
                        )}
                        <TextInput
                            style={[styles.input, isDarkMode && styles.darkInput]}
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            placeholderTextColor={isDarkMode ? '#AAA' : '#666'}
                        />
                        <TextInput
                            style={[styles.input, isDarkMode && styles.darkInput]}
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            placeholderTextColor={isDarkMode ? '#AAA' : '#666'}
                        />

                        {view === 'signin' && (
                            <TouchableOpacity style={styles.forgotPassword}>
                                <Text style={[styles.forgotPasswordText, isDarkMode && styles.darkTextLight]}>Forgot Password?</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.signInButton, isDarkMode && styles.darkButton]}
                            onPress={handleAuth}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={isDarkMode ? '#000' : '#FFF'} />
                            ) : (
                                <Text style={[styles.signInButtonText, isDarkMode && styles.darkButtonText]}>
                                    {view === 'signin' ? 'Sign In' : 'Create Account'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.divider, isDarkMode && styles.darkDivider]} />

                    <View style={styles.createAccountSection}>
                        <Text style={[styles.newToText, isDarkMode && styles.darkText]}>
                            {view === 'signin' ? 'New to Sephora?' : 'Already have an account?'}
                        </Text>
                        <TouchableOpacity
                            style={[styles.createAccountButton, isDarkMode && styles.darkOutlineButton]}
                            onPress={() => setView(view === 'signin' ? 'signup' : 'signin')}
                        >
                            <Text style={[styles.createAccountButtonText, isDarkMode && styles.darkText]}>
                                {view === 'signin' ? 'Create Account' : 'Sign In'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={() => router.replace('/(tabs)')}
                    >
                        <Text style={[styles.skipButtonText, isDarkMode && styles.darkText]}>Skip For Now</Text>
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Terms of Use & Privacy Policy</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
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
    darkInput: {
        backgroundColor: '#333333',
        borderColor: '#444444',
        color: '#FFFFFF',
    },
    darkButton: {
        backgroundColor: '#FFFFFF',
    },
    darkButtonText: {
        color: '#000000',
    },
    darkDivider: {
        backgroundColor: '#333333',
    },
    darkOutlineButton: {
        backgroundColor: 'transparent',
        borderColor: '#FFFFFF',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 20,
    },
    welcomeText: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        marginBottom: 16,
        color: '#000',
    },
    title: {
        fontSize: 32,
        fontWeight: '400', // Serif-like feel often uses lighter weights or specific fonts
        textAlign: 'center',
        marginBottom: 16,
        color: '#000',
        lineHeight: 40,
    },
    description: {
        fontSize: 14,
        textAlign: 'center',
        color: '#333',
        lineHeight: 20,
    },
    bold: {
        fontWeight: 'bold',
    },
    form: {
        gap: 16,
        marginBottom: 24,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 4,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#000',
        backgroundColor: '#FFF',
    },
    forgotPassword: {
        alignItems: 'flex-end',
    },
    forgotPasswordText: {
        fontSize: 12,
        color: '#333',
        textDecorationLine: 'underline',
    },
    signInButton: {
        backgroundColor: '#000',
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    signInButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 24,
    },
    createAccountSection: {
        alignItems: 'center',
        gap: 16,
        marginBottom: 32,
    },
    newToText: {
        fontSize: 16,
        color: '#000',
    },
    createAccountButton: {
        width: '100%',
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    createAccountButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    skipButton: {
        alignItems: 'center',
        marginBottom: 40,
    },
    skipButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    footer: {
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#007AFF',
    },
});
