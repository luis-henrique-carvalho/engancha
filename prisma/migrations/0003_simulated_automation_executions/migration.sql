CREATE TYPE "AutomationExecutionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'IGNORED', 'FAILED');
CREATE TYPE "AutomationExecutionOutputType" AS ENUM ('PUBLIC_REPLY', 'PRIVATE_REPLY', 'LINK_DELIVERY', 'EMAIL_CAPTURE_REQUEST');

CREATE TABLE "AutomationExecution" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "provider" "ContentProvider" NOT NULL,
  "mode" "ContentMode" NOT NULL DEFAULT 'SIMULATED',
  "channelConnectionId" TEXT,
  "commentId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "inputAuthor" TEXT NOT NULL,
  "inputText" TEXT NOT NULL,
  "originAutomationId" TEXT,
  "automationId" TEXT,
  "automationRevisionId" TEXT,
  "automationSnapshot" JSONB,
  "status" "AutomationExecutionStatus" NOT NULL DEFAULT 'PENDING',
  "matched" BOOLEAN,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "stateVersion" INTEGER NOT NULL DEFAULT 1,
  "enqueueAttemptedAt" TIMESTAMP(3),
  "enqueuedAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AutomationExecution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AutomationExecutionOutput" (
  "id" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "type" "AutomationExecutionOutputType" NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AutomationExecutionOutput_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AutomationExecution_organizationId_provider_mode_idempotencyKey_key"
  ON "AutomationExecution"("organizationId", "provider", "mode", "idempotencyKey");
CREATE INDEX "AutomationExecution_organizationId_status_createdAt_idx"
  ON "AutomationExecution"("organizationId", "status", "createdAt");
CREATE INDEX "AutomationExecution_contentId_createdAt_idx"
  ON "AutomationExecution"("contentId", "createdAt");
CREATE UNIQUE INDEX "AutomationExecutionOutput_executionId_key_key"
  ON "AutomationExecutionOutput"("executionId", "key");
CREATE INDEX "AutomationExecutionOutput_executionId_position_idx"
  ON "AutomationExecutionOutput"("executionId", "position");

ALTER TABLE "AutomationExecution" ADD CONSTRAINT "AutomationExecution_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutomationExecution" ADD CONSTRAINT "AutomationExecution_contentId_fkey"
  FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AutomationExecution" ADD CONSTRAINT "AutomationExecution_originAutomationId_fkey"
  FOREIGN KEY ("originAutomationId") REFERENCES "Automation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AutomationExecution" ADD CONSTRAINT "AutomationExecution_automationId_fkey"
  FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AutomationExecution" ADD CONSTRAINT "AutomationExecution_automationRevisionId_fkey"
  FOREIGN KEY ("automationRevisionId") REFERENCES "AutomationRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AutomationExecutionOutput" ADD CONSTRAINT "AutomationExecutionOutput_executionId_fkey"
  FOREIGN KEY ("executionId") REFERENCES "AutomationExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
