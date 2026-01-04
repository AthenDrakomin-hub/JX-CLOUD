/* Copyright (c) 2025 Jiangxi Star Hotel. 保留所有权利. */

import { Partner, PartnerCategoryAuthorization, CommissionRecord, PartnerFinancialSummary } from '../types-saas';
import { User, Dish, Order } from '../types';
import { supabase, isDemoMode } from './supabaseClient';
import { VirtualDB } from './api'; // Import the existing VirtualDB

const SAAS_STORAGE_KEYS = {
  PARTNERS: 'jx_virtual_partners',
  AUTHORISATIONS: 'jx_virtual_authorisations',
  COMMISSIONS: 'jx_virtual_commissions'
};

export const saasApi = {
  partners: {
    getAll: async (): Promise<Partner[]> => {
      if (!isDemoMode) {
        try {
          const { data } = await supabase.from('partners').select('*').order('created_at', { ascending: false });
          if (data) {
            return data.map((p: any) => ({
              id: p.id,
              name: p.name,
              businessLicense: p.business_license,
              contactPerson: p.contact_person,
              contactPhone: p.contact_phone,
              contactEmail: p.contact_email,
              address: p.address,
              status: p.status,
              commissionRate: Number(p.commission_rate),
              createdAt: p.created_at,
              updatedAt: p.updated_at,
              approvedAt: p.approved_at,
              approvedBy: p.approved_by,
              suspendedAt: p.suspended_at,
              suspendedBy: p.suspended_by,
              suspendedReason: p.suspended_reason,
              rating: p.rating ? Number(p.rating) : undefined,
              totalSales: p.total_sales ? Number(p.total_sales) : undefined,
              totalOrders: p.total_orders ? Number(p.total_orders) : undefined
            }));
          }
        } catch (e) {
          console.error('Failed to fetch partners from Supabase:', e);
        }
      }
      return VirtualDB.get<Partner[]>(SAAS_STORAGE_KEYS.PARTNERS, []);
    },

    create: async (partner: Partner) => {
      const partners = VirtualDB.get<Partner[]>(SAAS_STORAGE_KEYS.PARTNERS, []);
      VirtualDB.set(SAAS_STORAGE_KEYS.PARTNERS, [partner, ...partners]);
      
      if (!isDemoMode) {
        try {
          const { error } = await supabase.from('partners').insert({
            id: partner.id,
            name: partner.name,
            business_license: partner.businessLicense,
            contact_person: partner.contactPerson,
            contact_phone: partner.contactPhone,
            contact_email: partner.contactEmail,
            address: partner.address,
            status: partner.status,
            commission_rate: partner.commissionRate,
            created_at: partner.createdAt,
            updated_at: partner.updatedAt,
            approved_at: partner.approvedAt,
            approved_by: partner.approvedBy,
            suspended_at: partner.suspendedAt,
            suspended_by: partner.suspendedBy,
            suspended_reason: partner.suspendedReason,
            rating: partner.rating,
            total_sales: partner.totalSales,
            total_orders: partner.totalOrders
          });
          if (error) throw error;
        } catch (e) {
          console.error('Failed to insert partner to Supabase:', e);
          VirtualDB.queueForSync('INSERT', 'partners', partner);
        }
      }
    },

    update: async (partner: Partner) => {
      const partners = VirtualDB.get<Partner[]>(SAAS_STORAGE_KEYS.PARTNERS, []);
      VirtualDB.set(SAAS_STORAGE_KEYS.PARTNERS, partners.map(p => p.id === partner.id ? partner : p));
      
      if (!isDemoMode) {
        try {
          const { error } = await supabase.from('partners').update({
            name: partner.name,
            business_license: partner.businessLicense,
            contact_person: partner.contactPerson,
            contact_phone: partner.contactPhone,
            contact_email: partner.contactEmail,
            address: partner.address,
            status: partner.status,
            commission_rate: partner.commissionRate,
            updated_at: partner.updatedAt,
            approved_at: partner.approvedAt,
            approved_by: partner.approvedBy,
            suspended_at: partner.suspendedAt,
            suspended_by: partner.suspendedBy,
            suspended_reason: partner.suspendedReason,
            rating: partner.rating,
            total_sales: partner.totalSales,
            total_orders: partner.totalOrders
          }).eq('id', partner.id);
          if (error) throw error;
        } catch (e) {
          console.error('Failed to update partner in Supabase:', e);
          VirtualDB.queueForSync('UPDATE', 'partners', partner);
        }
      }
    },

    delete: async (id: string) => {
      const partners = VirtualDB.get<Partner[]>(SAAS_STORAGE_KEYS.PARTNERS, []);
      VirtualDB.set(SAAS_STORAGE_KEYS.PARTNERS, partners.filter(p => p.id !== id));
      
      if (!isDemoMode) {
        try {
          const { error } = await supabase.from('partners').delete().eq('id', id);
          if (error) throw error;
        } catch (e) {
          console.error('Failed to delete partner from Supabase:', e);
          VirtualDB.queueForSync('DELETE', 'partners', { id });
        }
      }
    }
  },

  authorizations: {
    getAll: async (): Promise<PartnerCategoryAuthorization[]> => {
      if (!isDemoMode) {
        try {
          const { data } = await supabase.from('partner_category_authorizations').select('*').order('authorized_at', { ascending: false });
          if (data) {
            return data.map((a: any) => ({
              id: a.id,
              partnerId: a.partner_id,
              categoryId: a.category,
              isExclusive: a.is_exclusive,
              authorizedAt: a.authorized_at,
              authorizedBy: a.authorized_by,
              expiresAt: a.expires_at
            }));
          }
        } catch (e) {
          console.error('Failed to fetch authorizations from Supabase:', e);
        }
      }
      return VirtualDB.get<PartnerCategoryAuthorization[]>(SAAS_STORAGE_KEYS.AUTHORISATIONS, []);
    },

    create: async (auth: PartnerCategoryAuthorization) => {
      const auths = VirtualDB.get<PartnerCategoryAuthorization[]>(SAAS_STORAGE_KEYS.AUTHORISATIONS, []);
      VirtualDB.set(SAAS_STORAGE_KEYS.AUTHORISATIONS, [auth, ...auths]);
      
      if (!isDemoMode) {
        try {
          const { error } = await supabase.from('partner_category_authorizations').insert({
            id: auth.id,
            partner_id: auth.partnerId,
            category: auth.categoryId,
            is_exclusive: auth.isExclusive,
            authorized_at: auth.authorizedAt,
            authorized_by: auth.authorizedBy,
            expires_at: auth.expiresAt
          });
          if (error) throw error;
        } catch (e) {
          console.error('Failed to insert authorization to Supabase:', e);
          VirtualDB.queueForSync('INSERT', 'partner_category_authorizations', auth);
        }
      }
    },

    update: async (auth: PartnerCategoryAuthorization) => {
      const auths = VirtualDB.get<PartnerCategoryAuthorization[]>(SAAS_STORAGE_KEYS.AUTHORISATIONS, []);
      VirtualDB.set(SAAS_STORAGE_KEYS.AUTHORISATIONS, auths.map(a => a.id === auth.id ? auth : a));
      
      if (!isDemoMode) {
        try {
          const { error } = await supabase.from('partner_category_authorizations').update({
            partner_id: auth.partnerId,
            category: auth.categoryId,
            is_exclusive: auth.isExclusive,
            authorized_at: auth.authorizedAt,
            authorized_by: auth.authorizedBy,
            expires_at: auth.expiresAt
          }).eq('id', auth.id);
          if (error) throw error;
        } catch (e) {
          console.error('Failed to update authorization in Supabase:', e);
          VirtualDB.queueForSync('UPDATE', 'partner_category_authorizations', auth);
        }
      }
    },

    delete: async (id: string) => {
      const auths = VirtualDB.get<PartnerCategoryAuthorization[]>(SAAS_STORAGE_KEYS.AUTHORISATIONS, []);
      VirtualDB.set(SAAS_STORAGE_KEYS.AUTHORISATIONS, auths.filter(a => a.id !== id));
      
      if (!isDemoMode) {
        try {
          const { error } = await supabase.from('partner_category_authorizations').delete().eq('id', id);
          if (error) throw error;
        } catch (e) {
          console.error('Failed to delete authorization from Supabase:', e);
          VirtualDB.queueForSync('DELETE', 'partner_category_authorizations', { id });
        }
      }
    }
  },

  commissions: {
    getAll: async (): Promise<CommissionRecord[]> => {
      if (!isDemoMode) {
        try {
          const { data } = await supabase.from('commission_records').select('*').order('created_at', { ascending: false });
          if (data) {
            return data.map((c: any) => ({
              id: c.id,
              orderId: c.order_id,
              partnerId: c.partner_id,
              orderAmount: Number(c.order_amount),
              commissionRate: Number(c.commission_rate),
              commissionAmount: Number(c.commission_amount),
              netAmount: Number(c.net_amount),
              status: c.status,
              processedAt: c.processed_at,
              processedBy: c.processed_by,
              paidAt: c.paid_at,
              paidBy: c.paid_by,
              createdAt: c.created_at
            }));
          }
        } catch (e) {
          console.error('Failed to fetch commissions from Supabase:', e);
        }
      }
      return VirtualDB.get<CommissionRecord[]>(SAAS_STORAGE_KEYS.COMMISSIONS, []);
    },

    create: async (commission: CommissionRecord) => {
      const commissions = VirtualDB.get<CommissionRecord[]>(SAAS_STORAGE_KEYS.COMMISSIONS, []);
      VirtualDB.set(SAAS_STORAGE_KEYS.COMMISSIONS, [commission, ...commissions]);
      
      if (!isDemoMode) {
        try {
          const { error } = await supabase.from('commission_records').insert({
            id: commission.id,
            order_id: commission.orderId,
            partner_id: commission.partnerId,
            order_amount: commission.orderAmount,
            commission_rate: commission.commissionRate,
            commission_amount: commission.commissionAmount,
            net_amount: commission.netAmount,
            status: commission.status,
            processed_at: commission.processedAt,
            processed_by: commission.processedBy,
            paid_at: commission.paidAt,
            paid_by: commission.paidBy,
            created_at: commission.createdAt
          });
          if (error) throw error;
        } catch (e) {
          console.error('Failed to insert commission to Supabase:', e);
          VirtualDB.queueForSync('INSERT', 'commission_records', commission);
        }
      }
    },

    update: async (commission: CommissionRecord) => {
      const commissions = VirtualDB.get<CommissionRecord[]>(SAAS_STORAGE_KEYS.COMMISSIONS, []);
      VirtualDB.set(SAAS_STORAGE_KEYS.COMMISSIONS, commissions.map(c => c.id === commission.id ? commission : c));
      
      if (!isDemoMode) {
        try {
          const { error } = await supabase.from('commission_records').update({
            order_id: commission.orderId,
            partner_id: commission.partnerId,
            order_amount: commission.orderAmount,
            commission_rate: commission.commissionRate,
            commission_amount: commission.commissionAmount,
            net_amount: commission.netAmount,
            status: commission.status,
            processed_at: commission.processedAt,
            processed_by: commission.processedBy,
            paid_at: commission.paidAt,
            paid_by: commission.paidBy
          }).eq('id', commission.id);
          if (error) throw error;
        } catch (e) {
          console.error('Failed to update commission in Supabase:', e);
          VirtualDB.queueForSync('UPDATE', 'commission_records', commission);
        }
      }
    },

    process: async (recordId: string, processedBy: string) => {
      const commissions = VirtualDB.get<CommissionRecord[]>(SAAS_STORAGE_KEYS.COMMISSIONS, []);
      const updatedCommissions = commissions.map(c => 
        c.id === recordId ? { ...c, status: 'processed', processedAt: new Date().toISOString(), processedBy } : c
      );
      VirtualDB.set(SAAS_STORAGE_KEYS.COMMISSIONS, updatedCommissions);
      
      if (!isDemoMode) {
        try {
          const { error } = await supabase.from('commission_records').update({
            status: 'processed',
            processed_at: new Date().toISOString(),
            processed_by: processedBy
          }).eq('id', recordId);
          if (error) throw error;
        } catch (e) {
          console.error('Failed to process commission in Supabase:', e);
          VirtualDB.queueForSync('UPDATE', 'commission_records', { id: recordId, status: 'processed', processedAt: new Date().toISOString(), processedBy });
        }
      }
    },

    pay: async (recordId: string, paidBy: string) => {
      const commissions = VirtualDB.get<CommissionRecord[]>(SAAS_STORAGE_KEYS.COMMISSIONS, []);
      const updatedCommissions = commissions.map(c => 
        c.id === recordId ? { ...c, status: 'paid', paidAt: new Date().toISOString(), paidBy } : c
      );
      VirtualDB.set(SAAS_STORAGE_KEYS.COMMISSIONS, updatedCommissions);
      
      if (!isDemoMode) {
        try {
          const { error } = await supabase.from('commission_records').update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            paid_by: paidBy
          }).eq('id', recordId);
          if (error) throw error;
        } catch (e) {
          console.error('Failed to pay commission in Supabase:', e);
          VirtualDB.queueForSync('UPDATE', 'commission_records', { id: recordId, status: 'paid', paidAt: new Date().toISOString(), paidBy });
        }
      }
    }
  },

  financial: {
    getSummary: async (partnerId: string): Promise<PartnerFinancialSummary> => {
      if (!isDemoMode) {
        try {
          // Use the view we created in the SQL schema
          const { data } = await supabase.from('partner_financial_summary').select('*').eq('partner_id', partnerId).single();
          if (data) {
            return {
              partnerId: data.partner_id,
              totalRevenue: Number(data.total_revenue || 0),
              totalCommission: Number(data.total_commission || 0),
              netEarnings: Number(data.net_earnings || 0),
              pendingCommission: Number(data.pending_commission || 0),
              processedCommission: Number(data.processed_commission || 0),
              paidCommission: Number(data.paid_commission || 0),
              periodStart: '',
              periodEnd: ''
            };
          }
        } catch (e) {
          console.error('Failed to fetch financial summary from Supabase:', e);
        }
      }
      
      // Fallback: calculate from local data
      const commissions = VirtualDB.get<CommissionRecord[]>(SAAS_STORAGE_KEYS.COMMISSIONS, []);
      const partnerRecords = commissions.filter(cr => cr.partnerId === partnerId);
      const paidRecords = partnerRecords.filter(cr => cr.status === 'paid');
      const processedRecords = partnerRecords.filter(cr => cr.status === 'processed');
      const pendingRecords = partnerRecords.filter(cr => cr.status === 'pending');
      
      return {
        partnerId,
        totalRevenue: paidRecords.reduce((sum, record) => sum + record.orderAmount, 0),
        totalCommission: paidRecords.reduce((sum, record) => sum + record.commissionAmount, 0),
        netEarnings: paidRecords.reduce((sum, record) => sum + record.netAmount, 0),
        pendingCommission: pendingRecords.reduce((sum, record) => sum + record.commissionAmount, 0),
        processedCommission: processedRecords.reduce((sum, record) => sum + record.commissionAmount, 0),
        paidCommission: paidRecords.reduce((sum, record) => sum + record.commissionAmount, 0),
        periodStart: '',
        periodEnd: ''
      };
    }
  }
};