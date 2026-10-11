import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getAllProjects,
  getMyProjects,
  getMyJoinedProjects,
  getMyJoinRequests,
  getOwnerPendingRequests,
  sendJoinRequest,
  acceptJoinRequest,
  rejectJoinRequest,
  createProject,
} from '../services/projectService';
import ProjectCard from '../components/ProjectCard';
import CreateProjectModal from '../components/CreateProjectModal';
import ProjectDetailsModal from '../components/ProjectDetailsModal';
import ApplicantProfileModal from '../components/ApplicantProfileModal';
import { getBookmarkedProjectIds } from '../utils/bookmarkStorage';
import { playSendRequestSound, playAcceptRequestSound } from '../utils/soundEffects';

export default function ProjectFinder() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Navigation tabs: 'explore' | 'my-projects' | 'my-requests' | 'saved'
  const [activeTab, setActiveTab] = useState('explore');

  // Projects data
  const [allProjects, setAllProjects] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [joinedProjects, setJoinedProjects] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [ownerPendingRequests, setOwnerPendingRequests] = useState([]);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [isApplicantModalOpen, setIsApplicantModalOpen] = useState(false);
  const [processingApplicantId, setProcessingApplicantId] = useState(null);

  // Loading & Action states
  const [loading, setLoading] = useState(true);
  const [requestingProjectId, setRequestingProjectId] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'OPEN' | 'CLOSED'
  const [selectedSkillFilter, setSelectedSkillFilter] = useState('');

  // Bookmarks trigger
  const [bookmarkTick, setBookmarkTick] = useState(0);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState({ type: '', message: '' });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast({ type: '', message: '' });
    }, 4500);
  };

  // Fetch all necessary data
  const loadData = async () => {
    setLoading(true);
    try {
      const [allData, myData, joinedData, requestsData, ownerRequestsData] = await Promise.all([
        getAllProjects().catch(() => []),
        getMyProjects().catch(() => []),
        getMyJoinedProjects().catch(() => []),
        getMyJoinRequests().catch(() => []),
        getOwnerPendingRequests().catch(() => []),
      ]);

      setAllProjects(allData || []);
      setMyProjects(myData || []);
      setJoinedProjects(joinedData || []);
      setMyRequests(requestsData || []);
      setOwnerPendingRequests(ownerRequestsData || []);
    } catch (err) {
      showToast('error', 'Failed to load projects data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Map pending request count by project ID for owner's projects
  const pendingCountsByProject = useMemo(() => {
    const map = {};
    if (ownerPendingRequests && ownerPendingRequests.length > 0) {
      ownerPendingRequests.forEach((req) => {
        if (req.projectId) {
          map[req.projectId] = (map[req.projectId] || 0) + 1;
        }
      });
    }
    return map;
  }, [ownerPendingRequests]);

  useEffect(() => {
    loadData();
  }, []);

  // Map user's join requests status by project ID
  const userRequestStatusMap = useMemo(() => {
    const map = {};
    if (myRequests && myRequests.length > 0) {
      myRequests.forEach((req) => {
        map[req.projectId] = req.status; // 'PENDING' | 'ACCEPTED' | 'REJECTED'
      });
    }
    return map;
  }, [myRequests]);

  // Extract all unique skills across projects
  const allAvailableSkills = useMemo(() => {
    const set = new Set();
    allProjects.forEach((p) => {
      if (p.requiredSkills) {
        p.requiredSkills.forEach((s) => set.add(s.name));
      }
    });
    return Array.from(set).sort();
  }, [allProjects]);

  // Bookmarked projects
  const bookmarkedProjects = useMemo(() => {
    const savedIds = getBookmarkedProjectIds(user?.id);
    return allProjects.filter((p) => savedIds.includes(p.id));
  }, [allProjects, user, bookmarkTick]);

  // Filtered projects for Explore tab
  const filteredProjects = useMemo(() => {
    return allProjects.filter((project) => {
      // 1. Search Query filter (Case-insensitive, trimmed)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesTitle = project.title?.toLowerCase().includes(query);
        const matchesDesc = project.description?.toLowerCase().includes(query);
        const matchesOwner = project.owner?.name?.toLowerCase().includes(query);
        const matchesSkills = project.requiredSkills?.some((s) =>
          s.name.toLowerCase().includes(query)
        );
        const matchesLookingFor = project.lookingFor?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesOwner && !matchesSkills && !matchesLookingFor) {
          return false;
        }
      }

      // 2. Status filter: 'OPEN' vs 'CLOSED'
      if (statusFilter === 'OPEN' && project.status !== 'OPEN') {
        return false;
      }
      if (statusFilter === 'CLOSED' && project.status === 'OPEN') {
        return false;
      }

      // 3. Skill filter
      if (selectedSkillFilter) {
        const hasSkill = project.requiredSkills?.some(
          (s) => s.name.toLowerCase() === selectedSkillFilter.toLowerCase()
        );
        if (!hasSkill) return false;
      }

      return true;
    });
  }, [allProjects, searchQuery, statusFilter, selectedSkillFilter]);

  // Handle Project Creation via Modal
  const handleCreateProject = async ({ title, description, requiredSkills }) => {
    setIsCreatingProject(true);
    try {
      const created = await createProject({ title, description, requiredSkills });
      showToast('success', `Project "${created.title}" published successfully!`);
      setIsCreateModalOpen(false);
      await loadData();
    } catch (err) {
      showToast(
        'error',
        err.response?.data?.message || 'Failed to create project. Please verify inputs.'
      );
    } finally {
      setIsCreatingProject(false);
    }
  };

  // Open Project Details Modal
  const handleOpenDetails = (project) => {
    setSelectedProject(project);
    setIsDetailsModalOpen(true);
  };

  // Handle Join Request
  const handleRequestJoin = async (projectId) => {
    setRequestingProjectId(projectId);
    try {
      await sendJoinRequest(projectId);
      playSendRequestSound();
      showToast('success', 'Join request submitted! The project owner has been notified.');
      await loadData();
    } catch (err) {
      showToast(
        'error',
        err.response?.data?.message || 'Failed to send join request.'
      );
    } finally {
      setRequestingProjectId(null);
    }
  };

  // Handle viewing applicant profile
  const handleViewApplicantProfile = (applicantReq) => {
    setSelectedApplicant(applicantReq);
    setIsApplicantModalOpen(true);
  };

  // Handle accepting incoming join request directly
  const handleAcceptIncoming = async (projectId, membershipId, studentName) => {
    setProcessingApplicantId(membershipId);
    try {
      await acceptJoinRequest(projectId, membershipId);
      playAcceptRequestSound();
      showToast('success', `Accepted ${studentName || 'student'} into project team!`);
      if (isApplicantModalOpen && selectedApplicant?.membershipId === membershipId) {
        setIsApplicantModalOpen(false);
        setSelectedApplicant(null);
      }
      await loadData();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to accept join request.');
    } finally {
      setProcessingApplicantId(null);
    }
  };

  // Handle rejecting incoming join request directly
  const handleRejectIncoming = async (projectId, membershipId, studentName) => {
    setProcessingApplicantId(membershipId);
    try {
      await rejectJoinRequest(projectId, membershipId);
      showToast('info', `Rejected join request from ${studentName || 'student'}.`);
      if (isApplicantModalOpen && selectedApplicant?.membershipId === membershipId) {
        setIsApplicantModalOpen(false);
        setSelectedApplicant(null);
      }
      await loadData();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to reject join request.');
    } finally {
      setProcessingApplicantId(null);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="project-finder-container" id="project-finder-page">
      {/* Toast Notification */}
      {toast.message && (
        <div className={`toast-notification toast-${toast.type}`} id="project-finder-toast">
          <span className="toast-icon">
            {toast.type === 'error' ? '⚠️' : '✓'}
          </span>
          <span className="toast-message">{toast.message}</span>
        </div>
      )}

      {/* Hero Header — Image 2 Reference Matched */}
      <section className="finder-hero-section">
        {/* Decorative sparkles */}
        <div className="decorative-sparkle sparkle-1" aria-hidden="true">✦</div>
        <div className="decorative-sparkle sparkle-2" aria-hidden="true">✧</div>
        <div className="decorative-sparkle sparkle-3" aria-hidden="true">⋆</div>

        {/* Left Column: Heading, Tagline & Action */}
        <div className="finder-hero-left">
          <div className="finder-badge-pill">
            <span className="badge-sparkle">✦</span>
            <span>BUILD • COLLABORATE • CREATE</span>
          </div>

          <h1 className="finder-main-title" id="project-finder-title">
            Build something <br />
            <span className="gradient-text">great together.</span>
          </h1>

          <p className="finder-subtext">
            Discover student projects, find the right teammates, and collaborate on ideas that turn into real-world experiences.
          </p>

          <div className="finder-hero-actions">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-create-project-hero"
              id="create-project-btn"
            >
              <span className="plus-icon">+</span> Create Project
            </button>
          </div>
        </div>

        {/* Center Column: Collaborative Students Vector Illustration */}
        <div className="finder-center-illustration" aria-hidden="true">
          {/* Annotation: Find your team with curved arrow */}
          <div className="illustration-annotation">
            <span>Find your team</span>
            <svg width="38" height="26" viewBox="0 0 50 35" fill="none" className="annotation-arrow">
              <path d="M 8 6 C 24 10, 32 20, 36 28" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="2 3" />
              <polyline points="28,26 36,30 38,20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Floating tech badges */}
          <div className="floating-badge badge-code" title="Code">
            <span>&lt;/&gt;</span>
          </div>
          <div className="floating-badge badge-idea" title="Idea">
            <span>💡</span>
          </div>
          <div className="floating-badge badge-gear" title="Build">
            <span>⚙️</span>
          </div>
          <div className="floating-badge badge-chart" title="Grow">
            <span>📈</span>
          </div>

          {/* Vector students & laptop illustration */}
          <svg viewBox="0 0 280 200" className="students-vector-svg">
            <defs>
              <linearGradient id="finderHoodieGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="finderFemaleShirtGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#9333ea" />
              </linearGradient>
              <linearGradient id="finderTechBoyGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1e40af" />
              </linearGradient>
              <linearGradient id="finderLaptopGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
            </defs>

            {/* Background soft ambient halo */}
            <circle cx="140" cy="115" r="80" fill="rgba(56, 189, 248, 0.08)" />

            {/* Center Student (Leader pointing in hoodie) */}
            <g className="student-center">
              <path d="M 112 110 C 112 95, 168 95, 168 110 L 176 185 L 104 185 Z" fill="url(#finderHoodieGrad)" />
              <path d="M 130 96 L 140 120 L 150 96 Z" fill="#60a5fa" opacity="0.8" />
              <rect x="135" y="86" width="10" height="12" fill="#fed7aa" rx="3" />
              <circle cx="140" cy="74" r="15" fill="#fed7aa" />
              <path d="M 125 72 C 125 56, 155 56, 155 72 C 150 64, 130 64, 125 72 Z" fill="#1e293b" />
              <path d="M 125 72 L 128 78 L 132 72 Z" fill="#1e293b" />
              <circle cx="135" cy="73" r="1.5" fill="#334155" />
              <circle cx="145" cy="73" r="1.5" fill="#334155" />
              <path d="M 137 79 Q 140 82 143 79" stroke="#334155" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              <path d="M 156 122 Q 152 140 144 148" stroke="#3b82f6" strokeWidth="8" strokeLinecap="round" />
              <circle cx="143" cy="149" r="4" fill="#fed7aa" />
            </g>

            {/* Left Student (Girl in purple) */}
            <g className="student-left">
              <path d="M 68 135 C 70 120, 115 120, 118 135 L 122 195 L 64 195 Z" fill="url(#finderFemaleShirtGrad)" />
              <circle cx="92" cy="100" r="14" fill="#fed7aa" />
              <path d="M 77 100 C 76 80, 108 80, 107 100 C 109 118, 102 128, 102 135 C 96 135, 96 112, 88 112 C 80 112, 78 135, 74 135 C 74 125, 76 115, 77 100 Z" fill="#0f172a" />
              <circle cx="89" cy="99" r="1.4" fill="#1e293b" />
              <circle cx="97" cy="99" r="1.4" fill="#1e293b" />
              <path d="M 91 105 Q 94 108 97 105" stroke="#1e293b" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              <path d="M 104 142 Q 112 155 120 162" stroke="#c084fc" strokeWidth="7" strokeLinecap="round" />
            </g>

            {/* Right Student (Developer with glasses) */}
            <g className="student-right">
              <path d="M 160 135 C 165 120, 210 120, 214 135 L 218 195 L 158 195 Z" fill="url(#finderTechBoyGrad)" />
              <circle cx="187" cy="100" r="14" fill="#fed7aa" />
              <path d="M 174 97 C 174 80, 200 80, 200 97 C 196 90, 178 90, 174 97 Z" fill="#1e293b" />
              <circle cx="183" cy="99" r="3.5" stroke="#0f172a" strokeWidth="1.2" fill="none" />
              <circle cx="192" cy="99" r="3.5" stroke="#0f172a" strokeWidth="1.2" fill="none" />
              <line x1="186.5" y1="99" x2="188.5" y2="99" stroke="#0f172a" strokeWidth="1.2" />
              <path d="M 185 106 Q 188 108 190 106" stroke="#0f172a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              <path d="M 170 144 Q 165 156 156 162" stroke="#2563eb" strokeWidth="7" strokeLinecap="round" />
            </g>

            {/* Laptop Base & Open Lid with Stickers */}
            <g className="laptop-device">
              <polygon points="120,138 160,138 165,168 115,168" fill="url(#finderLaptopGrad)" stroke="#64748b" strokeWidth="1" />
              <circle cx="140" cy="153" r="4.5" fill="#ffffff" opacity="0.9" />
              <rect x="127" y="148" width="5" height="5" rx="1" fill="#38bdf8" />
              <rect x="148" y="156" width="6" height="4" rx="1" fill="#818cf8" />
              <circle cx="132" cy="160" r="2.5" fill="#34d399" />
              <polygon points="108,168 172,168 178,175 102,175" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
            </g>
          </svg>
        </div>

        {/* Right Column: Floating interactive preview card with compatibility graph */}
        <div className="finder-right-preview">
          <div className="finder-preview-card">
            {/* Header: SkillSync Project Hub branding (NO teams and projects toggle buttons!) */}
            <div className="preview-card-header">
              <div className="preview-brand-tag">
                <span className="preview-logo-dot"></span>
                <span>SkillSync Project Hub</span>
              </div>
            </div>

            {/* Compatibility Graph Area */}
            <div className="preview-chart-area">
              <div className="preview-chart-top-bar">
                <span className="preview-chart-title">PROJECT COMPATIBILITY</span>
                <span className="preview-sparkle-tag">✦ Build together ✦</span>
              </div>

              {/* Connected 3-node undulating wave graph */}
              <div className="compatibility-flow-graph">
                <svg viewBox="0 0 320 64" className="preview-ribbon-svg" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="finderRibbonGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity="0.85" />
                      <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.85" />
                    </linearGradient>
                    <linearGradient id="finderRibbonGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#c084fc" stopOpacity="0.6" />
                      <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.6" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 15 32 C 55 16, 95 48, 160 32 C 225 16, 265 46, 305 32"
                    fill="none"
                    stroke="url(#finderRibbonGrad1)"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    className="wave-ribbon-1"
                  />
                  <path
                    d="M 15 38 C 65 48, 105 18, 160 34 C 215 50, 255 20, 305 36"
                    fill="none"
                    stroke="url(#finderRibbonGrad2)"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    className="wave-ribbon-2"
                  />
                </svg>

                {/* 3 Circular Node Badges */}
                <div className="graph-nodes-flow">
                  {/* Left Node: Document / Project profile */}
                  <div className="graph-node node-doc" title="Project Specs">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                  </div>

                  {/* Center Node: Team / Partners */}
                  <div className="graph-node node-team" title="Team Synergy">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>

                  {/* Right Node: Code / Projects */}
                  <div className="graph-node node-code" title="Code Stack">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 18 22 12 16 6"></polyline>
                      <polyline points="8 6 2 12 8 18"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Stat Chips */}
            <div className="preview-stats-row">
              {/* Left Chip: Mint/Green Folder Chip */}
              <div className="preview-stat-chip chip-projects-open">
                <div className="chip-icon-box folder-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <div className="stat-meta">
                  <strong className="stat-value">{allProjects.length > 0 ? allProjects.length : 24}</strong>
                  <span className="stat-label">Open Projects</span>
                </div>
              </div>

              {/* Right Chip: Purple/Indigo Team Chip */}
              <div className="preview-stat-chip chip-teams-forming">
                <div className="chip-icon-box team-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div className="stat-meta">
                  <strong className="stat-value">{myProjects.length + joinedProjects.length > 0 ? (myProjects.length + joinedProjects.length) : 8}</strong>
                  <span className="stat-label">Teams Forming</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Navigation Tabs */}
      <div className="finder-tabs-wrapper">
        <div className="finder-tabs-bar" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'explore'}
            className={`finder-tab-btn ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => handleTabChange('explore')}
            id="tab-explore-projects"
          >
            🔍 Explore Projects ({allProjects.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'my-projects'}
            className={`finder-tab-btn ${activeTab === 'my-projects' ? 'active' : ''}`}
            onClick={() => handleTabChange('my-projects')}
            id="tab-my-projects"
          >
            👑 My Projects ({myProjects.length + joinedProjects.length})
            {ownerPendingRequests.length > 0 && (
              <span className="tab-pending-badge" id="tab-pending-requests-counter">
                🔔 {ownerPendingRequests.length}
              </span>
            )}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'my-requests'}
            className={`finder-tab-btn ${activeTab === 'my-requests' ? 'active' : ''}`}
            onClick={() => handleTabChange('my-requests')}
            id="tab-my-requests"
          >
            📥 My Requests ({myRequests.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'joined'}
            className={`finder-tab-btn ${activeTab === 'joined' ? 'active' : ''}`}
            onClick={() => handleTabChange('joined')}
            id="tab-joined-projects"
          >
            👥 Joined Teams ({joinedProjects.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'saved'}
            className={`finder-tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => handleTabChange('saved')}
            id="tab-saved-projects"
          >
            🔖 Saved ({bookmarkedProjects.length})
          </button>
        </div>
      </div>

      {/* ── TAB 1: Explore Projects ─────────────────────────────────── */}
      {activeTab === 'explore' && (
        <div className="tab-pane" id="pane-explore-projects">
          {/* Search & Filter Toolbar */}
          <div className="finder-filter-toolbar" id="project-filter-toolbar">
            <div className="search-input-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects by title or required skills..."
                className="finder-search-input"
                id="project-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="search-clear-btn"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Segmented Buttons */}
            <div className="status-filter-pills-row">
              <button
                type="button"
                className={`filter-pill-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setStatusFilter('ALL')}
              >
                All
              </button>
              <button
                type="button"
                className={`filter-pill-btn ${statusFilter === 'OPEN' ? 'active' : ''}`}
                onClick={() => setStatusFilter('OPEN')}
              >
                🟢 Open
              </button>
              <button
                type="button"
                className={`filter-pill-btn ${statusFilter === 'CLOSED' ? 'active' : ''}`}
                onClick={() => setStatusFilter('CLOSED')}
              >
                🔴 Closed
              </button>
            </div>

            {/* Skills Filter Dropdown */}
            {allAvailableSkills.length > 0 && (
              <div className="filter-select-wrapper">
                <select
                  value={selectedSkillFilter}
                  onChange={(e) => setSelectedSkillFilter(e.target.value)}
                  className="finder-select"
                  id="project-skill-filter"
                >
                  <option value="">All Skills</option>
                  {allAvailableSkills.map((skill) => (
                    <option key={skill} value={skill}>
                      {skill}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="loading-state-box">
              <span className="spinner-lg"></span>
              <p>Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="empty-projects-state" id="empty-projects-state">
              <div className="empty-icon-circle">📂</div>
              <h3>No projects found</h3>
              <p>
                {searchQuery || statusFilter !== 'ALL' || selectedSkillFilter
                  ? 'No projects match your current filters. Try resetting your search terms.'
                  : 'No projects have been published yet. Be the first to start a collaboration!'}
              </p>
              {(searchQuery || statusFilter !== 'ALL' || selectedSkillFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setSelectedSkillFilter('');
                  }}
                  className="btn-secondary mt-3"
                  id="reset-filters-btn"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="projects-cards-grid" id="projects-grid">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  currentUserId={user?.id}
                  onViewDetails={handleOpenDetails}
                  onRequestJoin={handleRequestJoin}
                  isRequesting={requestingProjectId === project.id}
                  membershipStatus={userRequestStatusMap[project.id] || null}
                  pendingRequestsCount={pendingCountsByProject[project.id] || 0}
                  onBookmarkChange={() => setBookmarkTick((t) => t + 1)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: My Projects (Created by Me & Joined Projects) ──────── */}
      {activeTab === 'my-projects' && (
        <div className="tab-pane" id="pane-my-projects">
          {loading ? (
            <div className="loading-state-box">
              <span className="spinner-lg"></span>
              <p>Loading your projects...</p>
            </div>
          ) : (
            <div className="my-projects-sections-wrapper">
              {/* Section 0: Incoming Team Join Requests for Projects Owned by User */}
              {ownerPendingRequests.length > 0 && (
                <div className="owner-incoming-requests-banner mb-5" id="incoming-join-requests-section">
                  <div className="banner-header">
                    <div className="banner-title-cluster">
                      <span className="banner-bell-icon">🔔</span>
                      <div>
                        <h2 className="banner-title">Incoming Team Join Requests</h2>
                        <p className="banner-subtitle">
                          Students who requested to join your projects. Review their profile and accept or reject.
                        </p>
                      </div>
                    </div>
                    <span className="badge-pending-total" id="incoming-pending-total-badge">
                      {ownerPendingRequests.length} Pending
                    </span>
                  </div>

                  <div className="incoming-requests-grid" id="incoming-requests-grid">
                    {ownerPendingRequests.map((req) => (
                      <div key={req.membershipId} className="incoming-request-card" id={`incoming-req-${req.membershipId}`}>
                        <div className="applicant-top-row">
                          <div className="applicant-avatar-ring">
                            {req.userName ? req.userName.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div className="applicant-details-box">
                            <h3 className="applicant-full-name">{req.userName}</h3>
                            <div className="applicant-project-target">
                              <span className="project-target-label">For Project:</span>
                              <strong className="project-target-name">{req.projectTitle}</strong>
                            </div>
                          </div>
                          <span className="request-time-pill">
                            {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString() : 'Recently'}
                          </span>
                        </div>

                        {req.userSkills && req.userSkills.length > 0 && (
                          <div className="applicant-skills-chips">
                            {req.userSkills.slice(0, 4).map((sk, idx) => (
                              <span key={idx} className="skill-chip-mini">✦ {sk}</span>
                            ))}
                            {req.userSkills.length > 4 && (
                              <span className="skill-chip-mini">+{req.userSkills.length - 4} more</span>
                            )}
                          </div>
                        )}

                        <div className="incoming-request-actions">
                          <button
                            type="button"
                            className="btn-applicant-view-profile"
                            onClick={() => handleViewApplicantProfile(req)}
                            id={`view-profile-btn-${req.membershipId}`}
                          >
                            👤 View Profile
                          </button>
                          <button
                            type="button"
                            className="btn-applicant-accept"
                            onClick={() => handleAcceptIncoming(req.projectId, req.membershipId, req.userName)}
                            disabled={processingApplicantId === req.membershipId}
                            id={`accept-incoming-btn-${req.membershipId}`}
                          >
                            ✓ Accept
                          </button>
                          <button
                            type="button"
                            className="btn-applicant-reject"
                            onClick={() => handleRejectIncoming(req.projectId, req.membershipId, req.userName)}
                            disabled={processingApplicantId === req.membershipId}
                            id={`reject-incoming-btn-${req.membershipId}`}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 1: Created by Me */}
              <div className="my-projects-sub-section">
                <div className="sub-section-header">
                  <div>
                    <h2 className="sub-section-title">Created by Me</h2>
                    <p className="sub-section-subtitle">
                      Projects where you are the project owner.
                    </p>
                  </div>
                </div>

                {myProjects.length === 0 ? (
                  <div className="empty-projects-state sub-empty">
                    <div className="empty-icon-circle">💡</div>
                    <h3>You haven't created any projects yet</h3>
                    <p>Start a new project using the "Create Project" button in the banner above and build your college team.</p>
                  </div>
                ) : (
                  <div className="projects-cards-grid" id="my-projects-grid">
                    {myProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        currentUserId={user?.id}
                        onViewDetails={handleOpenDetails}
                        onRequestJoin={handleRequestJoin}
                        membershipStatus={null}
                        pendingRequestsCount={pendingCountsByProject[project.id] || 0}
                        onBookmarkChange={() => setBookmarkTick((t) => t + 1)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Joined Projects */}
              <div className="my-projects-sub-section mt-5">
                <div className="sub-section-header">
                  <div>
                    <h2 className="sub-section-title">Joined Projects</h2>
                    <p className="sub-section-subtitle">
                      Projects where you are an accepted team member.
                    </p>
                  </div>
                </div>

                {joinedProjects.length === 0 ? (
                  <div className="empty-projects-state sub-empty">
                    <div className="empty-icon-circle">🤝</div>
                    <h3>You haven't joined any projects yet</h3>
                    <p>Explore projects and request to collaborate with other teams.</p>
                    <button
                      type="button"
                      onClick={() => handleTabChange('explore')}
                      className="btn-explore-projects-action"
                      id="explore-from-my-joined"
                    >
                      🔍 Explore Projects
                    </button>
                  </div>
                ) : (
                  <div className="projects-cards-grid">
                    {joinedProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        currentUserId={user?.id}
                        onRequestJoin={handleRequestJoin}
                        membershipStatus="ACCEPTED"
                        onBookmarkChange={() => setBookmarkTick((t) => t + 1)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: My Requests (Projects I Requested to Join) ─────────── */}
      {activeTab === 'my-requests' && (
        <div className="tab-pane" id="pane-my-requests">
          {loading ? (
            <div className="loading-state-box">
              <span className="spinner-lg"></span>
              <p>Loading your project requests...</p>
            </div>
          ) : myRequests.length === 0 ? (
            <div className="empty-projects-state" id="empty-my-requests">
              <div className="empty-icon-circle">📨</div>
              <h3>No project requests yet</h3>
              <p>Explore projects and find something interesting to collaborate on.</p>
              <button
                type="button"
                onClick={() => handleTabChange('explore')}
                className="btn-explore-projects-action"
                id="explore-from-my-requests"
              >
                🔍 Explore Projects
              </button>
            </div>
          ) : (
            <div className="requests-cards-grid" id="my-requests-list">
              {myRequests.map((req) => {
                const isAccepted = req.status === 'ACCEPTED';
                const isPending = req.status === 'PENDING';
                const isRejected = req.status === 'REJECTED';

                return (
                  <div key={req.membershipId} className="project-request-item-card" id={`my-request-card-${req.membershipId}`}>
                    <div className="request-card-header">
                      <h3 className="request-card-title">{req.projectTitle}</h3>
                      <span className="request-card-owner">
                        Owner: <strong>{req.ownerName || 'Creator'}</strong>
                      </span>
                    </div>

                    <div className="request-status-indicator">
                      {isAccepted ? (
                        <span className="badge-request-status badge-accepted status-badge status-open">
                          ✓ Accepted Member
                        </span>
                      ) : isPending ? (
                        <span className="badge-request-status badge-pending status-badge status-progress">
                          ⌛ Pending Approval (Request Sent)
                        </span>
                      ) : isRejected ? (
                        <span className="badge-request-status badge-rejected status-badge status-completed">
                          🔴 Rejected
                        </span>
                      ) : (
                        <span className="badge-request-status">{req.status}</span>
                      )}
                    </div>

                    {req.requestedAt && (
                      <div className="request-date-info">
                        Sent on {new Date(req.requestedAt).toLocaleDateString()}
                      </div>
                    )}

                    <div className="request-card-actions">
                      <button
                        type="button"
                        onClick={() => navigate(`/projects/${req.projectId}`)}
                        className="btn-view-request-project"
                        id={`view-request-project-${req.membershipId}`}
                      >
                        View Project
                      </button>

                      {isAccepted && (
                        <button
                          type="button"
                          onClick={() => navigate(`/projects/${req.projectId}`)}
                          className="btn-chat-request-project"
                        >
                          💬 Open Group Chat
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Joined Projects ────────────────────────────────────── */}
      {activeTab === 'joined' && (
        <div className="tab-pane" id="pane-joined-projects">
          {loading ? (
            <div className="loading-state-box">
              <span className="spinner-lg"></span>
              <p>Loading joined projects...</p>
            </div>
          ) : joinedProjects.length === 0 ? (
            <div className="empty-projects-state" id="empty-joined-projects">
              <div className="empty-icon-circle">🤝</div>
              <h3>No joined project teams yet</h3>
              <p>Explore projects and request to collaborate with other teams.</p>
              <button
                type="button"
                onClick={() => handleTabChange('explore')}
                className="btn-explore-projects-action"
                id="explore-from-joined-projects"
              >
                🔍 Explore Projects
              </button>
            </div>
          ) : (
            <div className="projects-cards-grid" id="joined-projects-grid">
              {joinedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  currentUserId={user?.id}
                  onViewDetails={handleOpenDetails}
                  onRequestJoin={handleRequestJoin}
                  membershipStatus="ACCEPTED"
                  onBookmarkChange={() => setBookmarkTick((t) => t + 1)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: Saved / Bookmarked Projects ───────────────────────── */}
      {activeTab === 'saved' && (
        <div className="tab-pane" id="pane-saved-projects">
          {bookmarkedProjects.length === 0 ? (
            <div className="empty-projects-state" id="empty-saved-projects">
              <div className="empty-icon-circle">🔖</div>
              <h3>No saved projects</h3>
              <p>Bookmark projects by clicking the "Save" button on any project card.</p>
              <button
                type="button"
                onClick={() => handleTabChange('explore')}
                className="btn-explore-projects-action"
                id="explore-from-saved"
              >
                🔍 Explore Projects
              </button>
            </div>
          ) : (
            <div className="projects-cards-grid">
              {bookmarkedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  currentUserId={user?.id}
                  onRequestJoin={handleRequestJoin}
                  membershipStatus={userRequestStatusMap[project.id] || null}
                  onBookmarkChange={() => setBookmarkTick((t) => t + 1)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateProject={handleCreateProject}
        isCreating={isCreatingProject}
      />

      {/* Project Details Modal */}
      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedProject(null);
          }}
          currentUserId={user?.id}
          onRequestJoin={handleRequestJoin}
          isRequestingJoin={requestingProjectId === selectedProject.id}
          membershipStatus={userRequestStatusMap[selectedProject.id] || null}
          onActionComplete={loadData}
        />
      )}

      {/* Applicant Profile Modal for Owner Review */}
      {selectedApplicant && (
        <ApplicantProfileModal
          applicant={selectedApplicant}
          isOpen={isApplicantModalOpen}
          onClose={() => {
            setIsApplicantModalOpen(false);
            setSelectedApplicant(null);
          }}
          onAccept={handleAcceptIncoming}
          onReject={handleRejectIncoming}
          isBusy={processingApplicantId === selectedApplicant?.membershipId}
        />
      )}
    </div>
  );
}
