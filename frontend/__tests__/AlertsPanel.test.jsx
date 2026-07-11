import { describe, it, expect, mock } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';
import AlertsPanel from '../src/components/AlertsPanel.jsx';
import { I18nProvider } from '../src/context/I18nContext.jsx';

function renderWithI18n(ui) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe('AlertsPanel', () => {
  const mockAlerts = [
    { id: '1', gate: 'A', occupancy: 85, action: 'Redirect to B', reasoning: 'Gate B is empty' },
    { id: '2', gate: 'C', occupancy: 95, action: 'Redirect to D', reasoning: 'Gate D is empty' },
  ];

  it('renders correctly with alerts list', () => {
    const handleDismiss = mock(() => {});
    renderWithI18n(<AlertsPanel alerts={mockAlerts} onDismiss={handleDismiss} />);
    
    expect(screen.getByText('Gate A')).toBeTruthy();
    expect(screen.getByText('Gate C')).toBeTruthy();
    expect(screen.getByText('Redirect to B')).toBeTruthy();
    expect(screen.getByText('Redirect to D')).toBeTruthy();
    expect(screen.getByText('85%')).toBeTruthy();
    expect(screen.getByText('95%')).toBeTruthy();
  });

  it('shows badge with number of alerts', () => {
    renderWithI18n(<AlertsPanel alerts={mockAlerts} onDismiss={() => {}} />);
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('renders empty state when alerts list is empty', () => {
    renderWithI18n(<AlertsPanel alerts={[]} onDismiss={() => {}} />);
    expect(screen.getByText(/no active alerts/i)).toBeTruthy();
  });

  it('sorts alerts by occupancy (highest first)', () => {
    renderWithI18n(<AlertsPanel alerts={mockAlerts} onDismiss={() => {}} />);
    const occupancyElements = screen.getAllByText(/\d+%/);
    // Since 95% is higher than 85%, 95% should appear first
    expect(occupancyElements[0].textContent).toBe('95%');
    expect(occupancyElements[1].textContent).toBe('85%');
  });

  it('calls onDismiss when resolve button is clicked', () => {
    const handleDismiss = mock(() => {});
    renderWithI18n(<AlertsPanel alerts={mockAlerts} onDismiss={handleDismiss} />);
    
    // Resolve button has aria-label="Dismiss alert for Gate C" (sorted first because 95% is higher)
    const resolveButtons = screen.getAllByRole('button', { name: /dismiss alert for gate/i });
    fireEvent.click(resolveButtons[0]); // Click on the first resolve button (Gate C)
    
    expect(handleDismiss).toHaveBeenCalled();
  });
});
