// ---------------------------------------------------------------------------
// Database types — kept in sync with supabase/migrations
// ---------------------------------------------------------------------------

export type WastageReason = "Melted" | "Damaged" | "Expired";

export interface Database {
  public: {
    Tables: {
      app_settings: {
        Row: {
          user_id: string;
          shop_name: string;
          fridge_capacity: number;
          currency: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          shop_name?: string;
          fridge_capacity?: number;
          currency?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["app_settings"]["Insert"]>;
        Relationships: [];
      };
      daily_revenue: {
        Row: {
          id: string;
          user_id: string;
          entry_date: string;
          cash_revenue: number;
          online_revenue: number;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entry_date?: string;
          cash_revenue?: number;
          online_revenue?: number;
          note?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["daily_revenue"]["Insert"]>;
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          entry_date: string;
          amount: number;
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entry_date?: string;
          amount: number;
          reason: string;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
        Relationships: [];
      };
      inventory_items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          pieces_per_box: number;
          selling_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          pieces_per_box: number;
          selling_price?: number;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_items"]["Insert"]>;
        Relationships: [];
      };
      stock_purchases: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          boxes: number;
          amount: number;
          entry_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          boxes: number;
          amount: number;
          entry_date?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stock_purchases"]["Insert"]>;
        Relationships: [];
      };
      empty_boxes: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          empty_boxes: number;
          melted_pieces: number;
          pieces_per_box: number | null;
          entry_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          empty_boxes: number;
          melted_pieces?: number;
          pieces_per_box?: number | null;
          entry_date?: string;
        };
        Update: Partial<Database["public"]["Tables"]["empty_boxes"]["Insert"]>;
        Relationships: [];
      };
      damaged_stock: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          quantity: number;
          reason: WastageReason;
          entry_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          quantity: number;
          reason?: WastageReason;
          entry_date?: string;
        };
        Update: Partial<Database["public"]["Tables"]["damaged_stock"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      item_stock: {
        Row: {
          item_id: string;
          user_id: string;
          name: string;
          pieces_per_box: number;
          selling_price: number;
          purchased_boxes: number;
          purchased_pieces: number;
          total_purchase_amount: number;
          sold_boxes: number;
          sold_pieces_gross: number;
          sold_pieces: number;
          damaged_pieces: number;
          melted_pieces: number;
          other_damaged_pieces: number;
          remaining_pieces: number;
          avg_cost_per_piece: number;
          ice_cream_revenue: number;
          melted_loss: number;
          inventory_value: number;
        };
        Relationships: [];
      };
      daily_pnl: {
        Row: {
          user_id: string;
          entry_date: string;
          revenue: number;
          expenses: number;
          profit: number;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      wastage_reason: WastageReason;
    };
  };
}

// Convenience aliases ------------------------------------------------------
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];

export type AppSettings = Tables<"app_settings">;
export type DailyRevenue = Tables<"daily_revenue">;
export type Expense = Tables<"expenses">;
export type InventoryItem = Tables<"inventory_items">;
export type StockPurchase = Tables<"stock_purchases">;
export type EmptyBox = Tables<"empty_boxes">;
export type DamagedStock = Tables<"damaged_stock">;
export type ItemStock = Views<"item_stock">;
export type DailyPnl = Views<"daily_pnl">;
