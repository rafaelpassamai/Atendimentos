import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCatalogItemDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
