# SwapSpace - P2P Bartering & Trading Platform

**Full-stack marketplace for item/service exchanges with real-time messaging**

## 🛠 Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-15-black) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Prisma](https://img.shields.io/badge/Prisma-6-green) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-database-blue) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-cyan)

## ✨ Key Features Implemented

• **Real-time messaging system** - Private conversations between traders with read status tracking  
• **AI-powered face detection** - MediaPipe integration for profile picture validation via webcam  
• **Advanced search & filtering** - Full-text search with category filters and URL state management  
• **Multi-auth system** - Google OAuth + email/SMS OTP verification with session management  
• **Smart image handling** - Cloudinary integration for optimized uploads and transformations

## 🏗 Architecture Pattern

**Feature-based modular architecture** with separation of concerns:

- Server Actions for backend logic
- React Query for state management
- Component composition with Radix UI primitives

## 📦 Notable Libraries/Packages

• **MediaPipe Tasks Vision** - Face detection and validation  
• **Prisma + PostgreSQL** - Type-safe database operations with relational modeling  
• **TanStack Query** - Server state management and caching  
• **React Email + Resend** - Transactional email templates and delivery  
• **Cloudinary** - Image processing and CDN delivery

## 🚀 Quick Start

```bash
npm install
npx prisma generate && npx prisma db push
npm run dev
```

**Environment:** Requires PostgreSQL, Cloudinary, Google OAuth, and Resend API keys
