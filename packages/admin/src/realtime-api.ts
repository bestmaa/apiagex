import type {
  RealtimeEventType,
  RealtimeListResponse,
  RealtimeMutationResponse,
} from "./realtime.type";
import { adminJson } from "./api";

export async function listRealtimeSettings(): Promise<RealtimeListResponse> {
  return adminJson<RealtimeListResponse>("/api/admin/realtime");
}

export async function saveRealtimeConfig(
  schemaId: string,
  input: { enabled: boolean; events: RealtimeEventType[] },
): Promise<RealtimeMutationResponse> {
  return adminJson<RealtimeMutationResponse>(`/api/admin/realtime/${schemaId}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}
