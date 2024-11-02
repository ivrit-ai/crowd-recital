enum UserGroups {
  Admin = "admin",
  Speaker = "speaker",
}

type CommonUserFields = {
  id: string;
  email: string;
  name: string;
  picture?: string;
  group?: UserGroups;
};

type UserDTO = CommonUserFields & {
  agreement_signed_at?: string;
};

type UserType = CommonUserFields & {
  agreementSignedAt?: Date;
};

class User implements UserType {
  id: string;
  email: string;
  name: string;
  picture?: string;
  agreementSignedAt?: Date;
  group?: UserGroups;
  constructor(user: UserType) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.picture = user.picture;
    this.agreementSignedAt = user.agreementSignedAt;
    this.group = user.group;
  }

  static fromDTO({ agreement_signed_at, ...rest }: UserDTO): User {
    return new User({
      ...rest,
      agreementSignedAt: agreement_signed_at
        ? new Date(agreement_signed_at)
        : undefined,
    });
  }

  isAdmin() {
    return this.group === UserGroups.Admin;
  }

  isSpaker() {
    return this.group === UserGroups.Speaker || this.isAdmin();
  }

  didSignAgreement() {
    return !!this.agreementSignedAt;
  }
}

export type UserProfileDTO = {
  biological_sex?: string;
  year_of_birth?: number;
};

type UserProfileType = {
  biologicalSex?: string;
  yearOfBirth?: number;
};

class UserProfile implements UserProfileType {
  biologicalSex?: string;
  yearOfBirth?: number;

  constructor(metadata: UserProfileType) {
    this.biologicalSex = metadata.biologicalSex;
    this.yearOfBirth = metadata.yearOfBirth;
  }

  static fromDTO({ biological_sex, year_of_birth }: UserProfileDTO) {
    return new UserProfile({
      biologicalSex: biological_sex,
      yearOfBirth: year_of_birth,
    });
  }

  static toDTO(profile: UserProfile): UserProfileDTO {
    return {
      biological_sex: profile.biologicalSex,
      year_of_birth: profile.yearOfBirth,
    };
  }
}

export { type UserType, User, UserGroups, UserProfile };
