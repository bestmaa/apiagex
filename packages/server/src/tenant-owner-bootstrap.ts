import type { ApiagexDatabase } from "@apiagex/database";
import { bootstrapOwner } from "./owner-bootstrap.js";
import type { TenantProvisioningOwnerInput } from "./tenant-provisioning.type.js";

export type TenantOwnerBootstrapResult =
  | {
      created: true;
      email: string;
      userId: string;
    }
  | {
      created: false;
      reason: "OWNER_INPUT_MISSING" | "OWNER_PASSWORD_MISSING";
    };

export async function bootstrapTenantOwner(
  db: ApiagexDatabase,
  owner: TenantProvisioningOwnerInput | undefined,
): Promise<TenantOwnerBootstrapResult> {
  if (!owner) return { created: false, reason: "OWNER_INPUT_MISSING" };
  if (!owner.password) return { created: false, reason: "OWNER_PASSWORD_MISSING" };
  const result = await bootstrapOwner(db, {
    email: owner.email,
    password: owner.password,
  });
  return {
    created: true,
    email: result.user.email,
    userId: result.user.id,
  };
}
