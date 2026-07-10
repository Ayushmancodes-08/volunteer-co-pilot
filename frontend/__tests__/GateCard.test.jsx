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

  it('has correct ARIA label on the region', () => {
    renderWithI18n(<GateCard gate="D" occupancy={90} />);
    const region = screen.getByRole('region');
    expect(region.getAttribute('aria-label')).toContain('Gate D');
    expect(region.getAttribute('aria-label')).toContain('90%');
  });

  it('progress bar has correct aria-valuenow attribute', () => {
    renderWithI18n(<GateCard gate="E" occupancy={55} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar.getAttribute('aria-valuenow')).toBe('55');
    expect(progressBar.getAttribute('aria-valuemin')).toBe('0');
    expect(progressBar.getAttribute('aria-valuemax')).toBe('100');
  });

  it('renders sparkline SVG when history array is provided', () => {
    renderWithI18n(<GateCard gate="F" occupancy={60} history={[40, 50, 55, 60]} />);
    // The SVG path for sparkline should be rendered
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
    // There should be a path element for the sparkline
    const paths = document.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
  });

  it('does not render sparkline when history has fewer than 2 entries', () => {
    renderWithI18n(<GateCard gate="A" occupancy={45} history={[45]} />);
    // sparkline requires at least 2 data points
    const trendLabel = document.querySelector('[class*="Trend"]');
    expect(trendLabel).toBeNull();
  });

  it('handles missing history gracefully (no crash)', () => {
    // history defaults to [] per component prop default
    expect(() => renderWithI18n(<GateCard gate="B" occupancy={72} />)).not.toThrow();
  });
});