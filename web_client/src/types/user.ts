enum UserGroups {
  Admin = "admin",
  Speaker = "speaker",
}

type UserType = {
  id: string;
  email: string;
  name: string;
  picture?: string;
  group?: UserGroups;
};

class User implements UserType {
  id: string;
  email: string;
  name: string;
  picture?: string;
  group?: UserGroups;
  constructor(user: UserType) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.picture = user.picture;
    this.group = user.group;
  }

  isAdmin() {
    return this.group === UserGroups.Admin;
  }

  isSpaker() {
    return this.group === UserGroups.Speaker || this.isAdmin();
  }
}

export { type UserType, User, UserGroups };
