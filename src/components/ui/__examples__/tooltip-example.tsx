"use client";

import * as React from "react";
import { Tooltip, TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent } from "../tooltip";
import { Button } from "../button";
import { Info, HelpCircle, Settings, Trash2 } from "lucide-react";

/**
 * Tooltip Examples
 *
 * Demonstrates various tooltip configurations following MD3 specifications.
 */
export function TooltipExamples() {
  return (
    <TooltipProvider>
      <div className="flex flex-col gap-12 p-8">
        {/* Basic Tooltips */}
        <section>
          <h2 className="text-[length:var(--md-sys-typescale-headline-small-size)] mb-6">Basic Tooltips</h2>
          <div className="flex flex-wrap gap-4">
            <Tooltip title="This is a simple tooltip">
              <Button variant="filled">Hover me</Button>
            </Tooltip>

            <Tooltip title="Tooltip with longer text that wraps to multiple lines when it exceeds the maximum width">
              <Button variant="outlined">Long text</Button>
            </Tooltip>

            <Tooltip title="Disabled tooltip" disabled>
              <Button variant="text">Disabled tooltip</Button>
            </Tooltip>
          </div>
        </section>

        {/* Placement Variants */}
        <section>
          <h2 className="text-[length:var(--md-sys-typescale-headline-small-size)] mb-6">Placement Variants</h2>
          <div className="flex flex-wrap gap-4 items-center justify-center min-h-[200px]">
            <Tooltip title="Top placement" placement="top">
              <Button variant="tonal">Top</Button>
            </Tooltip>

            <Tooltip title="Bottom placement" placement="bottom">
              <Button variant="tonal">Bottom</Button>
            </Tooltip>

            <Tooltip title="Left placement" placement="left">
              <Button variant="tonal">Left</Button>
            </Tooltip>

            <Tooltip title="Right placement" placement="right">
              <Button variant="tonal">Right</Button>
            </Tooltip>
          </div>
        </section>

        {/* With Arrow */}
        <section>
          <h2 className="text-[length:var(--md-sys-typescale-headline-small-size)] mb-6">With Arrow Indicator</h2>
          <div className="flex flex-wrap gap-4">
            <Tooltip title="Tooltip with arrow" arrow placement="top">
              <Button variant="elevated">Top with arrow</Button>
            </Tooltip>

            <Tooltip title="Tooltip with arrow" arrow placement="bottom">
              <Button variant="elevated">Bottom with arrow</Button>
            </Tooltip>

            <Tooltip title="Tooltip with arrow" arrow placement="left">
              <Button variant="elevated">Left with arrow</Button>
            </Tooltip>

            <Tooltip title="Tooltip with arrow" arrow placement="right">
              <Button variant="elevated">Right with arrow</Button>
            </Tooltip>
          </div>
        </section>

        {/* Icon Buttons with Tooltips */}
        <section>
          <h2 className="text-[length:var(--md-sys-typescale-headline-small-size)] mb-6">Icon Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Tooltip title="Information" placement="top">
              <Button variant="text" size="icon">
                <Info className="h-5 w-5" />
              </Button>
            </Tooltip>

            <Tooltip title="Help" placement="top">
              <Button variant="text" size="icon">
                <HelpCircle className="h-5 w-5" />
              </Button>
            </Tooltip>

            <Tooltip title="Settings" placement="top">
              <Button variant="text" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Tooltip>

            <Tooltip title="Delete" placement="top">
              <Button variant="text" size="icon">
                <Trash2 className="h-5 w-5" />
              </Button>
            </Tooltip>
          </div>
        </section>

        {/* Custom Delay */}
        <section>
          <h2 className="text-[length:var(--md-sys-typescale-headline-small-size)] mb-6">Custom Delay</h2>
          <div className="flex flex-wrap gap-4">
            <Tooltip title="Instant tooltip" delayDuration={0}>
              <Button variant="outlined">No delay</Button>
            </Tooltip>

            <Tooltip title="Default delay (700ms)">
              <Button variant="outlined">Default delay</Button>
            </Tooltip>

            <Tooltip title="Long delay" delayDuration={1500}>
              <Button variant="outlined">Long delay (1.5s)</Button>
            </Tooltip>
          </div>
        </section>

        {/* Advanced Usage with Primitives */}
        <section>
          <h2 className="text-[length:var(--md-sys-typescale-headline-small-size)] mb-6">
            Advanced Usage (Primitives)
          </h2>
          <div className="flex flex-wrap gap-4">
            <TooltipRoot delayDuration={500}>
              <TooltipTrigger asChild>
                <button className="px-4 py-2 rounded-lg bg-[hsl(var(--md-sys-color-surface-container))] text-[hsl(var(--md-sys-color-on-surface))] hover:bg-[hsl(var(--md-sys-color-surface-container-high))]">
                  Custom trigger
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" arrow>
                Custom tooltip with primitives
              </TooltipContent>
            </TooltipRoot>

            <TooltipRoot>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--md-sys-color-primary-container))] text-[hsl(var(--md-sys-color-on-primary-container))]">
                  <Info className="h-4 w-4" />
                  Hover for info
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>
                This demonstrates full control over tooltip behavior
              </TooltipContent>
            </TooltipRoot>
          </div>
        </section>

        {/* Keyboard Focus */}
        <section>
          <h2 className="text-[length:var(--md-sys-typescale-headline-small-size)] mb-6">Keyboard Focus Support</h2>
          <p className="text-[hsl(var(--md-sys-color-on-surface-variant))] mb-4">
            Tab through these buttons to see tooltips appear on keyboard focus
          </p>
          <div className="flex flex-wrap gap-4">
            <Tooltip title="First button" arrow>
              <Button variant="filled">Button 1</Button>
            </Tooltip>

            <Tooltip title="Second button" arrow>
              <Button variant="filled">Button 2</Button>
            </Tooltip>

            <Tooltip title="Third button" arrow>
              <Button variant="filled">Button 3</Button>
            </Tooltip>
          </div>
        </section>
      </div>
    </TooltipProvider>
  );
}

export default TooltipExamples;
