# Zubi - Build Status

## 🚀 Latest Updates (10/02/2026)

### ⚡ NEW: Authentication & Security Infrastructure
- ✅ **User Authentication**: Full registration and login system with password hashing
- ✅ **Local Data Persistence**: AsyncStorage integration for trips, favorites, and user data
- ✅ **QR Code Security**: Cryptographic signatures, replay attack protection, 5-min expiry
- ✅ **AuthService**: Complete user management with profile updates
- ✅ **StorageService**: Persistent storage for all app data
- ✅ **Login/Register Screens**: Professional authentication UI for passenger app

### Previous Features in Codebase:
- ✅ **Gamification System**: Complete achievements tracking with progress bars and rewards for drivers
- ✅ **Coupon System**: Discount codes and promotional offers management for passengers  
- ✅ **Real-time Chat**: In-trip messaging between drivers and passengers with quick actions
- ✅ **Enhanced UI/UX**: Notification badges, animated elements, and modern design patterns
- ✅ **Improved HomeScreens**: Interactive elements, quick actions, and better user engagement

### 🔄 Build Status: Stable APKs Available
Latest code pushed to repository. Previous stable APKs available for download below.  
New builds with authentication features coming soon via local build infrastructure.

## APKs Disponíveis (Stable Version - MVP)

### ✅ Passenger App (Zubi Passageiro)
- **Status**: Build concluído com sucesso (MVP Version)
- **Download**: https://expo.dev/artifacts/eas/n19KKLfRsj4U3GxUAcnQwj.apk
- **Build ID**: aa154e93-d7b8-41a4-b247-0d4b50c78056
- **Versão**: 1.0.0
- **Data**: 08/02/2026
- **Features**: Basic P2P rideshare, mock blockchain payments, QR validation

### ✅ Driver App (Zubi Motorista)
- **Status**: Build concluído com sucesso (MVP Version)
- **Download**: https://expo.dev/artifacts/eas/t3czz8hXfnZPdk14TJEQWt.apk
- **Build ID**: daf55df7-6ac7-4b69-a762-c2e9cbc8aa47
- **Versão**: 1.0.0
- **Data**: 08/02/2026
- **Features**: Basic driver interface, earnings tracking, trip management

## EAS Project Info

### Passenger App
- **Project ID**: f2d9e42c-07a2-41db-a5ed-6d48b48a0fa1
- **Project URL**: https://expo.dev/accounts/hashino/projects/zubi-passenger

### Driver App
- **Project ID**: 5c3e10e5-877f-4525-9837-e90c4fe01486
- **Project URL**: https://expo.dev/accounts/hashino/projects/zubi-driver

## Instalação dos APKs no Android

1. Baixe os APKs pelos links acima
2. No celular Android, vá em Configurações > Segurança
3. Ative "Fontes Desconhecidas" ou "Instalar apps desconhecidos"
4. Abra o arquivo APK baixado
5. Toque em "Instalar"

**Nota**: Para testar o fluxo completo, você precisa instalar ambos os apps (Passenger e Driver) em dispositivos diferentes ou simular com um dispositivo físico e um emulador.

## Próximos Passos

### Imediato
- [ ] Criar projeto EAS para Driver App
- [ ] Gerar APK do Driver App
- [ ] Testar ambos os apps em dispositivos reais

### Features Para Produção
Ver arquivo [TODO.md](./TODO.md)

## 📱 New Features (Latest - 10/02/2026)

### 🔐 Authentication & Security (JUST ADDED):
- **User Registration & Login**: Complete auth flow with validation
- **Password Security**: SHA-256 hashing for password storage
- **Persistent Sessions**: Auth tokens saved locally
- **Profile Management**: User profiles with driver-specific fields
- **QR Security**: Cryptographic signatures with timestamps and nonces
- **Replay Protection**: Prevents QR code reuse attacks
- **Data Persistence**: All user data saved locally with AsyncStorage

### Driver App Enhancements:
- **🏆 Achievement System**: Gamified experience with 8 different achievements, progress tracking, and XP rewards
- **🔔 Smart Notifications**: Unread badge system with different notification types (earnings, achievements, system updates)
- **💬 In-Trip Chat**: Real-time messaging with passengers during active trips
- **📊 Enhanced Stats**: Better earnings display and performance metrics

### Passenger App Enhancements:
- **🎫 Coupon System**: Discount code management with valid/used coupon tracking
- **💰 Promotions**: "WELCOME20" and "SAVE10" discount codes with progress tracking
- **💬 In-Trip Chat**: Real-time messaging with drivers during active trips
- **⚡ Quick Actions**: Improved home screen with promotion counters and fast access

### Shared Infrastructure:
- **🔒 AuthService**: Complete authentication management
- **💾 StorageService**: Local data persistence layer
- **🔐 QRSecurityService**: Secure QR code generation and validation
- **💬 ChatService**: Mock P2P real-time messaging service with typing indicators
- **🎨 Modern UI**: Enhanced visual design with animations and gradients

## 🛠️ Local Build Infrastructure

The project now includes scripts for building APKs locally without EAS limits:
- `npm run build:local:passenger` - Build and submit passenger app
- `npm run build:local:driver` - Build and submit driver app
- See `BUILD_LOCAL.md` for complete setup instructions
