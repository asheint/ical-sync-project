// src/config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true' || false, // 'false' for port 587 (STARTTLS)
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM,
  },
  baseUrl:
    process.env.BASE_URL || `http://localhost:${process.env.PORT || '3000'}`,
});
