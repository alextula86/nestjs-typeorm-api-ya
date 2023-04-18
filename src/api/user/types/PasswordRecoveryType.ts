export type PasswordRecoveryType = {
  recoveryCode: string;
  expirationDate: Date;
  isRecovered: boolean;
};
