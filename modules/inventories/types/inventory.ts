import { InferSelectModel } from "drizzle-orm";
import { inventoryItems } from "@/db/schema";

export type DbInventoryItem = InferSelectModel<typeof inventoryItems>;

export interface InventoryItem extends DbInventoryItem {
  inventoryCategoryName: string;
}

export interface InventoryForm {
  name: string;
  quantity: number;
  unit: "PIECE" | "BOX" | "PACK" | "GALLON" | "BOTTLE";
  reorderLevel: number;
  inventoryCategoryId: string;
}
