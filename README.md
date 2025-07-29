# iCal Booking Demo (NestJS)

A simple backend for booking appointments and sending calendar invites via email using iCal (.ics) attachments. Built with NestJS, it allows anyone to book consultations, sends invites to practitioners, and tracks responses (accept/reject) via custom email links.

---

## Features

- Booking form for appointments
- Sends calendar invites (.ics) via email
- Practitioner can accept/reject via email links
- Patient receives confirmation email
- In-memory booking and response logic

---

## Tech Stack

- [NestJS](https://nestjs.com/) (TypeScript)
- [ical-generator](https://github.com/sebbo2002/ical-generator)
- [nodemailer](https://nodemailer.com/)
- [dotenv](https://www.npmjs.com/package/dotenv)

---

## Getting Started

1. **Clone & Install**

   ```bash
   git clone <your-repo-url>
   cd ical-sync-project
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file in the root directory:

   ```
   EMAIL_HOST=smtp.resend.com
   EMAIL_PORT=587
   EMAIL_USER=your_smtp_user
   EMAIL_PASSWORD=your_smtp_password
   EMAIL_FROM=your_email@example.com
   BASE_URL=http://localhost:3000
   ```

3. **Run the Server**

   ```bash
   npm run start:dev
   ```

   Server runs at: [http://localhost:3000](http://localhost:3000)

---

## How It Works

1. Visit [http://localhost:3000](http://localhost:3000) to access the booking form.
2. Fill in details and submit to book an appointment.
3. Practitioner receives an email with a .ics invite and accept/reject links.
4. Practitioner clicks a link to respond; patient gets a confirmation email.

---

## API Endpoints

- `GET /` — Booking form (HTML)
- `POST /book` — Create a booking and send invite
- `GET /booking/:id/:status` — Practitioner accepts/rejects

---

## Configuration Notes

- Set `EMAIL_PASSWORD` to your Resend API Key (or SMTP password)
- Ensure `EMAIL_FROM` domain is verified in Resend

---

## Testing

```bash
npm run test         # Unit tests
npm run test:e2e     # End-to-end tests
npm run test:cov     # Coverage report
```

---

## Google Calendar API Integration (Optional)

If you want to use Google Calendar API (OAuth, direct event creation), check the commit history for `feat: Integrated Google Calendar API` and follow the instructions in that commit. Add Google API credentials to your `.env` if needed.

---

## License

MIT
