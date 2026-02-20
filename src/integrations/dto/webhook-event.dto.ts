import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WebhookEventDto {
    @ApiProperty({ description: 'Source of the webhook event' })
    @IsString()
    @IsNotEmpty()
    source: string;

    @ApiProperty({ description: 'Type of the event' })
    @IsString()
    @IsNotEmpty()
    eventType: string;

    @ApiProperty({ description: 'Event payload' })
    @IsObject()
    @IsNotEmpty()
    payload: Record<string, any>;
}
