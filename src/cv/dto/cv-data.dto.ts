import { IsString, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CvExperienceDto {
  @IsString()
  role!: string;

  @IsString()
  company!: string;

  @IsString()
  dates!: string;

  @IsString()
  description!: string;
}

export class CvProjectDto {
  @IsString()
  name!: string;

  @IsString()
  stack!: string;

  @IsString()
  details!: string;
}

export class CvParsedDataDto {
  @IsString()
  profile!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CvExperienceDto)
  experience!: CvExperienceDto[];

  @IsArray()
  @IsString({ each: true })
  skills!: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CvProjectDto)
  projects!: CvProjectDto[];
}

export class CvEmbeddingDto {
  @IsString()
  id!: string;

  @IsString()
  text!: string;

  @IsArray()
  @IsNumber({}, { each: true })
  embedding!: number[];

  @ValidateNested()
  @Type(() => Object)
  metadata!: {
    source: string;
    section: string;
    original_length: number;
  };
}
