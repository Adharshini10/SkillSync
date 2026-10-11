import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import authIllustration from '../assets/auth_illustration.jpg';

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}) {
  return (
    <div className="auth-page-wrapper">
      {/* Background Decorative Sparkles & Waves */}
      <div className="auth-bg-decorations" aria-hidden="true">
        <span className="sparkle sparkle-1">✦</span>
        <span className="sparkle sparkle-2">✧</span>
        <span className="sparkle sparkle-3">✦</span>
        <span className="sparkle sparkle-4">✧</span>
        <span className="sparkle sparkle-5">★</span>
        <span className="sparkle sparkle-6">✦</span>
        <span className="sparkle sparkle-7">✧</span>
        <span className="sparkle sparkle-8">⋆</span>
        <span className="sparkle sparkle-9">✦</span>
        <span className="sparkle sparkle-10">★</span>
        <span className="sparkle sparkle-11">✧</span>
        <span className="sparkle sparkle-12">⋆</span>
        <span className="sparkle sparkle-13">✦</span>
        <span className="sparkle sparkle-14">✧</span>

        {/* Floating playful quote in bottom-right corner */}
        <div className="auth-corner-quote">
          <span>Same Goals</span>
          <span>Bigger Dreams ♡</span>
        </div>
      </div>

      {/* Floating Theme Toggle in top-right */}
      <div className="auth-floating-actions">
        <ThemeToggle id="auth-theme-toggle" className="auth-theme-pill" />
      </div>

      <div className="auth-layout-container">
        {/* ── Left Hero Panel ─────────────────────────────────── */}
        <section className="auth-hero-panel">
          {/* Top Brand Logo */}
          <Link to="/" className="auth-brand-header">
            <div className="auth-brand-logo-icon">
              <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" fill="url(#authBgSwirl)" opacity="0.2" />
                <path
                  d="M14 20C14 16.6863 16.6863 14 20 14C23.3137 14 26 16.6863 26 20C26 23.3137 23.3137 26 20 26"
                  stroke="url(#authStroke1)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  d="M10 20C10 14.4772 14.4772 10 20 10C25.5228 10 30 14.4772 30 20C30 25.5228 25.5228 30 20 30C15.8 30 12.2 27.4 10.7 23.7"
                  stroke="url(#authStroke2)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="20" cy="20" r="3" fill="#2dd4bf" />
                <defs>
                  <linearGradient id="authBgSwirl" x1="0" y1="0" x2="40" y2="40">
                    <stop stopColor="#0d9488" />
                    <stop offset="1" stopColor="#38bdf8" />
                  </linearGradient>
                  <linearGradient id="authStroke1" x1="14" y1="14" x2="26" y2="26">
                    <stop stopColor="#2dd4bf" />
                    <stop offset="1" stopColor="#38bdf8" />
                  </linearGradient>
                  <linearGradient id="authStroke2" x1="10" y1="10" x2="30" y2="30">
                    <stop stopColor="#38bdf8" />
                    <stop offset="1" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="auth-brand-title">SkillSync</span>
          </Link>

          {/* Pill Badge */}
          <div className="auth-badge-pill">
            <span className="auth-badge-dot"></span>
            Learn • Connect • Grow
          </div>

          {/* Big Headline */}
          <div className="auth-hero-headline-group">
            <h1 className="auth-hero-main-title">
              Your Skills.
              <span className="auth-hero-gradient-text">Bigger Opportunities.</span>
            </h1>
            <p className="auth-hero-subtitle">
              SkillSync helps you find the right people, exciting projects and build your future — together.
            </p>
          </div>

          {/* Illustration with Floating Badges & Arrows */}
          <div className="auth-illustration-container">
            {/* Floating Badge 1: Find your team */}
            <div className="auth-float-tag tag-team">
              <span className="float-tag-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </span>
              <div className="float-tag-text">
                <strong>Find your</strong>
                <span>team</span>
              </div>
              <svg className="float-tag-arrow arrow-left" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 4c0 8 6 12 14 14m0 0l-4-4m4 4l-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Floating Badge 2: Work on real projects */}
            <div className="auth-float-tag tag-projects">
              <span className="float-tag-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
              </span>
              <div className="float-tag-text">
                <strong>Work on</strong>
                <span>real projects</span>
              </div>
              <svg className="float-tag-arrow arrow-right" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20 4c0 8-6 12-14 14m0 0l4-4m-4 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Playful Floating Annotation */}
            <div className="auth-float-annotation">
              <span>Better</span>
              <span>Together</span>
              <span className="annotation-sparkle">✦</span>
            </div>

            {/* Center Vector Illustration */}
            <div className="auth-illustration-art-frame">
              <img
                src={authIllustration}
                alt="Students collaborating on laptops and sharing skills"
                className="auth-hero-img"
              />
            </div>
          </div>

          {/* Bottom 3 Feature Highlights */}
          <div className="auth-feature-pillars">
            <div className="auth-pillar-item">
              <div className="pillar-icon-box pillar-icon-skills">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                </svg>
              </div>
              <div className="pillar-text">
                <h4>Build Skills</h4>
                <p>Learn new technologies</p>
              </div>
            </div>

            <div className="auth-pillar-item">
              <div className="pillar-icon-box pillar-icon-connections">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div className="pillar-text">
                <h4>Make Connections</h4>
                <p>Find like-minded peers</p>
              </div>
            </div>

            <div className="auth-pillar-item">
              <div className="pillar-icon-box pillar-icon-projects">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  <polygon points="12 11 12 17 17 14"></polygon>
                </svg>
              </div>
              <div className="pillar-text">
                <h4>Work on Projects</h4>
                <p>Turn ideas into reality</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Right Auth Card Panel ────────────────────────────── */}
        <section className="auth-form-panel">
          <div className="auth-card-wrapper">
            {/* Centered Brand Icon on Card Header */}
            <div className="auth-card-top-header">
              <div className="auth-card-brand-mark">
                <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="18" fill="url(#cardBgSwirl)" opacity="0.25" />
                  <path
                    d="M14 20C14 16.6863 16.6863 14 20 14C23.3137 14 26 16.6863 26 20C26 23.3137 23.3137 26 20 26"
                    stroke="url(#cardStroke1)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10 20C10 14.4772 14.4772 10 20 10C25.5228 10 30 14.4772 30 20C30 25.5228 25.5228 30 20 30C15.8 30 12.2 27.4 10.7 23.7"
                    stroke="url(#cardStroke2)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="20" cy="20" r="3" fill="#2dd4bf" />
                  <defs>
                    <linearGradient id="cardBgSwirl" x1="0" y1="0" x2="40" y2="40">
                      <stop stopColor="#0d9488" />
                      <stop offset="1" stopColor="#06b6d4" />
                    </linearGradient>
                    <linearGradient id="cardStroke1" x1="14" y1="14" x2="26" y2="26">
                      <stop stopColor="#0d9488" />
                      <stop offset="1" stopColor="#06b6d4" />
                    </linearGradient>
                    <linearGradient id="cardStroke2" x1="10" y1="10" x2="30" y2="30">
                      <stop stopColor="#06b6d4" />
                      <stop offset="1" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="card-brand-title">SkillSync</span>
              </div>

              <h2 className="auth-card-title">{title}</h2>
              <p className="auth-card-subtitle">{subtitle}</p>
            </div>

            {/* Form body injected from Login or Register */}
            <div className="auth-card-body">{children}</div>

            {/* Footer Navigation */}
            <div className="auth-card-footer">{footer}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
