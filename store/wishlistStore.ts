import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Product } from '../types';

interface WishlistState {
    items: Product[];
    addItem: (item: Product) => void;
    removeItem: (id: string) => void;
    isInWishlist: (id: string) => boolean;
    toggleWishlist: (item: Product) => void;
}

export const useWishlistStore = create<WishlistState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (item) =>
                set((state) => ({
                    items: [...state.items, item],
                })),
            removeItem: (id) =>
                set((state) => ({
                    items: state.items.filter((i) => i.id !== id),
                })),
            isInWishlist: (id) => {
                return get().items.some((item) => item.id === id);
            },
            toggleWishlist: (item) => {
                const { items, addItem, removeItem } = get();
                const exists = items.some((i) => i.id === item.id);
                if (exists) {
                    removeItem(item.id);
                } else {
                    addItem(item);
                }
            },
        }),
        {
            name: 'wishlist-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
