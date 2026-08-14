import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import type {
  ActiveWorkspaceResponse,
  WorkspaceListResponse,
  WorkspaceMembersListRequest,
  WorkspaceMembersListResponse,
} from '@engancha/contracts'
import { PrismaService } from '../database/prisma.service'
import type { RequestWithAuthorization } from '../authorization/authorization-context'
import { OrganizationGateway } from './organization.gateway'

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
  constructor(
    private readonly database: PrismaService,
    private readonly organizations: OrganizationGateway = new OrganizationGateway(),
  ) {}

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
        await this.organizations.createOrganization({ userId: user.id, name, slug })
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

  async create(name: string, request: RequestWithAuthorization): Promise<ActiveWorkspaceResponse> {
    const { user, session } = this.requireAuthenticated(request)
    const normalizedName = name.trim()
    const slug = `${slugify(normalizedName).slice(0, 40)}-${user.id.slice(0, 8)}`.slice(0, 48)
    await this.organizations.createOrganization({ name: normalizedName, slug, userId: user.id })
    const membership = await this.database.client.member.findFirst({
      where: { userId: user.id, organization: { slug } },
      include: { organization: true },
    })
    if (!membership) throw new ConflictException('Workspace creation failed')
    await this.database.client.session.updateMany({
      where: { id: session.id, userId: user.id },
      data: { activeOrganizationId: membership.organizationId },
    })
    session.activeOrganizationId = membership.organizationId
    return this.toResponse(membership.organization, membership.role)
  }

  async members(
    input: WorkspaceMembersListRequest,
    request: RequestWithAuthorization,
  ): Promise<WorkspaceMembersListResponse> {
    const context = this.requireManager(request)
    const [members, invitations] = await Promise.all([
      this.database.client.member.findMany({
        where: { organizationId: context.organizationId },
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.database.client.invitation.findMany({
        where: { organizationId: context.organizationId, status: 'pending' },
        orderBy: { createdAt: 'asc' },
      }),
    ])
    const people = [
      ...members.map((member) => ({
        id: member.id,
        name: member.user.name || member.user.email,
        email: member.user.email,
        emailVerified: member.user.emailVerified,
        role: this.toMemberRole(member.role),
        status: 'active' as const,
      })),
      ...invitations.map((invitation) => ({
        id: invitation.id,
        name: 'Convite pendente',
        email: invitation.email,
        emailVerified: false,
        role: this.toMemberRole(invitation.role),
        status: 'invited' as const,
      })),
    ]
    const query = input.query?.toLocaleLowerCase()
    const filtered = people.filter((person) => {
      if (input.role?.length && !input.role.includes(person.role)) return false
      if (input.status?.length && !input.status.includes(person.status)) return false
      return (
        !query ||
        person.name.toLocaleLowerCase().includes(query) ||
        person.email.toLocaleLowerCase().includes(query)
      )
    })
    const total = filtered.length
    const totalPages = total === 0 ? 0 : Math.ceil(total / input.limit)
    const page = totalPages === 0 ? 1 : Math.min(input.page, totalPages)
    const start = (page - 1) * input.limit
    return {
      items: filtered.slice(start, start + input.limit),
      meta: { page, limit: input.limit, total, totalPages },
    }
  }

  async invite(email: string, request: RequestWithAuthorization): Promise<{ id: string }> {
    const context = this.requireManager(request)
    const invitation = await this.organizations.createInvitation({
      email: email.trim().toLowerCase(),
      organizationId: context.organizationId,
      headers: request.headers,
    })
    return { id: invitation.id }
  }

  private requireAuthenticated(request: RequestWithAuthorization): AuthenticatedRequest['session'] {
    const session = request.session
    if (!session) throw new UnauthorizedException('Authentication required')
    if (!session.user.emailVerified) throw new ForbiddenException('Email verification required')
    return session
  }

  private requireManager(request: RequestWithAuthorization) {
    const context = request.authorizationContext
    if (!context) throw new ConflictException('Workspace context unavailable')
    if (context.role !== 'owner' && context.role !== 'admin') {
      throw new ForbiddenException('Workspace management requires owner or admin role')
    }
    return context
  }

  private toMemberRole(role: string | null): 'owner' | 'admin' | 'member' {
    return role === 'owner' || role === 'admin' ? role : 'member'
  }

  private toResponse(organization: { id: string; name: string; slug: string }, role: string) {
    return { id: organization.id, name: organization.name, slug: organization.slug, role }
  }
}
