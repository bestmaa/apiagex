import type { AdminAuthService } from './auth.type.js';

export interface AuthRoutesOptions {
  auth: AdminAuthService;
}

export interface LoginInput {
  email: string;
  password: string;
}
