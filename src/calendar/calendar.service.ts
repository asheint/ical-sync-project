import { Injectable } from '@nestjs/common';
import ical, {
  ICalCalendarMethod,
  ICalAttendeeStatus,
  ICalAttendeeRole,
  ICalEventStatus,
  ICalEventBusyStatus,
} from 'ical-generator';
import { CreateEventDto } from './dto/create-event.dto';

export interface EventResponse {
  eventId: string;
  attendeeEmail: string;
  response: 'accepted' | 'declined' | 'tentative';
  respondedAt: Date;
}

@Injectable()
export class CalendarService {
  private eventResponses: Map<string, EventResponse[]> = new Map();

  generateEventId(): string {
    return (
      'event-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    );
  }

  createICalEvent(eventData: CreateEventDto, eventId: string): string {
    const calendar = ical({
      name: 'Meeting Invitation',
      timezone: 'UTC',
      method: ICalCalendarMethod.REQUEST,
      prodId: '//ZX Software//Calendar Invite//EN',
    });

    const event = calendar.createEvent({
      id: eventId,
      start: new Date(eventData.startDate),
      end: new Date(eventData.endDate),
      summary: eventData.title,
      description: `${eventData.description}\nMeeting Link: ${eventData.meetingLink ?? ''}`, // Add link to description
      location: eventData.meetingLink ?? 'Virtual Meeting', // Use link as location if provided
      organizer: {
        name: eventData.organizerName,
        email: eventData.organizerEmail,
      },
      status: ICalEventStatus.CONFIRMED,
      busystatus: ICalEventBusyStatus.BUSY,
      sequence: 0,
    });

    // Add attendee
    event.createAttendee({
      name: eventData.attendeeEmail.split('@')[0],
      email: eventData.attendeeEmail,
      rsvp: true,
      status: ICalAttendeeStatus.NEEDSACTION,
      role: ICalAttendeeRole.REQ,
    });

    return calendar.toString();
  }

  recordResponse(
    eventId: string,
    attendeeEmail: string,
    response: 'accepted' | 'declined' | 'tentative',
  ): void {
    if (!this.eventResponses.has(eventId)) {
      this.eventResponses.set(eventId, []);
    }

    const responses = this.eventResponses.get(eventId)!;
    const existingResponseIndex = responses.findIndex(
      (r) => r.attendeeEmail === attendeeEmail,
    );

    const eventResponse: EventResponse = {
      eventId,
      attendeeEmail,
      response,
      respondedAt: new Date(),
    };

    if (existingResponseIndex >= 0) {
      responses[existingResponseIndex] = eventResponse;
    } else {
      responses.push(eventResponse);
    }
  }

  getEventResponses(eventId: string): EventResponse[] {
    return this.eventResponses.get(eventId) || [];
  }

  getAllResponses(): Map<string, EventResponse[]> {
    return this.eventResponses;
  }
}
