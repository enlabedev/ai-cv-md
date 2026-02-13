import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CvService } from './cv.service';
import OpenAI from 'openai';
import { BadRequestException } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { CvParsedDataDto } from './dto/cv-data.dto';

// 1. Mockeamos la librería OpenAI completa antes de importar nada más
jest.mock('openai');

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
describe('CvService', () => {
  let service: CvService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let configService: ConfigService;

  let openAiMockInstance: {
    chat: { completions: { create: jest.Mock } };
    embeddings: { create: jest.Mock };
  };

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  const mockEmbeddings = [0.1, 0.2, 0.3];
  const mockParsedCv: CvParsedDataDto = {
    profile: 'Ingeniero Senior',
    experience: [
      {
        role: 'Dev',
        company: 'Tech',
        dates: '2020',
        description: 'Logros...',
      },
    ],
    skills: ['NestJS', 'React'],
    projects: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    openAiMockInstance = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify(mockParsedCv),
                },
              },
            ],
          }),
        },
      },
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: mockEmbeddings }],
        }),
      },
    };

    // Cuando se haga 'new OpenAI()', devolvemos nuestra instancia falsa
    (OpenAI as unknown as jest.Mock).mockImplementation(
      () => openAiMockInstance,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CvService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => `mock_${key}`),
            get: jest.fn((key: string) => `mock_${key}`),
          },
        },
      ],
    }).compile();

    service = module.get<CvService>(CvService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processCv', () => {
    it('should handle TEXT files (Markdown/HTML) correctly', async () => {
      const mockFile = {
        originalname: 'cv.md',
        mimetype: 'text/markdown',
        buffer: Buffer.from('# Curriculum Vitae'),
      } as Express.Multer.File;

      // Ejecutar
      const result = await service.processCv(mockFile);

      // 1. Debe llamar a OpenRouter (Chat) con el texto directo
      expect(openAiMockInstance.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.arrayContaining([
                expect.objectContaining({
                  type: 'text',
                  text: expect.stringContaining('# Curriculum Vitae'),
                }),
              ]),
            }),
          ]),
        }),
      );

      // Perfil + Skills + 1 Experiencia = 3 llamadas
      expect(openAiMockInstance.embeddings.create).toHaveBeenCalledTimes(3);

      // 3. El resultado debe tener la estructura correcta
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('embedding', mockEmbeddings);
    });

    it('should handle BINARY files (PDF/Images) using Vision/Multimodal', async () => {
      const mockFile = {
        originalname: 'cv.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('fake-pdf-content'),
      } as Express.Multer.File;

      // Ejecutar
      await service.processCv(mockFile);

      expect(openAiMockInstance.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.arrayContaining([
                expect.objectContaining({
                  type: 'image_url', // ¡Clave! Esto valida que usamos visión
                }),
              ]),
            }),
          ]),
        }),
      );
    });

    it('should throw BadRequestException if parsing fails', async () => {
      openAiMockInstance.chat.completions.create.mockRejectedValue(
        new Error('API Error'),
      );

      const mockFile = {
        originalname: 'cv.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('...'),
      } as Express.Multer.File;

      await expect(service.processCv(mockFile)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
