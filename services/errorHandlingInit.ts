/* Copyright (c) 2025 Jiangxi Star Hotel. 保留所有权利. */

import { ErrorHandler, GlobalErrorHandler } from './errorHandler';

// 初始化全局错误处理
export const initializeErrorHandling = () => {
  // 初始化全局错误处理器
  GlobalErrorHandler.init();
  
  // 初始化时记录系统启动
  console.log('✅ 错误处理系统已初始化');
};

// 导出错误处理相关的工具
export { ErrorHandler } from './errorHandler';