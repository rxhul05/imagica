import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { addToWishlist, removeFromWishlist } from '../lib/db';
import { Product } from '../types';

interface WishlistState {
    items: Product[];
    addItem: (item: Product, userId?: string) => void;
    removeItem: (id: string, userId?: string) => void;
    isInWishlist: (id: string) => boolean;
    toggleWishlist: (item: Product, userId?: string) => void;
    clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (item, userId) => {
                set((state) => ({
                    items: [...state.items, item],
                }));
                // Sync to Firestore
                if (userId) {
                    addToWishlist(userId, item.id).catch(err =>
                        console.error('Error syncing wishlist add:', err)
                    );
                }
            },
            removeItem: (id, userId) => {
                set((state) => ({
                    items: state.items.filter((i) => i.id !== id),
                }));
                // Sync to Firestore
                if (userId) {
                    removeFromWishlist(userId, id).catch(err =>
                        console.error('Error syncing wishlist remove:', err)
                    );
                }
            },
            isInWishlist: (id) => {
                return get().items.some((item) => item.id === id);
            },
            toggleWishlist: (item, userId) => {
                const { items, addItem, removeItem } = get();
                const exists = items.some((i) => i.id === item.id);
                if (exists) {
                    removeItem(item.id, userId);
                } else {
                    addItem(item, userId);
                }
            },
            clearWishlist: () => set({ items: [] }),
        }),
        {
            name: 'wishlist-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
