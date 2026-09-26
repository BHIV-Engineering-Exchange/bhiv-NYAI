import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Search,
  LayoutDashboard,
  MessageSquare,
  Scale,
  FileText,
  Bot,
  Clock3,
  Globe2,
  BookOpen,
  Library,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import './CommandPalette.css';

const COMMAND_ITEMS = [
  {
    id: 'dashboard',
    label: 'Overview & Dashboard',
    description: 'System operational status and core legal modules',
    category: 'Navigation',
    icon: LayoutDashboard,
    keywords: 'home dashboard overview main index'
  },
  {
    id: 'consult',
    label: 'Ask NYAI (Legal Consultation)',
    description: 'Structured sovereign legal consultation across jurisdictions',
    category: 'Legal Operations',
    icon: MessageSquare,
    keywords: 'ask legal consultation query facts dispute advise'
  },
  {
    id: 'decision',
    label: 'Decisions & Determinations',
    description: 'Auditable legal decisions, rationale, and procedural routing',
    category: 'Legal Operations',
    icon: Scale,
    keywords: 'decision determination review escalate inform insufficient'
  },
  {
    id: 'decision-draft',
    label: 'Decision Document Drafter',
    description: 'Formal multi-statutory legal decision documents',
    category: 'Legal Operations',
    icon: FileText,
    keywords: 'draft decision document formal report'
  },
  {
    id: 'law-agent',
    label: 'Law Agent Multi-Agent Engine',
    description: 'Agentic reasoning steps, verification trace, and provenance',
    category: 'Intelligence',
    icon: Bot,
    keywords: 'law agent multi-agent engine reasoning trace telemetry'
  },
  {
    id: 'timeline',
    label: 'Case Timeline Generator',
    description: 'Procedural milestones, limitation dates, and trial schedules',
    category: 'Procedural',
    icon: Clock3,
    keywords: 'timeline case events milestones deadlines dates'
  },
  {
    id: 'procedure',
    label: 'Jurisdiction & Court Structure',
    description: 'India, UK, and UAE sovereign court hierarchies and procedures',
    category: 'Procedural',
    icon: Globe2,
    keywords: 'jurisdiction procedure india uk uae courts acts'
  },
  {
    id: 'glossary',
    label: 'Legal Glossary & Statutory Lexicon',
    description: 'Cross-jurisdictional legal definitions and statutory provisions',
    category: 'Reference',
    icon: BookOpen,
    keywords: 'glossary dictionary terms definition legal lexicon'
  },
  {
    id: 'docs',
    label: 'Documentation & Architecture',
    description: 'Platform overview, API diagnostics, and sovereignty guidelines',
    category: 'Reference',
    icon: Library,
    keywords: 'documentation help api architecture guides'
  },
  {
    id: 'mitra',
    label: 'MITRA Platform Companion',
    description: 'Launch embedded BHIV ecosystem companion assistant',
    category: 'Ecosystem',
    icon: Sparkles,
    keywords: 'mitra companion ai chat assistant ecosystem'
  }
];

const CommandPalette = ({
  isOpen,
  onClose,
  onSelectView,
  onOpenMitra
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Filter items based on search term
  const filteredItems = COMMAND_ITEMS.filter(item => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.label.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      item.keywords.toLowerCase().includes(term)
    );
  });

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelectItem(filteredItems[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, onClose]);

  const handleSelectItem = (item) => {
    onClose();
    if (item.id === 'mitra') {
      onOpenMitra?.();
    } else {
      onSelectView?.(item.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="bhiv-cmd-backdrop"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Command Palette"
    >
      <div
        className="bhiv-cmd-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="bhiv-cmd-input-wrap">
          <Search size={18} className="bhiv-cmd-input-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            className="bhiv-cmd-input"
            placeholder="Type a command or search workspace... (Esc to close)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-autocomplete="list"
            aria-controls="cmd-palette-list"
          />
          <kbd className="bhiv-cmd-kbd">ESC</kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          id="cmd-palette-list"
          className="bhiv-cmd-list"
          role="listbox"
        >
          {filteredItems.length === 0 ? (
            <div className="bhiv-cmd-empty">
              No matching modules or actions found for &ldquo;{searchTerm}&rdquo;.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const IconComp = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`bhiv-cmd-item ${isSelected ? 'bhiv-cmd-item--selected' : ''}`}
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="bhiv-cmd-item__icon-wrap">
                    <IconComp size={16} />
                  </div>
                  <div className="bhiv-cmd-item__body">
                    <div className="bhiv-cmd-item__title">
                      <span>{item.label}</span>
                      <span className="bhiv-cmd-item__category">{item.category}</span>
                    </div>
                    <div className="bhiv-cmd-item__desc">{item.description}</div>
                  </div>
                  <ArrowRight size={14} className="bhiv-cmd-item__arrow" aria-hidden="true" />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="bhiv-cmd-footer">
          <span className="bhiv-cmd-shortcut"><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
          <span className="bhiv-cmd-shortcut"><kbd>↵</kbd> Select</span>
          <span className="bhiv-cmd-shortcut"><kbd>esc</kbd> Dismiss</span>
        </div>
      </div>
    </div>
  );
};

CommandPalette.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelectView: PropTypes.func.isRequired,
  onOpenMitra: PropTypes.func
};

export default CommandPalette;
