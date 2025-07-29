import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { CalendarService } from './calendar.service';
import { EmailService } from './email.service';
import { CreateEventDto } from './dto/create-event.dto';

@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly emailService: EmailService,
  ) {}

  @Post('send-invite')
  async sendInvite(@Body() eventData: CreateEventDto) {
    try {
      const eventId = this.calendarService.generateEventId();
      const icalContent = this.calendarService.createICalEvent(
        eventData,
        eventId,
      );

      const htmlContent = `
        <h2>You're invited to: ${eventData.title}</h2>
        <p><strong>Description:</strong> ${eventData.description}</p>
        <p><strong>Start:</strong> ${new Date(eventData.startDate).toLocaleString()}</p>
        <p><strong>End:</strong> ${new Date(eventData.endDate).toLocaleString()}</p>
        <p><strong>Organizer:</strong> ${eventData.organizerName} (${eventData.organizerEmail})</p>
      `;

      await this.emailService.sendCalendarInvite(
        eventData.attendeeEmail,
        `Meeting Invitation: ${eventData.title}`,
        htmlContent,
        icalContent,
        eventId,
      );

      return {
        success: true,
        message: 'Calendar invite sent successfully',
        eventId: eventId,
      };
    } catch (error: unknown) {
      let errorMessage = 'Unknown error';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as { message: unknown }).message);
      }
      return {
        success: false,
        message: 'Failed to send calendar invite',
        error: errorMessage,
      };
    }
  }

  @Get('respond/:eventId')
  respondToInvite(
    @Param('eventId') eventId: string,
    @Query('email') email: string,
    @Query('response') response: 'accepted' | 'declined' | 'tentative',
    @Res() res: Response,
  ) {
    try {
      this.calendarService.recordResponse(eventId, email, response);

      const responseMessage = {
        accepted: 'Thank you! You have accepted the meeting invitation.',
        declined: 'You have declined the meeting invitation.',
        tentative: 'You have marked your attendance as tentative.',
      };

      const html = `
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
            <h2>Response Recorded</h2>
            <p>${responseMessage[response]}</p>
            <p><strong>Event ID:</strong> ${eventId}</p>
            <p><strong>Your Email:</strong> ${email}</p>
            <p><strong>Response:</strong> ${response.toUpperCase()}</p>
          </body>
        </html>
      `;

      res.status(HttpStatus.OK).send(html);
    } catch {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send('Error recording response');
    }
  }

  @Get('responses/:eventId')
  getEventResponses(@Param('eventId') eventId: string) {
    return {
      eventId,
      responses: this.calendarService.getEventResponses(eventId),
    };
  }

  @Get('responses')
  getAllResponses() {
    const allResponses = this.calendarService.getAllResponses();
    const result = {};

    allResponses.forEach((responses, eventId) => {
      result[eventId] = responses;
    });

    return result;
  }
}
