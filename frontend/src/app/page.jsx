'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Header from '../components/Header.jsx';
import CrowdDashboard from '../components/CrowdDashboard.jsx';
import AlertsPanel from '../components/AlertsPanel.jsx';
import MultilingualPanel from '../components/MultilingualPanel.jsx';
import IncidentHistory from '../components/IncidentHistory.jsx';
import VoiceInput from '../components/VoiceInput.jsx';
import VolunteerProfile from '../components/VolunteerProfile.jsx';
import AIBriefing from '../components/AIBriefing.jsx';
import { useCrowdData } from '../hooks/useCrowdData.js';
import { useAlerts } from '../hooks/useAlerts.js';
import { useVolunteer } from '../hooks/useVolunteer.js';
import { useBriefing } from '../hooks/useBriefing.js';


export default function HomePage() {
  const [activeTab, setActiveTab] = useState('briefing');
  const { gates, timestamp, loading: crowdLoading } = useCrowdData();
  const { activeAlerts, history, evaluateGate, dismissAlert, evaluating } = useAlerts();
  const { profile, loading: profileLoading, updateProfile } = useVolunteer();
  const { briefing, loading: briefingLoading, fetchBriefing } = useBriefing();
  const prevGatesRef = useRef({});

  // Check thresholds every time gate data updates
  useEffect(() => {
    const prev = prevGatesRef.current;
    gates.forEach((gate) => {
      const wasBelow = (prev[gate.gate] || 0) < 80;
      const nowAtOrAbove = gate.occupancy >= 80;
      if (wasBelow && nowAtOrAbove) {
        evaluateGate(gate.gate, gate.occupancy);
      }
    });
    gates.forEach((g) => { prevGatesRef.current[g.gate] = g.occupancy; });
  }, [gates, evaluateGate]);

  const handleDismiss = useCallback((id) => {
    dismissAlert(id);
  }, [dismissAlert]);

  const renderTab = () => {
    switch (activeTab) {
      case 'briefing':
        return (
          <AIBriefing 
            briefing={briefing} 
            loading={briefingLoading} 
            onFetch={fetchBriefing} 
            volunteer={profile} 
          />
        );
      case 'dashboard':
        return (
          <div className="space-y-6">
            <CrowdDashboard gates={gates} evaluating={evaluating} />
            {activeAlerts.length > 0 && (
              <AlertsPanel alerts={activeAlerts} onDismiss={handleDismiss} />
            )}
          </div>
        );
      case 'alerts':
        return <AlertsPanel alerts={activeAlerts} onDismiss={handleDismiss} />;
      case 'translate':
        return (
          <div className="space-y-8">
            <MultilingualPanel />
            <VoiceInput />
          </div>
        );
      case 'history':
        return <IncidentHistory history={history} />;
      case 'profile':
        return (
          <VolunteerProfile 
            profile={profile} 
            onUpdate={updateProfile} 
            loading={profileLoading} 
          />
        );
      default:
        return null;
    }
  };

  const currentLoading = crowdLoading || profileLoading;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        volunteerName={profile?.name} 
      />
      <main className="max-w-7xl mx-auto px-4 py-8" role="main">
        {currentLoading ? (
          <div className="flex justify-center py-24">
            <svg className="animate-spin h-10 w-10 text-blue-600" viewBox="0 0 24 24" fill="none" aria-label="Loading">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          renderTab()
        )}
      </main>
    </div>
  );
}