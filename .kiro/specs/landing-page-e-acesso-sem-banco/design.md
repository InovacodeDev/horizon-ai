# Design Document

## Overview

Este documento detalha a arquitetura e o design da solução para permitir acesso ao dashboard sem banco conectado e criar uma landing page completa e animada para a Horizon AI. A solução mantém a arquitetura Next.js existente e adiciona novos componentes e páginas seguindo o Design System Material 3 já estabelecido.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Public Routes              Protected Routes                 │
│  ┌──────────────┐          ┌──────────────────┐            │
│  │ Landing Page │          │    Dashboard     │            │
│  │   (/)        │          │   (optional      │            │
│  │              │          │    bank conn)    │            │
│  └──────────────┘          └──────────────────┘            │
│  ┌──────────────┐          ┌──────────────────┐            │
│  │    Login     │          │   Connections    │            │
│  │  (/login)    │          │                  │            │
│  └──────────────┘          └──────────────────┘            │
│  ┌──────────────┐          ┌──────────────────┐            │
│  │   Register   │          │     Assets       │            │
│  │ (/register)  │          │                  │            │
│  └──────────────┘          └──────────────────┘            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
Landing Page Components:
├── HeroSection
│   ├── Headline
│   ├── Subheadline
│   └── CTAButtons
├── FeaturesSection
│   └── FeatureCard (x5)
├── BenefitsSection
│   └── BenefitItem (x3)
├── HowItWorksSection
│   └── Step (x3)
├── PricingSection
│   └── PricingCard (x2)
├── SocialProofSection
│   └── Testimonial (x3)
└── Footer
    ├── Links
    └── Copyright

Dashboard Empty States:
├── EmptyDashboard
│   ├── EmptyStateIllustration
│   ├── EmptyStateMessage
│   └── ConnectBankCTA
└── EmptyTransactionFeed
    └── EmptyStateMessage
```

## Components and Interfaces

### 1. Landing Page Components

#### HeroSection Component

```typescript
interface HeroSectionProps {
  title: string;
  subtitle: string;
  primaryCTA: {
    text: string;
    href: string;
  };
  secondaryCTA: {
    text: string;
    href: string;
  };
}
```

**Design Specifications:**

- Background: Gradient from `color.primary` to `color.primaryContainer`
- Typography: `typography.display-m` for title, `typography.body-l` for subtitle
- Spacing: 64dp vertical padding, 24dp horizontal padding
- Animation: Fade-in with slide-up on mount (duration: 600ms, easing: emphasized)

#### FeatureCard Component

```typescript
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number; // For staggered animation
}
```

**Design Specifications:**

- Container: `color.surface` with `shape.corner-m` (12dp)
- Elevation: 2dp shadow
- Padding: 24dp
- Animation: Fade-through with stagger (delay: index \* 100ms)

#### PricingCard Component

```typescript
interface PricingCardProps {
  plan: "free" | "premium";
  price: string;
  features: string[];
  highlighted?: boolean;
  ctaText: string;
  ctaHref: string;
}
```

**Design Specifications:**

- Container: `color.surface` with `shape.corner-m`
- Highlighted card: Border with `color.primary` (2dp)
- CTA Button: `Button-Filled` component from Design System
- Animation: Scale-in on scroll into view

### 2. Empty State Components

#### EmptyDashboard Component

```typescript
interface EmptyDashboardProps {
  onConnectBank: () => void;
}
```

**Design Specifications:**

- Layout: Centered vertically and horizontally
- Illustration: SVG icon (bank building) with `color.primary`
- Message: `typography.headline-l` for title, `typography.body-l` for description
- CTA: `Button-Filled` with `color.primary`
- Animation: Fade-in on mount

## Data Models

### No new database models required

The existing schema already supports optional bank connections. We only need to modify the application logic to handle cases where `connections` table has zero records for a user.

### Frontend State Management

```typescript
// User context extension
interface UserContext {
  user: User;
  hasConnections: boolean;
  isLoadingConnections: boolean;
}

// Empty state detection
const useHasConnections = () => {
  const { data: connections, isLoading } = useQuery({
    queryKey: ["connections"],
    queryFn: fetchConnections,
  });

  return {
    hasConnections: (connections?.length ?? 0) > 0,
    isLoading,
  };
};
```

## Animation Strategy

### Animation Library

Utilizaremos **Framer Motion** para todas as animações, mantendo consistência com o Design System Material 3.

### Animation Patterns

#### 1. Fade Through (Landing Page Sections)

```typescript
const fadeThrough = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.4, 0.0, 0.2, 1] },
};
```

#### 2. Staggered Children (Feature Cards)

```typescript
const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};
```

#### 3. Scroll-Triggered Animations

```typescript
// Using Intersection Observer via Framer Motion
<motion.div
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: "-100px" }}
  variants={fadeThrough}
>
```

## Routing Strategy

### Route Configuration

```typescript
// src/middleware.ts modifications
export function middleware(request: NextRequest) {
  const token = request.cookies.get("accessToken");
  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = ["/", "/login", "/register"];

  // If authenticated and accessing root, redirect to dashboard
  if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Protected routes - allow access even without bank connections
  const protectedRoutes = [
    "/dashboard",
    "/connections",
    "/assets",
    "/portfolio",
  ];
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // Remove any bank connection validation here
  }

  return NextResponse.next();
}
```

## Error Handling

### Empty State Scenarios

1. **No Bank Connections**
   - Display: EmptyDashboard component
   - Action: Redirect to /connections on CTA click
   - Message: "Conecte sua primeira conta para começar a ver seus dados financeiros consolidados"

2. **No Transactions**
   - Display: EmptyTransactionFeed component
   - Message: "Suas transações aparecerão aqui após a primeira sincronização"

3. **No Assets**
   - Display: EmptyAssets component
   - Message: "Adicione notas fiscais para rastrear seus produtos e garantias"

## Testing Strategy

### Unit Tests

- Test all new components in isolation
- Test animation variants and transitions
- Test empty state logic and conditional rendering

### Integration Tests

- Test navigation flow: Landing → Register → Login → Dashboard
- Test dashboard access without bank connections
- Test redirect logic for authenticated users on landing page

### E2E Tests

- Complete user journey: View landing page → Register → Access dashboard without connecting bank
- Verify all animations execute correctly
- Test responsive behavior on mobile, tablet, and desktop

### Accessibility Tests

- Verify WCAG 2.1 AA compliance for all new components
- Test keyboard navigation through landing page
- Verify screen reader compatibility for empty states

## Performance Considerations

### Landing Page Optimization

- Lazy load below-the-fold sections
- Optimize images and illustrations (use WebP format)
- Implement code splitting for animation library
- Target Lighthouse score: 90+ for Performance

### Animation Performance

- Use CSS transforms (translateY, scale) for hardware acceleration
- Avoid animating layout properties (width, height)
- Use `will-change` sparingly and only during animations
- Target 60fps for all animations

### Bundle Size

- Lazy load Framer Motion only on landing page
- Tree-shake unused animation variants
- Target: < 50KB additional bundle size for landing page

## Security Considerations

### Public Landing Page

- No sensitive data exposed
- Rate limiting on contact forms (if added)
- CSP headers configured for external resources

### Empty State Access

- Maintain authentication requirement for dashboard
- No data leakage in empty states
- Proper authorization checks remain in place

## Deployment Strategy

### Phased Rollout

1. **Phase 1**: Deploy empty state components and remove bank connection requirement
2. **Phase 2**: Deploy landing page with animations
3. **Phase 3**: Monitor analytics and iterate based on user behavior

### Feature Flags

```typescript
// Optional: Use feature flags for gradual rollout
const FEATURES = {
  LANDING_PAGE_V2: process.env.NEXT_PUBLIC_FEATURE_LANDING_V2 === "true",
  OPTIONAL_BANK_CONNECTION:
    process.env.NEXT_PUBLIC_FEATURE_OPTIONAL_BANK === "true",
};
```

### Monitoring

- Track landing page conversion rate (visitor → signup)
- Monitor dashboard access without bank connections
- Track time to first bank connection after signup
- Monitor animation performance metrics (FPS, jank)
