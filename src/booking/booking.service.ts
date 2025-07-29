// src/booking/booking.service.ts
import { Injectable, Logger } from '@nestjs/common';
import {
  ICalCalendar,
  ICalAttendeeType,
  ICalEventStatus,
  ICalAttendeeStatus,
} from 'ical-generator';
import { ConfigService } from '@nestjs/config';

// Define a simple in-memory store for bookings for demo purposes
interface Booking {
  id: string;
  patientName: string;
  patientEmail: string;
  practitionerEmail: string;
  startTime: Date;
  endTime: Date;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  icsContent: string;
}

const bookings = new Map<string, Booking>(); // bookingId -> Booking object

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    // FIX: Use non-null assertion (!) because this is guaranteed by config/configuration.ts
    this.baseUrl = this.configService.get<string>('baseUrl')!;
  }

  createBooking(
    patientName: string,
    patientEmail: string,
    practitionerEmail: string,
    date: string, // YYYY-MM-DD
    time: string, // HH:MM (e.g., '09:00')
  ): Booking {
    const bookingId = `booking-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const bookingStartTime = new Date(`${date}T${time}:00`);
    const bookingEndTime = new Date(
      bookingStartTime.getTime() + 60 * 60 * 1000,
    ); // 1 hour duration

    const iCalEventSummary = `Booking with ${patientName} - ${bookingStartTime.toLocaleDateString()} ${time}`;
    const iCalEventDescription = `Patient: ${patientName}\nEmail: ${patientEmail}`;
    const iCalEventLocation = 'Virtual Consultation';

    // Create custom links for practitioner's response
    const acceptLink = `${this.baseUrl}/booking/${bookingId}/accept`;
    const rejectLink = `${this.baseUrl}/booking/${bookingId}/reject`;

    const cal = new ICalCalendar({
      prodId: '//YourCompany//BookingApp//EN',
      name: 'Booking Invitation',
      timezone: 'Asia/Colombo', // Adjust timezone as needed
    });

    cal.createEvent({
      id: bookingId, // Use booking ID as UID for consistency
      start: bookingStartTime,
      end: bookingEndTime,
      summary: iCalEventSummary,
      description: `
        ${iCalEventDescription}

        Please respond to this booking:
        Accept: ${acceptLink}
        Reject: ${rejectLink}
      `,
      location: iCalEventLocation,
      url: `${this.baseUrl}/booking/${bookingId}`, // Link back to your system's booking page (if you had one)
      organizer: {
        name: patientName,
        email: patientEmail, // Patient's email as the organizer for iCal
      },
      attendees: [
        {
          name: 'Practitioner',
          email: practitionerEmail,
          rsvp: true,
          status: ICalAttendeeStatus.NEEDSACTION, // Initial status
          type: ICalAttendeeType.INDIVIDUAL,
        },
      ],
      status: ICalEventStatus.CONFIRMED,
      sequence: 0,
    });

    const icsContent = cal.toString();

    const newBooking: Booking = {
      id: bookingId,
      patientName,
      patientEmail,
      practitionerEmail,
      startTime: bookingStartTime,
      endTime: bookingEndTime,
      status: 'PENDING',
      icsContent,
    };

    bookings.set(bookingId, newBooking);
    this.logger.log(`New booking created: ${bookingId}`);
    return newBooking;
  }

  getBooking(id: string): Booking | undefined {
    return bookings.get(id);
  }

  updateBookingStatus(
    id: string,
    status: 'ACCEPTED' | 'REJECTED',
  ): Booking | undefined {
    const booking = bookings.get(id);
    if (booking) {
      booking.status = status;
      this.logger.log(`Booking ${id} status updated to: ${status}`);
    }
    return booking;
  }
}
