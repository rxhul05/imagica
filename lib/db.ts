import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
} from 'firebase/firestore';
import { AppUser } from '../types';
import { db } from './firebase';

// ============================
// Collection Names (constants)
// ============================
export const COLLECTIONS = {
    USERS: 'users',
    PROFILES: 'profiles',
    ORDERS: 'orders',
    ADDRESSES: 'addresses',
    PAYMENTS: 'payments',
    PREFERENCES: 'preferences',
    WISHLIST: 'wishlist',
    PRODUCTS: 'products',
} as const;

// ============================
// User Operations
// ============================

/** Create a new user document on signup */
export async function createUser(uid: string, email: string, fullName: string): Promise<void> {
    await setDoc(doc(db, COLLECTIONS.USERS, uid), {
        uid,
        email,
        full_name: fullName,
        isAdmin: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
    });
}

/** Get user document from Firestore */
export async function getUser(uid: string): Promise<AppUser | null> {
    const docSnap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
    if (!docSnap.exists()) return null;
    return { ...docSnap.data(), uid: docSnap.id } as AppUser;
}

/** Update user fields */
export async function updateUser(uid: string, data: Partial<AppUser>): Promise<void> {
    await setDoc(doc(db, COLLECTIONS.USERS, uid), {
        ...data,
        updated_at: serverTimestamp(),
    }, { merge: true });
}

/** Get all users (admin only) */
export async function getAllUsers(): Promise<AppUser[]> {
    const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    return snapshot.docs.map(d => ({ ...d.data(), uid: d.id } as AppUser));
}

/** Delete a user document */
export async function deleteUser(uid: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.USERS, uid));
}

// ============================
// Profile Operations
// ============================

export async function getProfile(uid: string) {
    const docSnap = await getDoc(doc(db, COLLECTIONS.PROFILES, uid));
    if (!docSnap.exists()) return null;
    return docSnap.data();
}

export async function saveProfile(uid: string, data: { full_name: string; phone: string }) {
    await setDoc(doc(db, COLLECTIONS.PROFILES, uid), {
        ...data,
        updated_at: serverTimestamp(),
    }, { merge: true });

    // Sync to users collection
    await updateUser(uid, { full_name: data.full_name, phone: data.phone });
}

// ============================
// Order Operations
// ============================

export async function createOrder(data: {
    user_id: string;
    user_email: string;
    items: string;
    total_amount: number;
    payment_method: string;
}) {
    return await addDoc(collection(db, COLLECTIONS.ORDERS), {
        ...data,
        status: 'processing',
        created_at: serverTimestamp(),
    });
}

export async function getUserOrders(uid: string) {
    const q = query(
        collection(db, COLLECTIONS.ORDERS),
        where('user_id', '==', uid),
        orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllOrders() {
    const q = query(
        collection(db, COLLECTIONS.ORDERS),
        orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateOrderStatus(orderId: string, status: string) {
    await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), { status });
}

// ============================
// Address Operations
// ============================

export async function getUserAddresses(uid: string) {
    const q = query(
        collection(db, COLLECTIONS.ADDRESSES),
        where('user_id', '==', uid),
        orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addAddress(uid: string, label: string, fullAddress: string) {
    return await addDoc(collection(db, COLLECTIONS.ADDRESSES), {
        user_id: uid,
        label,
        full_address: fullAddress,
        created_at: serverTimestamp(),
    });
}

export async function deleteAddress(id: string) {
    await deleteDoc(doc(db, COLLECTIONS.ADDRESSES, id));
}

// ============================
// Payment Operations
// ============================

export async function getUserPayments(uid: string) {
    const q = query(
        collection(db, COLLECTIONS.PAYMENTS),
        where('user_id', '==', uid),
        orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addPayment(uid: string, type: string, last4: string, expiry: string) {
    return await addDoc(collection(db, COLLECTIONS.PAYMENTS), {
        user_id: uid,
        type,
        last4,
        expiry,
        created_at: serverTimestamp(),
    });
}

export async function deletePayment(id: string) {
    await deleteDoc(doc(db, COLLECTIONS.PAYMENTS, id));
}

// ============================
// Preferences Operations
// ============================

export async function getPreferences(uid: string) {
    const docSnap = await getDoc(doc(db, COLLECTIONS.PREFERENCES, uid));
    if (!docSnap.exists()) return null;
    return docSnap.data();
}

export async function savePreferences(uid: string, data: {
    skin_type: string[];
    skin_concerns: string[];
    hair_type: string[];
    makeup_style: string[];
}) {
    await setDoc(doc(db, COLLECTIONS.PREFERENCES, uid), {
        user_id: uid,
        ...data,
        updated_at: serverTimestamp(),
    }, { merge: true });
}

// ============================
// Wishlist Operations
// ============================

export async function getUserWishlist(uid: string) {
    const q = query(
        collection(db, COLLECTIONS.WISHLIST),
        where('user_id', '==', uid)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ docId: d.id, ...(d.data() as any) }));
}

export async function addToWishlist(uid: string, productId: string) {
    return await addDoc(collection(db, COLLECTIONS.WISHLIST), {
        user_id: uid,
        product_id: productId,
        created_at: serverTimestamp(),
    });
}

export async function removeFromWishlist(uid: string, productId: string) {
    const q = query(
        collection(db, COLLECTIONS.WISHLIST),
        where('user_id', '==', uid),
        where('product_id', '==', productId)
    );
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, COLLECTIONS.WISHLIST, d.id)));
    await Promise.all(deletePromises);
}

// ============================
// Product Operations (Admin)
// ============================

export async function addProduct(data: {
    name: string;
    brand: string;
    price: number;
    category: string;
    description: string;
    image_url: string;
    rating?: number;
}) {
    return await addDoc(collection(db, COLLECTIONS.PRODUCTS), {
        ...data,
        rating: data.rating || 4.5,
        reviews: 0,
        created_at: serverTimestamp(),
    });
}

export async function getAllProducts() {
    const q = query(
        collection(db, COLLECTIONS.PRODUCTS),
        orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteProduct(id: string) {
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, id));
}

// ============================
// Admin Role Management
// ============================

export async function toggleAdmin(uid: string, isAdmin: boolean): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
        isAdmin,
        updated_at: serverTimestamp(),
    });
}

