import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    console.log('Email Config:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER,
      hasPassword: !!process.env.EMAIL_PASSWORD,
      from: process.env.EMAIL_FROM,
    });

    // Configure your email transporter for Resend
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.resend.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // false for port 587
      auth: {
        user: process.env.EMAIL_USER || 'resend',
        pass: process.env.EMAIL_PASSWORD,
      },
      debug: true, // Enable debug logs
      logger: true,
    });

    // Test the connection
    this.transporter.verify((error) => {
      if (error) {
        console.log('SMTP Connection Error:', error);
      } else {
        console.log('SMTP Server is ready to take our messages');
      }
    });
  }

  async sendCalendarInvite(
    to: string,
    subject: string,
    htmlContent: string,
    icalContent: string,
    eventId: string,
  ): Promise<void> {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    const emailHtml = `
      ${htmlContent}
      <br><br>
      <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
        <h3 style="margin: 0 0 15px 0;">Please respond to this meeting invitation:</h3>
        <a href="${baseUrl}/calendar/respond/${eventId}?email=${encodeURIComponent(to)}&response=accepted" 
           style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; margin-right: 10px; border-radius: 4px; display: inline-block;">
           ✓ Accept
        </a>
        <a href="${baseUrl}/calendar/respond/${eventId}?email=${encodeURIComponent(to)}&response=declined" 
           style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; margin-right: 10px; border-radius: 4px; display: inline-block;">
           ✗ Decline
        </a>
        <a href="${baseUrl}/calendar/respond/${eventId}?email=${encodeURIComponent(to)}&response=tentative" 
           style="background-color: #ffc107; color: black; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
           ? Maybe
        </a>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'no-reply@mail.zx-software.com',
      to: to,
      subject: subject,
      html: emailHtml,
      // Add both as attachment and alternative
      attachments: [
        {
          filename: 'invite.ics',
          content: icalContent,
          contentType: 'text/calendar; charset=utf-8; method=REQUEST',
          contentDisposition: 'inline' as const,
        },
      ],
      alternatives: [
        {
          contentType: 'text/calendar; charset=utf-8; method=REQUEST',
          content: icalContent,
        },
      ],
    };

    await this.transporter.sendMail(mailOptions);
  }
}
