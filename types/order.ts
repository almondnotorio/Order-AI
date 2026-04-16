import {
  Order,
  SKU,
  User,
  OrderStatus,
  AIStatus,
  DeliveryType,
} from "@/app/generated/prisma/client";

export type OrderWithRelations = Order & {
  matched_sku: SKU | null;
  user: Pick<User, "id" | "email" | "name">;
};

export type OrderListItem = Pick<
  Order,
  | "id"
  | "raw_input"
  | "status"
  | "ai_status"
  | "confidence_score"
  | "flags"
  | "delivery_type"
  | "created_at"
  | "processed_at"
> & {
  matched_sku: Pick<SKU, "sku_code" | "description"> | null;
  user: Pick<User, "id" | "email" | "name">;
};

export { OrderStatus, AIStatus, DeliveryType };
