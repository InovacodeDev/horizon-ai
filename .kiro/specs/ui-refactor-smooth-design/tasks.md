# Implementation Plan - UI Refactor: Smooth & Clean Design

- [x] 1. Setup design tokens and theme foundation
  - Update `tailwind.config.js` with new color palette (light and dark), spacing scale (4px base), typography system (Inter font, sizes, weights), shadow system (soft shadows), and border radius values
  - Update `app/globals.css` with CSS custom properties for both light and dark themes, including all color tokens, and add font imports for Inter
  - Create utility classes for smooth transitions and common patterns
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 8.1, 8.2_

- [x] 2. Implement theme provider and management system
  - [x] 2.1 Create ThemeContext and ThemeProvider components
    - Create `lib/contexts/ThemeContext.tsx` with theme state management (light/dark/system)
    - Implement theme detection logic (system preference via `prefers-color-scheme`)
    - Implement theme persistence using localStorage with key `horizon-theme-preference`
    - Add theme switching function with smooth transitions
    - _Requirements: 5.1, 5.2, 8.5_

  - [x] 2.2 Create theme toggle button component
    - Create `components/ui/ThemeToggle.tsx` with sun/moon icons
    - Implement smooth icon transition animation
    - Add keyboard accessibility (Enter/Space to toggle)
    - Style according to new design tokens
    - _Requirements: 5.2, 3.3, 3.4_

  - [x] 2.3 Integrate theme provider into application
    - Wrap root layout with ThemeProvider in `app/layout.tsx`
    - Apply theme class to document root element
    - Add theme toggle to header/navigation
    - Test theme switching and persistence
    - _Requirements: 5.1, 5.2, 8.5_

- [x] 3. Refactor base UI components with new design system
  - [x] 3.1 Refactor Button component
    - Update `components/ui/Button.tsx` with new variants (primary, secondary, outline, ghost, danger)
    - Implement new sizes (sm: 32px, md: 40px, lg: 48px)
    - Apply new styling (8px border radius, soft shadows on hover, smooth transitions)
    - Update hover, active, and disabled states with new colors
    - Add loading state with spinner
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 8.3, 8.4_

  - [x] 3.2 Refactor Input component
    - Update `components/ui/Input.tsx` with new styling (subtle borders, 8px radius, 44px height)
    - Implement focus state with blue border and subtle glow effect
    - Update placeholder styling with muted text color
    - Add error state with red border and error message display
    - Update disabled state with reduced opacity
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 8.3, 8.4_

  - [x] 3.3 Refactor Card component
    - Update `components/ui/Card.tsx` with new styling (12px border radius, soft shadows)
    - Implement variants (default, elevated, flat, interactive)
    - Update hover effects for interactive cards (shadow increase, subtle lift)
    - Apply new border colors and background colors
    - Ensure proper padding (24px default)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.3, 8.4_

  - [x] 3.4 Refactor Badge component
    - Update `components/ui/Badge.tsx` with new color schemes (success, warning, error, info, neutral)
    - Implement soft background colors with appropriate text colors
    - Apply new sizing (sm: 20px, md: 24px height)
    - Update border radius (6px) and padding
    - Ensure proper contrast in both light and dark modes
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.3, 8.4_

- [x] 4. Update additional UI components
  - [x] 4.1 Update Modal component
    - Update `components/ui/Modal.tsx` with new backdrop (soft blur, reduced opacity)
    - Apply new card styling to modal container
    - Update close button with new icon button styling
    - Implement smooth enter/exit animations
    - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3_

  - [x] 4.2 Update Dropdown component
    - Update `components/ui/DropdownMenu.tsx` with new styling (soft shadow, subtle border)
    - Apply new border radius (8px) and padding
    - Update hover states for menu items
    - Implement smooth open/close animations
    - _Requirements: 1.1, 1.2, 1.3, 3.3, 4.1, 4.2_

  - [x] 4.3 Update Tooltip component
    - Update `components/ui/Tooltip.tsx` with new styling (soft shadow, dark background)
    - Apply new border radius (6px) and padding
    - Update arrow styling
    - Implement smooth fade-in animation
    - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2_

  - [x] 4.4 Update Toast component
    - Update `components/ui/Toast.tsx` with new color schemes (success, error, warning, info)
    - Apply new styling (soft shadow, border radius, padding)
    - Update icon styling and positioning
    - Implement smooth slide-in animation
    - _Requirements: 1.1, 1.2, 1.3, 7.1, 7.2, 7.3, 7.4_

  - [x] 4.5 Update Spinner component
    - Update `components/ui/Spinner.tsx` with new color (blue-primary)
    - Apply smooth rotation animation
    - Ensure visibility in both light and dark modes
    - _Requirements: 1.1, 5.4_

  - [x] 4.6 Update Skeleton component
    - Update `components/ui/Skeleton.tsx` with new background colors
    - Implement smooth pulse animation
    - Ensure proper contrast in both themes
    - _Requirements: 1.1, 1.2, 5.3, 5.4_

- [x] 5. Refactor layout components
  - [x] 5.1 Update Sidebar component
    - Update `components/layout/Sidebar.tsx` (or equivalent) with new background and border colors
    - Apply subtle border on right edge (1px solid border-primary)
    - Update navigation item styling (8px border radius, hover background)
    - Implement active state with blue background and white text
    - Update icon sizing (20px) and spacing
    - Ensure smooth collapse/expand animation
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.3_

  - [x] 5.2 Update Header component
    - Update `components/layout/Header.tsx` (or equivalent) with new background and border colors
    - Apply subtle border on bottom edge (1px solid border-primary)
    - Integrate theme toggle button
    - Update search bar styling with new input design
    - Update user menu dropdown with new styling
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 6.1, 6.2_

  - [x] 5.3 Update page containers and spacing
    - Update `app/(app)/layout.tsx` and page wrappers with new spacing (32px padding desktop, 16px mobile)
    - Apply consistent section spacing (24px between major sections)
    - Set content max-width (1280px centered)
    - Ensure responsive behavior
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 6. Apply new styling to key pages
  - [x] 6.1 Update Dashboard/Overview page
    - Update `app/(app)/overview/page.tsx` with new card styling
    - Apply new spacing between sections and cards
    - Update chart colors to match new palette
    - Ensure proper contrast in dark mode
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 4.1, 4.2, 4.3, 5.3, 5.4_

  - [x] 6.2 Update Transactions page
    - Update `app/(app)/transactions/page.tsx` with new table styling
    - Apply new badge colors for transaction types
    - Update filter and search components with new input styling
    - Ensure proper spacing and alignment
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 6.1, 6.2, 7.1, 7.2, 7.3, 7.4_

  - [x] 6.3 Update Accounts page
    - Update `app/(app)/accounts/page.tsx` with new card styling for account items
    - Apply new button styling for actions
    - Update account balance display with new typography
    - Ensure proper spacing and visual hierarchy
    - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.2, 3.1, 4.1, 4.2_

  - [x] 6.4 Update Categories page
    - Update `app/(app)/categories/page.tsx` with new styling
    - Apply new badge colors for category indicators
    - Update modal styling for category management
    - Ensure proper spacing and alignment
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 4.1, 7.1, 7.2, 7.3, 7.4_

  - [x] 6.5 Update Credit Card Bills page
    - Update `app/(app)/credit-card-bills/page.tsx` with new card styling
    - Apply new badge colors for bill status
    - Update form modals with new input and button styling
    - Ensure proper spacing and visual hierarchy
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 4.1, 6.1, 7.1, 7.2_

  - [x] 6.6 Update Invoices page
    - Update `app/(app)/invoices/page.tsx` with new card styling
    - Apply new chart colors and styling
    - Update invoice card component with new design
    - Ensure proper spacing and alignment
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 4.1, 4.2, 4.3_

  - [x] 6.7 Update Shopping List page
    - Update `app/(app)/shopping-list/page.tsx` with new styling
    - Apply new card styling for product items
    - Update button and badge styling
    - Ensure proper spacing and visual hierarchy
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 4.1, 7.1_

  - [x] 6.8 Update remaining pages
    - Update `app/(app)/analytics/page.tsx`, `app/(app)/settings/page.tsx`, and other pages with new styling
    - Apply consistent spacing, typography, and component styling
    - Ensure all pages follow the new design system
    - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.2, 8.4_

- [x] 7. Update authentication pages
  - [x] 7.1 Update Login page
    - Update `app/(auth)/login/page.tsx` with new card styling for login form
    - Apply new input and button styling
    - Update background and layout
    - Ensure proper spacing and visual hierarchy
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 4.1, 6.1, 6.2_

  - [x] 7.2 Update Register page
    - Update `app/(auth)/register/page.tsx` with new card styling for registration form
    - Apply new input and button styling
    - Update background and layout
    - Ensure proper spacing and visual hierarchy
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 4.1, 6.1, 6.2_

- [x] 8. Update modal components
  - [x] 8.1 Update AddAccountModal
    - Update `components/modals/AddAccountModal.tsx` with new modal styling
    - Apply new input and button styling
    - Update form layout and spacing
    - _Requirements: 3.1, 4.1, 6.1, 6.2, 6.4_

  - [x] 8.2 Update AddTransactionModal
    - Update `components/modals/AddTransactionModal.tsx` with new modal styling
    - Apply new input, button, and select styling
    - Update form layout and spacing
    - _Requirements: 3.1, 4.1, 6.1, 6.2, 6.4_

  - [x] 8.3 Update AddCreditCardModal
    - Update `components/modals/AddCreditCardModal.tsx` with new modal styling
    - Apply new input and button styling
    - Update form layout and spacing
    - _Requirements: 3.1, 4.1, 6.1, 6.2, 6.4_

  - [x] 8.4 Update remaining modals
    - Update `components/modals/AddInvoiceModal.tsx`, `components/modals/EditCreditCardModal.tsx`, and other modals with new styling
    - Apply consistent modal, input, and button styling
    - Ensure all modals follow the new design system
    - _Requirements: 3.1, 4.1, 6.1, 6.2, 6.4, 8.4_

- [x] 9. Verify accessibility and responsiveness
  - [x] 9.1 Conduct accessibility audit
    - Test color contrast ratios for all text/background combinations using automated tools
    - Verify all interactive elements have visible focus states
    - Test keyboard navigation and ensure proper tab order
    - Verify screen reader compatibility with semantic HTML and ARIA labels
    - _Requirements: 5.5, 6.1, 6.2, 6.3, 6.4_

  - [x] 9.2 Test responsive behavior
    - Test all pages on mobile devices (320px, 375px, 414px widths)
    - Test all pages on tablet devices (768px, 1024px widths)
    - Test all pages on desktop (1280px, 1440px, 1920px widths)
    - Verify spacing adjustments work correctly at all breakpoints
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 9.3 Test theme switching
    - Verify smooth transitions between light and dark themes
    - Test theme persistence across page reloads
    - Verify system preference detection works correctly
    - Test all components in both light and dark modes
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 9.4 Cross-browser testing
    - Test in Chrome/Edge (latest 2 versions)
    - Test in Firefox (latest 2 versions)
    - Test in Safari (latest 2 versions)
    - Test in mobile browsers (iOS Safari, Chrome Mobile)
    - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2_

- [x] 10. Documentation and cleanup
  - [x] 10.1 Create component documentation
    - Document all updated components with usage examples
    - Create Storybook stories for base components (Button, Input, Card, Badge)
    - Document design tokens and their usage
    - Create migration guide for developers
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 10.2 Code cleanup and optimization
    - Remove unused CSS classes and styles
    - Optimize Tailwind configuration for production
    - Ensure consistent code formatting
    - Add comments for complex styling logic
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
