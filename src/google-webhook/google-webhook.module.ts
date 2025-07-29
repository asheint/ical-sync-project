import { Module } from '@nestjs/common';
import { GoogleWebhookController } from './google-webhook.controller';
import { GoogleWebhookService } from './google-webhook.service';
import { UserModule } from '../user/user.module';
import { GoogleAuthModule } from '../google-auth/google-auth.module';

@Module({
  imports: [UserModule, GoogleAuthModule],
  controllers: [GoogleWebhookController],
  providers: [GoogleWebhookService],
})
export class GoogleWebhookModule {}
