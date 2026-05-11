import type {
  RealtimeEventType,
  RealtimeListResponse,
  RealtimeMutationResponse,
} from "./realtime.type";

export async function listRealtimeSettings(): Promise<RealtimeListResponse> {
  const response = await fetch("/api/admin/realtime");
  return (await response.json()) as RealtimeListResponse;
}

export async function saveRealtimeConfig(
  schemaId: string,
  input: { enabled: boolean; events: RealtimeEventType[] },
): Promise<RealtimeMutationResponse> {
  const response = await fetch(`/api/admin/realtime/${schemaId}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return (await response.json()) as RealtimeMutationResponse;
}
