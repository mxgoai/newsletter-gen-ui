export function combineDateTimeToISO(date, time) {
    if (!date || !time) return null;
    const localDateTime = new Date(`${date}T${time}`);
    return localDateTime.toISOString();
}

export function convertLocalTimeToUTC(timeString) {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(":").map(Number);
    const localDate = new Date();
    localDate.setHours(hours, minutes, 0, 0);
    const utcHours = localDate.getUTCHours();
    const utcMinutes = localDate.getUTCMinutes();
    return `${String(utcHours).padStart(2, "0")}:${String(utcMinutes).padStart(2, "0")}`;
}
