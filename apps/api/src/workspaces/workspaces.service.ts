import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import type { ActiveWorkspaceResponse, WorkspaceListResponse } from '@engancha/contracts'
import { PrismaService } from '../database/prisma.service'
import type { RequestWithAuthorization } from '../authorization/authorization-context'
import { auth } from '../auth/auth'

type AuthenticatedRequest = RequestWithAuthorization & {
  session: NonNullable<RequestWithAuthorization['session']>
}

function slugify(value: string): string {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalized || 'workspace'
}

@Injectable()
export class WorkspacesService {
  constructor(private readonly database: PrismaService) {}

  async bootstrap(request: AuthenticatedRequest): Promise<ActiveWorkspaceResponse> {
    const { user } = request.session
    if (!user.emailVerified) throw new ConflictException('Email verification required')

    const existing = await this.database.client.member.findFirst({
      where: { userId: user.id },
      include: { organization: true },
      orderBy: { createdAt: 'asc' },
    })

    let membership = existing
    if (!membership) {
      const name = `${user.name || 'Meu'} Workspace`.slice(0, 80)
      const slug = `${slugify(user.name || 'workspace')}-${user.id.slice(0, 8)}`.slice(0, 48)
      try {
        await auth.api.createOrganization({
          body: {
            userId: user.id,
            name,
            slug,
            keepCurrentActiveOrganization: false,
          },
        })
        membership = await this.database.client.member.findFirst({
          where: { userId: user.id, organization: { slug } },
          include: { organization: true },
        })
      } catch {
        membership = await this.database.client.member.findFirst({
          where: { userId: user.id },
          include: { organization: true },
          orderBy: { createdAt: 'asc' },
        })
      }
    }

    if (!membership) throw new ConflictException('Workspace bootstrap failed')

    await this.database.client.session.updateMany({
      where: { id: request.session.session.id, userId: user.id },
      data: { activeOrganizationId: membership.organizationId },
    })
    request.session.session.activeOrganizationId = membership.organizationId
    return this.toResponse(membership.organization, membership.role)
  }

  async active(request: RequestWithAuthorization): Promise<ActiveWorkspaceResponse> {
    const context = request.authorizationContext
    if (!context) throw new ConflictException('Workspace context unavailable')
    const organization = await this.database.client.organization.findUnique({
      where: { id: context.organizationId },
    })
    if (!organization) throw new ConflictException('Workspace context unavailable')
    return this.toResponse(organization, context.role)
  }

  async list(request: RequestWithAuthorization): Promise<WorkspaceListResponse> {
    const { user } = this.requireAuthenticated(request)
    const memberships = await this.database.client.member.findMany({
      where: { userId: user.id },
      include: { organization: true },
      orderBy: { organization: { name: 'asc' } },
    })
    const workspaces = memberships.map((membership) =>
      this.toResponse(membership.organization, membership.role),
    )
    workspaces.sort((left, right) => left.name.localeCompare(right.name))
    return workspaces
  }

  async setActive(
    organizationId: string,
    request: RequestWithAuthorization,
  ): Promise<ActiveWorkspaceResponse> {
    const { user, session } = this.requireAuthenticated(request)
    const membership = await this.database.client.member.findUnique({
      where: { organizationId_userId: { organizationId, userId: user.id } },
      include: { organization: true },
    })
    if (!membership) throw new NotFoundException()

    const updated = await this.database.client.session.updateMany({
      where: { id: session.id, userId: user.id },
      data: { activeOrganizationId: membership.organizationId },
    })
    if (updated.count !== 1) throw new UnauthorizedException('Authentication required')
    session.activeOrganizationId = membership.organizationId
    return this.toResponse(membership.organization, membership.role)
  }

  async byId(id: string, request: RequestWithAuthorization): Promise<ActiveWorkspaceResponse> {
    const context = request.authorizationContext
    if (!context || context.organizationId !== id) {
      throw new NotFoundException()
    }
    return this.active(request)
  }

  private requireAuthenticated(request: RequestWithAuthorization): AuthenticatedRequest['session'] {
    const session = request.session
    if (!session) throw new UnauthorizedException('Authentication required')
    if (!session.user.emailVerified) throw new ForbiddenException('Email verification required')
    return session
  }

  private toResponse(organization: { id: string; name: string; slug: string }, role: string) {
    return { id: organization.id, name: organization.name, slug: organization.slug, role }
  }
}
