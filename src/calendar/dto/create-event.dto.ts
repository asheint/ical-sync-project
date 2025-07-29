export class CreateEventDto {
  title: string;
  description: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  attendeeEmail: string;
  organizerEmail: string;
  organizerName: string;
  meetingLink?: string;
}
