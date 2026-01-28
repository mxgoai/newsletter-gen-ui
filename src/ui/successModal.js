function getTaskIds(data) {
    if (Array.isArray(data?.scheduled_task_ids) && data.scheduled_task_ids.length > 0) {
        return data.scheduled_task_ids;
    }
    if (data?.task_id) {
        return [data.task_id];
    }
    if (data?.newsletter_id) {
        return [data.newsletter_id];
    }
    if (data?.id) {
        return [data.id];
    }
    return [];
}

function copyText(text) {
    if (navigator?.clipboard?.writeText) {
        return navigator.clipboard.writeText(text);
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    return Promise.resolve();
}

export function hideSuccessModal(elements) {
    if (!elements.successModal) {
        return;
    }
    elements.successModal.classList.add("hidden");
    elements.successModal.classList.remove("flex");
    document.body.style.overflow = "";
}

export function showSuccessModal(elements, data) {
    if (!elements.successModal || !elements.successModalMessage || !elements.successModalIds) {
        return;
    }

    const isScheduled = Boolean(data?.is_scheduled);
    const title = isScheduled ? "Newsletter scheduled" : "Newsletter created";
    const message = data?.sample_email_sent
        ? "A sample email has been sent to your inbox."
        : "Your newsletter request was submitted successfully.";

    const titleEl = elements.successModalCard?.querySelector("h3");
    if (titleEl) {
        titleEl.textContent = title;
    }
    elements.successModalMessage.textContent = message;

    const ids = getTaskIds(data);
    elements.successModalIds.innerHTML = "";

    if (ids.length > 0) {
        const label = document.createElement("p");
        label.className = "text-[11px] uppercase tracking-[0.25em] text-gray-400 font-semibold";
        label.textContent = ids.length > 1 ? "Task IDs" : "Task ID";
        elements.successModalIds.appendChild(label);

        ids.forEach((id) => {
            const row = document.createElement("div");
            row.className =
                "flex items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3";

            const value = document.createElement("span");
            value.className = "text-[12px] font-semibold text-gray-700 break-all";
            value.textContent = id;

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className =
                "w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition";
            btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">content_copy</span>';
            btn.addEventListener("click", async () => {
                try {
                    await copyText(id);
                    btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">check</span>';
                    setTimeout(() => {
                        btn.innerHTML =
                            '<span class="material-symbols-outlined text-[18px]">content_copy</span>';
                    }, 1200);
                } catch (error) {
                    console.error("Copy failed:", error);
                }
            });

            row.appendChild(value);
            row.appendChild(btn);
            elements.successModalIds.appendChild(row);
        });
    }

    elements.successModal.classList.remove("hidden");
    elements.successModal.classList.add("flex");
    document.body.style.overflow = "hidden";
}
