import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import GateCard from '../src/components/GateCard.jsx';
import { I18nProvider } from '../src/context/I18nContext.jsx';

function renderWithI18n(ui) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe('GateCard', () => {
  it('shows CRITICAL status at 85% occupancy', () => {
    renderWithI18n(<GateCard gate="A" occupancy={85} />);
    expect(screen.getByText('CRITICAL')).toBeTruthy();
    expect(screen.getByText('85%')).toBeTruthy();
    expect(screen.getByText('Gate A')).toBeTruthy();
  });

  it('shows WARNING status at 70% occupancy', () => {
    renderWithI18n(<GateCard gate="B" occupancy={70} />);
    expect(screen.getByText('WARNING')).toBeTruthy();
  });

  it('shows OK status at 40% occupancy', () => {
    renderWithI18n(<GateCard gate="C" occupancy={40} />);
    expect(screen.getByText('OK')).toBeTruthy();
  });

  it('has correct ARIA label', () => {
    renderWithI18n(<GateCard gate="D" occupancy={90} />);
    const region = screen.getByRole('region');
    expect(region.getAttribute('aria-label')).toContain('Gate D');
    expect(region.getAttribute('aria-label')).toContain('90%');
  });
});