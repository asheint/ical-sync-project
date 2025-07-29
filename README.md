# iCal Booking Demo (NestJS)

A backend demo for booking appointments and sending calendar invites via email using iCal (.ics) attachments. Built with NestJS, it allows patients to book consultations, sends invites to practitioners, and tracks responses (accept/reject) via custom email links.

---

## Features

- Booking form for patients to request appointments
- Sends calendar invites (.ics) to practitioners via email
- Practitioner can accept/reject via custom links in the email
- Patient receives confirmation email based on practitioner's response
- All booking and response logic is handled in-memory for demo purposes

---

## Tech Stack

- [NestJS](https://nestjs.com/) (TypeScript)
- [ical-generator](https://github.com/sebbo2002/ical-generator) (iCal file creation)
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

Create a `.env` file in the root directory with your SMTP credentials and (optionally) Google API credentials:

```
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=587
EMAIL_USER=your_smtp_user
EMAIL_PASSWORD=your_smtp_password
EMAIL_FROM=your_email@example.com
BASE_URL=http://localhost:3000

# Google API Credentials (for Google Calendar integration, see below)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/google-auth/callback
```

### 3. Run the Server

```bash
npm run start:dev
```

Server runs at: [http://localhost:3000](http://localhost:3000)

---

## How It Works

1. **Booking Form**: Visit [http://localhost:3000](http://localhost:3000) to access the booking form. Fill in patient and practitioner details, date, and time.
2. **Email Invite**: Practitioner receives an email with a .ics calendar invite and two links: Accept Booking / Reject Booking.
3. **Response Simulation**: Clicking a link updates the booking status and sends a confirmation email to the patient.
4. **Terminal Logs**: All actions are logged in the server terminal for demo visibility.

---

## API Endpoints

- `GET /` — Booking form (HTML)
- `POST /book` — Create a booking and send invite
- `GET /booking/:id/:status` — Practitioner simulates Accept/Reject (status = `accept` or `reject`)

---

## Configuration Notes

- Set `EMAIL_PASSWORD` to your Resend API Key (or SMTP password)
- Ensure `EMAIL_FROM` domain is verified in Resend
- All configuration is loaded from `.env` via `src/config/configuration.ts`

---

## Testing

```bash
npm run test         # Unit tests
npm run test:e2e     # End-to-end tests
npm run test:cov     # Coverage report
```

---

## Google Calendar API Integration

This demo currently uses iCal email invites only. If you want to use Google Calendar API integration (OAuth authentication, direct event creation in Google Calendar, etc.), you can revert to the branch/commit:

**Branch:** `feat/Integrated-Google-Calendar-API`

That branch includes functions for Google OAuth authentication and Google Calendar API event management. To switch back:

```bash
git checkout feat/Integrated-Google-Calendar-API
```

You will need to set up Google API credentials in your `.env` as shown above.

---

## License

This project is UNLICENSED. Please update the license as needed.

---

## Contact

For questions or support, open an issue or contact the maintainer.

---
