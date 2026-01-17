// Type declarations to extend Better Auth with custom fields

declare module 'better-auth' {
  interface User {
    role?: string;
    partnerId?: string;
    modulePermissions?: any;
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
      // Extended with custom fields defined in the server configuration
      role?: string;
      partnerId?: string;
      modulePermissions?: any;
    };
  }
}