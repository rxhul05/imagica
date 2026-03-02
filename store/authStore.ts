import { signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { create } from 'zustand';
import { auth } from '../lib/firebase';

interface AuthState {
    user: User | null;
    loading: boolean;
    setUser: (user: User | null) => void;
    signOut: () => Promise<void>;
    initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    loading: true,
    setUser: (user) => set({ user, loading: false }),
    signOut: async () => {
        await firebaseSignOut(auth);
        set({ user: null });
    },
    initialize: async () => {
        onAuthStateChanged(auth, (user) => {
            set({ user, loading: false });
        });
    },
}));
