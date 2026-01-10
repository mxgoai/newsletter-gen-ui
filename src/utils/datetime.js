export function combineDateTimeToISO(date, time) {
    if (!date || !time) return null;
    const localDateTime = new Date(`${date}T${time}`);
    return localDateTime.toISOString();
}

export function convertLocalScheduleToUTC(localDays, localTime) {
    if (!localDays || localDays.length === 0 || !localTime) {
        return { days: [], time: null };
    }

    const [localHours, localMinutes] = localTime.split(":").map(Number);
    const utcDays = new Set();
    let utcTime = "";

    const now = new Date();

    localDays.forEach((localDay, index) => {
        const scheduleDate = new Date(now);

        const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1; // Adjust Sunday to be 6
        const daysToAdd = (localDay - currentDay + 7) % 7;

        scheduleDate.setDate(now.getDate() + daysToAdd);
        scheduleDate.setHours(localHours, localMinutes, 0, 0);

        const utcDay = scheduleDate.getUTCDay() === 0 ? 6 : scheduleDate.getUTCDay() - 1;
        utcDays.add(utcDay);

        if (index === 0) {
            const utcHours = scheduleDate.getUTCHours();
            const utcMinutes = scheduleDate.getUTCMinutes();
            utcTime = `${String(utcHours).padStart(2, "0")}:${String(utcMinutes).padStart(2, "0")}`;
        }
    });

    return {
        days: Array.from(utcDays).sort(),
        time: utcTime,
    };
}