import { useState, useEffect, useCallback } from 'react';
import { 
  BREAKPOINTS, 
  MEDIA_QUERIES, 
  getScreenType, 
  getResponsiveGridCols,
  getResponsiveFontSize,
  getResponsiveSpacing,
  getResponsiveFontScale,
  getResponsiveComponentSize
} from './responsiveEnhanced';

/**
 * 增强版响应式 Hook
 * 提供更全面的响应式相关的状态和工具函数
 */
export const useResponsiveEnhanced = () => {
  const [screenType, setScreenType] = useState<'mobile' | 'tablet' | 'desktop' | keyof typeof BREAKPOINTS>('desktop');
  const [dimensions, setDimensions] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 0, 
    height: typeof window !== 'undefined' ? window.innerHeight : 0 
  });
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // 更新屏幕信息
  const updateScreenInfo = useCallback(() => {
    if (typeof window !== 'undefined') {
      setScreenType(getScreenType());
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
      
      // 检测方向
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
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
    // 监听方向变化（移动设备）
    window.addEventListener('orientationchange', updateScreenInfo);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', updateScreenInfo);
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

  // 获取响应式字体缩放
  const getFontScale = (): number => {
    return getResponsiveFontScale();
  };

  // 获取响应式组件尺寸
  const getComponentSize = (size: 'sm' | 'md' | 'lg' | 'xl' = 'md') => {
    return getResponsiveComponentSize(size);
  };

  // 检查是否为触摸设备
  const isTouchDevice = matchesBreakpoint('touchDevice');
  
  // 检查是否支持悬停
  const isHoverAvailable = matchesBreakpoint('hoverAvailable');
  
  // 检查是否偏好减少动画
  const prefersReducedMotion = matchesBreakpoint('prefersReducedMotion');
  
  // 检查颜色主题偏好
  const prefersColorScheme = {
    dark: matchesBreakpoint('prefersColorSchemeDark'),
    light: matchesBreakpoint('prefersColorSchemeLight')
  };

  return {
    screenType,
    isMobile,
    isTablet,
    isDesktop,
    dimensions,
    orientation,
    matchesBreakpoint,
    getGridCols,
    getFontSize,
    getSpacing,
    getPadding,
    getBorderRadius,
    getShadowSize,
    getFontScale,
    getComponentSize,
    // 断点检查
    isXs: matchesBreakpoint('xs'),
    isSm: matchesBreakpoint('sm'),
    isMd: matchesBreakpoint('md'),
    isLg: matchesBreakpoint('lg'),
    isXl: matchesBreakpoint('xl'),
    is2Xl: matchesBreakpoint('2xl'),
    // 设备类型检查
    isTouchDevice,
    isHoverAvailable,
    prefersReducedMotion,
    prefersColorScheme,
    // 方向检查
    isLandscape: orientation === 'landscape',
    isPortrait: orientation === 'portrait',
    // 自定义断点检查
    isMobileOnly: matchesBreakpoint('mobile'),
    isTabletOnly: matchesBreakpoint('tablet'),
    isDesktopOnly: matchesBreakpoint('desktop'),
    // 获取断点值
    breakpoints: BREAKPOINTS
  };
};

export default useResponsiveEnhanced;