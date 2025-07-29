import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { UserService } from '../user/user.service';
import { GoogleAuthService } from '../google-auth/google-auth.service';

@Injectable()
export class GoogleWebhookService {
  private readonly logger = new Logger(GoogleWebhookService.name);

  constructor(
    private readonly userService: UserService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  // Simplified: Removed isValidWebhookRequest for demo clarity.
  // In production, robust webhook validation is essential.

  async processCalendarChange(
    channelId: string,
    resourceId: string,
    resourceState: string,
  ) {
    this.logger.log(
      `[WEBHOOK] Received change: Channel: ${channelId}, State: ${resourceState}`,
    );

    if (resourceState === 'exists') {
      const user = await this.userService.findByGoogleWatchChannelId(channelId);
      if (!user || !user.googleRefreshToken) {
        this.logger.error(
          `[WEBHOOK ERROR] No user or refresh token found for channelId: ${channelId}. Cannot fetch event details.`,
        );
        return;
      }

      const authClient = await this.googleAuthService.getAuthenticatedClient(
        user.googleRefreshToken,
      );
      const calendar = google.calendar({ version: 'v3', auth: authClient });

      try {
        // Fetch events updated in a small window to catch recent changes
        const fifteenMinutesAgo = new Date(
          Date.now() - 15 * 60 * 1000,
        ).toISOString();
        const response = await calendar.events.list({
          calendarId: 'primary', // Check the primary calendar of the authenticated user
          timeMin: fifteenMinutesAgo,
          singleEvents: true,
          orderBy: 'updated',
          showDeleted: false,
        });

        const allUpdatedEvents = response.data.items;

        if (allUpdatedEvents && allUpdatedEvents.length > 0) {
          // Filter to include ONLY events that your app explicitly created and is tracking
          const relevantBookingEvents = allUpdatedEvents.filter(
            (event) =>
              event.id &&
              user.trackedGoogleEventIds &&
              user.trackedGoogleEventIds.includes(event.id),
          );

          if (relevantBookingEvents.length === 0) {
            this.logger.log(
              '[WEBHOOK] No recently updated booking events tracked by this application for this user.',
            );
            return;
          }

          for (const event of relevantBookingEvents) {
            this.logger.log(
              `[BOOKING EVENT] "${event.summary}" (ID: ${event.id}) has updates.`,
            );

            if (event.attendees && event.attendees.length > 0) {
              for (const attendee of event.attendees) {
                // Log all attendees' status for tracked events.
                // In your real application, you would find the specific patient/practitioner email
                // associated with this booking from your database and check their status.
                this.logger.log(
                  `  - Attendee: ${attendee.email}, RSVP Status: ${attendee.responseStatus || 'N/A'}`,
                );

                // Example: If this attendee is your tracked practitioner for this booking:
                // if (attendee.email === 'practitioner@example.com') { // Replace with actual logic
                //     this.logger.log(`    --> Practitioner RSVP for this booking: ${attendee.responseStatus}`);
                //     // YOUR DATABASE UPDATE LOGIC GOES HERE (e.g., mark slot booked/rejected)
                // }
              }
            } else {
              this.logger.log(
                `[BOOKING EVENT] "${event.summary}" (ID: ${event.id}) has no attendees.`,
              );
            }
          }
        } else {
          this.logger.log(
            '[WEBHOOK] No recent event changes found in the calendar within the last 15 minutes.',
          );
        }
      } catch (error) {
        this.logger.error(
          `[WEBHOOK ERROR] Error fetching calendar events for channel ${channelId}:`,
          error.message,
          error.response?.data?.error?.message || error.response?.data,
        );
      }
    } else if (resourceState === 'not_exists') {
      this.logger.log(
        `[WEBHOOK CLEANUP] Resource ${resourceId} no longer exists for channel ${channelId}. Cleaning up watch channel.`,
      );
      await this.userService.removeGoogleWatchChannel(channelId);
    }
  }
}
