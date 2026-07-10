import { describe, it, expect, mock } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';
import VolunteerProfile from '../src/components/VolunteerProfile.jsx';
import { I18nProvider } from '../src/context/I18nContext.jsx';

function renderWithI18n(ui) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

const mockProfile = {
  name: 'Sam Smith',
  role: 'Gate Monitor',
  gate: 'A',
  tasks: [
    { id: 't1', text: 'Check sensors', completed: false },
    { id: 't2', text: 'Brief team', completed: true },
  ],
};

describe('VolunteerProfile', () => {
  it('renders the volunteer name in the name input', () => {
    renderWithI18n(
      <VolunteerProfile profile={mockProfile} onUpdate={mock(() => {})} loading={false} />
    );
    const nameInput = document.getElementById('prof-name');
    expect(nameInput.value).toBe('Sam Smith');
  });

  it('renders all tasks in the task list', () => {
    renderWithI18n(
      <VolunteerProfile profile={mockProfile} onUpdate={mock(() => {})} loading={false} />
    );
    expect(screen.getByText('Check sensors')).toBeTruthy();
    expect(screen.getByText('Brief team')).toBeTruthy();
  });

  it('completed task checkbox is checked', () => {
    renderWithI18n(
      <VolunteerProfile profile={mockProfile} onUpdate={mock(() => {})} loading={false} />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    // t2 is completed — find its checkbox
    const briefTeamCheckbox = checkboxes.find(
      (cb) => cb.getAttribute('aria-label') && cb.getAttribute('aria-label').includes('Brief team')
    );
    expect(briefTeamCheckbox.checked).toBe(true);
  });

  it('task checkbox fires onUpdate when toggled (no double-fire)', () => {
    const onUpdate = mock(() => {});
    renderWithI18n(
      <VolunteerProfile profile={mockProfile} onUpdate={onUpdate} loading={false} />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    const sensorsCheckbox = checkboxes.find(
      (cb) => cb.getAttribute('aria-label') && cb.getAttribute('aria-label').includes('Check sensors')
    );
    fireEvent.click(sensorsCheckbox);
    // onUpdate should be called exactly once — not twice (no double-fire from div + checkbox)
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it('add task form creates a new task on submit', () => {
    const onUpdate = mock(() => {});
    renderWithI18n(
      <VolunteerProfile profile={mockProfile} onUpdate={onUpdate} loading={false} />
    );

    const taskInput = screen.getByPlaceholderText('E.g., Check first aid supplies...');
    fireEvent.change(taskInput, { target: { value: 'New task item' } });

    const addBtn = screen.getByText('Add Task');
    fireEvent.click(addBtn);

    // onUpdate should be called with the new task appended
    const lastCall = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0];
    expect(lastCall.tasks.some((t) => t.text === 'New task item')).toBe(true);
  });

  it('delete task button fires onUpdate with the task removed', () => {
    const onUpdate = mock(() => {});
    renderWithI18n(
      <VolunteerProfile profile={mockProfile} onUpdate={onUpdate} loading={false} />
    );

    const deleteButtons = screen.getAllByRole('button').filter(
      (btn) => btn.getAttribute('aria-label') && btn.getAttribute('aria-label').startsWith('Delete task')
    );
    expect(deleteButtons.length).toBeGreaterThan(0);
    fireEvent.click(deleteButtons[0]);

    const lastCall = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0];
    expect(lastCall.tasks.length).toBe(1); // one task removed
  });

  it('save button submits profile update', () => {
    const onUpdate = mock(() => {});
    renderWithI18n(
      <VolunteerProfile profile={mockProfile} onUpdate={onUpdate} loading={false} />
    );

    const saveBtn = screen.getByText('Save Changes');
    fireEvent.click(saveBtn);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    const callArg = onUpdate.mock.calls[0][0];
    expect(callArg.name).toBe('Sam Smith');
    expect(callArg.gate).toBe('A');
  });

  it('progress bar has correct aria attributes', () => {
    renderWithI18n(
      <VolunteerProfile profile={mockProfile} onUpdate={mock(() => {})} loading={false} />
    );
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar.getAttribute('aria-valuemin')).toBe('0');
    expect(progressBar.getAttribute('aria-valuemax')).toBe('100');
    // 1 of 2 tasks completed = 50%
    expect(progressBar.getAttribute('aria-valuenow')).toBe('50');
  });

  it('shows empty state when no tasks are present', () => {
    renderWithI18n(
      <VolunteerProfile
        profile={{ ...mockProfile, tasks: [] }}
        onUpdate={mock(() => {})}
        loading={false}
      />
    );
    expect(screen.getByText(/All caught up/)).toBeTruthy();
  });

  it('save button shows loading state when loading=true', () => {
    renderWithI18n(
      <VolunteerProfile profile={mockProfile} onUpdate={mock(() => {})} loading={true} />
    );
    const saveBtn = screen.getByRole('button', { name: /\.\.\./i });
    expect(saveBtn.disabled).toBe(true);
  });
});
