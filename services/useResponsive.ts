import { useState, useEffect, useCallback } from 'react';
import { 
  BREAKPOINTS, 
  MEDIA_QUERIES, 
  getScreenType, 
  getResponsiveGridCols,
  getResponsiveFontSize,
  getResponsiveSpacing
} from './responsive';

/**
 * 响应式 Hook
 * 提供响应式相关的状态和工具函数
 */
export const useResponsive = () => {
  const [screenType, setScreenType] = useState<'mobile' | 'tablet' | 'desktop' | keyof typeof BREAKPOINTS>('desktop');
  const [dimensions, setDimensions] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 0, 
    height: typeof window !== 'undefined' ? window.innerHeight : 0 
  });

  // 更新屏幕类型和尺寸
  const updateScreenInfo = useCallback(() => {
    if (typeof window !== 'undefined') {
      setScreenType(getScreenType());
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
  }, []);

  useEffect(() => {
    // 初始设置
    updateScreenInfo();

    // 防抖函数
    let timeoutId: number | null = null;
    const handleResize = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(updateScreenInfo, 150);
    };

    // 监听尺寸变化
    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [updateScreenInfo]);

  // 检查是否为特定屏幕类型
  const isMobile = screenType === 'mobile';
  const isTablet = screenType === 'tablet';
  const isDesktop = screenType === 'desktop';

  // 检查是否匹配特定断点
  const matchesBreakpoint = (breakpoint: keyof typeof MEDIA_QUERIES): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(MEDIA_QUERIES[breakpoint]).matches;
  };

  // 获取适配的网格列数
  const getGridCols = (defaultCols: number = 4): number => {
    return getResponsiveGridCols(defaultCols);
  };

  // 获取适配的字体大小
  const getFontSize = (baseSize: number): number => {
    return getResponsiveFontSize(baseSize);
  };

  // 获取适配的间距
  const getSpacing = (baseSpacing: number): number => {
    return getResponsiveSpacing(baseSpacing);
  };

  // 获取适配的边距/内边距
  const getPadding = (basePadding: number): number => {
    return getResponsiveSpacing(basePadding);
  };

  // 获取适配的边框半径
  const getBorderRadius = (baseRadius: number): number => {
    // 在移动设备上稍微减小圆角，以适应较小的屏幕
    return isMobile ? baseRadius * 0.8 : baseRadius;
  };

  // 获取适配的阴影大小
  const getShadowSize = (baseShadow: number): number => {
    // 在移动设备上减小阴影，以减少视觉干扰
    return isMobile ? baseShadow * 0.7 : baseShadow;
  };

  return {
    screenType,
    isMobile,
    isTablet,
    isDesktop,
    dimensions,
    matchesBreakpoint,
    getGridCols,
    getFontSize,
    getSpacing,
    getPadding,
    getBorderRadius,
    getShadowSize,
    // 断点检查
    isXs: matchesBreakpoint('xs'),
    isSm: matchesBreakpoint('sm'),
    isMd: matchesBreakpoint('md'),
    isLg: matchesBreakpoint('lg'),
    isXl: matchesBreakpoint('xl'),
    is2Xl: matchesBreakpoint('2xl'),
    // 设备类型检查
    isTouchDevice: matchesBreakpoint('touchDevice'),
    isHoverAvailable: matchesBreakpoint('hoverAvailable'),
    prefersReducedMotion: matchesBreakpoint('prefersReducedMotion'),
    // 方向检查
    isLandscape: matchesBreakpoint('landscape'),
    isPortrait: matchesBreakpoint('portrait')
  };
};

export default useResponsive;