import { IsUUID, IsEnum } from 'class-validator';
import { SharePermission } from '../list-share.entity';

export class ShareListDto {
  @IsUUID()
  sharedWithUserId: string;

  @IsEnum(SharePermission)
  permission: SharePermission;
}