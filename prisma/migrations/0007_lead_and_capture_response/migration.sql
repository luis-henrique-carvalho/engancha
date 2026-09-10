-- CreateTable
CREATE TABLE IF NOT EXISTS "Lead" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "automationId" TEXT,
    "executionId" TEXT,
    "provider" "ContentProvider" NOT NULL DEFAULT 'INSTAGRAM',
    "mode" "ContentMode" NOT NULL DEFAULT 'SIMULATED',
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Lead_contactId_key" ON "Lead"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Lead_organizationId_contactId_key" ON "Lead"("organizationId", "contactId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Lead_organizationId_capturedAt_idx" ON "Lead"("organizationId", "capturedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Lead_organizationId_provider_mode_idx" ON "Lead"("organizationId", "provider", "mode");

-- Create partial unique index to enforce at most one PENDING or PROCESSING capture per conversation
CREATE UNIQUE INDEX IF NOT EXISTS "EmailCaptureRequest_conversationId_active_unique_idx"
ON "EmailCaptureRequest" ("conversationId")
WHERE status IN ('PENDING', 'PROCESSING');

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Lead_organizationId_fkey') THEN
    ALTER TABLE "Lead" ADD CONSTRAINT "Lead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Lead_contactId_fkey') THEN
    ALTER TABLE "Lead" ADD CONSTRAINT "Lead_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Lead_automationId_fkey') THEN
    ALTER TABLE "Lead" ADD CONSTRAINT "Lead_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Lead_executionId_fkey') THEN
    ALTER TABLE "Lead" ADD CONSTRAINT "Lead_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AutomationExecution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
