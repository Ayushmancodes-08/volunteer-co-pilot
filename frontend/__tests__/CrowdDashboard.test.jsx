import { describe, it, expect, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import CrowdDashboard from '../src/components/CrowdDashboard.jsx';
import { I18nProvider } from '../src/context/I18nContext.jsx';

// Mock Recharts module before loading it, to bypass read-only exports
mock.module('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div style={{ width: '100px', height: '100px' }}>{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

function renderWithI18n(ui) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe('CrowdDashboard', () => {
  const mockGates = [
    { gate: 'A', occupancy: 45, history: [40, 42, 45] },
    { gate: 'B', occupancy: 85, history: [70, 75, 85] },
  ];

  it('renders correct dashboard title and subtitles', () => {
    renderWithI18n(<CrowdDashboard gates={mockGates} evaluating={false} />);
    expect(screen.getByText('Gate Occupancy')).toBeTruthy();
    expect(screen.getByText(/real-time gate ingress sensor readings/i)).toBeTruthy();
  });

  it('shows evaluation spinner when evaluating is true', () => {
    renderWithI18n(<CrowdDashboard gates={mockGates} evaluating={true} />);
    expect(screen.getByText('Refreshing...')).toBeTruthy();
  });

  it('renders gate cards on the dashboard', () => {
    renderWithI18n(<CrowdDashboard gates={mockGates} evaluating={false} />);
    expect(screen.getByText('Gate A')).toBeTruthy();
    expect(screen.getByText('Gate B')).toBeTruthy();
  });

  it('renders the status summary legend', () => {
    renderWithI18n(<CrowdDashboard gates={mockGates} evaluating={false} />);
    expect(screen.getByText('OK (<60%)')).toBeTruthy();
    expect(screen.getByText('WARNING (60-79%)')).toBeTruthy();
    expect(screen.getByText('CRITICAL (≥80%)')).toBeTruthy();
  });
});
