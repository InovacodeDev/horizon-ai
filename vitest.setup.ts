import "@testing-library/jest-dom";
import "vitest-axe/extend-expect";

// Mock IntersectionObserver for Framer Motion viewport animations
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;
