import { Injectable } from '@nestjs/common';
import { EmailAdapter } from '../adapters';

@Injectable()
export class EmailManager {
  constructor(private readonly emailAdapter: EmailAdapter) {}
  async sendEmailCreatedUser(email: string, code: string) {
    const message = `
      <h1>Thank for your registration</h1>
      <p>To finish registration please follow the link below:
        <a href='https://somesite.com/confirm-email?code=${code}'>complete registration</a>
      </p>
      `;
    const subject = 'Подтверждение регистрации';
    const messageId: string | null = await this.emailAdapter.sendEmail(
      email,
      subject,
      message,
    );
    if (!messageId) {
      return false;
    }

    return true;
  }
  async sendEmailWithRecoveryCode(email: string, code: string) {
    const message = `
      <h1>Password recovery</h1>
      <p>To finish password recovery please follow the link below:
         <a href='https://somesite.com/password-recovery?recoveryCode=${code}'>recovery password</a>
     </p>
      `;
    const subject = 'Востановление пароля';

    const messageId: string | null = await this.emailAdapter.sendEmail(
      email,
      subject,
      message,
    );

    if (!messageId) {
      return false;
    }

    return true;
  }
}
