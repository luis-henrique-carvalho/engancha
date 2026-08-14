import { IsString, MaxLength, MinLength } from 'class-validator'

export class SwitchActiveWorkspaceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  organizationId!: string
}
