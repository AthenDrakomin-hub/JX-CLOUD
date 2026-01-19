// types/better-auth-extensions.d.ts
import { BetterAuthClient } from "better-auth/client";

declare module "better-auth/react" {
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
    passkey: {
      addPasskey: () => Promise<{ error?: any; data?: any }>;
      listPasskeys: () => Promise<{ error?: any; data?: any[] }>;
      deletePasskey: (options: { id: string }) => Promise<{ error?: any; data?: any }>;
    };
  }

  function createAuthClient(options: any): ExtendedAuthClient;
}

declare module "../services/auth-client" {
  const authClient: import("better-auth/react").ExtendedAuthClient;
  export { authClient };
}