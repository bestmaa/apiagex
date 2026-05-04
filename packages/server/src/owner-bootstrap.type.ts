export type OwnerBootstrapInput = {
  email: string;
  password: string;
};

export type OwnerBootstrapResult = {
  ok: true;
  created: true;
  user: {
    id: string;
    email: string;
    role: "owner";
  };
};

export type OwnerLoginResult = {
  ok: true;
  token: string;
  user: {
    id: string;
    email: string;
    role: "owner";
  };
};
