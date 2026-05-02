# Authentication System

## Overview

This frontend-v2 application uses a MongoDB-based authentication system with OTP (One-Time Password) email verification. The authentication is handled entirely in the frontend, with no backend API authentication required.

## Features

- **Email + OTP Authentication**: Users sign in/up using their email and receive a 6-digit OTP via email
- **User Registration**: Collects first name, last name, organization, designation, and email
- **Free Trial**: All new users get a 1-day free trial automatically
- **JWT Session Management**: Secure session handling with HTTP-only cookies
- **Trial Tracking**: Visual indicators showing remaining trial days
- **MongoDB Storage**: All user data stored in MongoDB

## Architecture

### Database (MongoDB)

**Collections:**

1. **users** - Stores user accounts
   - email, firstName, lastName, organization, designation
   - trialEndsAt, isActive, hasSubscription
   - createdAt, updatedAt

2. **otps** - Stores OTP codes for verification
   - email, otp, expiresAt (10 minutes)
   - verified, createdAt

### API Routes

All routes are in `/src/app/api/auth/`:

- `POST /api/auth/request-otp` - Send OTP to email
- `POST /api/auth/signup` - Create new account with OTP verification
- `POST /api/auth/signin` - Sign in with OTP verification
- `POST /api/auth/signout` - Clear session
- `GET /api/auth/me` - Get current user info

### Authentication Flow

#### Sign Up
1. User enters email
2. User provides personal details (first name, last name, org, designation)
3. System sends OTP to email
4. User enters 6-digit OTP
5. System creates account with 1-day trial
6. JWT token set in HTTP-only cookie
7. User redirected to dashboard

#### Sign In
1. User enters email
2. System sends OTP to email
3. User enters 6-digit OTP
4. System verifies OTP and checks access
5. JWT token set in HTTP-only cookie
6. User redirected to dashboard

## Environment Variables

Add these to your `.env` file:

```env
# MongoDB connection
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=quantum_platform

# JWT Secret (change this in production!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Email configuration (Resend)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@quantumplatform.com
```

## Setup

### 1. Install MongoDB

```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 2. Configure Email Service (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add to `.env`

### 3. Install Dependencies

Already included in `package.json`:
- `mongodb` - MongoDB driver
- `jsonwebtoken` - JWT tokens
- `resend` - Email service
- `input-otp` - OTP input component

### 4. Run the Application

```bash
bun install
bun run dev
```

## Components

### Auth Context

`/src/contexts/auth-context.tsx`

Provides global auth state:
```tsx
const { user, loading, signOut, refreshUser } = useAuth();
```

### UI Components

- `SignupForm` - Multi-step signup with OTP verification
- `SigninForm` - Two-step signin with OTP
- `NavUser` - User menu in sidebar with sign out
- `TrialBanner` - Shows trial status and expiration warnings

### Middleware

`/src/middleware.ts`

- Protects all routes except `/signin` and `/signup`
- Redirects unauthenticated users to sign in
- Redirects authenticated users away from auth pages

## Design System

Follows the Plane.so-inspired design in `DESIGN.md`:

- Dark theme with `#0d1117` background
- Blue accent color `#3b82f6` for CTAs
- Monospace for OTP codes
- Minimal borders and shadows
- Tight spacing and high information density

## Trial System

- **Duration**: 1 day (24 hours) from signup
- **Warnings**: Shows banner when ≤3 days remain
- **Expiration**: Blocks access when trial expires without subscription
- **Future**: Subscription module will be added to extend access

## Security Features

- HTTP-only cookies prevent XSS attacks
- JWT tokens with 7-day expiration
- OTP expires after 10 minutes
- Email validation on all forms
- Secure session management
- No passwords stored (OTP-based auth)

## Backend API Routes

The backend API routes (`/api/dashboard`, `/api/finance`, `/api/options`, `/api/runs`) remain **open** without authentication. Only the frontend enforces user authentication.

## Testing

### Test User Flow

1. Go to `/signup`
2. Enter email and personal details
3. Check email for OTP
4. Enter OTP to create account
5. View trial banner at top of dashboard
6. Check user menu in sidebar
7. Sign out and sign in again

### Test Trial Expiration

To test trial expiration, manually update the user's `trialEndsAt` field in MongoDB to a past date.

## Future Enhancements

- [ ] Subscription module for paid plans
- [ ] Email verification reminders
- [ ] Account settings page
- [ ] Profile editing
- [ ] Organization management
- [ ] Multi-factor authentication
- [ ] Password recovery flow
- [ ] Admin dashboard for user management
