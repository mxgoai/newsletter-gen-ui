export function updateScheduleUI(elements, state) {
  const scheduleType = elements.scheduleTypeSelect.value;
  state.scheduleType = scheduleType;

  elements.specificDateTimeSection.classList.add('hidden');
  elements.customRecurringSection.classList.add('hidden');

  if (scheduleType === 'specific') {
    elements.specificDateTimeSection.classList.remove('hidden');
  } else if (scheduleType === 'recurring') {
    elements.customRecurringSection.classList.remove('hidden');
  }
}

export function toggleWeekday(state, button) {
  const day = parseInt(button.dataset.day, 10);
  button.classList.toggle('active');

  if (button.classList.contains('active')) {
    if (!state.selectedDays.includes(day)) {
      state.selectedDays.push(day);
    }
  } else {
    state.selectedDays = state.selectedDays.filter((d) => d !== day);
  }
}
