import type { Server } from 'node:http';

export interface AdminConfig {
  backendUrl: string;
  host: string;
  port: number;
}

export interface AdminApp {
  address: string;
  close(): Promise<void>;
  server: Server;
}
