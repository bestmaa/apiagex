import type { RealtimeEventType } from "@apiagex/database";

export type RealtimeConfigParams = {
  schemaId: string;
};

export type RealtimeConfigBody = {
  enabled: boolean;
  events: RealtimeEventType[];
};
