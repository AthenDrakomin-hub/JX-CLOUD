/*
 * 管理员登录助手
 * 用于在Better Auth Passkey端点未部署时登录系统
 */

console.log("=== 江西云厨管理员登录助手 ===");
console.log(" ");
console.log("系统检测到Better Auth Passkey端点可能未正确部署。");
console.log(" ");
console.log("解决方法：");
console.log("1. 确认Supabase Edge Function中已部署Better Auth");
console.log("2. 检查URL: https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/better-auth");
console.log("3. 确保Passkey功能已启用");
console.log(" ");
console.log("已通过数据库脚本创建的管理员账户：");
console.log("- 邮箱: athendrakomin@proton.me");
console.log("- 用户名: admin-root");
console.log("- 角色: admin");
console.log(" ");
console.log("部署命令参考:");
console.log("$ supabase functions deploy better-auth --project-ref ${SUPABASE_PROJECT_REF}");
console.log(" ");
console.log("或者联系系统管理员部署Better Auth到Supabase Edge Function。");