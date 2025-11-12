<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Horizon AI - Financial Management Platform

A comprehensive financial management platform built with Next.js 16, React 19.2, and Appwrite. Manage accounts, transactions, credit cards, and gain financial insights with AI-powered analytics.

## 🚀 Tech Stack

- **Next.js 16** - React framework with App Router and Turbopack
- **React 19.2** - UI library with Server Components and Actions
- **TypeScript 5.9** - Type safety
- **Appwrite** - Backend-as-a-Service (database, authentication)
- **Tailwind CSS** - Utility-first CSS framework
- **React Compiler** - Automatic performance optimization (experimental)

## ✨ Features

### Core Features

- 🔐 **Authentication** - Secure JWT-based authentication with httpOnly cookies
- 💰 **Account Management** - Track multiple bank accounts and balances
- 💳 **Credit Cards** - Manage credit cards and their transactions
- 📊 **Transactions** - Record and categorize income and expenses
- 📈 **Analytics** - Financial insights and spending patterns
- 🎯 **Categories** - Organize transactions with custom categories

### Advanced Features

- 🏦 **Multi-Account Support** - Checking, savings, and investment accounts
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🔄 **Real-time Updates** - Optimistic UI updates with React 19.2
- 🎨 **Modern UI** - Clean, intuitive interface with Tailwind CSS
- 🚀 **Fast Performance** - Turbopack for lightning-fast builds
- 🔒 **Secure** - Protected routes and secure API endpoints

## 📋 Prerequisites

- **Node.js** >= 22
- **pnpm** >= 9
- **Appwrite** account (cloud or self-hosted)

## 🛠️ Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Appwrite Configuration
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
APPWRITE_DATABASE_ID=your-database-id

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRATION=7d

# Application Configuration
NODE_ENV=development
API_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Optional: AI Features
GEMINI_API_KEY=your-gemini-api-key
```

**Generate JWT Secret:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Setup Database

Run database migrations to create the required tables:

```bash
pnpm migrate:up
```

Check migration status:

```bash
pnpm migrate:status
```

### 4. Run Development Server

Start the development server with Turbopack:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Available Scripts

### Development

- `pnpm dev` - Start development server with Turbopack (fast HMR)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier

### Database Migrations

- `pnpm migrate:up` - Run pending migrations
- `pnpm migrate:down` - Rollback last migration
- `pnpm migrate:status` - Check migration status
- `pnpm migrate:reset` - Reset all migrations (⚠️ destructive)

### Utilities

- `pnpm clean` - Remove build artifacts

## 🏗️ Project Structure

```
horizon-ai/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Public routes (login, register)
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── (app)/                    # Protected routes (dashboard)
│   │   ├── overview/
│   │   ├── accounts/
│   │   ├── transactions/
│   │   ├── categories/
│   │   ├── analytics/
│   │   ├── credit/
│   │   └── layout.tsx
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   ├── accounts/
│   │   ├── transactions/
│   │   └── credit-cards/
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── ui/                       # Reusable UI components
│   ├── layout/                   # Layout components
│   ├── modals/                   # Modal components
│   └── assets/                   # Icons and logos
│
├── lib/                          # Utilities and configurations
│   ├── appwrite/                 # Appwrite client and schema
│   ├── auth/                     # Authentication logic
│   ├── services/                 # Business logic services
│   ├── database/                 # Database utilities and migrations
│   ├── types/                    # TypeScript type definitions
│   └── utils/                    # General utilities
│
├── hooks/                        # Custom React hooks
│   ├── useAccounts.ts
│   ├── useTransactions.ts
│   └── useCreditCards.ts
│
├── actions/                      # Server Actions
│   ├── auth.actions.ts
│   ├── account.actions.ts
│   └── transaction.actions.ts
│
├── functions/                    # Appwrite Functions
│   ├── balance-sync/             # Balance sync function
│   │   ├── src/
│   │   │   └── main.ts          # Function code
│   │   ├── package.json
│   │   ├── deploy.sh            # Deploy script
│   │   ├── DEPLOYMENT.md        # Deploy guide
│   │   └── README.md
│   └── README.md                 # Functions overview
│
├── docs/                         # Documentation
│   ├── APPWRITE_FUNCTIONS.md    # Functions guide
│   ├── MIGRATION-GUIDE.md
│   └── ...
│
├── middleware.ts                 # Next.js middleware (auth)
├── next.config.js                # Next.js configuration
├── tailwind.config.js            # Tailwind CSS configuration
└── tsconfig.json                 # TypeScript configuration
```

## 🎯 React 19.2 Features Used

This project leverages the latest React 19.2 features for optimal performance and developer experience:

### 1. Server Actions

Native form actions that work seamlessly with Next.js:

```typescript
'use server';

export async function loginAction(formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');
  // Authentication logic
}
```

### 2. use Hook

Consume Promises and Context directly in components:

```typescript
'use client';
import { use } from 'react';

function AccountDetails({ accountPromise }) {
  const account = use(accountPromise);
  return <div>{account.name}</div>;
}
```

### 3. useOptimistic

Optimistic UI updates for instant feedback:

```typescript
const [optimisticAccounts, addOptimistic] = useOptimistic(accounts, (state, newAccount) => [...state, newAccount]);
```

### 4. useFormStatus

Access form submission state in child components:

```typescript
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>Submit</button>;
}
```

### 5. useActionState

Manage Server Action state:

```typescript
const [state, formAction, isPending] = useActionState(loginAction, null);
```

## ⚡ Next.js 16 Features

### Turbopack (Stable)

Fast builds and hot module replacement enabled by default:

```bash
pnpm dev  # Automatically uses Turbopack
```

### React Compiler (Experimental)

Automatic optimization without manual `useMemo`/`useCallback`:

```javascript
// next.config.js
experimental: {
  reactCompiler: true,
}
```

### Partial Prerendering (PPR)

Mix static and dynamic content in the same route:

```typescript
export const experimental_ppr = true;

export default async function Page() {
  return (
    <>
      <StaticHeader />
      <Suspense fallback={<Loading />}>
        <DynamicContent />
      </Suspense>
    </>
  );
}
```

### Async Request APIs

New async APIs for cookies and headers:

```typescript
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');
}
```

## 🔐 Authentication

The application uses JWT-based authentication with httpOnly cookies for security:

1. **Login/Register** - User credentials are validated against Appwrite
2. **JWT Token** - Generated and stored in httpOnly cookie
3. **Middleware** - Protects routes and validates tokens
4. **Session** - Maintained across requests via cookies

### Protected Routes

All routes under `/app/(app)/*` require authentication. Unauthenticated users are redirected to `/login`.

### Public Routes

- `/` - Landing page
- `/login` - Login page
- `/register` - Registration page
- `/pricing` - Pricing page

## 🚀 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-repo%2Fhorizon-ai)

#### Manual Deployment

1. Install Vercel CLI:

```bash
pnpm install -g vercel
```

2. Configure environment variables in Vercel dashboard or CLI:

```bash
vercel env add APPWRITE_ENDPOINT
vercel env add APPWRITE_PROJECT_ID
vercel env add APPWRITE_API_KEY
vercel env add APPWRITE_DATABASE_ID
vercel env add JWT_SECRET
```

3. Deploy:

```bash
vercel --prod
```

### Environment Variables for Production

Ensure all required environment variables are set in your deployment platform:

- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_DATABASE_ID`
- `JWT_SECRET`
- `JWT_EXPIRATION`
- `NODE_ENV=production`
- `CORS_ORIGIN` (your production domain)

## 🤖 Appwrite Functions

The project uses Appwrite Functions for automated background tasks:

### Balance Sync Function

Automatically manages account balances based on transactions:

- **Real-time Sync**: Updates balance when transactions are created/edited/deleted
- **Daily Processing**: Runs at 20:00 to process transactions that reached their date
- **Smart Logic**: Ignores future transactions and credit card transactions

**Setup**: See [functions/balance-sync/DEPLOYMENT.md](functions/balance-sync/DEPLOYMENT.md)

**Documentation**: See [docs/APPWRITE_FUNCTIONS.md](docs/APPWRITE_FUNCTIONS.md)

## 📚 Documentation

- [Appwrite Functions Guide](docs/APPWRITE_FUNCTIONS.md) - Complete guide to Appwrite Functions
- [Migration Guide](docs/MIGRATION-GUIDE.md) - Turborepo to Next.js migration details
- [Development Guide](docs/DEVELOPMENT-GUIDE.md) - How to add features and extend the app
- [Appwrite Setup](docs/APPWRITE-QUICKSTART.md) - Appwrite configuration guide
- [Deploy Checklist](docs/DEPLOY-CHECKLIST.md) - Pre-deployment checklist

## 🔧 Configuration

### Next.js Configuration

Key configurations in `next.config.js`:

- **Output**: Standalone for optimized builds
- **React Compiler**: Enabled (experimental)
- **PPR**: Enabled (experimental)
- **Turbopack**: Configured for SVG handling
- **Image Optimization**: AVIF and WebP formats
- **CORS**: Configured for API routes

### TypeScript Configuration

Strict mode enabled with path aliases:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Appwrite](https://appwrite.io/)
- UI components inspired by modern design systems

## 📞 Support

For issues and questions:

- Open an issue on GitHub
- Check the [documentation](docs/)
- Review the [migration guide](docs/MIGRATION-GUIDE.md)

---

Made with ❤️ by the Horizon AI team
