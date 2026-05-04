export interface AuditLogRow {
  action: string;
  actor_email: string;
  actor_role: string;
  created_at: string;
  details_json: string;
  id: string;
  scope: string;
  subject_id: string;
}
