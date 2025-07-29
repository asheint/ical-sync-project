// src/google-webhook/google-webhook.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { UserService } from '../user/user.service'; // Import UserService
import { GoogleAuthService } from '../google-auth/google-auth.service';

@Injectable()
export class GoogleWebhookService {
  private readonly logger = new Logger(GoogleWebhookService.name);

  constructor(
    private readonly userService: UserService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

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
        const fifteenMinutesAgo = new Date(
          Date.now() - 15 * 60 * 1000,
        ).toISOString();
        const response = await calendar.events.list({
          calendarId: 'primary',
          timeMin: fifteenMinutesAgo,
          singleEvents: true,
          orderBy: 'updated',
          showDeleted: false,
        });

        const allUpdatedEvents = response.data.items;

        if (allUpdatedEvents && allUpdatedEvents.length > 0) {
          // MODIFIED FILTER: Use the new filterTrackedEvents method from UserService
          const trackedEventIdsToMonitor = user.trackedEvents
            ? user.trackedEvents.map((e) => e.googleEventId)
            : [];
          const relevantBookingEvents = allUpdatedEvents.filter(
            (event) => event.id && trackedEventIdsToMonitor.includes(event.id),
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
                this.logger.log(
                  `  - Attendee: ${attendee.email}, RSVP Status: ${attendee.responseStatus || 'N/A'}`,
                );
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
