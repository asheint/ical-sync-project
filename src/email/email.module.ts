// src/email/email.module.ts
import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule], // EmailService needs ConfigService
  providers: [EmailService],
  exports: [EmailService], // Make EmailService available to other modules
})
export class EmailModule {}
