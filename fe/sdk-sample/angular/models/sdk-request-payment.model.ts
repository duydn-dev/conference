
export interface RequestPaymentModel {
  amount?: number;
  orderId?: string;
  description?: string;
  merchantCode?: string;
  paymentMethod?: string;
  [key: string]: any; // Cho phép các trường bổ sung
}
