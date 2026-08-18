import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common'
import type { ZodType } from 'zod'

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}
  transform(value: unknown): unknown {
    const parsed = this.schema.safeParse(value)
    if (!parsed.success)
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        issues: parsed.error.issues.map(({ path, message }) => ({ path: path.join('.'), message })),
      })
    return parsed.data
  }
}
