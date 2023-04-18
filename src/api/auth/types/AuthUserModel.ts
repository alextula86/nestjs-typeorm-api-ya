export type AuthUserModel = {
  /**
   * loginOrEmail of auth user
   * password of auth user
   */
  loginOrEmail: string;
  password: string;
};

export type AuthAccessTokenModel = {
  accessToken: string;
};

export type AuthUserCodeModel = {
  code: string;
};

export type AuthUserEmailModel = {
  email: string;
};

export type AuthUserConfirmPasswordModel = {
  newPassword: string;
  recoveryCode: string;
};
