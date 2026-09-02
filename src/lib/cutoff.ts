import { db } from "./db";

export interface CutoffStatus {
  isOpen: boolean;
  reason?: string;
  startTime: string;
  cutoffTime: string;
  isManualOverride: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isWeekend: boolean;
}

export function getTodayDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function getBookingCutoffStatus(targetDateStr?: string): Promise<CutoffStatus> {
  const now = new Date();
  const actualTodayStr = getTodayDateString(now);
  const todayStr = targetDateStr || actualTodayStr; // YYYY-MM-DD

  // 1. Fetch system settings
  const settings = await db.setting.findMany();
  const settingsMap: Record<string, string> = {};
  settings.forEach((s: { key: string; value: string }) => {
    settingsMap[s.key] = s.value;
  });

  const startTime = settingsMap["order_start_time"] || "08:00";
  const cutoffTime = settingsMap["cutoff_time"] || "11:00";
  const manualClosed = settingsMap["manual_cutoff_closed"] === "true";
  const workingDays = (settingsMap["working_days"] || "Mon,Tue,Wed,Thu,Fri").split(",");

  // 2. Check Past Date
  if (todayStr < actualTodayStr) {
    return {
      isOpen: false,
      reason: "Lunch booking is closed for past dates.",
      startTime,
      cutoffTime,
      isManualOverride: false,
      isHoliday: false,
      isWeekend: false,
    };
  }

  // 3. Check Weekend
  const dateObj = new Date(todayStr + "T00:00:00");
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const currentDayName = dayNames[dateObj.getDay()];
  const isWeekend = !workingDays.includes(currentDayName);

  if (isWeekend) {
    return {
      isOpen: false,
      reason: `Lunch booking is not available on weekends (${currentDayName}).`,
      startTime,
      cutoffTime,
      isManualOverride: false,
      isHoliday: false,
      isWeekend: true,
    };
  }

  // 4. Check Holiday
  const holiday = await db.holiday.findUnique({
    where: { date: todayStr },
  });

  if (holiday) {
    return {
      isOpen: false,
      reason: `No lunch booking available today due to Holiday: ${holiday.name}.`,
      startTime,
      cutoffTime,
      isManualOverride: false,
      isHoliday: true,
      holidayName: holiday.name,
      isWeekend: false,
    };
  }

  // 5. Check Manual Admin Override
  if (manualClosed && todayStr === actualTodayStr) {
    return {
      isOpen: false,
      reason: "Lunch booking has been closed manually by the administrator.",
      startTime,
      cutoffTime,
      isManualOverride: true,
      isHoliday: false,
      isWeekend: false,
    };
  }

  // 6. Check Start Time & Cutoff Time if checking today
  if (todayStr === actualTodayStr) {
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [cutoffHours, cutoffMinutes] = cutoffTime.split(":").map(Number);
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    const currentTotalMinutes = currentHours * 60 + currentMinutes;
    const startTotalMinutes = startHours * 60 + startMinutes;
    const cutoffTotalMinutes = cutoffHours * 60 + cutoffMinutes;

    if (currentTotalMinutes < startTotalMinutes) {
      return {
        isOpen: false,
        reason: `Lunch booking for today will open at ${formatTime12h(startTime)}.`,
        startTime,
        cutoffTime,
        isManualOverride: false,
        isHoliday: false,
        isWeekend: false,
      };
    }

    if (currentTotalMinutes >= cutoffTotalMinutes) {
      return {
        isOpen: false,
        reason: `Lunch booking closed for today at ${formatTime12h(cutoffTime)}. You can book lunch for tomorrow.`,
        startTime,
        cutoffTime,
        isManualOverride: false,
        isHoliday: false,
        isWeekend: false,
      };
    }
  }

  return {
    isOpen: true,
    startTime,
    cutoffTime,
    isManualOverride: false,
    isHoliday: false,
    isWeekend: false,
  };
}

export function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h ? h : 12;
  return `${h.toString().padStart(2, "0")}:${m} ${ampm}`;
}

export function getFormattedDateString(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return d.toLocaleDateString("en-US", options);
}
