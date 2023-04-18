import * as bcrypt from 'bcrypt';

export const bcryptService = {
  generateSaltSync(length: number) {
    const salt = bcrypt.genSaltSync(length);
    return salt;
  },
  async generateHash(password: string, salt: string): Promise<string> {
    const hash = await bcrypt.hash(password, salt);
    return hash;
  },
};
