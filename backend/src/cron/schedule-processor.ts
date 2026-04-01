import cron from "node-cron";
import * as ScheduleService from "../services/schedule.service.js";

/**
 * Starts the daily cron job that processes pending schedules.
 * Runs at midnight America/Sao_Paulo timezone.
 * Only call this when NODE_ENV !== 'test'.
 */
export function startScheduleCron(): void {
  // "0 0 * * *" = every day at 00:00
  cron.schedule(
    "0 0 * * *",
    async () => {
      console.log("[Cron] Processing daily schedules...");
      try {
        await ScheduleService.processDaily();
        console.log("[Cron] Daily schedule processing completed.");
      } catch (error) {
        console.error("[Cron] Error processing daily schedules:", error);
      }
    },
    {
      timezone: "America/Sao_Paulo",
    }
  );

  console.log("[Cron] Schedule processor started (timezone: America/Sao_Paulo)");
}
