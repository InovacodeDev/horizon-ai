"use client";

import { Button } from "./button";
import { Heart, Download, Plus } from "lucide-react";

/**
 * MD3 Button Examples
 *
 * This file demonstrates all the button variants and features
 * implemented according to Material Design 3 specifications.
 */
export function MD3ButtonExample() {
  return (
    <div className="p-8 space-y-8 bg-[hsl(var(--md-sys-color-background))]">
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-[hsl(var(--md-sys-color-on-background))]">Button Variants</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="filled">Filled Button</Button>
          <Button variant="outlined">Outlined Button</Button>
          <Button variant="text">Text Button</Button>
          <Button variant="elevated">Elevated Button</Button>
          <Button variant="tonal">Tonal Button</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-[hsl(var(--md-sys-color-on-background))]">Button Sizes</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="small">Small</Button>
          <Button size="medium">Medium</Button>
          <Button size="large">Large</Button>
          <Button size="icon" aria-label="Icon button">
            <Heart />
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-[hsl(var(--md-sys-color-on-background))]">Buttons with Icons</h2>
        <div className="flex flex-wrap gap-4">
          <Button icon={<Download />} iconPosition="start">
            Download
          </Button>
          <Button variant="outlined" icon={<Plus />} iconPosition="start">
            Add Item
          </Button>
          <Button variant="text" icon={<Heart />} iconPosition="end">
            Favorite
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-[hsl(var(--md-sys-color-on-background))]">Disabled States</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="filled" disabled>
            Filled Disabled
          </Button>
          <Button variant="outlined" disabled>
            Outlined Disabled
          </Button>
          <Button variant="text" disabled>
            Text Disabled
          </Button>
          <Button variant="elevated" disabled>
            Elevated Disabled
          </Button>
          <Button variant="tonal" disabled>
            Tonal Disabled
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-[hsl(var(--md-sys-color-on-background))]">Full Width Button</h2>
        <Button fullWidth>Full Width Button</Button>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-[hsl(var(--md-sys-color-on-background))]">Without Ripple Effect</h2>
        <div className="flex flex-wrap gap-4">
          <Button disableRipple>No Ripple</Button>
          <Button variant="outlined" disableRipple>
            No Ripple Outlined
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-[hsl(var(--md-sys-color-on-background))]">Without Elevation</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="elevated" disableElevation>
            No Elevation
          </Button>
          <Button variant="filled" disableElevation>
            Filled No Elevation
          </Button>
        </div>
      </section>
    </div>
  );
}
