// src/utils/network-diagnosis.ts
// Vercel 部署网络问题诊断工具

/**
 * Vercel 部署网络问题诊断工具
 * 用于排查 Supabase + BetterAuth + Drizzle ORM 在 Vercel 部署中的常见问题
 */

interface DiagnosisResult {
  environment: {
    isVercel: boolean;
    isBrowser: boolean;
    runtime: 'browser' | 'node' | 'edge';
  };
  supabase: {
    url: string;
    isConfigured: boolean;
    connectionTest?: {
      status: number;
      ok: boolean;
      error?: string;
    };
  };
  betterAuth: {
    url: string;
    isConfigured: boolean;
    connectionTest?: {
      status: number;
      ok: boolean;
      error?: string;
    };
  };
  network: {
    latency: number;
    region: string;
    isp: string;
  };
}

/**
 * 执行全面网络诊断
 */
export const runNetworkDiagnosis = async (): Promise<DiagnosisResult> => {
  const startTime = Date.now();
  
  // 检测运行环境
  const isBrowser = typeof window !== 'undefined';
  const isVercel = typeof process !== 'undefined' && !!process.env.VERCEL;
  
  // 检测运行时环境
  let runtime: 'browser' | 'node' | 'edge' = 'browser';
  if (typeof window === 'undefined') {
    if (process.env.EDGE_RUNTIME) {
      runtime = 'edge';
    } else {
      runtime = 'node';
    }
  }
  
  // 获取环境变量
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const betterAuthUrl = import.meta.env.VITE_BETTER_AUTH_URL || '';
  
  // 测试 Supabase 连接
  let supabaseTest;
  if (supabaseUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
      
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      supabaseTest = {
        status: response.status,
        ok: response.ok,
      };
    } catch (error) {
      supabaseTest = {
        status: 0,
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  // 测试 BetterAuth 连接
  let betterAuthTest;
  if (betterAuthUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
      
      const response = await fetch(betterAuthUrl, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      betterAuthTest = {
        status: response.status,
        ok: response.ok,
      };
    } catch (error) {
      betterAuthTest = {
        status: 0,
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  // 网络延迟测试
  const latency = Date.now() - startTime;
  
  // 地理位置估算（基于 IP 或其他指标）
  const region = estimateRegion();
  const isp = estimateISP();
  
  return {
    environment: {
      isVercel,
      isBrowser,
      runtime
    },
    supabase: {
      url: supabaseUrl,
      isConfigured: !!supabaseUrl,
      ...(supabaseTest && { connectionTest: supabaseTest })
    },
    betterAuth: {
      url: betterAuthUrl,
      isConfigured: !!betterAuthUrl,
      ...(betterAuthTest && { connectionTest: betterAuthTest })
    },
    network: {
      latency,
      region,
      isp
    }
  };
};

/**
 * 估计地理位置
 */
function estimateRegion(): string {
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language;
  }
  return 'Unknown';
}

/**
 * 估计 ISP（互联网服务提供商）
 */
function estimateISP(): string {
  // 在浏览器环境中简单估计
  if (typeof navigator !== 'undefined') {
    // 检查 navigator.connection 是否存在（可能需要额外的类型定义）
    try {
      // @ts-ignore - connection 属性可能不存在于标准 Navigator 接口
      const effectiveType = navigator.connection?.effectiveType;
      return `${effectiveType || 'Unknown'} network`;
    } catch (e) {
      return 'Unknown network';
    }
  }
  return 'Unknown';
}

/**
 * 检查 CORS 问题
 */
export const checkCORS = async (url: string): Promise<boolean> => {
  try {
    // 尝试进行预检请求
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('CORS check failed:', error);
    return false;
  }
};

/**
 * 检查网络连接质量
 */
export const checkNetworkQuality = async (): Promise<{
  isGood: boolean;
  downloadSpeed: number; // Mbps
  uploadSpeed: number; // Mbps
  ping: number; // ms
}> => {
  const start = Date.now();
  
  try {
    // 简单 ping 测试
    const pingStart = Date.now();
    await fetch('/api/health', { method: 'HEAD' }).catch(() => {});
    const pingTime = Date.now() - pingStart;
    
    // 由于无法直接测量带宽，返回估算值
    return {
      isGood: pingTime < 500, // ping 小于 500ms 认为网络良好
      downloadSpeed: 0, // 无法准确测量
      uploadSpeed: 0, // 无法准确测量
      ping: pingTime
    };
  } catch (error) {
    return {
      isGood: false,
      downloadSpeed: 0,
      uploadSpeed: 0,
      ping: Infinity
    };
  }
};

/**
 * 生成诊断报告
 */
export const generateDiagnosticReport = async (): Promise<string> => {
  const diagnosis = await runNetworkDiagnosis();
  
  let report = '=== Vercel 部署网络诊断报告 ===\n\n';
  
  report += `环境信息:\n`;
  report += `- 运行环境: ${diagnosis.environment.runtime}\n`;
  report += `- Vercel 部署: ${diagnosis.environment.isVercel ? '是' : '否'}\n`;
  report += `- 浏览器环境: ${diagnosis.environment.isBrowser ? '是' : '否'}\n\n`;
  
  report += `Supabase 配置:\n`;
  report += `- URL 配置: ${diagnosis.supabase.isConfigured ? '已配置' : '未配置'}\n`;
  if (diagnosis.supabase.connectionTest) {
    report += `- 连接测试: ${diagnosis.supabase.connectionTest.ok ? '成功' : '失败'} (状态: ${diagnosis.supabase.connectionTest.status})\n`;
    if (diagnosis.supabase.connectionTest.error) {
      report += `- 错误信息: ${diagnosis.supabase.connectionTest.error}\n`;
    }
  }
  report += `\n`;
  
  report += `BetterAuth 配置:\n`;
  report += `- URL 配置: ${diagnosis.betterAuth.isConfigured ? '已配置' : '未配置'}\n`;
  if (diagnosis.betterAuth.connectionTest) {
    report += `- 连接测试: ${diagnosis.betterAuth.connectionTest.ok ? '成功' : '失败'} (状态: ${diagnosis.betterAuth.connectionTest.status})\n`;
    if (diagnosis.betterAuth.connectionTest.error) {
      report += `- 错误信息: ${diagnosis.betterAuth.connectionTest.error}\n`;
    }
  }
  report += `\n`;
  
  report += `网络信息:\n`;
  report += `- 延迟: ${diagnosis.network.latency}ms\n`;
  report += `- 区域: ${diagnosis.network.region}\n`;
  report += `- 网络类型: ${diagnosis.network.isp}\n`;
  
  return report;
};