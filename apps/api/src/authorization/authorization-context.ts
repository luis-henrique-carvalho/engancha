import {
  CanActivate,
  ConflictException,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'

export type AuthorizationContext = {
  userId: string
  organizationId: string
  membershipId: string
  role: string
}

export type RequestWithAuthorization = {
  headers?: Record<string, string | string[] | undefined>
  session?: {
    user: { id: string; name?: string; email?: string; emailVerified?: boolean }
    session: { id: string; activeOrganizationId?: string | null }
  } | null
  authorizationContext?: AuthorizationContext
}

@Injectable()
export class AuthorizationContextGuard implements CanActivate {
  constructor(private readonly database: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuthorization>()
    const session = request.session
    if (!session) throw new UnauthorizedException('Authentication required')
    if (!session.user.emailVerified) throw new ForbiddenException('Email verification required')

    const organizationId = session.session.activeOrganizationId
    if (!organizationId) throw new ConflictException('Workspace context unavailable')

    const membership = await this.database.client.member.findUnique({
      where: { organizationId_userId: { organizationId, userId: session.user.id } },
    })
    if (!membership) throw new ConflictException('Workspace context unavailable')

    request.authorizationContext = {
      userId: session.user.id,
      organizationId,
      membershipId: membership.id,
      role: membership.role,
    }
    return true
  }
}
