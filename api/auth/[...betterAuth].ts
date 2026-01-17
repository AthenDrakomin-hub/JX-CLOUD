// @ts-ignore
import { betterAuth } from 'better-auth';
// @ts-ignore
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../../src/services/db.server.js';
import { user as authUser, session as authSession, users as businessUsers } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Track if initialization has already run to prevent multiple executions
let rootAdminInitialized = false;

/**
 * 初始化根管理员账户
 * 在服务启动时确保根管理员账户存在
 */
async function initializeRootAdmin() {
  if (rootAdminInitialized) {
    console.log('⏭️ Root admin already initialized, skipping...');
    return;
  }
  
  try {
    const rootEmail = 'athendrakomin@proton.me';
    const rootUsername = 'AthenDrakomin';
    const rootName = '系统总监';
    
    console.log('🔍 Checking for root admin account...');
    
    // 检查根管理员是否已存在于认证表中
    const existingUser = await db.select().from(authUser).where(eq(authUser.email, rootEmail));
    
    let userId = '';
    
    if (existingUser.length > 0) {
      // 更新现有用户为管理员
      console.log('📝 Updating existing root admin account...');
      await db.update(authUser).set({
        role: 'admin',
        name: rootName,
        updatedAt: new Date()
      }).where(eq(authUser.email, rootEmail));
      
      userId = existingUser[0].id;
      console.log('✅ Root admin account updated successfully');
    } else {
      // 创建新根管理员账户
      console.log('🔐 Creating new root admin account...');
      const newUser = {
        id: `user_${Date.now()}_${nanoid(8)}`,
        name: rootName,
        email: rootEmail,
        emailVerified: true,
        image: null,
        role: 'admin',
        partnerId: null,
        modulePermissions: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const insertedUsers = await db.insert(authUser).values(newUser).returning();
      userId = insertedUsers[0].id;
      console.log('✅ Root admin account created successfully');
    }
    
    // 检查根管理员是否已存在于业务表中
    const existingBusinessUser = await db.select().from(businessUsers).where(eq(businessUsers.email, rootEmail));
    
    if (existingBusinessUser.length > 0) {
      // 更新现有业务用户为管理员
      await db.update(businessUsers).set({
        role: 'admin',
        name: rootName,
        username: rootUsername,
        updatedAt: new Date()
      }).where(eq(businessUsers.email, rootEmail));
      console.log('✅ Root admin business account updated successfully');
    } else {
      // 创建新业务用户记录
      const newBusinessUser = {
        id: `business_user_${Date.now()}_${nanoid(8)}`,
        username: rootUsername,
        email: rootEmail,
        name: rootName,
        role: 'admin',
        partnerId: null,
        modulePermissions: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.insert(businessUsers).values(newBusinessUser);
      console.log('✅ Root admin business account created successfully');
    }
    
    rootAdminInitialized = true;
    console.log('🎉 Root admin initialization completed!');
  } catch (error) {
    console.error('❌ Error initializing root admin:', error);
  }
}

// 初始化根管理员（在模块加载时执行）
setTimeout(initializeRootAdmin, 0); // Defer execution to avoid blocking module loading

/**
 * Better Auth 服务器端配置
 * 使用 Drizzle 适配器连接到 Supabase PostgreSQL 数据库 (连接池模式)
 * 所有用户数据存储在 Supabase 的 public 模式下
 */
// @ts-ignore
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || 
           (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
           (typeof window !== 'undefined' ? window.location.origin : ''),
  database: drizzleAdapter(db, {
    provider: 'pg', // 明确指定使用 Postgres
    // 映射 Better Auth 默认表到我们定义的表结构（使用标准字段名）
    schema: {
      user: {
        model: authUser,
        fields: {
          id: 'id',
          email: 'email',
          emailVerified: 'emailVerified',
          name: 'name',
          image: 'image',
          role: 'role', // 扩展字段：用户角色
          partnerId: 'partner_id', // 扩展字段：合伙人ID
          modulePermissions: 'module_permissions', // 扩展字段：模块权限
          createdAt: 'createdAt',
          updatedAt: 'updatedAt',
        },
      },
      session: {
        model: authSession,
        fields: {
          id: 'id',
          userId: 'userId',
          expiresAt: 'expiresAt',
          token: 'token',
          ipAddress: 'ipAddress',
          userAgent: 'userAgent',
          createdAt: 'createdAt',
          updatedAt: 'updatedAt',
        },
      },
    },
    // 添加数据库钩子以实现双表数据同步
    hooks: {
      createUser: async (data) => {
        try {
          // 当认证用户被创建时，同步创建业务用户数据
          await db.insert(businessUsers).values({
            id: data.data.id,
            username: data.data.email.split('@')[0], // 使用邮箱前缀作为用户名
            email: data.data.email,
            name: data.data.name || data.data.email.split('@')[0],
            role: 'staff', // 默认为staff角色
            partnerId: data.data.partnerId || null,
            authType: 'credentials',
            emailVerified: data.data.emailVerified || false,
            isActive: true,
            modulePermissions: data.data.modulePermissions || null,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } catch (error) {
          console.error('Failed to create business user record:', error);
          // 不抛出错误，避免影响认证流程
        }
      },
      updateUser: async (data) => {
        try {
          // 当认证用户被更新时，同步更新业务用户数据（除了role字段）
          const updateData: any = {
            email: data.data.email,
            name: data.data.name,
            partnerId: data.data.partnerId,
            emailVerified: data.data.emailVerified,
            updatedAt: new Date()
          };
          
          // 如果提供了username，则更新它
          if (data.data.username) {
            updateData.username = data.data.username;
          }
          
          await db.update(businessUsers).set(updateData).where(eq(businessUsers.id, data.data.id));
        } catch (error) {
          console.error('Failed to update business user record:', error);
          // 不抛出错误，避免影响认证流程
        }
      },
      deleteUser: async (data) => {
        try {
          // 当认证用户被删除时，同步删除业务用户数据
          await db.delete(businessUsers).where(eq(businessUsers.id, data.data.id));
        } catch (error) {
          console.error('Failed to delete business user record:', error);
          // 不抛出错误，避免影响认证流程
        }
      }
    }
  }),
  user: {
    // Define additional fields to be available in session
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "user",
      },
      partnerId: {
        type: "string",
        required: false,
        fieldName: "partner_id", // 映射到数据库字段 partner_id
      },
      authType: {
        type: "string",
        required: false,
        defaultValue: "credentials",
        fieldName: "auth_type", // 认证类型字段
      },
      emailVerified: {
        type: "boolean",
        required: false,
        defaultValue: false,
        fieldName: "email_verified", // 邮箱验证状态
      },
      modulePermissions: {
        type: "string",
        required: false,
      },
    },
  },
  socialProviders: {
    // 可选的社交登录提供商
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // 根据业务需求调整
  },
  passkey: {
    enabled: true,
    rpName: "www.jiangxijiudian.store",
    rpID: "www.jiangxijiudian.store",
    crossPlatform: true, // 启用跨平台认证支持
  },
  advanced: {
    // 自定义登录页面或其他高级选项
  },
});

// 导出 API 处理程序
export { auth as default };