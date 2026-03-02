import { signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { create } from 'zustand';
import { createUser, getUser } from '../lib/db';
import { auth } from '../lib/firebase';
import { AppUser } from '../types';

interface AuthState {
    user: User | null;
    appUser: AppUser | null;
    isAdmin: boolean;
    loading: boolean;
    setUser: (user: User | null) => void;
    signOut: () => Promise<void>;
    initialize: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    appUser: null,
    isAdmin: false,
    loading: true,
    setUser: (user) => set({ user, loading: false }),
    signOut: async () => {
        await firebaseSignOut(auth);
        set({ user: null, appUser: null, isAdmin: false });
    },
    initialize: async () => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    let appUser = await getUser(user.uid);

                    // If user exists in Firebase Auth but NOT in Firestore, create the document
                    if (!appUser) {
                        const displayName = user.displayName || user.email?.split('@')[0] || 'User';
                        await createUser(user.uid, user.email || '', displayName);
                        appUser = await getUser(user.uid);
                    }

                    set({
                        user,
                        appUser,
                        isAdmin: appUser?.isAdmin ?? false,
                        loading: false,
                    });
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                    set({ user, appUser: null, isAdmin: false, loading: false });
                }
            } else {
                set({ user: null, appUser: null, isAdmin: false, loading: false });
            }
        });
    },
    refreshProfile: async () => {
        const { user } = get();
        if (!user) return;
        try {
            const appUser = await getUser(user.uid);
            set({ appUser, isAdmin: appUser?.isAdmin ?? false });
        } catch (error) {
            console.error('Error refreshing profile:', error);
        }
    },
}));
