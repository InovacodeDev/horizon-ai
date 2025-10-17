import { NavigationBarExample } from "@/components/ui/__examples__/navigation-bar-example";

export default function TestNavigationPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--md-sys-color-background))]">
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold mb-4 text-[hsl(var(--md-sys-color-on-background))]">
          MD3 Navigation Bar Component
        </h1>
        <p className="text-lg mb-8 text-[hsl(var(--md-sys-color-on-surface-variant))]">
          Testing the Material Design 3 Navigation Bar implementation
        </p>
        <NavigationBarExample />
      </div>
    </div>
  );
}
