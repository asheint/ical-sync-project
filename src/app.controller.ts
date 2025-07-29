// src/app.controller.ts
import {
  Controller,
  Get,
  Param,
  Res,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { CalendarService } from './calendar/calendar.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  getHello(): string {
    return `
      <h1>NestJS Google Calendar Webhook Demo</h1>
      <p>Authenticate with Google: <a href="/google-auth/login">/google-auth/login</a></p>
      <p>After authentication, create a demo event for a specific user and invite a practitioner:</p>
      <p>Example: <a href="/create-demo-event/testuser1/practitioner@example.com">/create-demo-event/testuser1/practitioner@example.com</a></p>
      <p>Replace 'testuser1' with your desired user ID and 'practitioner@example.com' with the actual email you want to invite.</p>
      <p>Make sure to start ngrok: 'ngrok http 3000' and update webhookUrl in src/config/configuration.ts with your ngrok HTTPS URL.</p>
    `;
  }

  @Get('/create-demo-event/:userId/:practitionerEmail')
  async createDemoEvent(
    @Param('userId') userId: string,
    @Param('practitionerEmail') practitionerEmail: string, // Capture practitioner email
    @Res() res: Response,
  ) {
    this.logger.log(
      `Attempting to create demo event for user: ${userId} inviting ${practitionerEmail}`,
    );
    try {
      const eventLink = await this.calendarService.createDemoEvent(
        userId,
        practitionerEmail,
      ); // Pass practitioner email
      return res.status(HttpStatus.OK).send(`
        <p>Demo Event Created! Check your Google Calendar and the invited practitioner's email.</p>
        <p>Event Link: <a href="${eventLink}" target="_blank">${eventLink}</a></p>
        <p>Google Auth URL: <a href="http://localhost:3000/google-auth/login">http://localhost:3000/google-auth/login</a></p>
        <p>Remember to start ngrok: 'ngrok http 3000' and update webhookUrl in src/config/configuration.ts</p>
        <p>To test RSVP, open the event link or the email invite and accept/decline. Watch your NestJS logs!</p>
      `);
    } catch (error) {
      this.logger.error(
        'Error creating demo event:',
        error.message,
        error.stack,
      );
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send(`Error creating demo event: ${error.message}`);
    }
  }
}
