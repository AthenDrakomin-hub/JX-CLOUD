/**
 * 自适应页面体验配置
 * 定义应用中使用的响应式设计标准和配置
 */

export interface ResponsiveConfig {
  // 断点配置
  breakpoints: {
    xs: number;    // 超小屏
    sm: number;    // 小屏
    md: number;    // 中屏
    lg: number;    // 大屏
    xl: number;    // 超大屏
    '2xl': number; // 超超大屏
  };
  
  // 网格配置
  grid: {
    mobile: number;    // 移动端列数
    tablet: number;    // 平板列数
    desktop: number;   // 桌面端列数
  };
  
  // 字体大小配置
  fontSize: {
    mobileScale: number;   // 移动端字体缩放
    tabletScale: number;   // 平板字体缩放
    desktopScale: number;  // 桌面端字体缩放
  };
  
  // 间距配置
  spacing: {
    mobileScale: number;   // 移动端间距缩放
    tabletScale: number;   // 平板间距缩放
    desktopScale: number;  // 桌面端间距缩放
  };
  
  // 组件尺寸配置
  componentSize: {
    mobileScale: number;   // 移动端组件缩放
    tabletScale: number;   // 平板组件缩放
    desktopScale: number;  // 桌面端组件缩放
  };
  
  // 动画配置
  animation: {
    prefersReducedMotion: boolean;  // 是否偏好减少动画
    mobileOptimized: boolean;       // 移动端优化动画
  };
}

// 默认响应式配置
export const defaultResponsiveConfig: ResponsiveConfig = {
  breakpoints: {
    xs: 480,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  },
  
  grid: {
    mobile: 1,
    tablet: 2,
    desktop: 4
  },
  
  fontSize: {
    mobileScale: 0.85,
    tabletScale: 0.95,
    desktopScale: 1
  },
  
  spacing: {
    mobileScale: 0.7,
    tabletScale: 0.85,
    desktopScale: 1
  },
  
  componentSize: {
    mobileScale: 0.8,
    tabletScale: 0.9,
    desktopScale: 1
  },
  
  animation: {
    prefersReducedMotion: false,
    mobileOptimized: true
  }
};

// 获取响应式配置
export const getResponsiveConfig = (): ResponsiveConfig => {
  // 可以从环境变量或配置文件中加载自定义配置
  return defaultResponsiveConfig;
};

// 根据屏幕类型获取配置值
export const getConfigForScreen = <T>(
  mobileValue: T,
  tabletValue: T,
  desktopValue: T,
  screenType: 'mobile' | 'tablet' | 'desktop' = 'desktop'
): T => {
  switch (screenType) {
    case 'mobile':
      return mobileValue;
    case 'tablet':
      return tabletValue;
    case 'desktop':
    default:
      return desktopValue;
  }
};

export default {
  defaultResponsiveConfig,
  getResponsiveConfig,
  getConfigForScreen
};