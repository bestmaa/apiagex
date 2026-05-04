export type OwnerSession = {
  email: string;
  token: string;
};

export type AuthResponse = {
  ok: boolean;
  token?: string;
  user?: {
    email: string;
  };
  error?: string;
};
