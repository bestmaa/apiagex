export interface ServerConfig {
  adminEmail: string;
  adminPassword: string;
  authSecret: string;
  editorEmail?: string;
  editorPassword?: string;
  host: string;
  ownerEmail?: string;
  ownerPassword?: string;
  viewerEmail?: string;
  viewerPassword?: string;
  port: number;
}
