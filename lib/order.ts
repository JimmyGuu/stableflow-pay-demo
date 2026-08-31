export type OrderStatus = "pending" | "success" | "failed" | "expired";

export type OrderRow = {
  id: string;
  out_order_no: string;
  session_id: string | null;
  session_url: string | null;
  payments_id: string | null;
  amount: string;
  network: string;
  symbol: string;
  recipient: string;
  status: OrderStatus;
  success_url: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
};
