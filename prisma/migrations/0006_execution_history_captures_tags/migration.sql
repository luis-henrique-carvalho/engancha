-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE IF NOT EXISTS 'DIRECT_MESSAGE_WITH_LINK';
ALTER TYPE "MessageType" ADD VALUE IF NOT EXISTS 'EMAIL_CAPTURE_REQUEST';

-- AlterEnum
ALTER TYPE "AutomationExecutionOutputType" ADD VALUE IF NOT EXISTS 'TAG_APPLICATION';

-- CreateEnum
CREATE TYPE "EmailCaptureRequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'SUPERSEDED');

-- AlterTable
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "position" INTEGER;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Tag" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ContactTag" (
    "contactId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "originExecutionId" TEXT,
    "originAutomationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactTag_pkey" PRIMARY KEY ("contactId","tagId")
);

ALTER TABLE "ContactTag" ADD COLUMN IF NOT EXISTS "originExecutionId" TEXT;
ALTER TABLE "ContactTag" ADD COLUMN IF NOT EXISTS "originAutomationId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "EmailCaptureRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "automationId" TEXT,
    "automationRevisionId" TEXT,
    "executionId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "responseMessageId" TEXT,
    "status" "EmailCaptureRequestStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "EmailCaptureRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Tag_organizationId_normalizedName_key" ON "Tag"("organizationId", "normalizedName");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Tag_organizationId_name_idx" ON "Tag"("organizationId", "name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContactTag_tagId_idx" ON "ContactTag"("tagId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContactTag_contactId_idx" ON "ContactTag"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EmailCaptureRequest_executionId_key" ON "EmailCaptureRequest"("executionId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EmailCaptureRequest_messageId_key" ON "EmailCaptureRequest"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EmailCaptureRequest_responseMessageId_key" ON "EmailCaptureRequest"("responseMessageId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmailCaptureRequest_organizationId_status_idx" ON "EmailCaptureRequest"("organizationId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmailCaptureRequest_conversationId_status_idx" ON "EmailCaptureRequest"("conversationId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmailCaptureRequest_contactId_idx" ON "EmailCaptureRequest"("contactId");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tag_organizationId_fkey') THEN
    ALTER TABLE "Tag" ADD CONSTRAINT "Tag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ContactTag_contactId_fkey') THEN
    ALTER TABLE "ContactTag" ADD CONSTRAINT "ContactTag_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ContactTag_tagId_fkey') THEN
    ALTER TABLE "ContactTag" ADD CONSTRAINT "ContactTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EmailCaptureRequest_organizationId_fkey') THEN
    ALTER TABLE "EmailCaptureRequest" ADD CONSTRAINT "EmailCaptureRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EmailCaptureRequest_conversationId_fkey') THEN
    ALTER TABLE "EmailCaptureRequest" ADD CONSTRAINT "EmailCaptureRequest_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EmailCaptureRequest_contactId_fkey') THEN
    ALTER TABLE "EmailCaptureRequest" ADD CONSTRAINT "EmailCaptureRequest_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EmailCaptureRequest_automationId_fkey') THEN
    ALTER TABLE "EmailCaptureRequest" ADD CONSTRAINT "EmailCaptureRequest_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EmailCaptureRequest_automationRevisionId_fkey') THEN
    ALTER TABLE "EmailCaptureRequest" ADD CONSTRAINT "EmailCaptureRequest_automationRevisionId_fkey" FOREIGN KEY ("automationRevisionId") REFERENCES "AutomationRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EmailCaptureRequest_executionId_fkey') THEN
    ALTER TABLE "EmailCaptureRequest" ADD CONSTRAINT "EmailCaptureRequest_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AutomationExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EmailCaptureRequest_messageId_fkey') THEN
    ALTER TABLE "EmailCaptureRequest" ADD CONSTRAINT "EmailCaptureRequest_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EmailCaptureRequest_responseMessageId_fkey') THEN
    ALTER TABLE "EmailCaptureRequest" ADD CONSTRAINT "EmailCaptureRequest_responseMessageId_fkey" FOREIGN KEY ("responseMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
