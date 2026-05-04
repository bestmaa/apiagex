export interface ContentTypeRowView {
  display_name: string;
  id: string;
  kind: string;
  permissions_json: string | null;
  realtime_create_enabled: number | null;
  realtime_delete_enabled: number | null;
  realtime_enabled: number;
  realtime_update_enabled: number | null;
  slug: string;
}
