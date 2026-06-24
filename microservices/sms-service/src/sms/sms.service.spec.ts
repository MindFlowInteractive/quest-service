import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { SmsProviderFactory } from '../providers/sms-provider.factory';
import { TemplatesService } from '../templates/templates.service';
import { Message, MessageStatus } from './entities/message.entity';
import { Receipt } from './entities/receipt.entity';
import { Sms } from './entities/sms.entity';
import { SmsService } from './sms.service';

const createRepository = () => ({
  create: jest.fn((value) => value),
  save: jest.fn(async (value) => ({ id: value.id || 'message-id', ...value })),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  find: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('SmsService', () => {
  let service: SmsService;
  let messageRepository: ReturnType<typeof createRepository>;

  beforeEach(async () => {
    const smsRepository = createRepository();
    messageRepository = createRepository();
    const receiptRepository = createRepository();

    smsRepository.findOne.mockResolvedValue({
      id: 'sender-id',
      provider: 'console',
      fromNumber: 'Quest',
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        SmsService,
        { provide: getRepositoryToken(Sms), useValue: smsRepository },
        { provide: getRepositoryToken(Message), useValue: messageRepository },
        { provide: getRepositoryToken(Receipt), useValue: receiptRepository },
        {
          provide: SmsProviderFactory,
          useValue: {
            getProvider: () => ({
              name: 'console',
              send: jest.fn(async () => ({
                provider: 'console',
                messageId: 'provider-id',
                status: 'sent',
              })),
            }),
          },
        },
        {
          provide: TemplatesService,
          useValue: {
            render: (_name: string, variables: Record<string, any>) =>
              `Your code is ${variables.code || '123456'}`,
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              ({
                'sms.defaultFrom': 'Quest',
                'sms.twilio.fromNumber': undefined,
                'sms.rateLimit.windowSeconds': 60,
                'sms.rateLimit.max': 5,
                'sms.otp.ttlSeconds': 300,
                'sms.otp.length': 6,
              })[key],
          },
        },
      ],
    }).compile();

    service = moduleRef.get(SmsService);
  });

  it('sends SMS through the active provider', async () => {
    const message = await service.send({
      toPhoneNumber: '+15555550100',
      body: 'Hello',
    });

    expect(message.status).toBe(MessageStatus.SENT);
    expect(message.providerMessageId).toBe('provider-id');
  });

  it('generates hashed OTP without returning the code', async () => {
    const result = await service.generateOtp({
      toPhoneNumber: '+15555550100',
    });

    expect(result.messageId).toBe('message-id');
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(messageRepository.save).toHaveBeenCalled();
  });
});
