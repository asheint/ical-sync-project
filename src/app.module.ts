// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { GoogleAuthModule } from './google-auth/google-auth.module';
import { CalendarModule } from './calendar/calendar.module';
import { GoogleWebhookModule } from './google-webhook/google-webhook.module';
import { UserModule } from './user/user.module';
import { EmailModule } from './email/email.module'; // NEW: Import EmailModule

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    UserModule,
    GoogleAuthModule,
    CalendarModule,
    GoogleWebhookModule,
    EmailModule, // NEW: Add EmailModule here
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
