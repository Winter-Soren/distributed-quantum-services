# Authentication System Design

**Date:** 2026-05-02  
**Type:** Feature Implementation  
**Scope:** Frontend-only authentication with email+OTP, MongoDB backend, JWT cookies

---

## Overview

Implement a complete authentication system in the Next.js frontend using email+OTP verification, JWT tokens stored in HTTP-only cookies, and MongoDB for user/OTP storage. Remove all Neon DB references and consolidate on MongoDB only. Follow the Plane.so-inspired design system (DESIGN.md) for all UI components.

## Requirements

### User Flows

**Sign Up:**
1. User fills form: firstName, lastName, email, organization, designation
2. System validates email uniqueness
3. System generates 6-digit OTP, stores in MongoDB with 10-minute expiry
4. System sends OTP via Resend email service
5. User enters OTP on verification page
6. System verifies OTP, creates user account with 1-day trial (trialExpiresAt = now + 24 hours)
7. System issues JWT cookie, redirects to dashboard

**Sign In:**
1. User enters email
2. System checks if user exists
3. System generates 6-digit OTP, stores in MongoDB with 10-minute expiry
4. System sends OTP via Resend
5. User enters OTP on verification page
6. System verifies OTP, issues JWT cookie, redirects to dashboard

**Protected Routes:**
- All routes under `/(main)/*` require valid JWT cookie
- Middleware checks JWT validity before allowing access
- Invalid/expired JWT redirects to `/login`
- Trial expiry check happens on protected routes (show banner if expired)

### Data Models

**User (MongoDB collection: `users`):**
```typescript
{
  _id: ObjectId,
  email: string (unique, indexed),
  firstName: string,
  lastName: string,
  organization: string,
  designation: string,
  trialExpiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**OTP Code (MongoDB collection: `otp_codes`):**
```typescript
{
  _id: ObjectId,
  email: string (indexed),
  code: string (6 digits),
  purpose: 'signup' | 'signin',
  expiresAt: Date (TTL index),
  createdAt: Date
}
```

**JWT Payload:**
```typescript
{
  userId: string,
  email: string,
  trialExpiresAt: string (ISO date),
  iat: number,
  exp: number (7 days from issue)
}
```

---

## Architecture

### Technology Stack
- **Frontend:** Next.js 16.2, React 19, TypeScript
- **Styling:** Tailwind CSS 4, following DESIGN.md specifications
- **Database:** MongoDB (existing connection from backend-v2)
- **Email:** Resend API
- **Auth:** JWT with jsonwebtoken library
- **HTTP-only Cookies:** Secure, SameSite=Lax

### File Structure

**API Routes:**
```
src/app/api/auth/
├── signup/route.ts          # POST: validate email, send OTP
├── signin/route.ts          # POST: check user exists, send OTP
├── verify-otp/route.ts      # POST: verify OTP, issue JWT
├── signout/route.ts         # POST: clear JWT cookie
├── me/route.ts              # GET: return current user
└── resend-otp/route.ts      # POST: resend OTP code
```

**Frontend Pages:**
```
src/app/
├── signup/page.tsx          # Sign up form
├── login/page.tsx           # Sign in form (replace existing)
├── verify-otp/page.tsx      # OTP entry form
└── (main)/                  # Protected route group
```

**Utilities:**
```
src/lib/
├── db.ts                    # MongoDB connection singleton
├── jwt.ts                   # JWT sign/verify utilities
├── otp.ts                   # OTP generation/validation
└── email.ts                 # Resend email service
```

**Middleware:**
```
src/middleware.ts            # JWT validation, route protection
```

**Types:**
```
src/types/auth.ts            # User, OTP, JWT types
```

---

## Component Design

### 1. API Route: `/api/auth/signup`

**Request:**
```typescript
POST /api/auth/signup
{
  email: string,
  firstName: string,
  lastName: string,
  organization: string,
  designation: string
}
```

**Logic:**
1. Validate input fields (Zod schema)
2. Check if email already exists in `users` collection
3. If exists, return error: "Email already registered"
4. Generate 6-digit OTP
5. Store OTP in `otp_codes` collection with 10-minute expiry, purpose='signup'
6. Send OTP email via Resend
7. Store signup data temporarily in session/cookie for OTP verification step
8. Return success: `{ success: true, email }`

**Response:**
```typescript
{ success: true, email: string } | { error: string }
```

### 2. API Route: `/api/auth/signin`

**Request:**
```typescript
POST /api/auth/signin
{
  email: string
}
```

**Logic:**
1. Validate email format
2. Check if user exists in `users` collection
3. If not exists, return error: "No account found with this email"
4. Generate 6-digit OTP
5. Store OTP in `otp_codes` collection with 10-minute expiry, purpose='signin'
6. Send OTP email via Resend
7. Return success: `{ success: true, email }`

**Response:**
```typescript
{ success: true, email: string } | { error: string }
```

### 3. API Route: `/api/auth/verify-otp`

**Request:**
```typescript
POST /api/auth/verify-otp
{
  email: string,
  code: string,
  purpose: 'signup' | 'signin',
  signupData?: {
    firstName: string,
    lastName: string,
    organization: string,
    designation: string
  }
}
```

**Logic:**
1. Find valid OTP in `otp_codes` (email, code, purpose, expiresAt > now)
2. If not found or expired, return error: "Invalid or expired OTP"
3. Delete used OTP from database
4. **If purpose='signup':**
   - Create new user in `users` collection
   - Set trialExpiresAt = now + 24 hours
5. **If purpose='signin':**
   - Fetch user from `users` collection
6. Generate JWT with payload: `{ userId, email, trialExpiresAt }`
7. Set HTTP-only cookie: `auth-token`, SameSite=Lax, Secure (in production), Max-Age=7 days
8. Return success with user data

**Response:**
```typescript
{
  success: true,
  user: {
    id: string,
    email: string,
    firstName: string,
    lastName: string,
    organization: string,
    designation: string,
    trialExpiresAt: string
  }
} | { error: string }
```

### 4. API Route: `/api/auth/signout`

**Request:**
```typescript
POST /api/auth/signout
```

**Logic:**
1. Clear `auth-token` cookie (set Max-Age=0)
2. Return success

**Response:**
```typescript
{ success: true }
```

### 5. API Route: `/api/auth/me`

**Request:**
```typescript
GET /api/auth/me
```

**Logic:**
1. Extract JWT from `auth-token` cookie
2. Verify JWT signature and expiry
3. Fetch user from `users` collection by userId from JWT
4. Return user data or 401 if invalid

**Response:**
```typescript
{
  user: {
    id: string,
    email: string,
    firstName: string,
    lastName: string,
    organization: string,
    designation: string,
    trialExpiresAt: string
  }
} | { error: 'Unauthorized' }
```

### 6. API Route: `/api/auth/resend-otp`

**Request:**
```typescript
POST /api/auth/resend-otp
{
  email: string,
  purpose: 'signup' | 'signin'
}
```

**Logic:**
1. Delete any existing OTPs for this email+purpose
2. Generate new 6-digit OTP
3. Store in `otp_codes` with 10-minute expiry
4. Send via Resend
5. Return success

**Response:**
```typescript
{ success: true } | { error: string }
```

---

## Frontend Pages

### 1. Sign Up Page (`/signup`)

**UI Components:**
- Dark background (`#0d1117`)
- Card on elevated surface (`#1f2937`)
- Form fields: Email, First Name, Last Name, Organization, Designation
- Primary button: "Send OTP" (blue `#3b82f6`)
- Link to sign in: "Already have an account? Sign in"

**Behavior:**
1. Client-side validation (Zod)
2. On submit: POST to `/api/auth/signup`
3. On success: Store email in state, navigate to `/verify-otp?purpose=signup&email={email}`
4. On error: Display error message below form

**Styling (DESIGN.md):**
- Input fields: background `#0d1117`, border `1px solid rgba(255,255,255,0.1)`, radius 6px, padding 8px 12px
- Focus state: border `#3b82f6` + ring `0 0 0 3px rgba(59,130,246,0.1)`
- Button: background `#3b82f6`, hover `#2563eb`, transition 150ms ease-out
- Typography: 14px Inter for body, 16px weight 500 for labels

### 2. Sign In Page (`/login`)

**UI Components:**
- Similar layout to sign up
- Single field: Email
- Primary button: "Send OTP"
- Link to sign up: "Don't have an account? Sign up"

**Behavior:**
1. On submit: POST to `/api/auth/signin`
2. On success: Navigate to `/verify-otp?purpose=signin&email={email}`
3. On error: Display error message

### 3. OTP Verification Page (`/verify-otp`)

**URL Params:**
- `email` (string)
- `purpose` ('signup' | 'signin')

**UI Components:**
- 6-digit OTP input (use `input-otp` library already in package.json)
- "Verify" button
- "Resend OTP" link (with 60-second cooldown timer)
- Back link to sign up/sign in

**Behavior:**
1. Auto-focus first OTP digit
2. On complete (6 digits entered): Auto-submit or show Verify button
3. POST to `/api/auth/verify-otp` with email, code, purpose, signupData (if signup)
4. On success: Redirect to `/dashboard`
5. On error: Clear OTP fields, show error
6. Resend OTP: POST to `/api/auth/resend-otp`, start 60s cooldown

**Styling:**
- OTP input: Large monospace digits (JetBrains Mono 24px), individual boxes with same styling as input fields
- Resend link: secondary text color `#9ca3af`, hover `#f9fafb`

---

## Middleware (`src/middleware.ts`)

**Responsibilities:**
1. Run on all routes except `/api/auth/*`, `/login`, `/signup`, `/verify-otp`, `/_next/*`, `/favicon.ico`
2. Extract `auth-token` cookie
3. Verify JWT signature and expiry
4. **If valid JWT:**
   - Allow request to continue
   - If accessing `/login` or `/signup`, redirect to `/dashboard`
5. **If invalid/missing JWT:**
   - If accessing protected route `/(main)/*`, redirect to `/login`
   - If accessing public route, allow

**Matcher Config:**
```typescript
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)']
}
```

---

## Utilities

### `src/lib/db.ts` - MongoDB Connection

**Purpose:** Provide singleton MongoDB client connection.

**Implementation:**
```typescript
import { MongoClient } from 'mongodb';

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGODB_DB_NAME || 'quantum_network';

if (!global._mongoClientPromise) {
  client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export async function getDb() {
  const client = await clientPromise;
  return client.db(dbName);
}
```

### `src/lib/jwt.ts` - JWT Utilities

**Functions:**
- `signJwt(payload)` - Sign JWT with secret, 7-day expiry
- `verifyJwt(token)` - Verify and decode JWT
- `getJwtFromCookies(cookies)` - Extract JWT from cookie header

**Implementation:**
```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export function signJwt(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJwt(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
```

### `src/lib/otp.ts` - OTP Generation

**Functions:**
- `generateOtp()` - Generate 6-digit random code
- `hashOtp(code)` - Hash OTP for storage (optional, for extra security)

**Implementation:**
```typescript
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
```

### `src/lib/email.ts` - Resend Email Service

**Functions:**
- `sendOtpEmail(email, code, purpose)` - Send OTP email via Resend

**Implementation:**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(
  email: string,
  code: string,
  purpose: 'signup' | 'signin'
): Promise<void> {
  const subject = purpose === 'signup' 
    ? 'Verify your account - OTP Code'
    : 'Sign in to your account - OTP Code';

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
    to: email,
    subject,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f9fafb; font-size: 24px;">Your OTP Code</h1>
        <p style="color: #9ca3af; font-size: 14px;">
          Use the code below to ${purpose === 'signup' ? 'complete your registration' : 'sign in to your account'}:
        </p>
        <div style="background: #1f2937; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-family: 'JetBrains Mono', monospace; font-size: 32px; font-weight: 600; color: #3b82f6; text-align: center; margin: 0;">
            ${code}
          </p>
        </div>
        <p style="color: #6b7280; font-size: 12px;">
          This code expires in 10 minutes. If you didn't request this, please ignore this email.
        </p>
      </div>
    `
  });
}
```

---

## Environment Variables

Add to `frontend-v2/.env`:
```bash
# MongoDB (reuse from backend-v2 or use separate connection)
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=quantum_network

# JWT
JWT_SECRET=your-secret-key-min-32-chars-change-in-production

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com

# Existing backend proxy
QUANTUM_BACKEND_URL=http://127.0.0.1:8081
```

Add to `.env.example`:
```bash
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=quantum_network
JWT_SECRET=your-secret-key-here
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com
QUANTUM_BACKEND_URL=http://127.0.0.1:8081
```

---

## Dependencies to Install

```bash
bun add mongodb jsonwebtoken resend
bun add -D @types/jsonwebtoken
```

---

## Database Indexes

**MongoDB Indexes to Create:**
```javascript
// users collection
db.users.createIndex({ email: 1 }, { unique: true });

// otp_codes collection
db.otp_codes.createIndex({ email: 1 });
db.otp_codes.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
```

---

## Removal of Neon DB

**Actions:**
1. Search codebase for any Neon imports or references
2. Remove `@neondatabase/*` packages from package.json if present
3. Ensure all API routes use MongoDB connection from `src/lib/db.ts`
4. Remove any Postgres connection pooling code

---

## Security Considerations

1. **JWT Secret:** Use strong random secret (min 32 chars) in production
2. **HTTP-only Cookies:** Prevent XSS attacks by making cookie inaccessible to JavaScript
3. **SameSite=Lax:** Protect against CSRF attacks
4. **Secure Flag:** Enable in production (HTTPS only)
5. **OTP TTL:** 10-minute expiry, auto-delete via MongoDB TTL index
6. **Rate Limiting:** Consider adding rate limits to OTP send endpoints (future enhancement)
7. **Email Validation:** Validate email format and check for disposable email domains (optional)

---

## Trial Period Management

**Implementation:**
- `trialExpiresAt` stored in user document and JWT payload
- Middleware can check trial status but doesn't block (allow expired trial users to access)
- Display banner/modal on protected pages if trial expired
- Banner component: "Your trial has expired. Subscribe to continue using all features."
- Subscription module to be built in future (out of scope for this design)

---

## Error Handling

**API Routes:**
- Return consistent error format: `{ error: string }`
- Use HTTP status codes: 400 (validation), 401 (unauthorized), 404 (not found), 500 (server error)
- Log errors to console in development, use proper logging service in production

**Frontend:**
- Display user-friendly error messages
- Clear form state on errors
- Provide retry mechanisms (resend OTP, go back to sign in)

---

## Testing Strategy

**Manual Testing Checklist:**
1. Sign up with new email → receive OTP → verify → create account → redirect to dashboard
2. Sign in with existing email → receive OTP → verify → redirect to dashboard
3. Enter invalid OTP → show error
4. Wait for OTP expiry (>10 min) → show expired error
5. Resend OTP → receive new code → verify with new code
6. Access protected route without auth → redirect to login
7. Sign out → clear cookie → redirect to login
8. Access /login while authenticated → redirect to dashboard
9. Trial expiry: Create user with trialExpiresAt in past → show trial expired banner

**Future Enhancements:**
- Unit tests for JWT utilities, OTP generation
- Integration tests for API routes
- E2E tests with Playwright for user flows

---

## Migration from Existing Login

**Current State:**
- Existing `/login` page with email/password fields and GitHub OAuth
- No actual authentication logic connected

**Migration Steps:**
1. Replace `/login/page.tsx` with new OTP-based sign-in form
2. Remove password field and GitHub OAuth button
3. Remove `login-form.tsx` component or refactor to new design
4. All existing protected routes continue to work with new JWT middleware

---

## Design System Compliance (DESIGN.md)

**Colors:**
- Background base: `#0d1117`
- Background elevated (cards): `#1f2937`
- Background hover: `#374151`
- Border: `rgba(255,255,255,0.1)`
- Text primary: `#f9fafb`
- Text secondary: `#9ca3af`
- Text tertiary: `#6b7280`
- Accent blue (buttons, focus): `#3b82f6`
- Accent green (success): `#10b981`
- Accent red (error): `#ef4444`

**Typography:**
- Body text: 14px Inter weight 400
- Labels: 12px Inter weight 500
- Headings: 18-24px Inter weight 600
- Monospace (OTP digits): JetBrains Mono

**Spacing:**
- Base unit: 4px (use 8px, 12px, 16px, 24px)
- Card padding: 16px
- Input padding: 8px 12px
- Button padding: 8px 16px

**Interactions:**
- Transitions: 150ms ease-out
- Hover states: subtle background tint
- Focus: blue border + ring
- No dramatic animations or shadows

---

## Implementation Order

1. **Setup:**
   - Install dependencies (mongodb, jsonwebtoken, resend)
   - Create utility files (db.ts, jwt.ts, otp.ts, email.ts)
   - Add environment variables

2. **API Routes:**
   - `/api/auth/signup`
   - `/api/auth/signin`
   - `/api/auth/verify-otp`
   - `/api/auth/me`
   - `/api/auth/signout`
   - `/api/auth/resend-otp`

3. **Frontend Pages:**
   - `/signup` page
   - Replace `/login` page
   - `/verify-otp` page

4. **Middleware:**
   - Create `src/middleware.ts` for route protection

5. **Database:**
   - Create MongoDB indexes

6. **Cleanup:**
   - Remove Neon DB references
   - Update existing components to use auth context

7. **Testing:**
   - Manual testing of all flows

---

## Success Criteria

- ✅ User can sign up with email, receive OTP, verify, and access dashboard
- ✅ User can sign in with email, receive OTP, verify, and access dashboard
- ✅ Protected routes redirect to /login when not authenticated
- ✅ JWT stored in HTTP-only cookie
- ✅ OTP expires after 10 minutes
- ✅ User data stored in MongoDB with 1-day trial period
- ✅ All UI follows DESIGN.md specifications (dark theme, Plane.so style)
- ✅ No Neon DB references remain in codebase
- ✅ Email sent via Resend successfully

---

## Out of Scope (Future Work)

- Subscription payment system
- Social OAuth (Google, GitHub)
- Password reset flow
- Email verification links (alternative to OTP)
- Rate limiting on OTP sends
- Multi-factor authentication
- Role-based access control (RBAC)
- Session management dashboard
- Audit logs for auth events
