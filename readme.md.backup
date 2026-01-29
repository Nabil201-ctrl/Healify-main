# Healthify - Healthcare Mobile Application

<div align="center">

![Healthify Logo](./assets/icon.png)

**Your health, simplified with AI.**

A modern, cross-platform healthcare mobile application built with React Native and Expo, featuring custom authentication, AI-powered health insights, and comprehensive health tracking.

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.18-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)](https://www.typescriptlang.org/)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Authentication Flow](#authentication-flow)
- [API Integration](#api-integration)
- [Setup & Installation](#setup--installation)
- [Configuration](#configuration)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

Healthify is a comprehensive healthcare mobile application that provides users with AI-powered health insights, appointment management, and health tracking capabilities. The application is built with modern technologies to ensure security, scalability, and a seamless user experience across iOS and Android platforms.

### Key Features

- 🔐 **Custom Authentication** - Email/Password authentication
- 🤖 **AI Health Checks** - AI-powered health assessment and insights
- 📅 **Appointment Management** - Schedule and track medical appointments
- 📊 **Health Dashboard** - Comprehensive health metrics and insights
- 🔒 **Secure Data Storage** - (Future: Encrypted storage for sensitive data)
- 🎨 **Modern UI/UX** - Beautiful, intuitive interface built with Tailwind CSS
- 📱 **Cross-Platform** - Works seamlessly on iOS and Android

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile Application                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Expo/RN    │  │   Expo Router│  │  React Native│      │
│  │   Framework  │  │   Navigation │  │   Components │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Custom     │  │   Context    │  │   API Layer  │      │
│  │   Auth       │  │   Providers  │  │   (Axios)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Backend Services                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   NestJS     │  │   Custom     │  │   Database   │      │
│  │   API Server │  │   Auth       │  │   (Future)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Application Architecture Layers

#### 1. **Presentation Layer**
- **React Native Components**: UI components built with React Native
- **Expo Router**: File-based routing system for navigation
- **Tailwind CSS (twrnc)**: Utility-first styling
- **Context API**: Global state management for authentication and user data

#### 2. **Business Logic Layer**
- **AuthContext**: Custom authentication state management
- **API Services**: Business logic for API interactions
- **Navigation Logic**: Route protection and navigation flow
- **Onboarding Logic**: User onboarding state management

#### 3. **Data Access Layer**
- **Custom Auth Service**: Handles user authentication and session management
- **Axios**: HTTP client for API requests
- **AsyncStorage**: Local token storage (for mock implementation)

#### 4. **Infrastructure Layer**
- **Expo Framework**: Build system and native module access
- **TypeScript**: Type safety and developer experience
- **Environment Variables**: Configuration management

### Navigation Architecture

The application uses Expo Router's file-based routing system with route groups:

```
app/
├── _layout.tsx              # Root layout with providers
├── index.tsx                # Entry point
├── (onboarding)/            # Onboarding route group (first screen)
│   └── onboarding.tsx       # Onboarding screen
├── (auth)/                  # Auth route group
│   ├── _layout.tsx          # Auth layout
│   ├── sign-in.tsx          # Sign in screen
│   └── sign-up.tsx          # Sign up screen
└── (home)/                  # Home route group
    ├── _layout.tsx          # Home layout
    └── index.tsx            # Dashboard/home screen
```

### State Management Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    State Management                          │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │           AuthProvider (Context API)               │    │
│  │  - user: User | null                              │    │
│  │  - isLoading: boolean                             │    │
│  │  - isSignedIn: boolean                            │    │
│  │  - signIn: function                               │    │
│  │  - signOut: function                              │    │
│  │  - signUp: function                               │    │
│  └────────────────────────────────────────────────────┘    │
│                        │                                     │
│                        ▼                                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Component-Level State (useState)           │    │
│  │  - Form inputs                                     │    │
│  │  - Loading states                                  │    │
│  │  - Error messages                                  │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.81.5 | Mobile app framework |
| **Expo** | ~54.0.18 | Development platform and tooling |
| **Expo Router** | ~6.0.14 | File-based routing |
| **TypeScript** | ~5.9.2 | Type safety |
| **React** | ^19.1.0 | UI library |
| **Tailwind CSS (twrnc)** | ^4.10.1 | Utility-first styling |

### Backend (NestJS)

| Technology | Version | Purpose |
|------------|---------|---------|
| **NestJS** | ~11.0.0 | Backend framework |
| **TypeScript** | ~5.9.2 | Type safety |
| **Passport** | ~0.7.0 | Authentication middleware |
| **JWT** | ~10.0.0 | JSON Web Tokens |
| **Bcrypt** | ~5.1.1 | Password hashing |

### API & Networking

| Technology | Version | Purpose |
|------------|---------|---------|
| **Axios** | ^1.13.1 | HTTP client |

---

## 📁 Project Structure

```
Health-Care-App/
│
├── app/                          # Expo Router app directory
│   ├── _layout.tsx              # Root layout with providers
│   ├── ...
│
├── api/                          # API layer
│   ├── ...
│
├── components/                   # Shared components
│
├── context/                      # React Context providers
│   └── AuthContext.tsx          # Authentication context
│
├── services/                     # Custom application services
│   ├── AuthService.ts           # Mock authentication service
│   └── OnboardingService.ts     # Onboarding status service
│
├── assets/                       # Static assets
│
├── backend/                      # NestJS backend
│   ├── src/
│   │   ├── auth/                # Auth module (JWT, refresh tokens)
│   │   ├── users/               # User management
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── package.json
│
├── app.json                      # Expo configuration
├── package.json                  # Frontend dependencies
└── README.md                     # This file
```

---

## ✨ Features

### Authentication Features

- ✅ **Email/Password Authentication**
- ✅ **JWT-based Session Management**
- ✅ **Refresh Token Strategy**
- ✅ **Hashed Passwords** (using bcrypt)

### User Experience Features

- ✅ **Onboarding Flow**
- ✅ **Protected Routes**
- ✅ **Dashboard**
- ✅ **Modern UI/UX**

---

## 🔐 Authentication Flow

### Onboarding Flow (New User Journey)

1. **App Launch**: The user sees the onboarding screens for the first time.
2. **Onboarding Completion**: The app marks onboarding as finished in local storage.
3. **Navigation to Auth**: The app navigates to the Sign In/Sign Up screen.

### Sign Up / Sign In Flow

1. **User enters credentials**.
2. **Frontend calls the NestJS backend API** (`/auth/signup` or `/auth/login`).
3. **Backend validates credentials**, creates a user (if signing up), and returns an `accessToken` and a `refreshToken`.
4. **Frontend stores tokens securely**.
5. **Frontend navigates to the main app** (`/home`).

### Session Refresh Flow

1. **Access Token Expires**: The `accessToken` (short-lived) expires.
2. **API call fails with 401 Unauthorized**.
3. **Frontend API interceptor** (future implementation) catches the 401 error.
4. **Interceptor calls the backend** (`/auth/refresh`) with the `refreshToken`.
5. **Backend validates the `refreshToken`** and issues a new pair of tokens.
6. **Frontend stores the new tokens** and retries the original failed API call.
7. The user's session is seamlessly extended without requiring a new login.

---

## 🚀 Setup & Installation

### 1. Frontend (React Native App)

- Navigate to the root directory.
- Run `npm install`.
- Create a `.env` file and set `EXPO_PUBLIC_API_BASE_URL=http://localhost:3000`.
- Run `npm start` to start the Metro bundler.
- Press `i` for iOS simulator or `a` for Android emulator.

### 2. Backend (NestJS Server)

- Navigate to the `backend` directory: `cd backend`.
- Run `npm install`.
- Create a `backend/.env` file with JWT secrets:
  ```env
  JWT_SECRET=your-access-secret
  JWT_REFRESH_SECRET=your-refresh-secret
  PORT=3000
  ```
- Run `npm run start:dev` to start the server in watch mode.

---

## 🤝 Contributing

1. **Fork the repository**.
2. **Create a feature branch**.
3. **Make your changes**.
4. **Commit and push**.
5. **Create a Pull Request**.

---

## 📄 License

This project is licensed under the MIT License.