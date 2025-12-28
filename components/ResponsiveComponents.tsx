import React from 'react';
import useResponsiveEnhanced from '../services/useResponsiveEnhanced';

interface ResponsiveComponentProps {
  mobile: React.ReactNode;
  tablet?: React.ReactNode;
  desktop?: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * 根据屏幕尺寸渲染不同组件的响应式组件
 */
export const ResponsiveComponent: React.FC<ResponsiveComponentProps> = ({ 
  mobile, 
  tablet, 
  desktop, 
  fallback = mobile 
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsiveEnhanced();
  
  if (isDesktop && desktop) return <>{desktop}</>;
  if (isTablet && tablet) return <>{tablet}</>;
  if (isMobile) return <>{mobile}</>;
  
  return <>{fallback}</>;
};

interface AdaptiveGridProps {
  children: React.ReactNode;
  defaultCols?: number;
  mobileCols?: number;
  tabletCols?: number;
  desktopCols?: number;
  gap?: string;
  className?: string;
}

/**
 * 自适应网格组件
 */
export const AdaptiveGrid: React.FC<AdaptiveGridProps> = ({ 
  children, 
  defaultCols = 4, 
  mobileCols = 1, 
  tabletCols = 2, 
  desktopCols = defaultCols,
  gap = 'gap-8',
  className = ''
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsiveEnhanced();
  
  let colsClass = '';
  if (isMobile) colsClass = `grid-cols-${mobileCols}`;
  else if (isTablet) colsClass = `grid-cols-${tabletCols}`;
  else if (isDesktop) colsClass = `grid-cols-${desktopCols}`;
  
  return (
    <div className={`grid ${colsClass} ${gap} ${className}`}>
      {children}
    </div>
  );
};

interface AdaptiveTextProps {
  children: React.ReactNode;
  baseSize?: number;
  mobileScale?: number;
  tabletScale?: number;
  desktopScale?: number;
  className?: string;
}

/**
 * 自适应文本组件
 */
export const AdaptiveText: React.FC<AdaptiveTextProps> = ({ 
  children, 
  baseSize = 16, 
  mobileScale = 0.85, 
  tabletScale = 0.95, 
  desktopScale = 1,
  className = ''
}) => {
  const { isMobile, isTablet, isDesktop, getFontSize } = useResponsiveEnhanced();
  
  let fontSize = baseSize;
  if (isMobile) fontSize = baseSize * mobileScale;
  else if (isTablet) fontSize = baseSize * tabletScale;
  else if (isDesktop) fontSize = baseSize * desktopScale;
  
  return (
    <span 
      className={className}
      style={{ fontSize: `${fontSize}px` }}
    >
      {children}
    </span>
  );
};

interface AdaptivePaddingProps {
  children: React.ReactNode;
  basePadding?: number;
  mobileScale?: number;
  tabletScale?: number;
  desktopScale?: number;
  className?: string;
}

/**
 * 自适应内边距组件
 */
export const AdaptivePadding: React.FC<AdaptivePaddingProps> = ({ 
  children, 
  basePadding = 12, 
  mobileScale = 0.7, 
  tabletScale = 0.85, 
  desktopScale = 1,
  className = ''
}) => {
  const { isMobile, isTablet, isDesktop, getPadding } = useResponsiveEnhanced();
  
  let padding = basePadding;
  if (isMobile) padding = basePadding * mobileScale;
  else if (isTablet) padding = basePadding * tabletScale;
  else if (isDesktop) padding = basePadding * desktopScale;
  
  return (
    <div 
      className={className}
      style={{ padding: `${padding}px` }}
    >
      {children}
    </div>
  );
};

export default {
  ResponsiveComponent,
  AdaptiveGrid,
  AdaptiveText,
  AdaptivePadding
};