import { describe, it, expect, mock } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';
import AIBriefing from '../src/components/AIBriefing.jsx';
import { I18nProvider } from '../src/context/I18nContext.jsx';

function renderWithI18n(ui) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

const mockVolunteer = { name: 'Alex Morgan', role: 'Gate Monitor', gate: 'C' };

const mockBriefing = {
  summary: 'Welcome to your shift, Alex Morgan!',
  weatherForecast: '22°C, partly cloudy.',
  crowdOutlook: 'Peak crowds expected at 17:30.',
  announcements: ['Keep exits clear.', 'Stay hydrated.'],
  suggestedActions: ['Check sensors.', 'Review scripts.'],
};

describe('AIBriefing', () => {
  it('renders the briefing title', () => {
    renderWithI18n(
      <AIBriefing briefing={null} loading={false} onFetch={mock(() => {})} volunteer={mockVolunteer} />
    );
    expect(screen.getByText('AI Shift Briefing')).toBeTruthy();
  });

  it('calls onFetch on mount when briefing is null', () => {
    const onFetch = mock(() => {});
    renderWithI18n(
      <AIBriefing briefing={null} loading={false} onFetch={onFetch} volunteer={mockVolunteer} />
    );
    expect(onFetch).toHaveBeenCalledWith('Alex Morgan', 'Gate Monitor', 'C');
  });

  it('does not call onFetch if briefing is already loaded', () => {
    const onFetch = mock(() => {});
    renderWithI18n(
      <AIBriefing briefing={mockBriefing} loading={false} onFetch={onFetch} volunteer={mockVolunteer} />
    );
    expect(onFetch).not.toHaveBeenCalled();
  });

  it('shows loading state when loading=true', () => {
    renderWithI18n(
      <AIBriefing briefing={null} loading={true} onFetch={mock(() => {})} volunteer={mockVolunteer} />
    );
    // aria-busy region should be present
    const busyEl = document.querySelector('[aria-busy="true"]');
    expect(busyEl).toBeTruthy();
  });

  it('renders summary when briefing is provided', () => {
    renderWithI18n(
      <AIBriefing briefing={mockBriefing} loading={false} onFetch={mock(() => {})} volunteer={mockVolunteer} />
    );
    expect(screen.getByText(/Welcome to your shift, Alex Morgan!/)).toBeTruthy();
  });

  it('renders all announcements', () => {
    renderWithI18n(
      <AIBriefing briefing={mockBriefing} loading={false} onFetch={mock(() => {})} volunteer={mockVolunteer} />
    );
    expect(screen.getByText('Keep exits clear.')).toBeTruthy();
    expect(screen.getByText('Stay hydrated.')).toBeTruthy();
  });

  it('renders all suggested actions', () => {
    renderWithI18n(
      <AIBriefing briefing={mockBriefing} loading={false} onFetch={mock(() => {})} volunteer={mockVolunteer} />
    );
    expect(screen.getByText('Check sensors.')).toBeTruthy();
    expect(screen.getByText('Review scripts.')).toBeTruthy();
  });

  it('refresh button calls onFetch when clicked', () => {
    const onFetch = mock(() => {});
    renderWithI18n(
      <AIBriefing briefing={mockBriefing} loading={false} onFetch={onFetch} volunteer={mockVolunteer} />
    );
    // Reset call count from initial mount (no call since briefing is set)
    const refreshBtn = screen.getByRole('button');
    fireEvent.click(refreshBtn);
    expect(onFetch).toHaveBeenCalledTimes(1);
    expect(onFetch).toHaveBeenCalledWith('Alex Morgan', 'Gate Monitor', 'C');
  });

  it('refresh button is disabled while loading', () => {
    renderWithI18n(
      <AIBriefing briefing={null} loading={true} onFetch={mock(() => {})} volunteer={mockVolunteer} />
    );
    const btn = screen.getByRole('button');
    expect(btn.disabled).toBe(true);
  });

  it('announcement badge text is translated (not hardcoded ALERT)', () => {
    renderWithI18n(
      <AIBriefing briefing={mockBriefing} loading={false} onFetch={mock(() => {})} volunteer={mockVolunteer} />
    );
    // Should use 'NOTICE' (from i18n key announcements.badge), not 'ALERT'
    const alertTexts = screen.queryAllByText('ALERT');
    expect(alertTexts).toHaveLength(0);
  });
});
