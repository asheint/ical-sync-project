// src/config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // !! IMPORTANT !! Replace this with your CURRENT ngrok HTTPS URL + /google-auth/callback
    // Example: https://YOUR_NGROK_ID.ngrok-free.app/google-auth/callback
    // Make sure to restart your NestJS app and ngrok if this changes.
    // Use BASE_URL from your .env for local testing
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ||
      `${process.env.BASE_URL}/google-auth/callback`,
    // !! IMPORTANT !! Replace this with your CURRENT ngrok HTTPS URL + /google-webhook/calendar
    // Example: https://YOUR_NGROK_ID.ngrok-free.app/google-webhook/calendar
    webhookUrl:
      process.env.GOOGLE_WEBHOOK_URL ||
      ' https://e629fa736ef0.ngrok-free.app/google-webhook/calendar',
  },
  // NEW: Email Configuration using Resend details
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    // Resend with port 587 typically uses STARTTLS, so 'secure' is false
    secure: process.env.EMAIL_SECURE === 'true', // Should be 'false' for port 587 with STARTTLS
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM,
  },
});
