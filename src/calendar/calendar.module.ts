import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { EmailService } from './email.service';

@Module({
  controllers: [CalendarController],
  providers: [CalendarService, EmailService],
})
export class CalendarModule {}
