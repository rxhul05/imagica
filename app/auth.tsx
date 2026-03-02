import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUser } from '../lib/db';
import { auth } from '../lib/firebase';
import { useThemeStore } from '../store/themeStore';

// ============================
// Validation Helpers
// ============================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ValidationErrors {
    fullName?: string;
    email?: string;
    password?: string;
}

function validateEmail(email: string): string | undefined {
    if (!email.trim()) return 'Email is required';
    if (!EMAIL_REGEX.test(email)) return 'Please enter a valid email address';
    return undefined;
}

function validatePassword(password: string): string | undefined {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password.length > 128) return 'Password is too long';
    return undefined;
}

function validateFullName(name: string): string | undefined {
    if (!name.trim()) return 'Full name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    if (name.trim().length > 50) return 'Name is too long';
    return undefined;
}

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
    if (!password) return { label: '', color: 'transparent', width: '0%' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { label: 'Weak', color: '#E53935', width: '20%' };
    if (score <= 2) return { label: 'Fair', color: '#FF9800', width: '40%' };
    if (score <= 3) return { label: 'Good', color: '#FFC107', width: '60%' };
    if (score <= 4) return { label: 'Strong', color: '#4CAF50', width: '80%' };
    return { label: 'Very Strong', color: '#2E7D32', width: '100%' };
}

// ============================
// Auth Screen Component
// ============================

export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'signin' | 'signup'>('signin');
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [serverError, setServerError] = useState('');
    const router = useRouter();
    const { mode } = useThemeStore();
    const isDarkMode = mode === 'dark';

    // Clear errors when switching views
    useEffect(() => {
        setErrors({});
        setTouched({});
        setServerError('');
    }, [view]);

    // Real-time validation on touched fields
    useEffect(() => {
        const newErrors: ValidationErrors = {};
        if (touched.email) newErrors.email = validateEmail(email);
        if (touched.password) newErrors.password = validatePassword(password);
        if (touched.fullName && view === 'signup') newErrors.fullName = validateFullName(fullName);
        setErrors(newErrors);
    }, [email, password, fullName, touched, view]);

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const validateAll = (): boolean => {
        const newErrors: ValidationErrors = {};
        newErrors.email = validateEmail(email);
        newErrors.password = validatePassword(password);
        if (view === 'signup') newErrors.fullName = validateFullName(fullName);

        setErrors(newErrors);
        setTouched({ email: true, password: true, fullName: true });

        return !newErrors.email && !newErrors.password && (view === 'signin' || !newErrors.fullName);
    };

    async function handleAuth() {
        setServerError('');

        if (!validateAll()) return;

        setLoading(true);
        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out. Please check your internet connection.')), 15000)
            );

            if (view === 'signup') {
                const result = await Promise.race([
                    createUserWithEmailAndPassword(auth, email.trim(), password),
                    timeoutPromise
                ]) as any;

                // Save user to Firestore with isAdmin = false
                await createUser(result.user.uid, result.user.email!, fullName.trim());

                router.replace('/(tabs)');
            } else {
                await Promise.race([
                    signInWithEmailAndPassword(auth, email.trim(), password),
                    timeoutPromise
                ]);

                router.replace('/(tabs)');
            }
        } catch (error: any) {
            console.error('Auth error:', error);
            let message = 'An unexpected error occurred. Please try again.';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    message = 'This email is already registered. Please sign in instead.';
                    break;
                case 'auth/invalid-email':
                    message = 'Please enter a valid email address.';
                    break;
                case 'auth/weak-password':
                    message = 'Password is too weak. Use at least 6 characters.';
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    message = 'Invalid email or password. Please try again.';
                    break;
                case 'auth/too-many-requests':
                    message = 'Too many attempts. Please try again later.';
                    break;
                case 'auth/network-request-failed':
                    message = 'Network error. Please check your connection.';
                    break;
                default:
                    if (error.message) message = error.message;
            }
            setServerError(message);
        } finally {
            setLoading(false);
        }
    }

    const passwordStrength = view === 'signup' ? getPasswordStrength(password) : null;

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
                            Get <Text style={[styles.bold, isDarkMode && styles.darkText]}>FREE standard shipping</Text>, manage orders, and access rewards, discounts, and personalized recommendations.
                        </Text>
                    </View>

                    {/* Server Error Banner */}
                    {serverError ? (
                        <View style={styles.errorBanner}>
                            <AlertCircle size={18} color="#D32F2F" />
                            <Text style={styles.errorBannerText}>{serverError}</Text>
                        </View>
                    ) : null}

                    <View style={styles.form}>
                        {/* Full Name Field (Signup Only) */}
                        {view === 'signup' && (
                            <View style={styles.inputGroup}>
                                <View style={[
                                    styles.inputContainer,
                                    isDarkMode && styles.darkInputContainer,
                                    touched.fullName && errors.fullName && styles.inputError,
                                    touched.fullName && !errors.fullName && fullName && styles.inputSuccess,
                                ]}>
                                    <User size={18} color={errors.fullName && touched.fullName ? '#D32F2F' : (isDarkMode ? '#888' : '#666')} />
                                    <TextInput
                                        style={[styles.input, isDarkMode && styles.darkInputText]}
                                        placeholder="Full Name"
                                        value={fullName}
                                        onChangeText={setFullName}
                                        onBlur={() => handleBlur('fullName')}
                                        autoCapitalize="words"
                                        placeholderTextColor={isDarkMode ? '#666' : '#999'}
                                    />
                                    {touched.fullName && !errors.fullName && fullName ? (
                                        <CheckCircle2 size={18} color="#4CAF50" />
                                    ) : null}
                                </View>
                                {touched.fullName && errors.fullName ? (
                                    <Text style={styles.errorText}>{errors.fullName}</Text>
                                ) : null}
                            </View>
                        )}

                        {/* Email Field */}
                        <View style={styles.inputGroup}>
                            <View style={[
                                styles.inputContainer,
                                isDarkMode && styles.darkInputContainer,
                                touched.email && errors.email && styles.inputError,
                                touched.email && !errors.email && email && styles.inputSuccess,
                            ]}>
                                <Mail size={18} color={errors.email && touched.email ? '#D32F2F' : (isDarkMode ? '#888' : '#666')} />
                                <TextInput
                                    style={[styles.input, isDarkMode && styles.darkInputText]}
                                    placeholder="Email Address"
                                    value={email}
                                    onChangeText={setEmail}
                                    onBlur={() => handleBlur('email')}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    placeholderTextColor={isDarkMode ? '#666' : '#999'}
                                />
                                {touched.email && !errors.email && email ? (
                                    <CheckCircle2 size={18} color="#4CAF50" />
                                ) : null}
                            </View>
                            {touched.email && errors.email ? (
                                <Text style={styles.errorText}>{errors.email}</Text>
                            ) : null}
                        </View>

                        {/* Password Field */}
                        <View style={styles.inputGroup}>
                            <View style={[
                                styles.inputContainer,
                                isDarkMode && styles.darkInputContainer,
                                touched.password && errors.password && styles.inputError,
                                touched.password && !errors.password && password && styles.inputSuccess,
                            ]}>
                                <Lock size={18} color={errors.password && touched.password ? '#D32F2F' : (isDarkMode ? '#888' : '#666')} />
                                <TextInput
                                    style={[styles.input, isDarkMode && styles.darkInputText]}
                                    placeholder="Password"
                                    value={password}
                                    onChangeText={setPassword}
                                    onBlur={() => handleBlur('password')}
                                    secureTextEntry={!showPassword}
                                    placeholderTextColor={isDarkMode ? '#666' : '#999'}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    {showPassword ? (
                                        <EyeOff size={18} color={isDarkMode ? '#888' : '#666'} />
                                    ) : (
                                        <Eye size={18} color={isDarkMode ? '#888' : '#666'} />
                                    )}
                                </TouchableOpacity>
                            </View>
                            {touched.password && errors.password ? (
                                <Text style={styles.errorText}>{errors.password}</Text>
                            ) : null}

                            {/* Password Strength Meter (Signup Only) */}
                            {view === 'signup' && password.length > 0 && passwordStrength && (
                                <View style={styles.strengthContainer}>
                                    <View style={styles.strengthBarBg}>
                                        <View style={[styles.strengthBarFill, {
                                            width: passwordStrength.width as any,
                                            backgroundColor: passwordStrength.color,
                                        }]} />
                                    </View>
                                    <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                                        {passwordStrength.label}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {view === 'signin' && (
                            <TouchableOpacity style={styles.forgotPassword}>
                                <Text style={[styles.forgotPasswordText, isDarkMode && styles.darkTextLight]}>Forgot Password?</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.signInButton,
                                isDarkMode && styles.darkButton,
                                loading && styles.buttonDisabled,
                            ]}
                            onPress={handleAuth}
                            disabled={loading}
                            activeOpacity={0.8}
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
                            {view === 'signin' ? 'New to Glamify?' : 'Already have an account?'}
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
    darkInputContainer: {
        backgroundColor: '#1E1E1E',
        borderColor: '#333333',
    },
    darkInputText: {
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
        fontWeight: '400',
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

    // Error Banner
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
        gap: 10,
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    errorBannerText: {
        flex: 1,
        color: '#C62828',
        fontSize: 14,
        lineHeight: 20,
    },

    // Form
    form: {
        gap: 4,
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 52,
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 14,
        gap: 10,
        backgroundColor: '#FAFAFA',
    },
    inputError: {
        borderColor: '#D32F2F',
        backgroundColor: '#FFF5F5',
    },
    inputSuccess: {
        borderColor: '#4CAF50',
        backgroundColor: '#F1F8E9',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#000',
    },
    errorText: {
        color: '#D32F2F',
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
        fontWeight: '500',
    },

    // Password Strength
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 8,
    },
    strengthBarBg: {
        flex: 1,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        overflow: 'hidden',
    },
    strengthBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    strengthLabel: {
        fontSize: 11,
        fontWeight: '600',
        minWidth: 70,
        textAlign: 'right',
    },

    forgotPassword: {
        alignItems: 'flex-end',
        marginTop: 4,
        marginBottom: 8,
    },
    forgotPasswordText: {
        fontSize: 12,
        color: '#333',
        textDecorationLine: 'underline',
    },
    signInButton: {
        backgroundColor: '#000',
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
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
