/* Copyright (c) 2025 Jiangxi Star Hotel. 保留所有权利. */

// SaaS平台新增的数据类型定义

export interface Partner {
  id: string;
  name: string;
  businessLicense: string; // 营业执照号
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended'; // 合作状态
  commissionRate: number; // 佣金比例 (0.00-1.00)
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  suspendedAt?: string;
  suspendedBy?: string;
  suspendedReason?: string;
  rating?: number; // 信誉评分
  totalSales?: number; // 总销售额
  totalOrders?: number; // 总订单数
}

export interface PartnerCategoryAuthorization {
  id: string;
  partnerId: string;
  categoryId: string; // 对应CATEGORIES中的分类
  isExclusive: boolean; // 是否为独家授权
  authorizedAt: string;
  authorizedBy: string;
  expiresAt?: string; // 授权过期时间
}

export interface CommissionRecord {
  id: string;
  orderId: string;
  partnerId: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number; // 计算得出: orderAmount * commissionRate
  netAmount: number; // 合作伙伴净收入: orderAmount - commissionAmount
  status: 'pending' | 'processed' | 'paid'; // 佣金状态
  processedAt?: string;
  processedBy?: string;
  paidAt?: string;
  paidBy?: string;
}

export interface PartnerFinancialSummary {
  partnerId: string;
  totalRevenue: number;
  totalCommission: number;
  netEarnings: number;
  pendingCommission: number;
  processedCommission: number;
  paidCommission: number;
  periodStart: string;
  periodEnd: string;
}