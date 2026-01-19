
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db.server.js";
import * as schema from "../schema.js";

/**
 * 江西云厨 - 服务端认证核心 (Passkey/WebAuthn Only)
 */
export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
            passkey: schema.passkey,
        }
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {},
    advanced: {
        useSecureCookies: true,
        crossOrigin: true
    }
});