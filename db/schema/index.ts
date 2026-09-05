// ===================================================
// index.ts — re-export schema ทุก domain
// เพื่อให้ relationship.ts และ Drizzle config import ได้ง่าย
// ===================================================

export * from "./auth";
export * from "./customer";
export * from "./appointment";
export * from "./service";
export * from "./finance";
export * from "./inventory";
export * from "./store";
export * from "./staff";
export * from "./enum";
export * from "./relationship";
export * from "./line";
export * from "./business-rule";
export * from "./vendor";
