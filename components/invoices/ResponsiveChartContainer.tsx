'use client';

import { ReactNode, useEffect, useState } from 'react';

interface ResponsiveChartContainerProps {
  children: ReactNode;
  minHeight?: number;
  className?: string;
}

/**
 * Responsive Chart Container
 * Adjusts chart dimensions based on screen size
 */
export function ResponsiveChartContainer({
  children,
  minHeight = 300,
  className = '',
}: ResponsiveChartContainerProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: minHeight });

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      let height = minHeight;

      // Adjust height based on screen size
      if (width < 640) {
        // Mobile
        height = Math.max(250, minHeight * 0.8);
      } else if (width < 1024) {
        // Tablet
        height = Math.max(280, minHeight * 0.9);
      }

      setDimensions({ width, height });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, [minHeight]);

  return (
    <div
      className={`w-full overflow-x-auto ${className}`}
      style={{ minHeight: dimensions.height }}
    >
      {children}
    </div>
  );
}

/**
 * Hook to get responsive chart configuration
 */
export function useResponsiveChart() {
  const [config, setConfig] = useState({
    isMobile: false,
    isTablet: false,
    fontSize: 12,
    legendPosition: 'bottom' as 'top' | 'bottom' | 'left' | 'right',
    showLegend: true,
    showTooltip: true,
  });

  useEffect(() => {
    const updateConfig = () => {
      const width = window.innerWidth;

      if (width < 640) {
        // Mobile
        setConfig({
          isMobile: true,
          isTablet: false,
          fontSize: 10,
          legendPosition: 'bottom',
          showLegend: false, // Hide legend on mobile to save space
          showTooltip: true,
        });
      } else if (width < 1024) {
        // Tablet
        setConfig({
          isMobile: false,
          isTablet: true,
          fontSize: 11,
          legendPosition: 'bottom',
          showLegend: true,
          showTooltip: true,
        });
      } else {
        // Desktop
        setConfig({
          isMobile: false,
          isTablet: false,
          fontSize: 12,
          legendPosition: 'right',
          showLegend: true,
          showTooltip: true,
        });
      }
    };

    updateConfig();
    window.addEventListener('resize', updateConfig);

    return () => window.removeEventListener('resize', updateConfig);
  }, []);

  return config;
}
