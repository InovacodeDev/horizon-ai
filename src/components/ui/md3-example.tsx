/**
 * Example component demonstrating MD3 design token usage
 * This file serves as a reference for using the MD3 design system
 */

import { tokens } from "@/lib/theme";

export function MD3Example() {
  return (
    <div className="space-y-8 p-8">
      {/* Color Examples */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">MD3 Colors</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-md-primary text-md-on-primary p-4 rounded-md-md">Primary</div>
          <div className="bg-md-secondary text-md-on-secondary p-4 rounded-md-md">Secondary</div>
          <div className="bg-md-tertiary text-md-on-tertiary p-4 rounded-md-md">Tertiary</div>
          <div className="bg-md-surface-container text-md-on-surface p-4 rounded-md-md">Surface Container</div>
          <div className="bg-md-error text-md-on-error p-4 rounded-md-md">Error</div>
          <div className="border border-md-outline text-md-on-surface p-4 rounded-md-md">Outlined</div>
        </div>
      </section>

      {/* Shape Examples */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">MD3 Shapes</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-md-surface-container p-4 rounded-md-xs">Extra Small (4px)</div>
          <div className="bg-md-surface-container p-4 rounded-md-sm">Small (8px)</div>
          <div className="bg-md-surface-container p-4 rounded-md-md">Medium (12px)</div>
          <div className="bg-md-surface-container p-4 rounded-md-lg">Large (16px)</div>
          <div className="bg-md-surface-container p-4 rounded-md-xl">Extra Large (28px)</div>
          <div className="bg-md-surface-container p-4 rounded-md-full">Full (Pill)</div>
        </div>
      </section>

      {/* Elevation Examples */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">MD3 Elevation</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-md-surface p-4 rounded-md-md shadow-md-0">Level 0</div>
          <div className="bg-md-surface p-4 rounded-md-md shadow-md-1">Level 1</div>
          <div className="bg-md-surface p-4 rounded-md-md shadow-md-2">Level 2</div>
          <div className="bg-md-surface p-4 rounded-md-md shadow-md-3">Level 3</div>
          <div className="bg-md-surface p-4 rounded-md-md shadow-md-4">Level 4</div>
          <div className="bg-md-surface p-4 rounded-md-md shadow-md-5">Level 5</div>
        </div>
      </section>

      {/* Programmatic Token Access Example */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Programmatic Token Access</h2>
        <div
          className="p-4 rounded-md-md"
          style={{
            backgroundColor: `hsl(var(--md-sys-color-primary-container))`,
            color: `hsl(var(--md-sys-color-on-primary-container))`,
          }}
        >
          Using CSS variables directly
        </div>
      </section>
    </div>
  );
}
