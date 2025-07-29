import {
  Controller,
  Get,
  Query,
  Res,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { GoogleAuthService } from './google-auth.service';
import { UserService } from '../user/user.service';

@Controller('google-auth')
export class GoogleAuthController {
  private readonly logger = new Logger(GoogleAuthController.name);

  constructor(
    private readonly googleAuthService: GoogleAuthService,
    private readonly userService: UserService,
  ) {}

  @Get('login')
  async googleLogin(@Res() res: Response, @Query('userId') userId?: string) {
    const effectiveUserId = userId || 'testuser1';
    const authUrl = this.googleAuthService.getAuthUrl(effectiveUserId);
    res.redirect(authUrl);
  }

  @Get('callback')
  async googleAuthCallback(
    @Query('code') code: string,
    @Query('state') userId: string,
    @Res() res: Response,
  ) {
    if (!code || !userId) {
      this.logger.error('Google OAuth callback: Missing code or user ID.');
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send('Authentication failed: Missing parameters.');
    }

    try {
      this.logger.debug(`Received Google OAuth callback for userId: ${userId}`);
      const tokens = await this.googleAuthService.getTokens(code);

      await this.userService.updateGoogleTokensAndWatchInfo(userId, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
      });

      await this.googleAuthService.startCalendarWatch(
        userId,
        tokens.refresh_token,
      );

      res.status(HttpStatus.OK).send(`
        <html>
          <body>
            <h1>Google Authentication Successful!</h1>
            <p>You are authenticated as demo user: <b>${userId}</b>.</p>
            <p>Next step: <a href="/create-demo-event/${userId}/practitioner@example.com">Create a Demo Booking Event</a></p>
            <p>(Remember to replace 'practitioner@example.com' with a real email!)</p>
            <p>Check your console for instructions after creating the event.</p>
          </body>
        </html>
      `);
    } catch (error) {
      this.logger.error(
        'Error during Google authentication callback:',
        error.message,
        error.stack,
      );
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send(`Authentication failed: ${error.message}`);
    }
  }

  // Simplified: Removed logout endpoint for demo clarity.
  // We can re-introduce this if you specifically need to demonstrate stopping the watch.
}
