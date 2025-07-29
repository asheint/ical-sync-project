import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as express from 'express';

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
  logger.log(`
████████████████████████████████████████████████████████████████████████████████
██                                                                             ██
██   NestJS Google Calendar Booking Demo is running!                           ██
██                                                                             ██
██   1. Authorize with Google:                                                 ██
██      Go to: http://localhost:${port}/google-auth/login                       ██
██      (Use 'testuser1' as the default demo user. Grants calendar access)     ██
██                                                                             ██
██   2. Create a Demo Booking Event:                                           ██
██      Go to: http://localhost:${port}/create-demo-event/testuser1/practitioner@example.com ██
██      (REPLACE 'practitioner@example.com' with a REAL email you can check!)  ██
██                                                                             ██
██   3. Check your Ngrok tunnel:                                               ██
██      Ensure Ngrok is running (e.g., 'ngrok http ${port}').                  ██
██      UPDATE 'redirectUri' and 'webhookUrl' in 'src/config/configuration.ts' ██
██      with your CURRENT Ngrok HTTPS URL before running!                      ██
██                                                                             ██
██   4. Test Practitioner RSVP:                                                ██
██      Check the invited practitioner's email for the Google Calendar invite. ██
██      Accept/Decline the event. Watch THIS terminal for RSVP updates!        ██
██                                                                             ██
████████████████████████████████████████████████████████████████████████████████
`);
}
bootstrap();
