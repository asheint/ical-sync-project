// src/app.controller.ts
import {
  Controller,
  Get,
  Param,
  Res,
  HttpStatus,
  Logger,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { CalendarService } from './calendar/calendar.service';
import { UserService } from './user/user.service';
import {
  ICalCalendar,
  ICalAttendeeType,
  ICalEventStatus,
  ICalAttendeeStatus,
} from 'ical-generator';
import { EmailService } from './email/email.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly calendarService: CalendarService,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
  ) {}

  @Get()
  getHello(): string {
    return `
      <h1>NestJS Google Calendar Booking Demo</h1>
      <p><b>Full Google Integration Flow:</b></p>
      <p>1. Authenticate with Google: <a href="/google-auth/login">/google-auth/login</a></p>
      <p>2. After authentication, create a demo event for a specific user and invite a practitioner:</p>
      <p>   Example: <a href="/create-demo-event/testuser1/practitioner@example.com">/create-demo-event/testuser1/practitioner@example.com</a></p>
      <p>   (Replace 'testuser1' with your desired user ID and 'practitioner@example.com' with the actual email you want to invite.)</p>
      <p>   (Make sure to start ngrok: 'ngrok http 3000' and update webhookUrl in src/config/configuration.ts with your ngrok HTTPS URL.)</p>
      <p><b>Standalone iCal Generation & Email (No Google Integration):</b></p>
      <p>   <a href="/send-ical-email?to=recipient@example.com">/send-ical-email?to=recipient@example.com</a></p>
      <p>   (REPLACE 'recipient@example.com' with a REAL email you can check, or your Ethereal.email inbox URL!)</p>
      <p>   (This will send an email with the .ics file as an attachment.)</p>
    `;
  }

  @Get('/create-demo-event/:userId/:practitionerEmail')
  async createDemoEvent(
    @Param('userId') userId: string,
    @Param('practitionerEmail') practitionerEmail: string,
    @Res() res: Response,
  ) {
    this.logger.log(
      `Attempting to create demo event for user: ${userId} inviting ${practitionerEmail}`,
    );
    try {
      const { eventLink, icsDownloadLink } =
        await this.calendarService.createDemoEvent(userId, practitionerEmail);
      return res.status(HttpStatus.OK).send(`
        <p>Demo Event Created! Check your Google Calendar and the invited practitioner's email.</p>
        <p>Google Event Link: <a href="${eventLink}" target="_blank">${eventLink}</a></p>
        <p><b>Download .ics File:</b> <a href="${icsDownloadLink}" target="_blank">Click to Download Event.ics</a></p>
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

  @Get('/download-ics/:userId/:googleEventId')
  async downloadIcsFile(
    @Param('userId') userId: string,
    @Param('googleEventId') googleEventId: string,
    @Res() res: Response,
  ) {
    this.logger.log(
      `Attempting to download ICS for event ID: ${googleEventId} for user: ${userId}`,
    );
    try {
      const icsContent = await this.userService.getIcsContentForEvent(
        userId,
        googleEventId,
      );

      if (!icsContent) {
        this.logger.warn(
          `ICS content not found for event ID: ${googleEventId} or user: ${userId}`,
        );
        return res
          .status(HttpStatus.NOT_FOUND)
          .send(
            'ICS file not found. Event might not exist or was not created by this app instance.',
          );
      }

      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="event_${googleEventId.substring(0, 8)}.ics"`,
      );
      res.send(icsContent);
    } catch (error) {
      this.logger.error('Error serving ICS file:', error.message, error.stack);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send(`Error generating ICS file: ${error.message}`);
    }
  }

  // NEW ENDPOINT: Standalone iCal generation and email sending
  @Get('/send-ical-email')
  async sendStandaloneIcalEmail(
    @Query('to') toEmail: string,
    @Res() res: Response,
  ) {
    if (!toEmail) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send(
          'Please provide a recipient email address using ?to=email@example.com',
        );
    }

    this.logger.log(
      `Generating and sending standalone iCal file to ${toEmail}.`,
    );

    const eventStart = new Date();
    eventStart.setMinutes(eventStart.getMinutes() + 30); // Start in 30 minutes
    const eventEnd = new Date(eventStart.getTime() + 30 * 60 * 1000); // 30 minute duration
    const eventUid = `standalone-email-event-${Date.now()}`;
    const eventLocation = 'Online via Zoom'; // <--- FIX: Defined eventLocation here

    const cal = new ICalCalendar({
      prodId: '//YourCompany//StandaloneApp//EN',
      name: 'Standalone Demo Meeting',
      timezone: 'Asia/Colombo',
    });

    cal.createEvent({
      id: eventUid,
      start: eventStart,
      end: eventEnd,
      summary: 'Quick Demo Meeting (Email Invite)',
      description:
        'This is a standalone iCal file sent via email from your NestJS app, generated without Google Calendar integration. You can accept/decline this event directly in your calendar client.',
      location: eventLocation, // Used the defined variable
      url: 'https://example.com/join-meeting',
      organizer: {
        name: 'Your App Bookings',
        email: 'noreply@your-app.com', // This should match your EMAIL_FROM config
      },
      attendees: [
        {
          name: 'Recipient',
          email: toEmail,
          rsvp: true, // Request RSVP
          status: ICalAttendeeStatus.NEEDSACTION,
          type: ICalAttendeeType.INDIVIDUAL,
        },
      ],
      status: ICalEventStatus.CONFIRMED,
      sequence: 0,
    });

    const icsContent = cal.toString();
    const icsFilename = `standalone_meeting_${eventUid.substring(0, 8)}.ics`;

    try {
      await this.emailService.sendIcsEmail(
        toEmail,
        `Meeting Invitation: ${cal.name()} - ${eventStart.toLocaleString()}`,
        `<p>Dear Recipient,</p><p>You are invited to a demo meeting. Please find the attached .ics file to add it to your calendar.</p><p><b>Meeting:</b> ${cal.name()}</p><p><b>Time:</b> ${eventStart.toLocaleString()} - ${eventEnd.toLocaleString()}</p><p><b>Location:</b> ${eventLocation}</p><p>Best regards,<br>Your Demo App</p>`,
        icsContent,
        icsFilename,
      );
      res
        .status(HttpStatus.OK)
        .send(
          `Standalone iCal email sent successfully to ${toEmail}. Check the console for Ethereal.email preview link (if using Ethereal).`,
        );
    } catch (error) {
      this.logger.error(
        `Error sending standalone iCal email to ${toEmail}:`,
        error.message,
        error.stack,
      );
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send(`Failed to send iCal email: ${error.message}`);
    }
  }
}
