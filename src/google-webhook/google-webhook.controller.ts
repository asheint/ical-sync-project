import {
  Controller,
  Post,
  Headers,
  Body,
  Res,
  HttpStatus,
  Logger,
  Req,
} from '@nestjs/common';
import { Response, Request } from 'express'; // Import Request
import { GoogleWebhookService } from './google-webhook.service';

@Controller('google-webhook')
export class GoogleWebhookController {
  private readonly logger = new Logger(GoogleWebhookController.name);

  constructor(private readonly googleWebhookService: GoogleWebhookService) {}

  @Post('calendar')
  async handleCalendarWebhook(
    @Headers() headers: Record<string, string>,
    @Req() req: Request, // Use @Req() to access rawBody
    @Body() body: any, // Body might be empty for calendar sync, check headers
    @Res() res: Response,
  ) {
    this.logger.debug(
      'Received Google Calendar Webhook Notification headers:',
      headers,
    );
    // Body is often empty for calendar push notifications, but rawBody might contain signature
    // this.logger.debug('Webhook Body:', body);

    const channelId = headers['x-goog-channel-id'];
    const resourceId = headers['x-goog-resource-id'];
    const resourceState = headers['x-goog-resource-state'];

    if (!channelId || !resourceId || !resourceState) {
      this.logger.error(
        'Webhook: Missing X-Goog headers. Request is malformed.',
      );
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send('Missing required headers.');
    }

    // IMPORTANT: Google expects a 200 OK response quickly (within seconds).
    // Send it immediately, then process the change asynchronously.
    res.status(HttpStatus.OK).send();

    // Process the change in the background
    try {
      await this.googleWebhookService.processCalendarChange(
        channelId,
        resourceId,
        resourceState,
      );
    } catch (error) {
      this.logger.error(
        'Error processing calendar change asynchronously:',
        error.message,
        error.stack,
      );
    }
  }
}
