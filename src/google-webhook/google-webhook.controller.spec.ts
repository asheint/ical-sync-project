import { Test, TestingModule } from '@nestjs/testing';
import { GoogleWebhookController } from './google-webhook.controller';

describe('GoogleWebhookController', () => {
  let controller: GoogleWebhookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoogleWebhookController],
    }).compile();

    controller = module.get<GoogleWebhookController>(GoogleWebhookController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
