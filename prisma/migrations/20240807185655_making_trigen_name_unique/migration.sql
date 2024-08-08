/*
  Warnings:

  - A unique constraint covering the columns `[triggerEvent]` on the table `Flow` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Flow_triggerEvent_key" ON "Flow"("triggerEvent");
