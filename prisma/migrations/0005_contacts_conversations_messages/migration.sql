CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE "MessageType" AS ENUM ('COMMENT', 'INCOMING_MESSAGE', 'PUBLIC_REPLY', 'PRIVATE_REPLY', 'DIRECT_MESSAGE');
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'RECEIVED');

CREATE TABLE "Contact" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "channelConnectionId" TEXT,
  "provider" "ContentProvider" NOT NULL DEFAULT 'INSTAGRAM',
  "mode" "ContentMode" NOT NULL DEFAULT 'SIMULATED',
  "externalUserId" TEXT,
  "username" TEXT,
  "name" TEXT,
  "email" TEXT,
  "emailNormalized" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "lastInteractionAt" TIMESTAMP(3),
  CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Conversation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "contactId" TEXT NOT NULL,
  "channelConnectionId" TEXT,
  "provider" "ContentProvider" NOT NULL DEFAULT 'INSTAGRAM',
  "mode" "ContentMode" NOT NULL DEFAULT 'SIMULATED',
  "externalId" TEXT,
  "status" "ConversationStatus" NOT NULL DEFAULT 'OPEN',
  "lastMessageAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Message" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "executionId" TEXT,
  "channelConnectionId" TEXT,
  "direction" "MessageDirection" NOT NULL,
  "type" "MessageType" NOT NULL,
  "provider" "ContentProvider" NOT NULL DEFAULT 'INSTAGRAM',
  "mode" "ContentMode" NOT NULL DEFAULT 'SIMULATED',
  "externalId" TEXT,
  "text" TEXT,
  "payload" JSONB,
  "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AutomationExecution" ADD COLUMN "contactId" TEXT;
ALTER TABLE "AutomationExecution" ADD COLUMN "conversationId" TEXT;

CREATE INDEX "Contact_organizationId_updatedAt_idx" ON "Contact"("organizationId", "updatedAt");
CREATE INDEX "Contact_organizationId_lastInteractionAt_idx" ON "Contact"("organizationId", "lastInteractionAt");
CREATE INDEX "Contact_organizationId_provider_mode_externalUserId_idx" ON "Contact"("organizationId", "provider", "mode", "externalUserId");
CREATE INDEX "Contact_organizationId_emailNormalized_idx" ON "Contact"("organizationId", "emailNormalized");
CREATE UNIQUE INDEX "Contact_organizationId_provider_mode_externalUserId_null_conn_key"
  ON "Contact"("organizationId", "provider", "mode", "externalUserId")
  WHERE "channelConnectionId" IS NULL AND "externalUserId" IS NOT NULL;
CREATE UNIQUE INDEX "Contact_organizationId_provider_mode_conn_externalUserId_key"
  ON "Contact"("organizationId", "provider", "mode", "channelConnectionId", "externalUserId")
  WHERE "channelConnectionId" IS NOT NULL AND "externalUserId" IS NOT NULL;
CREATE UNIQUE INDEX "Contact_organizationId_emailNormalized_key"
  ON "Contact"("organizationId", "emailNormalized")
  WHERE "emailNormalized" IS NOT NULL;

CREATE INDEX "Conversation_organizationId_lastMessageAt_idx" ON "Conversation"("organizationId", "lastMessageAt");
CREATE INDEX "Conversation_organizationId_contactId_provider_mode_idx" ON "Conversation"("organizationId", "contactId", "provider", "mode");
CREATE INDEX "Conversation_contactId_idx" ON "Conversation"("contactId");
CREATE UNIQUE INDEX "Conversation_organizationId_contactId_provider_mode_null_conn_key"
  ON "Conversation"("organizationId", "contactId", "provider", "mode")
  WHERE "channelConnectionId" IS NULL;
CREATE UNIQUE INDEX "Conversation_organizationId_contactId_provider_mode_conn_key"
  ON "Conversation"("organizationId", "contactId", "provider", "mode", "channelConnectionId")
  WHERE "channelConnectionId" IS NOT NULL;

CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");
CREATE INDEX "Message_organizationId_createdAt_idx" ON "Message"("organizationId", "createdAt");
CREATE INDEX "Message_executionId_idx" ON "Message"("executionId");
CREATE UNIQUE INDEX "Message_executionId_type_direction_key"
  ON "Message"("executionId", "type", "direction")
  WHERE "executionId" IS NOT NULL;
CREATE UNIQUE INDEX "Message_conversationId_externalId_key"
  ON "Message"("conversationId", "externalId")
  WHERE "externalId" IS NOT NULL;

CREATE INDEX "AutomationExecution_contactId_idx" ON "AutomationExecution"("contactId");
CREATE INDEX "AutomationExecution_conversationId_idx" ON "AutomationExecution"("conversationId");

ALTER TABLE "Contact" ADD CONSTRAINT "Contact_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Message" ADD CONSTRAINT "Message_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_executionId_fkey"
  FOREIGN KEY ("executionId") REFERENCES "AutomationExecution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AutomationExecution" ADD CONSTRAINT "AutomationExecution_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AutomationExecution" ADD CONSTRAINT "AutomationExecution_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
