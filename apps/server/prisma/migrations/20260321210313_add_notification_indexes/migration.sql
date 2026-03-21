-- CreateIndex
CREATE INDEX "Notification_residentId_idx" ON "Notification"("residentId");

-- CreateIndex
CREATE INDEX "Notification_residentId_acknowledged_idx" ON "Notification"("residentId", "acknowledged");
