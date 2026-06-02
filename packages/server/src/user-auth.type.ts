export type UserLoginInput = {
  email: string;
  password: string;
};

export type UserLoginResult = {
  ok: true;
  token: string;
  tokenType: "content-user";
  expiresAt: string;
  user: {
    id: string;
    email: string;
    roleId: string;
    roleName: string;
  };
};

export type UserSessionResult = {
  ok: true;
  user: {
    id: string;
    email: string;
    roleId: string;
    roleName: string;
  };
};
