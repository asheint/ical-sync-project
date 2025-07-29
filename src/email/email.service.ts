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

    // Ensure all necessary config values are present before attempting to create transporter
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
      secure: emailConfig.secure, // Should be 'false' for Resend on port 587 (uses STARTTLS)
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
      },
      // Remove or set to true: `tls: { rejectUnauthorized: false }` is for specific local/test setups,
      // generally not needed or desired for production services like Resend.
      // If you face CERT_HAS_EXPIRED or similar errors during local development,
      // you *might* temporarily set rejectUnauthorized: false, but ideally fix the certificate issue.
      // For now, let's remove it as it's not standard for Resend.
      // If you encounter connection issues later, this is one place to check.
    });

    this.mailFrom = emailConfig.from;

    this.transporter.verify((error) => {
      if (error) {
        this.logger.error(
          'Email transporter verification failed:',
          error.message,
        );
        // Do not throw here, allow app to start, but log the error
      } else {
        this.logger.log('Email transporter ready and verified.');
      }
    });
  }

  async sendIcsEmail(
    to: string,
    subject: string,
    html: string,
    icsContent: string,
    icsFilename: string,
  ): Promise<void> {
    try {
      const mailOptions = {
        from: this.mailFrom,
        to: to,
        subject: subject,
        html: html,
        attachments: [
          {
            filename: icsFilename,
            content: icsContent,
            contentType: 'text/calendar',
            method: 'PUBLISH', // Important for iCal attachments
          },
        ],
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${to}: ${info.messageId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}:`,
        error.message,
        error.stack,
      );
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
}
