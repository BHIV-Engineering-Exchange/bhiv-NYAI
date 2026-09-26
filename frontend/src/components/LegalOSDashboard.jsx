import React from 'react';
import PropTypes from 'prop-types';
import {
  LayoutDashboard,
  MessageSquare,
  Scale,
  FileText,
  Bot,
  Clock3,
  Globe2,
  BookOpen,
  Library,
  Shield,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { GlassCard, BHIVButton, StatusBadge } from './ui/index.js';
import './LegalOSDashboard.css';

/**
 * Redesigned LegalOSDashboard
 * Unified BHIV design language, professional icons, no emojis.
 */
const LegalOSDashboard = ({ onModuleSelect }) => {
  const modules = [
    {
      id: 'consult',
      title: 'Ask Legal Question',
      description: 'Submit legal scenarios for real-time statutory reasoning, procedural routes, and jurisdiction mapping.',
      Icon: MessageSquare,
      badge: 'CORE QUERY',
      actionText: 'Launch Legal Query'
    },
    {
      id: 'decision',
      title: 'Legal Decisions',
      description: 'Access structured judicial determinations, advisory recommendation flags, and precedent findings.',
      Icon: Scale,
      badge: 'STRUCTURED',
      actionText: 'Review Decisions'
    },
    {
      id: 'procedure',
      title: 'Jurisdiction Procedure',
      description: 'Explore procedural workflows, limitation periods, and statutory filing guidelines across India, UK, and UAE.',
      Icon: Globe2,
      badge: 'MULTI-REGION',
      actionText: 'Explore Procedures'
    },
    {
      id: 'timeline',
      title: 'Case Timeline Generator',
      description: 'Build comprehensive procedural event timelines, statutory milestones, and chronological roadmaps.',
      Icon: Clock3,
      badge: 'CHRONOLOGY',
      actionText: 'Build Timeline'
    },
    {
      id: 'glossary',
      title: 'Legal Glossary',
      description: 'Search jurisdictional legal terminology, statutory definitions, and doctrine cross-references.',
      Icon: BookOpen,
      badge: 'LEXICON',
      actionText: 'Search Glossary'
    },
    {
      id: 'law-agent',
      title: 'Law Agent Engine',
      description: 'Inspect multi-agent legal consultation workflows, evidence chains, and reasoning traces.',
      Icon: Bot,
      badge: 'AGENTIC',
      actionText: 'Inspect Agent'
    }
  ];

  const capabilities = [
    { Icon: Shield, label: 'Sovereign Compliant' },
    { Icon: Activity, label: 'Transparent Reasoning' },
    { Icon: Globe2, label: 'Multi-Jurisdiction (IN/UK/UAE)' },
    { Icon: CheckCircle2, label: 'Audit-Grade Provenance' }
  ];

  return (
    <div className="bhiv-dashboard">
      {/* Restrained BHIV Hero Section */}
      <section className="bhiv-dashboard__hero" aria-labelledby="dashboard-hero-title">
        <div className="bhiv-dashboard__eyebrow">
          <span>BHIV / NYAI</span>
        </div>

        <h1 id="dashboard-hero-title" className="bhiv-dashboard__heading">
          Legal Intelligence, Unified.
        </h1>

        <p className="bhiv-dashboard__subtitle">
          Operational legal reasoning and decision intelligence across sovereign jurisdictions.
          Evaluate statutory procedures, precedent routes, and structured outcomes with audit-grade fidelity.
        </p>

        <div className="bhiv-dashboard__cta-group">
          <BHIVButton
            variant="primary"
            size="lg"
            onClick={() => onModuleSelect('consult')}
          >
            Ask a Legal Question
          </BHIVButton>

          <BHIVButton
            variant="ghost"
            size="lg"
            onClick={() => onModuleSelect('decision')}
          >
            Review Decisions
          </BHIVButton>
        </div>
      </section>

      {/* Operational Capabilities Bar */}
      <section className="bhiv-dashboard__capabilities" aria-label="System Capabilities">
        {capabilities.map((cap, idx) => (
          <div key={idx} className="bhiv-dashboard__cap-item">
            <cap.Icon size={14} strokeWidth={2} className="bhiv-dashboard__cap-icon" aria-hidden="true" />
            <span>{cap.label}</span>
          </div>
        ))}
      </section>

      {/* Core Operational Modules */}
      <section className="bhiv-dashboard__section" aria-labelledby="core-modules-heading">
        <div className="bhiv-dashboard__section-header">
          <h2 id="core-modules-heading" className="bhiv-dashboard__section-title">
            Operational Modules
          </h2>
          <span className="bhiv-dashboard__section-desc">
            Select a module to initiate consultation or procedure workflows
          </span>
        </div>

        <div className="bhiv-dashboard__grid">
          {modules.map((module) => (
            <GlassCard
              key={module.id}
              interactive
              padding="normal"
              className="bhiv-dashboard__module-card"
              onClick={() => onModuleSelect(module.id)}
              aria-label={`Open ${module.title}`}
            >
              <div className="bhiv-dashboard__card-top">
                <div className="bhiv-dashboard__card-header">
                  <div className="bhiv-dashboard__card-icon" aria-hidden="true">
                    <module.Icon size={20} strokeWidth={1.75} />
                  </div>
                  <StatusBadge variant="neutral" size="sm">
                    {module.badge}
                  </StatusBadge>
                </div>
                <h3 className="bhiv-dashboard__card-title">{module.title}</h3>
                <p className="bhiv-dashboard__card-desc">{module.description}</p>
              </div>

              <div className="bhiv-dashboard__card-action" aria-hidden="true">
                <span>{module.actionText}</span>
                <span>→</span>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>
    </div>
  );
};

LegalOSDashboard.propTypes = {
  onModuleSelect: PropTypes.func.isRequired
};

export default LegalOSDashboard;
