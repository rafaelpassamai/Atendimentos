import { ArrayMaxSize, IsArray, IsOptional, IsUUID } from 'class-validator';

export class UpdateUserPreferencesDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  preferred_category_ids?: string[];
}
