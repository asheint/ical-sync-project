// src/calendar/calendar.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { google, calendar_v3 } from 'googleapis';
import { GoogleAuthService } from '../google-auth/google-auth.service';
import { UserService } from '../user/user.service';
import {
  ICalCalendar,
  ICalAttendeeType,
  ICalEventStatus,
  ICalAttendeeStatus,
} from 'ical-generator';

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
  ): Promise<{ eventLink: string; icsDownloadLink: string }> {
    const user = await this.userService.findByUserId(userId);
    if (!user || !user.googleRefreshToken) {
      throw new Error(
        'User not found or not authenticated. Please authorize with Google first.',
      );
    }

    const authClient = await this.googleAuthService.getAuthenticatedClient(
      user.googleRefreshToken,
    );
    const calendarGoogle = google.calendar({ version: 'v3', auth: authClient });

    const eventStart = new Date();
    eventStart.setHours(eventStart.getHours() + 1); // Event in 1 hour
    const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000); // 1 hour later

    const eventSummary = `Booking with Practitioner - ${eventStart.toLocaleTimeString('en-US')}`;
    const eventDescription = `Demo booking from your platform. Patient: ${userId}, Practitioner: ${practitionerEmail}.`;
    const eventLocation = 'Virtual Meeting (Link to be provided)'; // Example location

    const googleEvent: calendar_v3.Schema$Event = {
      summary: eventSummary,
      description: eventDescription,
      start: {
        dateTime: eventStart.toISOString(),
        timeZone: 'Asia/Colombo',
      },
      end: {
        dateTime: eventEnd.toISOString(),
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

    let createdGoogleEventId: string | undefined;
    let googleEventHtmlLink: string | undefined;

    try {
      const response = await calendarGoogle.events.insert({
        calendarId: 'primary',
        requestBody: googleEvent,
        sendNotifications: true,
      });

      createdGoogleEventId = response.data.id || undefined;
      googleEventHtmlLink = response.data.htmlLink || undefined;

      this.logger.log(`Created Google Calendar Event: "${eventSummary}"`);
      this.logger.debug(`Google Event Link: ${googleEventHtmlLink}`);

      if (!createdGoogleEventId) {
        throw new Error('Failed to get Google Event ID after creation.');
      }
      if (!googleEventHtmlLink) {
        throw new Error('Failed to get Google Event HTML link after creation.');
      }

      // --- Generate .ics content ---
      const cal = new ICalCalendar({
        prodId: '//YourCompany//YourApp v1.0//EN', // Unique identifier for your calendar product
        name: 'Booking Confirmation',
        timezone: 'Asia/Colombo',
      });

      cal.createEvent({
        // FIX 1: Changed 'uid' to 'id' for ICalEventData
        id: createdGoogleEventId, // Use Google Event ID as UID for consistency
        start: eventStart,
        end: eventEnd,
        summary: eventSummary,
        description: eventDescription,
        location: eventLocation,
        url: googleEventHtmlLink, // Link back to the Google Calendar event
        organizer: {
          name: 'Your App Booking', // Display name for the organizer
          email: user.userId, // The authenticated user's email (patient's email in this demo)
          mailto: user.userId, // mailto property
        },
        attendees: [
          {
            name: 'Practitioner', // Display name for the practitioner
            email: practitionerEmail,
            rsvp: true, // Request RSVP
            // FIX 2: Corrected enum member name from NEEDS_ACTION to NEEDSACTION
            status: ICalAttendeeStatus.NEEDSACTION, // Initial status for a new invitee
            type: ICalAttendeeType.INDIVIDUAL,
          },
        ],
        status: ICalEventStatus.CONFIRMED, // Overall event status
        sequence: 0, // Revision number, increment on updates
      });

      const icsContent = cal.toString();
      this.logger.debug(
        `Generated ICS content for event ID ${createdGoogleEventId}`,
      );

      // Store the ICS content with the tracked event
      await this.userService.addTrackedGoogleEvent(
        userId,
        createdGoogleEventId,
        icsContent,
      );

      const icsDownloadLink = `/download-ics/${userId}/${createdGoogleEventId}`;
      this.logger.log(`ICS download link for this event: ${icsDownloadLink}`);

      return { eventLink: googleEventHtmlLink, icsDownloadLink };
    } catch (error) {
      this.logger.error(
        'Error creating Google Calendar event or generating ICS:',
        error.message,
        error.stack,
      );
      throw new Error(
        `Failed to create Google Calendar event: ${error.message}`,
      );
    }
  }
}
