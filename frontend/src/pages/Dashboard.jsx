import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfile, getSkills } from '../services/profileService';
import { getMyConnections, sendConnectionRequest } from '../services/connectionService';
import { getMyProjects, getMyJoinedProjects } from '../services/projectService';
import { getSkillMatches } from '../services/skillSwapperService';
import { getMyNotifications } from '../services/notificationService';
import { playSendRequestSound } from '../utils/soundEffects';

// Dashboard Components
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DashboardGreeting from '../components/dashboard/DashboardGreeting';
import DashboardStats from '../components/dashboard/DashboardStats';
import SkillMatchSection from '../components/dashboard/SkillMatchSection';
import ActiveProjectsSection from '../components/dashboard/ActiveProjectsSection';
import RecentActivitySection from '../components/dashboard/RecentActivitySection';

// Reusable Modals
import StudentProfileModal from '../components/StudentProfileModal';
import PrivateChatModal from '../components/PrivateChatModal';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Core Data States
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [connections, setConnections] = useState([]);
  const [createdProjects, setCreatedProjects] = useState([]);
  const [joinedProjects, setJoinedProjects] = useState([]);
  const [matches, setMatches] = useState([]);
  const [activities, setActivities] = useState([]);

  // Granular Loading & Error States
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);

  const [errorMatches, setErrorMatches] = useState(null);
  const [errorProjects, setErrorProjects] = useState(null);
  const [errorActivities, setErrorActivities] = useState(null);

  // Modal States
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [chatPeer, setChatPeer] = useState(null);

  // Combine unique active projects (created + joined)
  const activeProjects = useMemo(() => {
    const map = new Map();
    (createdProjects || []).forEach((p) => {
      map.set(p.id, { ...p, isOwner: true, isAccepted: true });
    });
    (joinedProjects || []).forEach((p) => {
      if (!map.has(p.id)) {
        map.set(p.id, { ...p, isMember: true, isAccepted: true });
      }
    });
    return Array.from(map.values());
  }, [createdProjects, joinedProjects]);

  // 1. Fetch Profile & Stats
  const fetchStatsAndProfile = async () => {
    setLoadingStats(true);
    try {
      const [profData, skillsData, connData] = await Promise.allSettled([
        getProfile(),
        getSkills(),
        getMyConnections(),
      ]);

      if (profData.status === 'fulfilled') setProfile(profData.value);
      if (skillsData.status === 'fulfilled') setSkills(skillsData.value || []);
      if (connData.status === 'fulfilled') setConnections(connData.value || []);
    } catch (e) {
      console.error('Stats loading error:', e);
    } finally {
      setLoadingStats(false);
    }
  };

  // 2. Fetch Skill Matches
  const fetchMatches = async () => {
    setLoadingMatches(true);
    setErrorMatches(null);
    try {
      const matchData = await getSkillMatches(1);
      setMatches(matchData || []);
    } catch (e) {
      setErrorMatches(e.response?.data?.message || 'Unable to load recommended skill matches.');
    } finally {
      setLoadingMatches(false);
    }
  };

  // 3. Fetch Active Projects
  const fetchProjects = async () => {
    setLoadingProjects(true);
    setErrorProjects(null);
    try {
      const [createdRes, joinedRes] = await Promise.allSettled([
        getMyProjects(),
        getMyJoinedProjects(),
      ]);

      if (createdRes.status === 'fulfilled') setCreatedProjects(createdRes.value || []);
      if (joinedRes.status === 'fulfilled') setJoinedProjects(joinedRes.value || []);
    } catch (e) {
      setErrorProjects(e.response?.data?.message || 'Unable to load your active projects.');
    } finally {
      setLoadingProjects(false);
    }
  };

  // 4. Fetch Activities
  const fetchActivities = async () => {
    setLoadingActivities(true);
    setErrorActivities(null);
    try {
      const notifData = await getMyNotifications();
      setActivities(notifData || []);
    } catch (e) {
      setErrorActivities(e.response?.data?.message || 'Unable to load recent activity.');
    } finally {
      setLoadingActivities(false);
    }
  };

  // Initial Data Fetch
  useEffect(() => {
    fetchStatsAndProfile();
    fetchMatches();
    fetchProjects();
    fetchActivities();
  }, []);

  // Handle Connect from Student Modal
  const handleConnectStudent = async (studentUserId) => {
    try {
      await sendConnectionRequest(studentUserId);
      playSendRequestSound();
      // Refresh matches and activities
      fetchMatches();
      fetchActivities();
      if (selectedStudent) {
        setSelectedStudent((prev) => ({
          ...prev,
          connectionStatus: 'PENDING_SENT',
        }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send connection request.');
    }
  };

  return (
    <div className="dashboard-page-container dashboard-container" id="dashboard-main-view">
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <DashboardHeader profile={profile} />

      {/* ── Main Dashboard Content Grid ───────────────────────────── */}
      <div className="dashboard-content-grid">
        {/* ── Left / Center Column (Main Content) ─────────────────── */}
        <div className="dashboard-primary-column">
          {/* Greeting Banner */}
          <DashboardGreeting />

          {/* Statistics Cards */}
          <DashboardStats
            skillsCount={skills.length}
            connectionsCount={connections.length}
            projectsCount={activeProjects.length}
            loading={loadingStats}
          />

          {/* Recommended Skill Matches */}
          <SkillMatchSection
            matches={matches}
            loading={loadingMatches}
            error={errorMatches}
            onRetry={fetchMatches}
            onViewProfile={(student) => setSelectedStudent(student)}
          />

          {/* My Active Projects */}
          <ActiveProjectsSection
            projects={activeProjects}
            currentUserId={user?.id}
            loading={loadingProjects}
            error={errorProjects}
            onRetry={fetchProjects}
            onOpenGroupChat={(proj) => navigate(`/projects/${proj.id}`)}
          />
        </div>

        {/* ── Right Column: Recent Activity Panel ─────────────────── */}
        <div className="dashboard-secondary-column">
          <RecentActivitySection
            activities={activities}
            loading={loadingActivities}
            error={errorActivities}
            onRetry={fetchActivities}
          />
        </div>
      </div>

      {/* ── Reusable Modals ───────────────────────────────────────── */}
      {/* Student Profile Modal */}
      {selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          isOpen={Boolean(selectedStudent)}
          onClose={() => setSelectedStudent(null)}
          onConnect={handleConnectStudent}
          onChat={(st) => {
            setSelectedStudent(null);
            setChatPeer(st);
          }}
        />
      )}

      {/* 1-on-1 Private Chat Modal */}
      {chatPeer && (
        <PrivateChatModal
          peer={chatPeer}
          isOpen={Boolean(chatPeer)}
          onClose={() => setChatPeer(null)}
        />
      )}
    </div>
  );
}
