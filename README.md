# SwapSpace

A modern bartering and trading platform built with Next.js 15

## 🚀 Overview

SwapSpace is a full-stack digital exchange platform that enables users to trade, swap, and exchange items and services efficiently through a secure marketplace.

**Note:** This application is currently optimized for desktop view only and is not yet responsive for mobile devices.

## ✨ Features

- **Multi-Authentication System**: Secure login with Google OAuth + email/SMS OTP verification using [Oslo](https://oslojs.dev/) authentication libraries
- **Bartering & Trading**: Post items/services, create offers, and manage trade negotiations
- **Real-time Messaging**: Private conversations between traders with read status tracking
- **AI-Powered Profile Validation**: MediaPipe face detection for profile picture verification via webcam
- **Advanced Search & Filter**: Full-text search with category filters and URL state management using [nuqs](https://www.npmjs.com/package/nuqs)
- **Smart Image Handling**: Cloudinary integration for optimized uploads and transformations
- **Notification System**: Real-time notifications for offers, messages, and trade updates
- **Profile Management**: Comprehensive user profiles with webcam capture functionality

## 🛠️ Tech Stack

- **Core Framework**:
  - Next.js 15
  - React 19
  - TypeScript

- **UI & Styling**:
  - Tailwind CSS
  - Shadcn UI components
  - next-themes (dark/light mode)

- **State Management & Data Fetching**:
  - TanStack React Query (server state management)
  - Next.js Server Actions (backend operations)
  - nuqs (URL-based state management)

- **Database & Authentication**:
  - Prisma ORM
  - PostgreSQL
  - Oslo authentication libraries (@oslojs/crypto, @oslojs/encoding)
  - Arctic (OAuth integration)
  - Node.js Argon2 (password hashing)

- **Media & AI Processing**:
  - Cloudinary (image processing and CDN)
  - MediaPipe Tasks Vision (AI face detection)
  - next-cloudinary (optimized image delivery)

- **Communication**:
  - React Email + Resend (transactional emails)
  - Real-time messaging system

- **Utility Libraries**:
  - zod (schema validation for forms and API data)
  - date-fns (date manipulation)
  - uuid (unique identifier generation)
  - react-intersection-observer (scroll detection)
  - react-webcam (camera integration)

### Key Architectural Decisions

1. **Feature-Based Architecture**:
   - The codebase is organized by features (e.g., `auth`, `bartering`, `messaging`, `profile`) rather than by type (e.g., `components`, `hooks`, `utils`).
   - Each feature contains its own components, hooks, actions, and queries, making it easier to scale and maintain the application.

2. **Server-First Approach**:
   - Leverages Next.js Server Actions for backend operations
   - Server-side authentication and session management
   - Optimized data fetching with React Query

3. **Type Safety**:
   - End-to-end type safety with TypeScript and Prisma
   - Schema validation with Zod for all user inputs and API responses

## 🚀 Quick Start

```bash
npm install
npx prisma generate && npx prisma db push
npm run dev
```

**Environment:** Requires PostgreSQL, Cloudinary, Google OAuth, and Resend API keys
