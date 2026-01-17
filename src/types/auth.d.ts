// 全局类型扩展 - 为 Better Auth 会话对象添加扩展字段
// 这些扩展使得 TypeScript 能识别 role 和 partnerId 等自定义字段

// 扩展 Better Auth 的会话类型定义
declare global {
  namespace BetterAuth {
    interface User {
      role: string;
      partnerId: string;
      modulePermissions?: any;
      authType?: string;
      emailVerified?: boolean;
    }
    
    interface Session {
      user: {
        id: string;
        email: string;
        emailVerified: boolean;
        name: string;
        image?: string | null;
        createdAt: Date;
        updatedAt: Date;
        // 扩展字段 - 江西云厨应用的自定义字段
        role: string;
        partnerId: string;
        modulePermissions?: any;
        authType?: string;
      };
    }
  }
  

}

// 为 better-auth/react 模块提供类型扩展
declare module 'better-auth/react' {
  interface User {
    role: string;
    partnerId: string;
  }
  
  interface Session {
    user: {
      id: string;
      email: string;
      emailVerified: boolean;
      name: string;
      image?: string | null;
      createdAt: Date;
      updatedAt: Date;
      // 扩展字段 - 江西云厨应用的自定义字段
      role: string;
      partnerId: string;
    };
  }
}

// 为 better-auth/client 模块提供类型扩展
declare module 'better-auth/client' {
  interface User {
    role: string;
    partnerId: string;
  }
  
  interface Session {
    user: {
      id: string;
      email: string;
      emailVerified: boolean;
      name: string;
      image?: string | null;
      createdAt: Date;
      updatedAt: Date;
      // 扩展字段 - 江西云厨应用的自定义字段
      role: string;
      partnerId: string;
    };
  }
}

// 确保这是一个模块文件
export {};