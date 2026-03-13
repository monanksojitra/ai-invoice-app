import { create } from 'zustand';
import api from '../utils/api';

export interface LineItem {
  description: string;
  hsn_code?: string | null;
  quantity?: number | null;
  unit?: string | null;
  unit_price?: number | null;
  line_total: number;
  gst_rate?: number | null;
}

export interface Invoice {
  id: string;
  user_id: string;
  invoice_number?: string | null;
  invoice_date?: string | null;
  due_date?: string | null;
  vendor_name?: string | null;
  vendor_gstin?: string | null;
  vendor_phone?: string | null;
  vendor_address?: string | null;
  buyer_name?: string | null;
  buyer_gstin?: string | null;
  line_items: LineItem[];
  subtotal?: number | null;
  discount?: number | null;
  cgst?: number | null;
  sgst?: number | null;
  igst?: number | null;
  total_tax?: number | null;
  grand_total: number;
  currency: string;
  payment_terms?: string | null;
  status: string;
  category?: string | null;
  notes?: string | null;
  source_type: string;
  confidence_score?: number | null;
  created_at: string;
  updated_at: string;
}

interface InvoiceState {
  invoices: Invoice[];
  total: number;
  isLoading: boolean;
  selectedInvoice: Invoice | null;
  analytics: any | null;
  fetchInvoices: (params?: Record<string, string>) => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  setSelectedInvoice: (invoice: Invoice | null) => void;
  refreshAll: () => Promise<void>;
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: [],
  total: 0,
  isLoading: false,
  selectedInvoice: null,
  analytics: null,

  fetchInvoices: async (params) => {
    set({ isLoading: true });
    try {
      const res = await api.listInvoices(params);
      set({ invoices: res.invoices, total: res.total, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchAnalytics: async () => {
    try {
      const analytics = await api.getAnalytics();
      set({ analytics });
    } catch {
      // ignore
    }
  },

  setSelectedInvoice: (invoice) => set({ selectedInvoice: invoice }),

  refreshAll: async () => {
    const { fetchInvoices, fetchAnalytics } = get();
    await Promise.all([fetchInvoices(), fetchAnalytics()]);
  },
}));
