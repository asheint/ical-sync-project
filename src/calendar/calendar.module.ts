import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { GoogleAuthModule } from '../google-auth/google-auth.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [GoogleAuthModule, UserModule],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
