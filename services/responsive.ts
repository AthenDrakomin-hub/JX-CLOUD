/**
 * 响应式设计工具函数
 * 提供屏幕尺寸检测和响应式相关的工具函数
 */

// 定义断点
export const BREAKPOINTS = {
  xs: 480,    // 超小屏
  sm: 640,    // 小屏
  md: 768,    // 中屏
  lg: 1024,   // 大屏
  xl: 1280,   // 超大屏
  '2xl': 1536  // 超超大屏
};

// 媒体查询断点
export const MEDIA_QUERIES = {
  xs: `(min-width: ${BREAKPOINTS.xs}px)`,
  sm: `(min-width: ${BREAKPOINTS.sm}px)`,
  md: `(min-width: ${BREAKPOINTS.md}px)`,
  lg: `(min-width: ${BREAKPOINTS.lg}px)`,
  xl: `(min-width: ${BREAKPOINTS.xl}px)`,
  '2xl': `(min-width: ${BREAKPOINTS['2xl']}px)`,
  // 移动设备
  mobile: `(max-width: ${BREAKPOINTS.md - 1}px)`,
  tablet: `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`,
  desktop: `(min-width: ${BREAKPOINTS.lg}px)`,
  // 横屏/竖屏
  landscape: '(orientation: landscape)',
  portrait: '(orientation: portrait)',
  // 高宽比
  aspectRatioSquare: '(aspect-ratio: 1/1)',
  aspectRatioLandscape: '(aspect-ratio: 16/9)',
  aspectRatioPortrait: '(aspect-ratio: 9/16)',
  // 设备特性
  hoverAvailable: '(hover: hover)',
  touchDevice: '(hover: none) and (pointer: coarse)',
  prefersReducedMotion: '(prefers-reduced-motion: reduce)',
  prefersColorSchemeDark: '(prefers-color-scheme: dark)',
  prefersColorSchemeLight: '(prefers-color-scheme: light)'
};

/**
 * 获取当前屏幕尺寸类型
 */
export const getScreenType = (): keyof typeof BREAKPOINTS | 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'md'; // 服务端渲染时返回默认值

  const width = window.innerWidth;
  
  if (width < BREAKPOINTS.md) return 'mobile';
  if (width < BREAKPOINTS.lg) return 'tablet';
  return 'desktop';
};

/**
 * 检查当前屏幕是否匹配指定断点
 */
export const isScreen = (breakpoint: keyof typeof MEDIA_QUERIES): boolean => {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia(MEDIA_QUERIES[breakpoint]).matches;
};

/**
 * 监听屏幕尺寸变化
 */
export const onScreenChange = (callback: (screenType: ReturnType<typeof getScreenType>) => void) => {
  if (typeof window === 'undefined') return () => {};

  let timeoutId: number | null = null;
  
  const handleResize = () => {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
    
    timeoutId = window.setTimeout(() => {
      callback(getScreenType());
    }, 150); // 防抖
  };

  window.addEventListener('resize', handleResize);
  
  // 立即执行一次
  callback(getScreenType());
  
  return () => {
    window.removeEventListener('resize', handleResize);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  };
};

/**
 * 获取适配的尺寸值
 * 根据当前屏幕尺寸返回相应的值
 */
export const getResponsiveValue = <T>(
  values: Partial<Record<keyof typeof BREAKPOINTS | 'mobile' | 'tablet' | 'desktop', T>>
): T => {
  const screenType = getScreenType();
  
  // 按优先级查找匹配的值
  const priority = [screenType, 'desktop', 'lg', 'md', 'sm', 'xs'];
  
  for (const key of priority) {
    if (values[key as keyof typeof values] !== undefined) {
      return values[key as keyof typeof values] as T;
    }
  }
  
  // 如果都没有匹配，返回第一个值或 undefined
  return Object.values(values)[0] as T;
};

/**
 * 根据屏幕尺寸调整字体大小
 */
export const getResponsiveFontSize = (baseSize: number): number => {
  const screenType = getScreenType();
  
  switch (screenType) {
    case 'mobile':
      return baseSize * 0.85; // 移动端稍小
    case 'tablet':
      return baseSize * 0.95; // 平板适中
    case 'desktop':
    default:
      return baseSize; // 桌面端正常
  }
};

/**
 * 根据屏幕尺寸调整间距
 */
export const getResponsiveSpacing = (baseSpacing: number): number => {
  const screenType = getScreenType();
  
  switch (screenType) {
    case 'mobile':
      return baseSpacing * 0.7; // 移动端紧凑
    case 'tablet':
      return baseSpacing * 0.85; // 平板适中
    case 'desktop':
    default:
      return baseSpacing; // 桌面端正常
  }
};

/**
 * 获取响应式网格列数
 */
export const getResponsiveGridCols = (defaultCols: number = 4): number => {
  const screenType = getScreenType();
  
  switch (screenType) {
    case 'mobile':
      return Math.min(defaultCols, 2); // 移动端最多2列
    case 'tablet':
      return Math.min(defaultCols, 3); // 平板最多3列
    case 'desktop':
    default:
      return defaultCols; // 桌面端正常列数
  }
};

export default {
  BREAKPOINTS,
  MEDIA_QUERIES,
  getScreenType,
  isScreen,
  onScreenChange,
  getResponsiveValue,
  getResponsiveFontSize,
  getResponsiveSpacing,
  getResponsiveGridCols
};