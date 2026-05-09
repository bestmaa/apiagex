import { createContext, useContext } from "react";
import type { AdminSubnavSetter } from "./admin-subnav-context.type";

export const AdminSubnavContext = createContext<AdminSubnavSetter>(() => undefined);

export function useAdminSubnav(): AdminSubnavSetter {
  return useContext(AdminSubnavContext);
}
