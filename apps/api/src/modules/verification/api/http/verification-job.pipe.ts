import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common'
import { verificationJobSchema, type VerificationJob } from '@engancha/contracts'

@Injectable()
export class VerificationJobPipe implements PipeTransform<unknown, VerificationJob> {
  transform(value: unknown): VerificationJob {
    const parsed = verificationJobSchema.safeParse(value)
    if (!parsed.success) {
      throw new BadRequestException('Invalid verification job')
    }

    return parsed.data
  }
}
