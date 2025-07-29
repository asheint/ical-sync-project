// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as express from 'express';
import * as dotenv from 'dotenv'; // Import dotenv

// Load environment variables from .env file
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Enable CORS for simple local testing (VERY permissive, adjust for real apps)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Necessary for webhook to read raw body for potential signature verification (even if not fully implemented in demo)
  app.use(
    express.json({
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: true }));

  const port = process.env.PORT || 3000;
  await app.listen(port);

  // Retrieve base URL from environment variables for convenience
  const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
  const googleRedirectUri =
    process.env.GOOGLE_REDIRECT_URI || `${baseUrl}/google-auth/callback`;
  const googleWebhookUrl =
    process.env.GOOGLE_WEBHOOK_URL ||
    'YOUR_NGROK_HTTPS_URL/google-webhook/calendar'; // Reminder for Ngrok URL

  logger.log(`
██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████
██                                                                                                                  ██
██   NestJS Google Calendar & iCal Booking Demo is running!                                                         ██
██                                                                                                                  ██
██   ---------------------------------------------------------------------------------------------------------------██
██   >> Full Google Calendar Integration Flow:                                                                      ██
██   ---------------------------------------------------------------------------------------------------------------██
██   1. Authorize with Google:                                                                                      ██
██      Go to: ${baseUrl}/google-auth/login                                                                         ██
██      (Use 'testuser1' as the default demo user. This grants calendar access.)                                    ██
██                                                                                                                  ██
██   2. Create a Demo Booking Event (Google Calendar & downloadable .ics):                                          ██
██      Go to: ${baseUrl}/create-demo-event/testuser1/practitioner@example.com                                      ██
██      (REPLACE 'practitioner@example.com' with a REAL email you can check!)                                       ██
██                                                                                                                  ██
██   3. Check your Ngrok tunnel:                                                                                    ██
██      Ensure Ngrok is running (e.g., 'ngrok http ${port}').                                                       ██
██      IMPORTANT: UPDATE 'GOOGLE_REDIRECT_URI' & 'GOOGLE_WEBHOOK_URL' in your '.env' file                         ██
██      with your CURRENT Ngrok HTTPS URL before running!                                                           ██
██      e.g., GOOGLE_REDIRECT_URI=${googleRedirectUri}                                                              ██
██      e.g., GOOGLE_WEBHOOK_URL=${googleWebhookUrl}                                                                ██
██                                                                                                                  ██
██   4. Test Practitioner RSVP:                                                                                     ██
██      Check the invited practitioner's email for the Google Calendar invite.                                      ██
██      Accept/Decline the event. Watch THIS terminal for RSVP updates via webhook!                                 ██
██                                                                                                                  ██
██   ---------------------------------------------------------------------------------------------------------------██
██   >> Standalone iCal Generation & Email Flow (No Google Integration):                                            ██
██   ---------------------------------------------------------------------------------------------------------------██
██   1. Send a Standalone iCal Email:                                                                               ██
██      Go to: ${baseUrl}/send-ical-email?to=recipient@example.com                                                  ██
██      (REPLACE 'recipient@example.com' with a REAL email you can check!)                                          ██
██      (This will send an email with a .ics file attachment via Resend.com.)                                       ██
██                                                                                                                  ██
██   2. Check your Resend.com Configuration:                                                                        ██
██      Ensure your 'EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM' are correct in your '.env' file.   ██
██      Verify your 'EMAIL_FROM' domain (e.g., 'mail.zx-software.com') is verified in your Resend account!         ██
██                                                                                                                  ██
██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████
  `);
}
bootstrap();
