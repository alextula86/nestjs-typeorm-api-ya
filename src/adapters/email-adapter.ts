import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { isEmpty } from 'lodash';

@Injectable()
export class EmailAdapter {
  constructor(private mailerService: MailerService) {}
  async sendEmail(email: string, subject: string, message: string) {
    try {
      const response = await this.mailerService.sendMail({
        to: email,
        subject: subject,
        html: message,
      });

      if (!isEmpty(response.rejected)) {
        throw response;
      }

      // console.log("Message sent: %s", info.messageId);
      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

      // Preview only available when sending through an Ethereal account
      // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...

      return response.messageId;
    } catch (error) {
      console.log('mailerService sendMail error', error);
    }

    return null;
  }
}
