# Glamify - Premium Beauty & Cosmetics E-Commerce App

<div align="center">

![Glamify](https://img.shields.io/badge/Glamify-Beauty%20%26%20Cosmetics-FF69B4?style=for-the-badge)
![Expo](https://img.shields.io/badge/Expo-~54.0.27-000020?style=for-the-badge&logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-~5.9.2-3178C6?style=for-the-badge&logo=typescript)

A modern, feature-rich mobile e-commerce application for beauty and cosmetics products, built with React Native and Expo.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Project Structure](#-project-structure) • [Screenshots](#-screenshots)

</div>

---

## 📱 Overview

**Glamify** is a premium mobile shopping experience designed for beauty enthusiasts. The app offers a sleek, modern interface with comprehensive e-commerce functionality including product browsing, wishlist management, shopping cart, user authentication, and order management. Built with React Native and Expo, it delivers a native-like experience on both iOS and Android platforms.

## ✨ Features

### 🛍️ Shopping Experience

- **Product Discovery**: Browse curated collections from premium brands (Fenty Beauty, Rare Beauty, Kylie Cosmetics)
- **Smart Search**: Advanced search functionality with category filtering and real-time results
- **Product Categories**: Organized by Makeup, Skincare, Fragrance, Hair, Body Care, Cleansers, and Masks
- **Hero Carousel**: Auto-rotating banner showcasing featured collections and promotions
- **Product Details**: Comprehensive product pages with images, descriptions, pricing, and brand information

### 🛒 Cart & Checkout

- **Shopping Bag**: Intuitive cart management with quantity controls
- **Real-time Totals**: Dynamic price calculation with item quantity updates
- **Multiple Payment Methods**: Support for Cash on Delivery (COD) and Online Payment options
- **Order Confirmation**: Animated success feedback with order tracking integration
- **Persistent Cart**: Cart state maintained across app sessions

### ❤️ Wishlist & Favorites

- **Save for Later**: Add products to wishlist for future purchase
- **Persistent Storage**: Wishlist data saved locally using AsyncStorage
- **Quick Access**: Easy toggle between wishlist and cart
- **Visual Indicators**: Clear UI feedback for wishlisted items

### 👤 User Management

- **Authentication**: Secure sign-in/sign-up with Supabase
- **User Profiles**: Personalized account management
- **Account Sections**:
  - Personal Information
  - Saved Addresses
  - Payment Methods
  - Order History
  - Preferences & Settings
  - Wishlist Management
- **Guest Mode**: Browse and explore without mandatory sign-in
- **Session Persistence**: Auto-refresh tokens and persistent sessions

### 🎨 UI/UX Excellence

- **Dark Mode Support**: Complete dark theme implementation across all screens
- **Smooth Animations**: React Native Reanimated for fluid transitions
- **Responsive Design**: Optimized layouts for various screen sizes
- **iOS-style Navigation**: Bottom tab navigation with custom tab bar
- **Gesture Support**: Native gesture handling for enhanced interactivity
- **Loading States**: Skeleton screens and activity indicators for better UX

### 🔐 Security & Data

- **Supabase Integration**: Secure backend with real-time capabilities
- **Encrypted Storage**: Secure local data persistence
- **Session Management**: Auto-refresh tokens and secure authentication
- **Data Validation**: Input validation and error handling

## 🛠️ Tech Stack

### Core Framework

- **[Expo](https://expo.dev)** (~54.0.27) - Development platform and build tooling
- **[React Native](https://reactnative.dev)** (0.81.5) - Cross-platform mobile framework
- **[React](https://react.dev)** (19.1.0) - UI library
- **[TypeScript](https://www.typescriptlang.org)** (~5.9.2) - Type-safe development

### Navigation & Routing

- **[Expo Router](https://docs.expo.dev/router/introduction/)** (~6.0.17) - File-based routing
- **[React Navigation](https://reactnavigation.org)** (^7.1.8) - Navigation library
- **[@react-navigation/bottom-tabs](https://reactnavigation.org/docs/bottom-tab-navigator/)** (^7.4.0) - Tab navigation

### State Management

- **[Zustand](https://zustand-demo.pmnd.rs)** (^5.0.9) - Lightweight state management
  - `authStore.ts` - User authentication state
  - `cartStore.ts` - Shopping cart management
  - `wishlistStore.ts` - Wishlist with persistence
  - `themeStore.ts` - Dark/light mode preferences

### Backend & Database

- **[@supabase/supabase-js](https://supabase.com)** (^2.78.0) - Backend as a Service
  - User authentication
  - Order management
  - Real-time data sync
- **[@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/)** (^2.2.0) - Local data persistence

### UI & Animation

- **[React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)** (~4.1.1) - Advanced animations
- **[React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)** (~2.28.0) - Touch gestures
- **[Lucide React Native](https://lucide.dev)** (^0.556.0) - Beautiful icon library
- **[@expo/vector-icons](https://icons.expo.fyi)** (^15.0.3) - Additional icon sets
- **[Expo Image](https://docs.expo.dev/versions/latest/sdk/image/)** (~3.0.11) - Optimized image component

### Additional Expo Modules

- **[Expo Splash Screen](https://docs.expo.dev/versions/latest/sdk/splash-screen/)** (~31.0.12) - Custom splash screens
- **[Expo Status Bar](https://docs.expo.dev/versions/latest/sdk/status-bar/)** (~3.0.9) - Status bar customization
- **[Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/)** (~15.0.8) - Haptic feedback
- **[Expo System UI](https://docs.expo.dev/versions/latest/sdk/system-ui/)** (~6.0.9) - System UI controls
- **[Expo Navigation Bar](https://docs.expo.dev/versions/latest/sdk/navigation-bar/)** (~5.0.10) - Android navigation bar
- **[Expo Font](https://docs.expo.dev/versions/latest/sdk/font/)** (~14.0.10) - Custom fonts
- **[Expo Linking](https://docs.expo.dev/versions/latest/sdk/linking/)** (~8.0.10) - Deep linking
- **[Expo Web Browser](https://docs.expo.dev/versions/latest/sdk/webbrowser/)** (~15.0.10) - In-app browser

### Development Tools

- **[ESLint](https://eslint.org)** (^9.25.0) - Code linting
- **[eslint-config-expo](https://www.npmjs.com/package/eslint-config-expo)** (~10.0.0) - Expo ESLint config
- **[@types/react](https://www.npmjs.com/package/@types/react)** (~19.1.0) - React type definitions

### Additional Libraries

- **[react-native-svg](https://github.com/software-mansion/react-native-svg)** (^15.15.1) - SVG support
- **[react-native-url-polyfill](https://www.npmjs.com/package/react-native-url-polyfill)** (^3.0.0) - URL polyfill
- **[react-native-worklets](https://github.com/margelo/react-native-worklets)** (0.5.1) - Worklet support

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI** (optional, but recommended)
- **iOS Simulator** (for macOS) or **Android Emulator**
- **Expo Go** app (for physical device testing)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Rutuja
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Supabase** (Optional - for authentication and orders)

   The app is pre-configured with Supabase credentials in `lib/supabase.ts`. For production use, replace with your own:

   ```typescript
   const supabaseUrl = "YOUR_SUPABASE_URL";
   const supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY";
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

### Running the App

After starting the development server, you'll see options to:

- **Press `i`** - Open in iOS Simulator
- **Press `a`** - Open in Android Emulator
- **Scan QR code** - Open in Expo Go on your physical device
- **Press `w`** - Open in web browser (limited functionality)

### Building for Production

For iOS:

```bash
npx expo run:ios
```

For Android:

```bash
npx expo run:android
```

For EAS Build (recommended):

```bash
npm install -g eas-cli
eas build --platform ios
eas build --platform android
```

## 📁 Project Structure

```
Rutuja/
├── app/                          # Main application code (file-based routing)
│   ├── (tabs)/                   # Tab-based screens
│   │   ├── _layout.tsx           # Tab navigation layout
│   │   ├── index.tsx             # Home/Discover screen
│   │   ├── browse.tsx            # Search & browse screen
│   │   ├── bag.tsx               # Shopping cart screen
│   │   └── account.tsx           # User account screen
│   ├── account/                  # Account sub-screens
│   │   ├── addresses.tsx         # Saved addresses
│   │   ├── orders.tsx            # Order history
│   │   ├── payments.tsx          # Payment methods
│   │   ├── personal-info.tsx     # Personal information
│   │   ├── preferences.tsx       # User preferences
│   │   └── wishlist.tsx          # Wishlist management
│   ├── admin/                    # Admin screens (future)
│   ├── brand/                    # Brand detail screens
│   ├── product/                  # Product detail screens
│   ├── _layout.tsx               # Root layout
│   └── auth.tsx                  # Authentication screen
├── assets/                       # Static assets
│   └── images/                   # App images and icons
├── components/                   # Reusable components
│   └── TabBar.tsx                # Custom tab bar component
├── constants/                    # App constants
│   └── Colors.ts                 # Color palette
├── data/                         # Mock data
│   └── products.ts               # Product catalog
├── lib/                          # Libraries and utilities
│   └── supabase.ts               # Supabase client configuration
├── store/                        # Zustand state stores
│   ├── authStore.ts              # Authentication state
│   ├── cartStore.ts              # Shopping cart state
│   ├── themeStore.ts             # Theme preferences
│   └── wishlistStore.ts          # Wishlist state
├── types/                        # TypeScript type definitions
│   └── index.ts                  # Shared types
├── .gitignore                    # Git ignore rules
├── app.json                      # Expo configuration
├── babel.config.js               # Babel configuration
├── eas.json                      # EAS Build configuration
├── eslint.config.js              # ESLint configuration
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

### Key Directories Explained

- **`app/`**: Contains all screens using Expo Router's file-based routing system
- **`store/`**: Zustand stores for global state management (cart, wishlist, auth, theme)
- **`components/`**: Reusable UI components used across multiple screens
- **`lib/`**: Third-party library configurations and utilities
- **`data/`**: Mock product data and constants
- **`types/`**: TypeScript interfaces and type definitions

## 🎯 Key Features Implementation

### State Management with Zustand

The app uses Zustand for efficient, lightweight state management:

**Cart Store** (`store/cartStore.ts`):

- Add/remove items
- Update quantities
- Calculate totals
- Clear cart

**Wishlist Store** (`store/wishlistStore.ts`):

- Persistent storage with AsyncStorage
- Toggle wishlist items
- Check if item is wishlisted

**Auth Store** (`store/authStore.ts`):

- User session management
- Authentication state

**Theme Store** (`store/themeStore.ts`):

- Dark/light mode toggle
- Theme persistence

### Authentication Flow

1. User lands on auth screen (`app/auth.tsx`)
2. Can sign in, sign up, or skip to browse as guest
3. Supabase handles authentication with email/password
4. Session persisted with AsyncStorage
5. Protected routes check auth state
6. Auto-refresh tokens for seamless experience

### Shopping Cart Flow

1. User adds product from product detail screen
2. Item added to cart store (Zustand)
3. Cart badge updates in tab bar
4. User navigates to bag screen
5. Can adjust quantities or remove items
6. Checkout requires authentication
7. Payment method selection modal
8. Order saved to Supabase
9. Success animation and cart cleared

### Dark Mode Implementation

- Theme preference stored in Zustand
- All screens check `isDarkMode` from theme store
- Conditional styling applied throughout
- Smooth transitions between themes
- Persisted across app sessions

## 🎨 Design Philosophy

### Color Palette

The app uses a sophisticated color scheme defined in `constants/Colors.ts`:

- **Primary**: Black (#000) - Premium, elegant feel
- **Secondary**: White (#FFF) - Clean, minimal
- **Accent**: iOS Blue (#007AFF) - Interactive elements
- **Gold**: (#D4AF37) - Premium collections
- **Background**: White/Dark (#FFF/#121212)
- **Surface**: Light Gray/Dark Gray (#F5F5F5/#1E1E1E)

### Typography

- **Headers**: Bold, large sizes (28-42px) for impact
- **Body**: Regular weight (14-16px) for readability
- **Accents**: Letter spacing for premium feel
- **Hierarchy**: Clear visual hierarchy throughout

### Animations

- **React Native Reanimated**: Smooth, performant animations
- **Spring animations**: Natural, bouncy feel
- **Zoom effects**: Success modals and interactive elements
- **Carousel**: Auto-rotating hero banners

## 📸 Screenshots

> Add screenshots of your app here to showcase the UI

## 🔧 Configuration

### App Configuration (`app.json`)

```json
{
  "name": "Glamify",
  "slug": "glamify",
  "version": "1.0.0",
  "scheme": "glamify",
  "newArchEnabled": true
}
```

### Supabase Setup

The app uses Supabase for:

- User authentication (email/password)
- Order storage and management
- Real-time data synchronization

Database schema (recommended):

```sql
-- Users table (handled by Supabase Auth)

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  items JSONB,
  total_amount DECIMAL,
  status TEXT,
  payment_method TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🧪 Testing

Run linting:

```bash
npm run lint
```

## 📝 Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web
- `npm run lint` - Run ESLint
- `npm run reset-project` - Reset to blank project

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- **Expo Team** - For the amazing development platform
- **Supabase** - For backend infrastructure
- **React Native Community** - For excellent libraries and support
- **Lucide Icons** - For beautiful, consistent icons

## 📧 Contact

For questions or support, please contact the development team.

---

<div align="center">

**Built with ❤️ using React Native & Expo**

![Made with React Native](https://img.shields.io/badge/Made%20with-React%20Native-61DAFB?style=flat-square&logo=react)
![Powered by Expo](https://img.shields.io/badge/Powered%20by-Expo-000020?style=flat-square&logo=expo)

</div>
# imagica
