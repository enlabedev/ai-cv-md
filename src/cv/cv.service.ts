import {
  Injectable,
  Logger,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import { CvEmbeddingDto, CvParsedDataDto } from './dto/cv-data.dto';

@Injectable()
export class CvService {
  private readonly logger = new Logger(CvService.name);
  private openRouter: OpenAI;

  constructor(private configService: ConfigService) {
    this.openRouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: this.configService.getOrThrow('OPENAI_API_KEY'),
    });
  }

  @UseInterceptors(FileInterceptor('file'))
  async processCv(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CvEmbeddingDto[]> {
    this.logger.log(`Processing file: ${file.originalname} (${file.mimetype})`);
    const structuredData = await this.parseWithGemini(file);
    return this.generateEmbeddings(structuredData, file.originalname);
  }

  @UseInterceptors(FileInterceptor('file'))
  private async parseWithGemini(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CvParsedDataDto> {
    const isTextFile = [
      'text/html',
      'text/markdown',
      'text/plain',
      'application/json',
    ].includes(file.mimetype);

    let contentMessage: Array<OpenAI.Chat.Completions.ChatCompletionContentPart> =
      [{ type: 'text', text: 'Analiza este CV.' }];

    if (isTextFile) {
      const textContent = file.buffer.toString('utf-8');
      contentMessage = [
        {
          type: 'text',
          text: `Analiza el siguiente contenido de CV (Formato ${file.mimetype}):\n\n${textContent}`,
        },
      ];
    } else {
      const base64Content = file.buffer.toString('base64');
      const mimeType =
        file.mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ? 'application/pdf'
          : file.mimetype;

      contentMessage.push({
        type: 'image_url',
        image_url: {
          url: `data:${mimeType};base64,${base64Content}`,
        },
      });
    }

    try {
      const completion = await this.openRouter.chat.completions.create({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `Eres un experto ATS (Applicant Tracking System). Tu trabajo es convertir CVs en JSON estructurado.
            
            Extrae:
            - profile (Resumen profesional)
            - experience (Array con: role, company, dates, description)
            - skills (Array de strings)
            - projects (Array con: name, stack, details)
            
            IMPORTANTE: Responde ÚNICAMENTE con el objeto JSON válido. Sin markdown.`,
          },
          {
            role: 'user',
            content: contentMessage,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const result = completion.choices[0].message.content;
      if (!result) {
        this.logger.error('Gemini returned empty or non-string content');
        throw new BadRequestException(
          'Fallo al procesar el archivo con la IA: respuesta vacía o inválida.',
        );
      }
      return JSON.parse(result) as CvParsedDataDto;
    } catch (error) {
      this.logger.error('Error en Gemini Parsing:', error);
      throw new BadRequestException(
        'Fallo al procesar el archivo con la IA. Asegúrate de que el formato sea válido.',
      );
    }
  }

  private async generateEmbeddings(
    data: CvParsedDataDto,
    source: string,
  ): Promise<CvEmbeddingDto[]> {
    const textsToVectorize: { text: string; type: string }[] = [];
    if (data.profile) {
      textsToVectorize.push({
        text: `Perfil: ${data.profile}`,
        type: 'profile',
      });
    }
    if (data.skills && Array.isArray(data.skills)) {
      textsToVectorize.push({
        text: `Skills: ${data.skills.join(', ')}`,
        type: 'skills',
      });
    }
    if (data.experience && Array.isArray(data.experience)) {
      data.experience.forEach((exp) => {
        textsToVectorize.push({
          text: `Experiencia: ${exp.role} en ${exp.company} (${exp.dates}). Detalles: ${exp.description}`,
          type: 'experience',
        });
      });
    }

    if (data.projects && Array.isArray(data.projects)) {
      data.projects.forEach((proj) => {
        textsToVectorize.push({
          text: `Proyecto: ${proj.name}. Tech Stack: ${proj.stack}. Detalles: ${proj.details}`,
          type: 'project',
        });
      });
    }

    const promises = textsToVectorize.map(async (item) => {
      const response = await this.openRouter.embeddings.create({
        model: 'text-embedding-3-small',
        input: item.text,
      });

      return {
        id: randomUUID(),
        text: item.text,
        embedding: response.data[0].embedding,
        metadata: {
          source,
          section: item.type,
          original_length: item.text.length,
        },
      };
    });

    return Promise.all(promises);
  }
}
