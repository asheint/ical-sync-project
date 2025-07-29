# iCal Sync Project

A NestJS-based backend for sending calendar invites via email, tracking attendee responses, and managing event data using iCal format.

## Features

- Create and send calendar invites via email (with .ics attachment)
- Attendees can respond (Accept/Decline/Maybe) via email links
- Track responses for each event
- RESTful API endpoints for event management

## Tech Stack

- [NestJS](https://nestjs.com/) (TypeScript)
- [ical-generator](https://github.com/sebbo2002/ical-generator)
- [nodemailer](https://nodemailer.com/) (SMTP email sending)
- [dotenv](https://www.npmjs.com/package/dotenv) (environment variables)

---

## Getting Started

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd ical-sync-project
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory with your SMTP credentials:

```
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=587
EMAIL_USER=your_smtp_user
EMAIL_PASSWORD=your_smtp_password
EMAIL_FROM=your_email@example.com
BASE_URL=http://localhost:3000
```

### 3. Run the Server

```bash
npm run start:dev
```

Server runs at: [http://localhost:3000](http://localhost:3000)

---

## API Endpoints

### 1. Send Calendar Invite

**POST** `/calendar/send-invite`

Send a calendar invite to an attendee via email.

#### Request Body (JSON)

```json
{
  "title": "Project Sync Meeting",
  "description": "Discuss project updates and next steps.",
  "startDate": "2025-07-30T10:00:00.000Z",
  "endDate": "2025-07-30T11:00:00.000Z",
  "attendeeEmail": "attendee@example.com",
  "organizerEmail": "organizer@example.com",
  "organizerName": "Organizer Name",
  "meetingLink": "https://meet.example.com/abc123"
}
```

#### Sample Response

```json
{
  "success": true,
  "message": "Calendar invite sent successfully",
  "eventId": "event-1234567890-abcdefg"
}
```

---

### 2. Respond to Invite

**GET** `/calendar/respond/:eventId?email=<attendeeEmail>&response=<accepted|declined|tentative>`

Records attendee's response. This is typically accessed via the links in the email.

#### Example

```
GET /calendar/respond/event-1234567890-abcdefg?email=attendee@example.com&response=accepted
```

---

### 3. Get Event Responses

**GET** `/calendar/responses/:eventId`

Returns all responses for a specific event.

#### Sample Response

```json
{
  "eventId": "event-1234567890-abcdefg",
  "responses": [
    {
      "eventId": "event-1234567890-abcdefg",
      "attendeeEmail": "attendee@example.com",
      "response": "accepted",
      "respondedAt": "2025-07-29T12:34:56.789Z"
    }
  ]
}
```

---

### 4. Get All Responses

**GET** `/calendar/responses`

Returns responses for all events.

---

## Testing with Postman

### 1. Send Invite

- Set method to `POST`
- URL: `http://localhost:3000/calendar/send-invite`
- Body: Select `raw` and `JSON`, then use the sample JSON above.

### 2. Respond to Invite

- Set method to `GET`
- URL: `http://localhost:3000/calendar/respond/<eventId>?email=<attendeeEmail>&response=accepted`
- Replace `<eventId>` and `<attendeeEmail>` with actual values.

### 3. Get Responses

- Set method to `GET`
- URL: `http://localhost:3000/calendar/responses/<eventId>`

---

## Example Postman Collection

You can create a Postman collection with these endpoints and sample payloads for easy testing.

---

## Running Tests

```bash
npm run test         # Unit tests
npm run test:e2e     # End-to-end tests
npm run test:cov     # Coverage report
```

---

## License

This project is UNLICENSED. Please update the license as needed.

---

## Contact

For questions or support, open an issue or contact the maintainer.

---
