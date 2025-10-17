/**
 * Animation Performance Optimization Utilities
 *
 * Utilities to ensure animations meet 60fps target and use hardware acceleration.
 * Based on MD3 motion system and performance best practices.
 */

/**
 * Check if the browser supports hardware acceleration
 */
export function supportsHardwareAcceleration(): boolean {
  if (typeof window === "undefined") return false;

  // Check for CSS transform support
  const testElement = document.createElement("div");
  const transforms = ["transform", "WebkitTransform", "MozTransform", "msTransform", "OTransform"];

  return transforms.some((transform) => {
    return testElement.style[transform as any] !== undefined;
  });
}

/**
 * Properties that trigger GPU acceleration (safe to animate)
 */
export const GPU_ACCELERATED_PROPERTIES = ["transform", "opacity", "filter"] as const;

/**
 * Properties that cause layout recalculation (avoid animating)
 */
export const LAYOUT_PROPERTIES = [
  "width",
  "height",
  "top",
  "left",
  "right",
  "bottom",
  "margin",
  "padding",
  "border",
  "font-size",
] as const;

/**
 * Properties that cause paint (avoid if possible)
 */
export const PAINT_PROPERTIES = ["color", "background-color", "box-shadow", "border-radius", "border-color"] as const;

/**
 * Check if a CSS property is GPU-accelerated
 */
export function isGPUAccelerated(property: string): boolean {
  return GPU_ACCELERATED_PROPERTIES.includes(property as any);
}

/**
 * Check if a CSS property causes layout recalculation
 */
export function causesLayout(property: string): boolean {
  return LAYOUT_PROPERTIES.includes(property as any);
}

/**
 * Check if a CSS property causes paint
 */
export function causesPaint(property: string): boolean {
  return PAINT_PROPERTIES.includes(property as any);
}

/**
 * Get the current frame rate
 * Returns a promise that resolves with the average FPS over a short period
 */
export function measureFPS(duration: number = 1000): Promise<number> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(60); // Default to 60fps on server
      return;
    }

    let frameCount = 0;
    let startTime = performance.now();
    let lastTime = startTime;

    function countFrame() {
      const currentTime = performance.now();
      frameCount++;

      if (currentTime - startTime < duration) {
        lastTime = currentTime;
        requestAnimationFrame(countFrame);
      } else {
        const elapsed = currentTime - startTime;
        const fps = (frameCount / elapsed) * 1000;
        resolve(Math.round(fps));
      }
    }

    requestAnimationFrame(countFrame);
  });
}

/**
 * Measure animation performance
 * Returns metrics about animation performance
 */
export async function measureAnimationPerformance(
  animationFn: () => void,
  duration: number = 1000
): Promise<{
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  droppedFrames: number;
}> {
  if (typeof window === "undefined") {
    return {
      averageFPS: 60,
      minFPS: 60,
      maxFPS: 60,
      droppedFrames: 0,
    };
  }

  const frameTimes: number[] = [];
  let startTime = performance.now();
  let lastTime = startTime;
  let frameCount = 0;

  return new Promise((resolve) => {
    function measureFrame() {
      const currentTime = performance.now();
      const frameTime = currentTime - lastTime;
      frameTimes.push(frameTime);
      frameCount++;
      lastTime = currentTime;

      if (currentTime - startTime < duration) {
        animationFn();
        requestAnimationFrame(measureFrame);
      } else {
        // Calculate metrics
        const fps = frameTimes.map((time) => 1000 / time);
        const averageFPS = fps.reduce((a, b) => a + b, 0) / fps.length;
        const minFPS = Math.min(...fps);
        const maxFPS = Math.max(...fps);

        // Count dropped frames (frames that took longer than 16.67ms)
        const droppedFrames = frameTimes.filter((time) => time > 16.67).length;

        resolve({
          averageFPS: Math.round(averageFPS),
          minFPS: Math.round(minFPS),
          maxFPS: Math.round(maxFPS),
          droppedFrames,
        });
      }
    }

    requestAnimationFrame(measureFrame);
  });
}

/**
 * Optimize animation by using requestAnimationFrame
 * Ensures animations run at optimal frame rate
 */
export function optimizeAnimation(callback: (progress: number) => void, duration: number): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  let startTime: number | null = null;
  let animationId: number;

  function animate(currentTime: number) {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    callback(progress);

    if (progress < 1) {
      animationId = requestAnimationFrame(animate);
    }
  }

  animationId = requestAnimationFrame(animate);

  // Return cancel function
  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  };
}

/**
 * Debounce animation frame
 * Ensures callback is called at most once per frame
 */
export function rafDebounce<T extends (...args: any[]) => void>(callback: T): (...args: Parameters<T>) => void {
  let rafId: number | null = null;

  return function (...args: Parameters<T>) {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }

    rafId = requestAnimationFrame(() => {
      callback(...args);
      rafId = null;
    });
  };
}

/**
 * Throttle animation frame
 * Ensures callback is called at most once per frame
 */
export function rafThrottle<T extends (...args: any[]) => void>(callback: T): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  return function (...args: Parameters<T>) {
    lastArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs !== null) {
          callback(...lastArgs);
          lastArgs = null;
        }
        rafId = null;
      });
    }
  };
}

/**
 * Check if reduced motion is preferred
 * Respects user's accessibility preferences
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Get safe animation duration based on user preferences
 * Returns 0 if reduced motion is preferred, otherwise returns the duration
 */
export function getSafeAnimationDuration(duration: number): number {
  return prefersReducedMotion() ? 0 : duration;
}

/**
 * Performance monitoring for animations
 */
export class AnimationPerformanceMonitor {
  private frameCount = 0;
  private startTime = 0;
  private lastTime = 0;
  private fps = 60;
  private isMonitoring = false;

  start() {
    if (typeof window === "undefined") return;

    this.isMonitoring = true;
    this.frameCount = 0;
    this.startTime = performance.now();
    this.lastTime = this.startTime;
    this.measure();
  }

  stop() {
    this.isMonitoring = false;
  }

  private measure() {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    this.frameCount++;

    // Update FPS every second
    if (currentTime - this.startTime >= 1000) {
      this.fps = Math.round((this.frameCount / (currentTime - this.startTime)) * 1000);
      this.frameCount = 0;
      this.startTime = currentTime;
    }

    this.lastTime = currentTime;
    requestAnimationFrame(() => this.measure());
  }

  getFPS(): number {
    return this.fps;
  }

  isPerformant(): boolean {
    return this.fps >= 55; // Allow 5fps drop from 60fps target
  }
}
