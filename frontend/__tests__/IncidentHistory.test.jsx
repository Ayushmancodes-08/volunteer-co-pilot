import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import IncidentHistory from '../src/components/IncidentHistory.jsx';
import { I18nProvider } from '../src/context/I18nContext.jsx';

function renderWithI18n(ui) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe('IncidentHistory', () => {
  const mockHistory = [
    { id: '1', gate: 'B', occupancy: 82, action: 'Redirect C', reasoning: 'Gate C clear', dismissed: false, timestamp: new Date().toISOString() },
    { id: '2', gate: 'A', occupancy: 88, action: 'Redirect D', reasoning: 'Gate D clear', dismissed: true, timestamp: new Date().toISOString() },
  ];

  it('renders empty log state correctly', () => {
    renderWithI18n(<IncidentHistory history={[]} />);
    expect(screen.getByText(/no incidents logged yet/i)).toBeTruthy();
  });

  it('renders table columns and data rows', () => {
    renderWithI18n(<IncidentHistory history={mockHistory} />);
    expect(screen.getByText('Gate B')).toBeTruthy();
    expect(screen.getByText('Gate A')).toBeTruthy();
    expect(screen.getByText('Redirect C')).toBeTruthy();
    expect(screen.getByText('Redirect D')).toBeTruthy();
  });

  it('shows resolved status for dismissed entries', () => {
    renderWithI18n(<IncidentHistory history={mockHistory} />);
    expect(screen.getByText('Resolved')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
  });
});
