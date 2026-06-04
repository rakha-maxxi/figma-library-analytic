-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "figma_connections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default Figma Connection',
    "encrypted_access_token" TEXT NOT NULL,
    "token_type" TEXT NOT NULL DEFAULT 'personal_access_token',
    "status" TEXT NOT NULL DEFAULT 'connected',
    "connected_user_name" TEXT,
    "connected_user_email" TEXT,
    "last_validated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "figma_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_files" (
    "id" TEXT NOT NULL,
    "figma_file_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "figma_url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "last_component_refresh_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_components" (
    "id" TEXT NOT NULL,
    "source_file_id" TEXT NOT NULL,
    "component_key" TEXT,
    "component_node_id" TEXT NOT NULL,
    "component_name" TEXT NOT NULL,
    "component_set_name" TEXT,
    "page_name" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "first_imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_in_source_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registered_files" (
    "id" TEXT NOT NULL,
    "figma_file_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "figma_url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_scanned',
    "tracking_enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_scan_job_id" TEXT,
    "last_scan_status" TEXT,
    "last_scan_attempt_at" TIMESTAMP(3),
    "last_successful_scan_at" TIMESTAMP(3),
    "total_instances" INTEGER NOT NULL DEFAULT 0,
    "unique_components_used" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registered_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_batches" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "total_files" INTEGER NOT NULL DEFAULT 0,
    "completed_files" INTEGER NOT NULL DEFAULT 0,
    "failed_files" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scan_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_jobs" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT,
    "registered_file_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "duration_ms" INTEGER,
    "error_code" TEXT,
    "error_message" TEXT,
    "retry_after_seconds" INTEGER,
    "total_instances" INTEGER NOT NULL DEFAULT 0,
    "unique_components_used" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scan_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_usage_current" (
    "id" TEXT NOT NULL,
    "source_component_id" TEXT NOT NULL,
    "registered_file_id" TEXT NOT NULL,
    "instance_count" INTEGER NOT NULL DEFAULT 0,
    "page_count" INTEGER NOT NULL DEFAULT 0,
    "frame_count" INTEGER NOT NULL DEFAULT 0,
    "last_seen_at" TIMESTAMP(3),
    "last_scanned_at" TIMESTAMP(3) NOT NULL,
    "last_scan_job_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "component_usage_current_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_snapshots" (
    "id" TEXT NOT NULL,
    "scan_job_id" TEXT NOT NULL,
    "source_component_id" TEXT NOT NULL,
    "registered_file_id" TEXT NOT NULL,
    "instance_count" INTEGER NOT NULL DEFAULT 0,
    "page_count" INTEGER NOT NULL DEFAULT 0,
    "frame_count" INTEGER NOT NULL DEFAULT 0,
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_instances" (
    "id" TEXT NOT NULL,
    "source_component_id" TEXT NOT NULL,
    "registered_file_id" TEXT NOT NULL,
    "instance_node_id" TEXT NOT NULL,
    "instance_name" TEXT,
    "page_name" TEXT,
    "frame_name" TEXT,
    "figma_node_url" TEXT,
    "usage_depth" TEXT NOT NULL DEFAULT 'direct',
    "parent_source_component_id" TEXT,
    "parent_instance_node_id" TEXT,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "missing_detected_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_changes" (
    "id" TEXT NOT NULL,
    "scan_job_id" TEXT NOT NULL,
    "source_component_id" TEXT NOT NULL,
    "registered_file_id" TEXT NOT NULL,
    "change_type" TEXT NOT NULL,
    "previous_count" INTEGER NOT NULL DEFAULT 0,
    "current_count" INTEGER NOT NULL DEFAULT 0,
    "difference" INTEGER NOT NULL DEFAULT 0,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL,
    "low_usage_instance_threshold" INTEGER NOT NULL DEFAULT 5,
    "stale_file_days_threshold" INTEGER NOT NULL DEFAULT 14,
    "scan_delay_ms" INTEGER NOT NULL DEFAULT 7000,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "source_files_figma_file_key_key" ON "source_files"("figma_file_key");

-- CreateIndex
CREATE UNIQUE INDEX "source_components_source_file_id_component_node_id_key" ON "source_components"("source_file_id", "component_node_id");

-- CreateIndex
CREATE UNIQUE INDEX "registered_files_figma_file_key_key" ON "registered_files"("figma_file_key");

-- CreateIndex
CREATE UNIQUE INDEX "component_usage_current_source_component_id_registered_file_key" ON "component_usage_current"("source_component_id", "registered_file_id");

-- CreateIndex
CREATE INDEX "usage_snapshots_source_component_id_idx" ON "usage_snapshots"("source_component_id");

-- CreateIndex
CREATE INDEX "usage_snapshots_registered_file_id_idx" ON "usage_snapshots"("registered_file_id");

-- CreateIndex
CREATE INDEX "usage_snapshots_scanned_at_idx" ON "usage_snapshots"("scanned_at");

-- CreateIndex
CREATE INDEX "usage_instances_usage_depth_idx" ON "usage_instances"("usage_depth");

-- CreateIndex
CREATE UNIQUE INDEX "usage_instances_source_component_id_registered_file_id_inst_key" ON "usage_instances"("source_component_id", "registered_file_id", "instance_node_id");

-- AddForeignKey
ALTER TABLE "source_components" ADD CONSTRAINT "source_components_source_file_id_fkey" FOREIGN KEY ("source_file_id") REFERENCES "source_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_jobs" ADD CONSTRAINT "scan_jobs_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "scan_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_jobs" ADD CONSTRAINT "scan_jobs_registered_file_id_fkey" FOREIGN KEY ("registered_file_id") REFERENCES "registered_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_usage_current" ADD CONSTRAINT "component_usage_current_source_component_id_fkey" FOREIGN KEY ("source_component_id") REFERENCES "source_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_usage_current" ADD CONSTRAINT "component_usage_current_registered_file_id_fkey" FOREIGN KEY ("registered_file_id") REFERENCES "registered_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_snapshots" ADD CONSTRAINT "usage_snapshots_scan_job_id_fkey" FOREIGN KEY ("scan_job_id") REFERENCES "scan_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_snapshots" ADD CONSTRAINT "usage_snapshots_source_component_id_fkey" FOREIGN KEY ("source_component_id") REFERENCES "source_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_snapshots" ADD CONSTRAINT "usage_snapshots_registered_file_id_fkey" FOREIGN KEY ("registered_file_id") REFERENCES "registered_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_instances" ADD CONSTRAINT "usage_instances_source_component_id_fkey" FOREIGN KEY ("source_component_id") REFERENCES "source_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_instances" ADD CONSTRAINT "usage_instances_registered_file_id_fkey" FOREIGN KEY ("registered_file_id") REFERENCES "registered_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_changes" ADD CONSTRAINT "usage_changes_scan_job_id_fkey" FOREIGN KEY ("scan_job_id") REFERENCES "scan_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_changes" ADD CONSTRAINT "usage_changes_source_component_id_fkey" FOREIGN KEY ("source_component_id") REFERENCES "source_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_changes" ADD CONSTRAINT "usage_changes_registered_file_id_fkey" FOREIGN KEY ("registered_file_id") REFERENCES "registered_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

