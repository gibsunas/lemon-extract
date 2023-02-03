-- CreateTable
CREATE TABLE "LemonExtractProject" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "LemonExtractProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitCommit" (
    "sha" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "message" TEXT NOT NULL,

    CONSTRAINT "GitCommit_pkey" PRIMARY KEY ("sha")
);

-- CreateTable
CREATE TABLE "LemonExtractProjectState" (
    "id" TEXT NOT NULL,
    "projectConfigHash" TEXT NOT NULL,
    "gitCommitId" TEXT,

    CONSTRAINT "LemonExtractProjectState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LemonExtractProjectScan" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    "projectStateId" TEXT NOT NULL,

    CONSTRAINT "LemonExtractProjectScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LemonExtractScanRecords" (
    "id" TEXT NOT NULL,
    "projectScanId" TEXT NOT NULL,

    CONSTRAINT "LemonExtractScanRecords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LemonExtractProjectState" ADD CONSTRAINT "LemonExtractProjectState_gitCommitId_fkey" FOREIGN KEY ("gitCommitId") REFERENCES "GitCommit"("sha") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LemonExtractProjectScan" ADD CONSTRAINT "LemonExtractProjectScan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LemonExtractProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LemonExtractProjectScan" ADD CONSTRAINT "LemonExtractProjectScan_projectStateId_fkey" FOREIGN KEY ("projectStateId") REFERENCES "LemonExtractProjectState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LemonExtractScanRecords" ADD CONSTRAINT "LemonExtractScanRecords_projectScanId_fkey" FOREIGN KEY ("projectScanId") REFERENCES "LemonExtractProjectScan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
