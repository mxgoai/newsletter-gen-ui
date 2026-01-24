export function updateProgressUI(elements, state) {
    if (!elements.progressPercent || !elements.progressStatus) {
        return;
    }

    const promptValue = document.getElementById("prompt")?.value.trim() || "";
    const readTimeValue = document.getElementById("read-time")?.value || "";
    const scheduleType = elements.scheduleTypeSelect?.value || "immediate";

    const requirements = [
        promptValue.length > 0,
        readTimeValue !== "" && Number(readTimeValue) > 0,
        Boolean(scheduleType),
    ];

    if (scheduleType === "specific") {
        const specificDate = document.getElementById("specific-date")?.value || "";
        const specificTime = document.getElementById("specific-time")?.value || "";
        requirements.push(specificDate !== "" && specificTime !== "");
    }

    if (scheduleType === "recurring") {
        requirements.push(state.selectedDays.length > 0);
    }

    const completed = requirements.filter(Boolean).length;
    const total = requirements.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    elements.progressPercent.textContent = `${percent}%`;

    if (percent === 0) {
        elements.progressStatus.textContent = "Not started";
    } else if (percent < 100) {
        elements.progressStatus.textContent = "In progress";
    } else {
        elements.progressStatus.textContent = "Complete";
    }

    if (elements.progressBar) {
        elements.progressBar.style.width = `${percent}%`;
    }

    if (elements.progressCard) {
        elements.progressCard.classList.toggle("complete", percent === 100);
    }

    if (elements.progressCheck) {
        elements.progressCheck.classList.toggle("hidden", percent !== 100);
    }
}
