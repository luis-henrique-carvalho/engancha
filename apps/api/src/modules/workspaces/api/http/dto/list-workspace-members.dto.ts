import { Transform, Type } from 'class-transformer'
import { IsArray, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

function toQueryArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
  return typeof value === 'string' ? [value] : undefined
}

export class ListWorkspaceMembersDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit = 20

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() || undefined : value))
  @IsString()
  @MaxLength(120)
  @IsOptional()
  query?: string

  @Transform(({ value }) => toQueryArray(value))
  @IsArray()
  @IsIn(['owner', 'admin', 'member'], { each: true })
  @IsOptional()
  role?: Array<'owner' | 'admin' | 'member'>

  @Transform(({ value }) => toQueryArray(value))
  @IsArray()
  @IsIn(['active', 'invited'], { each: true })
  @IsOptional()
  status?: Array<'active' | 'invited'>
}
