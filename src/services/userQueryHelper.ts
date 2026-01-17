import { db } from './db.server.js';
import { user as authUser, users as businessUsers } from '../../drizzle/schema.js';
import { eq, and, or, ilike } from 'drizzle-orm';
import type { User } from '../types';

/**
 * 联合查询认证表和业务表的用户数据
 * 返回包含认证信息和业务信息的完整用户对象
 */
export async function getUserWithBusinessData(userId: string) {
  const result = await db
    .select({
      // 认证表字段
      authId: authUser.id,
      authEmail: authUser.email,
      authName: authUser.name,
      authImage: authUser.image,
      authRole: authUser.role,
      authPartnerId: authUser.partnerId,
      authEmailVerified: authUser.emailVerified,
      authCreatedAt: authUser.createdAt,
      authUpdatedAt: authUser.updatedAt,
      // 业务表字段
      businessId: businessUsers.id,
      businessUsername: businessUsers.username,
      businessEmail: businessUsers.email,
      businessName: businessUsers.name,
      businessRole: businessUsers.role,
      businessPartnerId: businessUsers.partnerId,
      businessAuthType: businessUsers.authType,
      businessEmailVerified: businessUsers.emailVerified,
      businessIsActive: businessUsers.isActive,
      businessModulePermissions: businessUsers.modulePermissions,
      businessCreatedAt: businessUsers.createdAt,
      businessUpdatedAt: businessUsers.updatedAt
    })
    .from(authUser)
    .leftJoin(businessUsers, eq(authUser.id, businessUsers.id))
    .where(eq(authUser.id, userId));

  if (result.length === 0) {
    return null;
  }

  const row = result[0];
  
  // 合并数据，优先使用业务表数据
  return {
    id: row.businessId || row.authId,
    email: row.businessEmail || row.authEmail,
    username: row.businessUsername || row.authEmail.split('@')[0],
    name: row.businessName || row.authName,
    role: row.businessRole || row.authRole || 'user',
    partnerId: row.businessPartnerId || row.authPartnerId,
    emailVerified: row.businessEmailVerified || row.authEmailVerified,
    isActive: row.businessIsActive ?? true,
    modulePermissions: row.businessModulePermissions,
    authType: row.businessAuthType,
    createdAt: row.businessCreatedAt || row.authCreatedAt,
    updatedAt: row.businessUpdatedAt || row.authUpdatedAt,
    image: row.authImage
  };
}

/**
 * 查询所有用户的联合视图
 */
export async function getAllUsersWithBusinessData() {
  const result = await db
    .select({
      // 认证表字段
      authId: authUser.id,
      authEmail: authUser.email,
      authName: authUser.name,
      authImage: authUser.image,
      authRole: authUser.role,
      authPartnerId: authUser.partnerId,
      authEmailVerified: authUser.emailVerified,
      authCreatedAt: authUser.createdAt,
      authUpdatedAt: authUser.updatedAt,
      // 业务表字段
      businessId: businessUsers.id,
      businessUsername: businessUsers.username,
      businessEmail: businessUsers.email,
      businessName: businessUsers.name,
      businessRole: businessUsers.role,
      businessPartnerId: businessUsers.partnerId,
      businessAuthType: businessUsers.authType,
      businessEmailVerified: businessUsers.emailVerified,
      businessIsActive: businessUsers.isActive,
      businessModulePermissions: businessUsers.modulePermissions,
      businessCreatedAt: businessUsers.createdAt,
      businessUpdatedAt: businessUsers.updatedAt
    })
    .from(authUser)
    .leftJoin(businessUsers, eq(authUser.id, businessUsers.id))
    .orderBy(authUser.createdAt);

  return result.map(row => ({
    id: row.businessId || row.authId,
    email: row.businessEmail || row.authEmail,
    username: row.businessUsername || row.authEmail.split('@')[0],
    name: row.businessName || row.authName,
    role: row.businessRole || row.authRole || 'user',
    partnerId: row.businessPartnerId || row.authPartnerId,
    emailVerified: row.businessEmailVerified || row.authEmailVerified,
    isActive: row.businessIsActive ?? true,
    modulePermissions: row.businessModulePermissions,
    authType: row.businessAuthType,
    createdAt: row.businessCreatedAt || row.authCreatedAt,
    updatedAt: row.businessUpdatedAt || row.authUpdatedAt,
    image: row.authImage
  }));
}

/**
 * 搜索用户的联合视图
 */
export async function searchUsersWithBusinessData(searchTerm: string) {
  const result = await db
    .select({
      // 认证表字段
      authId: authUser.id,
      authEmail: authUser.email,
      authName: authUser.name,
      authImage: authUser.image,
      authRole: authUser.role,
      authPartnerId: authUser.partnerId,
      authEmailVerified: authUser.emailVerified,
      authCreatedAt: authUser.createdAt,
      authUpdatedAt: authUser.updatedAt,
      // 业务表字段
      businessId: businessUsers.id,
      businessUsername: businessUsers.username,
      businessEmail: businessUsers.email,
      businessName: businessUsers.name,
      businessRole: businessUsers.role,
      businessPartnerId: businessUsers.partnerId,
      businessAuthType: businessUsers.authType,
      businessEmailVerified: businessUsers.emailVerified,
      businessIsActive: businessUsers.isActive,
      businessModulePermissions: businessUsers.modulePermissions,
      businessCreatedAt: businessUsers.createdAt,
      businessUpdatedAt: businessUsers.updatedAt
    })
    .from(authUser)
    .leftJoin(businessUsers, eq(authUser.id, businessUsers.id))
    .where(or(
      ilike(authUser.email, `%${searchTerm}%`),
      ilike(authUser.name, `%${searchTerm}%`),
      ilike(businessUsers.username, `%${searchTerm}%`),
      ilike(businessUsers.name, `%${searchTerm}%`)
    ))
    .orderBy(authUser.createdAt);

  return result.map(row => ({
    id: row.businessId || row.authId,
    email: row.businessEmail || row.authEmail,
    username: row.businessUsername || row.authEmail.split('@')[0],
    name: row.businessName || row.authName,
    role: row.businessRole || row.authRole || 'user',
    partnerId: row.businessPartnerId || row.authPartnerId,
    emailVerified: row.businessEmailVerified || row.authEmailVerified,
    isActive: row.businessIsActive ?? true,
    modulePermissions: row.businessModulePermissions,
    authType: row.businessAuthType,
    createdAt: row.businessCreatedAt || row.authCreatedAt,
    updatedAt: row.businessUpdatedAt || row.authUpdatedAt,
    image: row.authImage
  }));
}