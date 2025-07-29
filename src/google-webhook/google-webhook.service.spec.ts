import { Test, TestingModule } from '@nestjs/testing';
import { GoogleWebhookService } from './google-webhook.service';

describe('GoogleWebhookService', () => {
  let service: GoogleWebhookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleWebhookService],
    }).compile();

    service = module.get<GoogleWebhookService>(GoogleWebhookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
