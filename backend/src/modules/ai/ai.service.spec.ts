import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { REQUEST } from '@nestjs/core';
import { BadRequestException } from '@nestjs/common';
import { encrypt } from '../../common/utils/crypto';

describe('AiService BYOK Production Encryption & Decryption Tests', () => {
  let service: AiService;
  let mockDb: any;
  let mockConfigService: any;
  let mockRequest: any;
  const encryptionKey = 'test-secret-byok-encryption-key';

  beforeEach(async () => {
    mockDb = {
      queryOne: jest.fn(),
      query: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'BYOK_ENCRYPTION_KEY') return encryptionKey;
        if (key === 'OPENROUTER_API_KEY') return 'sk-or-system-dev-key';
        return undefined;
      }),
    };

    mockRequest = {
      user: {
        sub: 'user-123',
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: REQUEST, useValue: mockRequest },
      ],
    }).compile();

    service = await module.resolve<AiService>(AiService);
  });

  it('Scenario A: User has encrypted key -> decrypts successfully -> uses user personal key', async () => {
    const plainKey = 'sk-or-user-personal-key';
    const encryptedKey = encrypt(plainKey, encryptionKey);

    mockDb.queryOne.mockResolvedValue({
      preferences: {
        openRouterKey: encryptedKey,
      },
    });

    const client = await (service as any).getClient();
    expect(client.apiKey).toBe(plainKey);
  });

  it('Scenario B: User has no BYOK key -> fails with config error', async () => {
    mockDb.queryOne.mockResolvedValue({
      preferences: {},
    });

    await expect((service as any).getClient()).rejects.toThrow(
      new BadRequestException(
        'No OpenRouter API key configured. Add your own API key in AI Provider Settings.',
      ),
    );
  });

  it('Scenario C: User has invalid/corrupted encrypted key -> fails safely', async () => {
    mockDb.queryOne.mockResolvedValue({
      preferences: {
        openRouterKey: 'badiv:badtext:badtag', // Bad hex parts
      },
    });

    await expect((service as any).getClient()).rejects.toThrow(
      new BadRequestException('Failed to decrypt your AI API key. Please check your provider settings.'),
    );
  });

  it('Scenario D: Production authenticated request -> NEVER uses developer key fallback', async () => {
    mockDb.queryOne.mockResolvedValue({
      preferences: {
        openRouterKey: '', // Empty key
      },
    });

    await expect((service as any).getClient()).rejects.toThrow(
      new BadRequestException(
        'No OpenRouter API key configured. Add your own API key in AI Provider Settings.',
      ),
    );
  });

  it('Scenario E: Non-production context fallback behaves correctly when request is unauthenticated', async () => {
    // Override NODE_ENV to development and mock unauthenticated request (no req.user)
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'NODE_ENV') return 'development';
      if (key === 'OPENROUTER_API_KEY') return 'sk-or-system-dev-key';
      return undefined;
    });
    mockRequest.user = undefined;

    // Simulate clients initialized
    await service.onModuleInit();

    const client = await (service as any).getClient();
    expect(client.apiKey).toBe('sk-or-system-dev-key');
  });

  it('Scenario F: Legacy plain-text keys are automatically migrated and encrypted safely on read', async () => {
    const plainKey = 'sk-or-legacy-plaintext-key';
    mockDb.queryOne.mockResolvedValue({
      preferences: {
        openRouterKey: plainKey,
      },
    });

    const client = await (service as any).getClient();
    expect(client.apiKey).toBe(plainKey);
    // Ensure the DB update queries were executed
    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE users SET preferences'),
      expect.any(Array),
    );
  });
});
