export function showMessage(elements, message, type = "success") {
    elements.messageContainer.textContent = message;
    elements.messageContainer.className = `message-container ${type}`;
    elements.messageContainer.classList.remove("hidden");
    setTimeout(() => {
        elements.messageContainer.classList.add("hidden");
    }, 10000);
}

export function setButtonLoading(button, isLoading) {
    button.disabled = isLoading;
    button.classList.toggle("btn-loading", isLoading);
}
