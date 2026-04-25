import { IsString, IsIn, IsNotEmpty } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['owner', 'officer', 'member'])
  role: 'owner' | 'officer' | 'member';
}
