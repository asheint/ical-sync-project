import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as express from 'express';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`
█████████████████████████████████████████████████████████████████████████████████████████████
██                                                                                         ██
██   Simple iCal Booking Demo is running!                                                  ██
██                                                                                         ██
██   ------------------------------------------------------------------------------------- ██
██   >> How to Test:                                                                       ██
██   ------------------------------------------------------------------------------------- ██
██   1. Open the Booking Form:                                                             ██
██      Go to: http://localhost:${port}/                                                    ██
██      (Fill in details for Patient and Practitioner. Practitioner gets the invite.)      ██
██                                                                                         ██
██   2. Check Practitioner's Email:                                                        ██
██      The Practitioner will receive an email with an attached .ics file.                 ██
██      This email also contains TWO CUSTOM LINKS for Acceptance/Rejection.                ██
██      (These links simulate the practitioner's response back to your system.)            ██
██                                                                                         ██
██   3. Simulate Practitioner Response:                                                    ██
██      Click either 'Accept Booking' or 'Reject Booking' link in the email.               ██
██      (This will trigger a response back to your NestJS app.)                            ██
██                                                                                         ██
██   4. Check Patient's Email:                                                             ██
██      The Patient will receive a confirmation email based on the simulated response.     ██
██                                                                                         ██
██   5. Watch THIS Terminal:                                                               ██
██      You'll see logs when emails are sent and when the simulated acceptance/rejection   ██
██      occurs, demonstrating the "accepted or rejected thing into system".                ██
██                                                                                         ██
██   ------------------------------------------------------------------------------------- ██
██   >> IMPORTANT CONFIGURATION:                                                           ██
██   ------------------------------------------------------------------------------------- ██
██   * Make sure 'EMAIL_PASSWORD' in your '.env' is your Resend API Key.                   ██
██   * Ensure 'EMAIL_FROM' domain (e.g., 'mail.zx-software.com') is VERIFIED in Resend.    ██
██                                                                                         ██
█████████████████████████████████████████████████████████████████████████████████████████████
  `);
}
bootstrap();
