import React, { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
  faSignOutAlt,
  faChartLine,
  faVolumeUp,
  faVolumeMute,
  faTrophy,
  faUser,
  faGraduationCap,
  faBell,
  faBars,
  faTimes,
  faHome,

  faCommentDots
} from '@fortawesome/free-solid-svg-icons';
import './Layout.css';
import { AuthContext } from './AuthContext';
import NotificationDropdown from './NotificationDropdown';
import SoundConfigModal from './SoundConfigModal';
import { soundManager } from '../utils/SoundManager';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const currentLocation = useLocation();
  const { username, logout, role, fullName } = useContext(AuthContext);

  // Sound configuration state
  const [showSoundConfig, setShowSoundConfig] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(soundManager.isSoundEnabled);

  // Mobile sidebar toggle
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check if current route is teacher dashboard
  const isTeacherDashboard = currentLocation.pathname === '/teacher-dash';

  // Get current active tab from URL or location state
  const getCurrentTab = () => {
    if (currentLocation.pathname !== '/teacher-dash') return null;
    if (currentLocation.state?.activeTab) return currentLocation.state.activeTab;
    const params = new URLSearchParams(currentLocation.search);
    return params.get('tab') || 'homework';
  };

  // Handle navigation for teachers with tab state
  const handleTeacherNavigation = (link) => {
    if (role === 'teacher' && link.tabName) {
      navigate(`/teacher-dash?tab=${link.tabName}`, { state: { activeTab: link.tabName } });
    } else {
      navigate(link.path);
    }
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    console.log('Logging out...');
    logout();
    navigate('/');
  };

  // Navigation links based on role
  const studentLinks = [
    { path: '/student-dash', label: 'Dashboard', icon: faHome },
    { path: '/analytics', label: 'Analytics', icon: faChartLine },
    // { path: '/leaderboard', label: 'Leaderboard', icon: faTrophy },
  ];

  const teacherLinks = [
      { path: '/student-dash', label: 'Dashboard', icon: faHome },
    { path: '/teacher-dash?tab=exercise', label: 'Homework', icon: '📝', tabName: 'exercise' },
    { path: '/teacher-dash?tab=upload-homework', label: 'Upload Homework', icon: '📑', tabName: 'upload-homework' },
    { path: '/teacher-dash?tab=classwork', label: 'Classwork', icon: '✏', tabName: 'classwork' },
    // { path: '/teacher-dash?tab=upload-classwork', label: 'Upload Classwork', icon: '📑', tabName: 'upload-classwork' },
    { path: '/teacher-dash?tab=homework', label: 'Worksheets', icon: '📄', tabName: 'homework' },
    { path: '/teacher-dash?tab=exam-correction', label: 'Exam Correction', icon: '📄', tabName: 'exam-correction' },
    { path: '/teacher-dash?tab=class', label: 'Class Analysis', icon: '📊', tabName: 'class' },
    { path: '/teacher-dash?tab=student', label: 'Student Analysis', icon: '👤', tabName: 'student' },
    { path: '/teacher-dash?tab=progress', label: 'Progress', icon: '📈', tabName: 'progress' },
  ];

  // Get the appropriate links based on role
  const navigationLinks = role === 'teacher' ? teacherLinks : studentLinks;

  // Get user initials for avatar
  const getUserInitials = () => {
    const name = fullName || username || 'U';
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div id="main-content1">
      {/* Mobile menu toggle button */}
      <button
        className="mobile-menu-toggle d-md-none"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        <FontAwesomeIcon icon={isSidebarOpen ? faTimes : faBars} />
      </button>

      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={toggleSidebar}
      />

      {/* Side Navigation */}
      <aside className={`sidebar-navigation ${isSidebarOpen ? 'open' : ''}`}>
        {/* Brand/Logo */}
        <div className="">
          <div className="sidebar-brand">
            <img src="/images/smart.png" alt="Logo" style={{ width: '100%', height: '20vh', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-menu">
          <ul className="sidebar-menu-list">
            <li className="sidebar-menu-item sidebar-notification-wrapper">
              <NotificationDropdown />
            </li>
            {navigationLinks.map((link) => {
              const currentTab = getCurrentTab();
              const isActive = role === 'teacher' && link.tabName
                ? currentTab === link.tabName
                : currentLocation.pathname === link.path;

              return (
                <li key={link.path} className="sidebar-menu-item">
                  <a
                    className={`sidebar-menu-link ${isActive ? 'active' : ''}`}
                    onClick={() => handleTeacherNavigation(link)}
                  >
                    {typeof link.icon === 'string' ? (
                      <span className="sidebar-menu-icon">{link.icon}</span>
                    ) : (
                      <FontAwesomeIcon icon={link.icon} className="sidebar-menu-icon" />
                    )}
                    <span className="sidebar-menu-text">{link.label}</span>
                  </a>
                </li>
              );
            })}

            {/* Notifications Dropdown */}

            {/* Sound Toggle as menu item */}
            {/* <li className="sidebar-menu-item">
              <div
                className="sidebar-menu-link"
                onClick={() => setShowSoundConfig(true)}
              >
                <FontAwesomeIcon
                  icon={isSoundEnabled ? faVolumeUp : faVolumeMute}
                  className="sidebar-menu-icon"
                />
                <span className="sidebar-menu-text">Sound</span>
              </div>
            </li> */}

            {/* Feedback menu item */}
            {/* <li className="sidebar-menu-item">
              <a className="sidebar-menu-link">
                <FontAwesomeIcon icon={faCommentDots} className="sidebar-menu-icon" />
                <span className="sidebar-menu-text">Feedback</span>
              </a>
            </li> */}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {/* User Info */}

          
      { role==='student' && (<div className="sidebar-user-info">
            <div className="sidebar-user-avatar">
              {getUserInitials()}
            </div>
            <div className="sidebar-user-details">
              <p className="sidebar-user-name">{fullName || username}</p>
              <p className="sidebar-user-role">{role === 'student' ? 'Student' : 'Teacher'}</p>
            </div>
          </div>)}

          {/* Logout Button */}
          <button
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content-area">
        {children}
      </main>

      {/* Sound Configuration Modal */}
      <SoundConfigModal
        show={showSoundConfig}
        onHide={() => setShowSoundConfig(false)}
      />
    </div>
  );
};

export default Layout;
