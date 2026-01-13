export function validateForm(state, showMessage) {
    if (!document.getElementById("prompt").value.trim()) {
        showMessage("Please enter a newsletter prompt.", "error");
        return false;
    }

    if (!document.getElementById("read-time").value) {
        showMessage("Please enter an estimated read time.", "error");
        return false;
    }

    if (state.scheduleType === "specific") {
        const date = document.getElementById("specific-date").value;
        const time = document.getElementById("specific-time").value;

        if (!date || !time) {
            showMessage("Please select both a date and time for specific scheduling.", "error");
            return false;
        }

        if (new Date(`${date}T${time}`) < new Date()) {
            showMessage("The scheduled date and time must be in the future.", "error");
            return false;
        }
    }

    if (state.scheduleType === "recurring" && state.selectedDays.length === 0) {
        showMessage("Please select at least one day for a recurring schedule.", "error");
        return false;
    }

    return true;
}
