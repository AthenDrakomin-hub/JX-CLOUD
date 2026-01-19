
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db.server.js";
import * as schema from "../schema.js";
import { passkey } from "better-auth/plugins";

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
    plugins: [
        passkey({
            rpName: "江西云厨",
            rpID: process.env.NODE_ENV === 'production' 
                ? 'jiangxijiudian.store' 
                : 'localhost',
            origin: process.env.NODE_ENV === 'production'
                ? 'https://jiangxijiudian.store'
                : 'http://localhost:3002',
        })
    ],
    advanced: {
        useSecureCookies: true,
        crossOrigin: true
    }
});