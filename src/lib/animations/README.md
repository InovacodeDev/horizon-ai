# Animation Components

This directory contains Material Design 3 compliant animation components and utilities for the Horizon AI application.

## Components

### SharedAxis

Used for screen-to-screen transitions to create a sense of forward/backward progression.

```tsx
import { SharedAxis } from "@/lib/animations";

<SharedAxis direction="forward">
  <YourScreen />
</SharedAxis>;
```

**Props:**

- `direction`: "forward" | "backward" - Controls the slide direction
- Duration: 400ms (Long)
- Easing: Emphasized

### FadeThrough

Used for list items entering the screen with a staggered effect.

```tsx
import { FadeThrough } from "@/lib/animations";

<FadeThrough delay={0.1}>
  <ListItem />
</FadeThrough>;
```

**Props:**

- `delay`: number - Delay before animation starts (in seconds)
- Duration: 150ms (Short)

### FadeThroughList

Wrapper component that automatically staggers children with Fade Through animation.

```tsx
import { FadeThroughList } from "@/lib/animations";

<FadeThroughList staggerDelay={0.05}>
  {items.map((item) => (
    <ListItem key={item.id} {...item} />
  ))}
</FadeThroughList>;
```

**Props:**

- `staggerDelay`: number - Delay between each item (default: 0.05s)

### Ripple Effect

Buttons and interactive elements automatically include ripple effects. The ripple is managed through the `useRipple` hook.

```tsx
import { useRipple, RippleContainer } from "@/lib/animations";

function CustomButton() {
  const { ripples, createRipple } = useRipple();

  return (
    <button onClick={createRipple}>
      <RippleContainer ripples={ripples} />
      Click me
    </button>
  );
}
```

## Motion Configuration

All animation durations and easing curves are centralized in `config.ts`:

```tsx
import { motionConfig } from "@/lib/animations";

// Use in framer-motion
<motion.div
  transition={{
    duration: motionConfig.duration.long,
    ease: motionConfig.easing.emphasized,
  }}
/>

// Or use CSS variables
<div style={{ transitionDuration: motionConfig.duration.short }} />
```

## Design System Alignment

All animations follow the Material Design 3 motion guidelines:

- **Short (150ms)**: Subtle feedback like fade-ins
- **Medium (250ms)**: Small element transitions
- **Long (400ms)**: Large-scale transitions like screen changes

- **Emphasized easing**: For elements entering or exiting the screen
- **Standard easing**: For elements transforming within the screen
