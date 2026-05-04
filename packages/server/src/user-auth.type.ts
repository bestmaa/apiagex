export type UserLoginInput = {
  email: string;
  password: string;
};

export type UserLoginResult = {
  ok: true;
  token: string;
  user: {
    id: string;
    email: string;
    roleId: string;
  };
};
