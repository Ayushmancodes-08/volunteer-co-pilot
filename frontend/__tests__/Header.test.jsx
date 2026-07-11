import { describe, it, expect, mock } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../src/components/Header.jsx';
import { I18nProvider } from '../src/context/I18nContext.jsx';

function renderWithI18n(ui) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe('Header', () => {
  it('renders branding title and subtitle', () => {
    renderWithI18n(<Header activeTab="briefing" setActiveTab={() => {}} />);
    expect(screen.getByText('Volunteer Co-Pilot')).toBeTruthy();
  });

  it('renders volunteer name quick badge when name is provided', () => {
    renderWithI18n(<Header activeTab="briefing" setActiveTab={() => {}} volunteerName="Jessica" />);
    expect(screen.getByText('Jessica')).toBeTruthy();
  });

  it('calls setActiveTab when a navigation tab button is clicked', () => {
    const handleTabChange = mock(() => {});
    renderWithI18n(<Header activeTab="briefing" setActiveTab={handleTabChange} />);
    
    // There are desktop and mobile buttons for Dashboard. Let's click the first one.
    const dashboardTabs = screen.getAllByRole('button', { name: /dashboard/i });
    fireEvent.click(dashboardTabs[0]);
    
    expect(handleTabChange).toHaveBeenCalled();
  });

  it('renders language toggle button', () => {
    renderWithI18n(<Header activeTab="briefing" setActiveTab={() => {}} />);
    // Initial language is English, button text should show ES (to switch to Spanish)
    expect(screen.getByRole('button', { name: /switch language to spanish/i })).toBeTruthy();
  });
});
