import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function DashboardGreeting() {
  const { user } = useAuth();

  // Dynamic time-based greeting
  const getGreetingText = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const greetingPrefix = getGreetingText();
  const userName = user?.name || 'Student';

  return (
    <section className="dashboard-greeting-banner" aria-label="Greeting Section">
      <div className="greeting-content">
        <span className="greeting-time-tag">{greetingPrefix},</span>
        <h1 className="greeting-user-title">
          {userName} <span className="greeting-wave" aria-hidden="true">👋</span>
        </h1>
        <p className="greeting-subtitle">
          Keep learning, keep growing! Your skills can create amazing opportunities.
        </p>
      </div>

      <div className="greeting-illustration" aria-hidden="true">
        <div className="greeting-sparkle-badge">
          <span className="sparkle-icon">✨</span>
          <span className="sparkle-text">SkillSync Active</span>
        </div>
      </div>
    </section>
  );
}
