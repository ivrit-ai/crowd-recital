enum UserGroups {
  Admin = "admin",
  Speaker = "speaker",
}

type User = {
  id: string;
  email: string;
  name: string;
  picture?: string;
  group?: UserGroups;
};

export { type User, UserGroups };
