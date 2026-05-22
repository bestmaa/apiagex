import type { AutomationTokenScope } from "@apiagex/database";

export type AutomationTokenBody = {
  name?: string | undefined;
  scopes?: AutomationTokenScope[] | undefined;
  ttlMinutes?: number | undefined;
};

export type AutomationTokenParams = {
  tokenId: string;
};
