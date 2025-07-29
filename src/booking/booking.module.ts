import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule], // BookingService needs ConfigService for baseUrl
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
