import { generateUUID } from "../utils/uuid.js";
import { combineDateTimeToISO, convertLocalScheduleToUTC } from "../utils/datetime.js";

export function buildScheduleObject(state) {
    switch (state.scheduleType) {
        case "immediate":
            return { type: "IMMEDIATE", specific_datetime: null, weekly_schedule: null };

        case "specific": {
            const date = document.getElementById("specific-date").value;
            const time = document.getElementById("specific-time").value;
            return {
                type: "SPECIFIC_DATES",
                specific_datetime: combineDateTimeToISO(date, time),
                weekly_schedule: null,
            };
        }

        case "recurring": {
            const localTime = document.getElementById("recurring-time").value || "09:00";
            const utcSchedule = convertLocalScheduleToUTC(state.selectedDays, localTime);
            return {
                type: "RECURRING_WEEKLY",
                specific_datetime: null,
                weekly_schedule: { days: utcSchedule.days, time: utcSchedule.time },
            };
        }

        default:
            return { type: "IMMEDIATE", specific_datetime: null, weekly_schedule: null };
    }
}

function parseEstimatedReadTime(inputValue) {
    const parsed = parseInt(inputValue, 10);
    if (Number.isNaN(parsed) || parsed === 0) {
        return null;
    }
    return parsed;
}

export function buildPayload(state) {
    const sourcesArray = document
        .getElementById("sources")
        .value.trim()
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    const locationsArray = document
        .getElementById("locations")
        .value.trim()
        .split(",")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    return {
        request_id: generateUUID(),
        prompt: document.getElementById("prompt").value.trim(),
        estimated_read_time: parseEstimatedReadTime(document.getElementById("read-time").value),
        sources: sourcesArray.length > 0 ? sourcesArray : null,
        geographic_locations: locationsArray.length > 0 ? locationsArray : null,
        formatting_instructions: null,
        schedule: buildScheduleObject(state),
    };
}
