// src/config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // !! IMPORTANT !! Replace this with your CURRENT ngrok HTTPS URL + /google-auth/callback
    // Example: https://YOUR_NGROK_ID.ngrok-free.app/google-auth/callback
    // Make sure to restart your NestJS app and ngrok if this changes.
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ||
      'https://e629fa736ef0.ngrok-free.app/google-auth/callback',
    // !! IMPORTANT !! Replace this with your CURRENT ngrok HTTPS URL + /google-webhook/calendar
    // Example: https://YOUR_NGROK_ID.ngrok-free.app/google-webhook/calendar
    webhookUrl:
      process.env.GOOGLE_WEBHOOK_URL ||
      'https://e629fa736ef0.ngrok-free.app/google-webhook/calendar',
  },
});
