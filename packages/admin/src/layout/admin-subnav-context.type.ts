import type { ReactNode } from "react";

export type AdminSubnavSlot = {
  ariaLabel: string;
  content: ReactNode;
} | null;

export type AdminSubnavSetter = (slot: AdminSubnavSlot) => void;
