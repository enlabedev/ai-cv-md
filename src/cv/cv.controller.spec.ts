import { Test, TestingModule } from '@nestjs/testing';
import { CvController } from './cv.controller';
import { CvService } from './cv.service';
import { Response } from 'express';

/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
describe('CvController', () => {
  let controller: CvController;
  let service: CvService;

  const mockEmbeddingsResult = [
    { id: '1', text: 'Test', embedding: [0.1], metadata: {} },
  ];

  const mockCvService = {
    processCv: jest.fn().mockResolvedValue(mockEmbeddingsResult),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CvController],
      providers: [
        {
          provide: CvService,
          useValue: mockCvService,
        },
      ],
    }).compile();

    controller = module.get<CvController>(CvController);
    service = module.get<CvService>(CvService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('ingestCv', () => {
    it('should process file and return JSON stream', async () => {
      // Mock del objeto Response de Express
      const res = {
        set: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      const file = {
        originalname: 'test.pdf',
        buffer: Buffer.from('data'),
        size: 1024,
      } as Express.Multer.File;

      await controller.ingestCv(file, res);

      // 1. Verifica que llamó al servicio
      expect(service.processCv).toHaveBeenCalledWith(file);

      // 2. Verifica los Headers de descarga
      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type': 'application/json',
          'Content-Disposition': expect.stringContaining(
            'attachment; filename=',
          ),
        }),
      );

      // 3. Verifica que envió el JSON convertido a Buffer
      const expectedBuffer = Buffer.from(
        JSON.stringify(mockEmbeddingsResult, null, 2),
        'utf-8',
      );
      expect(res.send).toHaveBeenCalledWith(expectedBuffer);
    });
  });
});
