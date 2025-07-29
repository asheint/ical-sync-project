import { Injectable, Logger } from '@nestjs/common';
import { google, calendar_v3 } from 'googleapis';
import { GoogleAuthService } from '../google-auth/google-auth.service';
import { UserService } from '../user/user.service';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    private readonly googleAuthService: GoogleAuthService,
    private readonly userService: UserService,
  ) {}

  async createDemoEvent(
    userId: string,
    practitionerEmail: string,
  ): Promise<string> {
    const user = await this.userService.findByUserId(userId);
    if (!user || !user.googleRefreshToken) {
      throw new Error(
        'User not found or not authenticated. Please authorize with Google first.',
      );
    }

    const authClient = await this.googleAuthService.getAuthenticatedClient(
      user.googleRefreshToken,
    );
    const calendar = google.calendar({ version: 'v3', auth: authClient });

    const eventDateTime = new Date();
    eventDateTime.setHours(eventDateTime.getHours() + 1);

    const event: calendar_v3.Schema$Event = {
      summary: `Booking with Practitioner - ${new Date().toLocaleTimeString('en-US')}`,
      description: `Demo booking from your platform. Patient: ${userId}, Practitioner: ${practitionerEmail}.`,
      start: {
        dateTime: eventDateTime.toISOString(),
        timeZone: 'Asia/Colombo',
      },
      end: {
        dateTime: new Date(
          eventDateTime.getTime() + 60 * 60 * 1000,
        ).toISOString(),
        timeZone: 'Asia/Colombo',
      },
      attendees: [{ email: practitionerEmail }],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
    };

    try {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        sendNotifications: true,
      });

      this.logger.log(`Created Google Calendar Event: "${event.summary}"`);
      this.logger.debug(`Event Link: ${response.data.htmlLink}`);

      if (response.data.id) {
        await this.userService.addTrackedGoogleEventId(
          userId,
          response.data.id,
        );
        this.logger.log(`Event ID ${response.data.id} is now being tracked.`);
      }

      if (!response.data.htmlLink) {
        throw new Error('Failed to get event HTML link after creation.');
      }
      return response.data.htmlLink;
    } catch (error) {
      this.logger.error(
        'Error creating Google Calendar event:',
        error.message,
        error.stack,
      );
      throw new Error(
        `Failed to create Google Calendar event: ${error.message}`,
      );
    }
  }
}
