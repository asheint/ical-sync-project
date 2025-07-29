// src/email/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

@Injectable()
export class EmailService {
  private transporter: Mail;
  private readonly logger = new Logger(EmailService.name);
  private readonly mailFrom: string;

  constructor(private configService: ConfigService) {
    const emailConfig = this.configService.get('email');

    if (
      !emailConfig ||
      !emailConfig.host ||
      !emailConfig.user ||
      !emailConfig.pass ||
      !emailConfig.from
    ) {
      this.logger.error(
        'Email configuration is missing or incomplete. Check EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM in your .env or configuration.ts.',
      );
      throw new Error('Email configuration incomplete.');
    }

    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
      },
      // Resend uses valid TLS certificates, so rejectUnauthorized should typically be true or removed.
      // Set to false ONLY if you encounter certificate issues in local development, but NOT for production.
      // tls: { rejectUnauthorized: false }
    });

    this.mailFrom = emailConfig.from;

    this.transporter.verify((error) => {
      if (error) {
        this.logger.error(
          'Email transporter verification failed:',
          error.message,
        );
      } else {
        this.logger.log('Email transporter ready and verified.');
      }
    });
  }

  async sendEmail(mailOptions: Mail.Options): Promise<void> {
    try {
      mailOptions.from = mailOptions.from || this.mailFrom; // Ensure sender is set
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent: ${info.messageId} to ${mailOptions.to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${mailOptions.to}:`,
        error.message,
        error.stack,
      );
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
}
