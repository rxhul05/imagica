export interface Product {
    id: string;
    name: string;
    brand: string;
    category: string;
    price: number;
    rating: number;
    description: string;
    image_url: string | number;
    tags: string[];
}

export interface Category {
    id: string;
    name: string;
    image_url: string;
}

export interface CartItem extends Product {
    quantity: number;
}

export interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
}

export interface AppUser {
    uid: string;
    email: string;
    full_name: string;
    phone?: string;
    avatar_url?: string;
    isAdmin: boolean;
    created_at?: any;
    updated_at?: any;
}
