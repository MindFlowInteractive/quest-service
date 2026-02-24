import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum BannerTheme {
  COSMIC = 'cosmic',
  FOREST = 'forest',
  OCEAN = 'ocean',
  SUNSET = 'sunset',
  NEON = 'neon',
  MINIMAL = 'minimal',
  DARK = 'dark',
  LIGHT = 'light',
  GRADIENT = 'gradient',
  CUSTOM = 'custom'
}

export class UpdateBannerDto {
  @IsOptional()
  @IsEnum(BannerTheme)
  theme?: BannerTheme;

  @IsOptional()
  @IsString()
  customBannerUrl?: string;
}