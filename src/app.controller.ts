import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  HttpStatus,
  Logger,
  Param,
} from '@nestjs/common';
import { Response } from 'express';
import { BookingService } from './booking/booking.service';
import { EmailService } from './email/email.service';
import { ConfigService } from '@nestjs/config';
import * as Mail from 'nodemailer/lib/mailer'; // Import Mail from nodemailer

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  private readonly baseUrl: string;
  private readonly emailFrom: string;

  constructor(
    private readonly bookingService: BookingService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    // FIX: Use non-null assertion (!) because these are guaranteed by config/configuration.ts
    this.baseUrl = this.configService.get<string>('baseUrl')!;
    this.emailFrom = this.configService.get<string>('email.from')!;
  }

  @Get('/')
  getBookingForm(@Res() res: Response) {
    // Generate time options for the dropdown
    const timeOptions: string[] = []; // FIX: Explicitly type as string[]
    for (let i = 9; i <= 17; i++) {
      // From 9 AM to 5 PM
      const hour = i.toString().padStart(2, '0');
      timeOptions.push(`<option value="${hour}:00">${hour}:00 AM</option>`);
    }

    res.status(HttpStatus.OK).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Simple iCal Booking Demo</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 20px; background-color: #f4f4f4; color: #333; }
              .container { max-width: 600px; margin: 30px auto; padding: 25px; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h1 { color: #0056b3; text-align: center; margin-bottom: 25px; }
              label { display: block; margin-bottom: 8px; font-weight: bold; }
              input[type="text"], input[type="email"], input[type="date"], select {
                  width: calc(100% - 22px); padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;
              }
              button {
                  background-color: #28a745; color: white; padding: 12px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;
                  width: 100%; transition: background-color 0.3s ease;
              }
              button:hover { background-color: #218838; }
              .message { margin-top: 20px; padding: 10px; border-radius: 4px; }
              .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
              .error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>Book a Consultation</h1>
              <form id="bookingForm">
                  <label for="patientName">Patient Name:</label>
                  <input type="text" id="patientName" name="patientName" required value="Jane Doe">

                  <label for="patientEmail">Patient Email:</label>
                  <input type="email" id="patientEmail" name="patientEmail" required value="patient@example.com">

                  <label for="practitionerEmail">Practitioner Email (Receives Invite):</label>
                  <input type="email" id="practitionerEmail" name="practitionerEmail" required value="practitioner@example.com">

                  <label for="date">Date:</label>
                  <input type="date" id="date" name="date" required value="${new Date().toISOString().split('T')[0]}">

                  <label for="time">Time (1-hour slot):</label>
                  <select id="time" name="time" required>
                      ${timeOptions.join('')}
                  </select>

                  <button type="submit">Send Booking Request</button>
              </form>
              <div id="message" class="message"></div>
          </div>

          <script>
              document.getElementById('bookingForm').addEventListener('submit', async function(event) {
                  event.preventDefault();
                  const form = event.target;
                  const messageDiv = document.getElementById('message');
                  messageDiv.className = 'message';
                  messageDiv.textContent = 'Sending booking request...';

                  const formData = {
                      patientName: form.patientName.value,
                      patientEmail: form.patientEmail.value,
                      practitionerEmail: form.practitionerEmail.value,
                      date: form.date.value,
                      time: form.time.value,
                  };

                  try {
                      const response = await fetch('/book', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(formData)
                      });

                      const result = await response.text(); // Get text for direct display

                      if (response.ok) {
                          messageDiv.className = 'message success';
                          messageDiv.innerHTML = 'Booking request sent successfully! Check practitioner\'s email.<br>' + result;
                      } else {
                          messageDiv.className = 'message error';
                          messageDiv.innerHTML = 'Failed to send booking request: ' + result;
                      }
                  } catch (error) {
                      console.error('Network or server error:', error);
                      messageDiv.className = 'message error';
                      messageDiv.textContent = 'An unexpected error occurred.';
                  }
              });
          </script>
      </body>
      </html>
    `);
  }

  @Post('/book')
  async handleBookingRequest(@Body() body: any, @Res() res: Response) {
    try {
      const { patientName, patientEmail, practitionerEmail, date, time } = body;
      this.logger.log(
        `Received booking request from ${patientEmail} for ${practitionerEmail} on ${date} at ${time}`,
      );

      const booking = this.bookingService.createBooking(
        patientName,
        patientEmail,
        practitionerEmail,
        date,
        time,
      );

      const practitionerEmailSubject = `New Booking Request: ${booking.patientName} - ${booking.startTime.toLocaleString()}`;
      const practitionerEmailHtml = `
        <p>Dear Practitioner,</p>
        <p>You have a new booking request:</p>
        <ul>
          <li><strong>Patient:</strong> ${booking.patientName} (${booking.patientEmail})</li>
          <li><strong>Time:</strong> ${booking.startTime.toLocaleString()} - ${booking.endTime.toLocaleString()}</li>
          <li><strong>Status:</strong> ${booking.status}</li>
        </ul>
        <p>Please click one of the links below to respond:</p>
        <p><a href="${this.baseUrl}/booking/${booking.id}/accept" style="background-color:#28a745;color:white;padding:10px 15px;border-radius:5px;text-decoration:none;">Accept Booking</a></p>
        <p><a href="${this.baseUrl}/booking/${booking.id}/reject" style="background-color:#dc3545;color:white;padding:10px 15px;border-radius:5px;text-decoration:none;">Reject Booking</a></p>
        <p>Best regards,<br>Your Booking System</p>
      `;

      await this.emailService.sendEmail({
        to: practitionerEmail,
        subject: practitionerEmailSubject,
        html: practitionerEmailHtml,
        attachments: [
          // FIX: Cast attachment object to 'any' to bypass strict type checking for 'method'
          {
            filename: `booking_${booking.id.substring(0, 8)}.ics`,
            content: booking.icsContent,
            contentType: 'text/calendar',
            method: 'PUBLISH', // This is an iCal property, not a Nodemailer property directly
          } as any, // Cast to any
        ],
      }); // No need to cast the whole options object if attachments are cast

      res
        .status(HttpStatus.OK)
        .send(
          `Booking request sent to ${practitionerEmail}. Booking ID: ${booking.id}`,
        );
    } catch (error) {
      this.logger.error(
        'Error handling booking request:',
        error.message,
        error.stack,
      );
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send(
          `Failed to process booking request: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
    }
  }

  // Endpoint for Practitioner to simulate ACCEPT/REJECT
  @Get('/booking/:id/:status')
  async handleBookingResponse(
    @Param('id') bookingId: string,
    @Param('status') status: 'accept' | 'reject',
    @Res() res: Response,
  ) {
    try {
      const newStatus = status === 'accept' ? 'ACCEPTED' : 'REJECTED';
      const booking = this.bookingService.updateBookingStatus(
        bookingId,
        newStatus,
      );

      if (!booking) {
        this.logger.warn(
          `Booking ID ${bookingId} not found for status update.`,
        );
        return res
          .status(HttpStatus.NOT_FOUND)
          .send('Booking not found or invalid ID.');
      }

      this.logger.log(
        `Booking ${booking.id} has been ${newStatus} by practitioner ${booking.practitionerEmail}`,
      );

      // Send confirmation email to patient
      const patientEmailSubject = `Your Booking for ${booking.startTime.toLocaleString()} has been ${newStatus}`;
      const patientEmailHtml = `
        <p>Dear ${booking.patientName},</p>
        <p>Your booking request with ${booking.practitionerEmail} for ${booking.startTime.toLocaleString()} has been <strong>${newStatus}</strong>.</p>
        ${
          newStatus === 'ACCEPTED'
            ? `
          <p>The practitioner has accepted your booking. You can add this event to your calendar using the attached .ics file.</p>
          <p>We look forward to your consultation!</p>
        `
            : `
          <p>Unfortunately, the practitioner has rejected your booking. Please try booking another slot or contact us for assistance.</p>
        `
        }
        <p>Best regards,<br>Your Booking System</p>
      `;

      const attachments: Mail.Attachment[] = [];
      if (newStatus === 'ACCEPTED') {
        attachments.push({
          filename: `your_booking_${booking.id.substring(0, 8)}.ics`,
          content: booking.icsContent, // Attach the original ICS to patient's email
          contentType: 'text/calendar',
          method: 'PUBLISH', // This is an iCal property
        } as any); // FIX: Cast to any
      }

      await this.emailService.sendEmail({
        to: booking.patientEmail,
        subject: patientEmailSubject,
        html: patientEmailHtml,
        attachments: attachments,
      });

      res
        .status(HttpStatus.OK)
        .send(
          `Booking ${booking.id} status updated to ${newStatus}. Confirmation sent to ${booking.patientEmail}.`,
        );
    } catch (error: any) {
      this.logger.error(
        'Error handling booking response:',
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error.stack : undefined,
      );
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send(
          `Failed to update booking status: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
    }
  }
}
