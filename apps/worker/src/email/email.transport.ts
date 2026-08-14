import { Injectable } from '@nestjs/common'
import { Resend } from 'resend'
import type { EmailDeliveryJob } from '@engancha/contracts'
import type { EmailTransport } from './email.job'

@Injectable()
export class ResendEmailTransport {
  private readonly resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : undefined

  async send(job: EmailDeliveryJob): Promise<'sent' | 'mocked'> {
    if (!this.resend) return 'mocked'

    const subject = job.type === 'verification' ? 'Confirme seu e-mail' : 'Redefina sua senha'
    const result = await this.resend.emails.send({
      from: process.env.RESEND_FROM ?? 'Engancha <onboarding@example.com>',
      to: job.to,
      subject,
      text: `Acesse este link para continuar: ${job.actionUrl}`,
    })
    if (result.error) throw new Error(`Resend delivery failed: ${result.error.name}`)
    return 'sent'
  }

  asTransport(): EmailTransport {
    return (job) => this.send(job)
  }
}
