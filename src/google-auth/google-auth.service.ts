// src/google-auth/google-auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { UserService } from '../user/user.service';

@Injectable()
export class GoogleAuthService {
  private oauth2Client: any;
  private readonly logger = new Logger(GoogleAuthService.name);

  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    const clientId = this.configService.get<string>('google.clientId');
    const clientSecret = this.configService.get<string>('google.clientSecret');
    const redirectUri = this.configService.get<string>('google.redirectUri');

    if (!clientId || !clientSecret || !redirectUri) {
      this.logger.error(
        'Missing Google OAuth configuration. Check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI in .env or config.',
      );
      throw new Error('Google OAuth configuration incomplete.');
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );
  }

  getAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId,
      prompt: 'consent',
    });
  }

  async getTokens(code: string): Promise<any> {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  async getAuthenticatedClient(refreshToken: string) {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });

    // Simplified: Removed token refresh listener for demo clarity.
    // In production, you'd handle token refreshes robustly.
    try {
      await this.oauth2Client.getAccessToken(); // This will auto-refresh if needed and update internal token
    } catch (error) {
      this.logger.error(
        'Error getting/refreshing access token:',
        error.message,
      );
      throw error;
    }

    return this.oauth2Client;
  }

  async startCalendarWatch(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const authClient = await this.getAuthenticatedClient(refreshToken);
    const calendar = google.calendar({ version: 'v3', auth: authClient });
    const webhookUrl = this.configService.get<string>('google.webhookUrl');

    if (!webhookUrl) {
      this.logger.error(
        'Google webhook URL is not configured. Cannot start calendar watch.',
      );
      throw new Error('Webhook URL missing.');
    }

    const channelId = `${userId}-${Date.now()}`;

    try {
      const response = await calendar.events.watch({
        calendarId: 'primary',
        requestBody: {
          id: channelId,
          type: 'web_hook',
          address: webhookUrl,
          // expiration: (Date.now() + 3600 * 1000).toString(), // Optional: 1 hour expiration for demo
        },
      });

      this.logger.debug(`Calendar watch started for user ${userId}.`);
      this.logger.debug(`Channel ID: ${response.data.id}`);
      this.logger.debug(`Resource ID: ${response.data.resourceId}`);
      this.logger.debug(`Expiration: ${response.data.expiration}`);

      await this.userService.updateGoogleTokensAndWatchInfo(userId, {
        // Convert null to undefined for optional properties in interface
        watchChannelId: response.data.id || undefined,
        watchResourceId: response.data.resourceId || undefined,
        watchExpiry: response.data.expiration || undefined,
      });
    } catch (error) {
      this.logger.error(
        'Error starting calendar watch:',
        error.message,
        error.stack,
      );
      throw new Error('Failed to start Google Calendar watch.');
    }
  }

  // Simplified: Removed stopCalendarWatch for demo clarity
  // If you need logout functionality, we can add this back and handle token revocation.
}
