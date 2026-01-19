// better-auth-types.d.ts
declare module "better-auth/react" {
  // 导入原始类型
  import { type BetterAuthClient } from "better-auth/client";

  // 扩展原始类型以包含 passkey 方法
  interface ExtendedAuthClient extends BetterAuthClient {
    signIn: BetterAuthClient['signIn'] & {
      passkey: (options: {
        email: string;
        callbackURL?: string;
      }) => Promise<{
        data?: any;
        error?: {
          message: string;
          name?: string;
        };
      }>;
    };
    signUp: BetterAuthClient['signUp'] & {
      passkey: (options: {
        email: string;
        name: string;
      }) => Promise<{
        data?: any;
        error?: {
          message: string;
        };
      }>;
    };
  }

  export function createAuthClient(options: any): ExtendedAuthClient;
}