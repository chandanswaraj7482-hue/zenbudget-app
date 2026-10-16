import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  X, 
  Check, 
  Sparkles, 
  RotateCcw 
} from 'lucide-react';

interface QuickPreset {
  label: string;
  daysToAdd?: number;
  monthsToAdd?: number;
  yearsToAdd?: number;
  isToday?: boolean;
}

interface ZenDatePickerModalProps {
  isOpen: boolean;
  value: string; // Format 'YYYY-MM-DD'
  onChange: (dateStr: string) => void;
  onClose: () => void;
  title?: string;
  minDate?: string;
  maxDate?: string;
}

const DEFAULT_PRESETS: QuickPreset[] = [
  { label: 'Today', isToday: true },
  { label: '+1 Month', monthsToAdd: 1 },
  { label: '+3 Months', monthsToAdd: 3 },
  { label: '+6 Months', monthsToAdd: 6 },
  { label: '+1 Year', yearsToAdd: 1 },
  { label: '+3 Years', yearsToAdd: 3 }
];

export const ZenDatePickerModal: React.FC<ZenDatePickerModalProps> = ({
  isOpen,
  value,
  onChange,
  onClose,
  title = 'Select Date',
  minDate,
  maxDate
}) => {
  // Parse initial date safely
  const initialDate = useMemo(() => {
    if (!value) return new Date();
    const parts = value.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return new Date(y, m, d);
    }
    return new Date();
  }, [value]);

  const [currentNav, setCurrentNav] = useState<Date>(initialDate);
  const [selectedDate, setSelectedDate] = useState<string>(value || '');
  const [showYearPicker, setShowYearPicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const d = value ? new Date(value.replace(/-/g, '/')) : new Date();
      setCurrentNav(isNaN(d.getTime()) ? new Date() : d);
      setSelectedDate(value || '');
      setShowYearPicker(false);
    }
  }, [isOpen, value]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isLight = typeof document !== 'undefined' && document.body.classList.contains('light-theme');

  const navYear = currentNav.getFullYear();
  const navMonth = currentNav.getMonth();

  // Helper date calculations
  const daysInMonth = new Date(navYear, navMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(navYear, navMonth, 1).getDay();

  // Today string YYYY-MM-DD
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const formatToISO = (y: number, m: number, d: number) => {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const handleDayClick = (day: number) => {
    const formatted = formatToISO(navYear, navMonth, day);
    setSelectedDate(formatted);
  };

  const handleApplyPreset = (preset: QuickPreset) => {
    const base = new Date();
    if (preset.isToday) {
      // today
    } else if (preset.daysToAdd) {
      base.setDate(base.getDate() + preset.daysToAdd);
    } else if (preset.monthsToAdd) {
      base.setMonth(base.getMonth() + preset.monthsToAdd);
    } else if (preset.yearsToAdd) {
      base.setFullYear(base.getFullYear() + preset.yearsToAdd);
    }
    const formatted = formatToISO(base.getFullYear(), base.getMonth(), base.getDate());
    setSelectedDate(formatted);
    setCurrentNav(new Date(base.getFullYear(), base.getMonth(), 1));
  };

  const handleConfirm = () => {
    if (selectedDate) {
      onChange(selectedDate);
    }
    onClose();
  };

  // Month Names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Year options for fast jump (-5 to +15 years)
  const currentYear = today.getFullYear();
  const yearOptions = Array.from({ length: 25 }, (_, i) => currentYear - 5 + i);

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100020,
        background: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeInModal 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '380px',
          background: isLight ? '#ffffff' : '#0b1329',
          borderRadius: '26px',
          border: `1.5px solid ${isLight ? '#e2e8f0' : 'rgba(16, 185, 129, 0.25)'}`,
          boxShadow: isLight 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.18)' 
            : '0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 0 25px rgba(16, 185, 129, 0.15)',
          padding: '20px',
          color: isLight ? '#0f172a' : '#f8fafc',
          boxSizing: 'border-box',
          animation: 'scaleUpModal 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981'
            }}>
              <CalendarIcon size={17} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                {title}
              </h3>
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                {selectedDate 
                  ? new Date(selectedDate.replace(/-/g, '/')).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })
                  : 'Select a date'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isLight ? '#64748b' : '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Quick Presets Row */}
        <div style={{ 
          display: 'flex', 
          gap: '6px', 
          overflowX: 'auto', 
          paddingBottom: '8px', 
          marginBottom: '10px',
          scrollbarWidth: 'none'
        }}>
          {DEFAULT_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              style={{
                padding: '5px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 700,
                border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
                background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.04)',
                color: isLight ? '#334155' : '#94a3b8',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Month & Year Navigation Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
          border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.06)'}`,
          borderRadius: '16px',
          padding: '8px 12px',
          marginBottom: '14px'
        }}>
          <button
            type="button"
            onClick={() => setCurrentNav(new Date(navYear, navMonth - 1, 1))}
            style={{
              background: isLight ? '#ffffff' : 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isLight ? '#0f172a' : '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            onClick={() => setShowYearPicker(!showYearPicker)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '14px',
              fontWeight: 800,
              color: isLight ? '#0f172a' : '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>{monthNames[navMonth]} {navYear}</span>
            <span style={{ fontSize: '10px', color: '#10b981' }}>▾</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentNav(new Date(navYear, navMonth + 1, 1))}
            style={{
              background: isLight ? '#ffffff' : 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isLight ? '#0f172a' : '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Year Dropdown Grid (if toggled) */}
        {showYearPicker ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            maxHeight: '220px',
            overflowY: 'auto',
            padding: '8px 0',
            marginBottom: '14px'
          }}>
            {yearOptions.map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => {
                  setCurrentNav(new Date(yr, navMonth, 1));
                  setShowYearPicker(false);
                }}
                style={{
                  padding: '8px 4px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: yr === navYear ? '1.5px solid #10b981' : `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)'}`,
                  background: yr === navYear 
                    ? (isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.2)') 
                    : (isLight ? '#f8fafc' : 'rgba(255,255,255,0.02)'),
                  color: yr === navYear ? '#10b981' : (isLight ? '#334155' : '#cbd5e1'),
                  cursor: 'pointer'
                }}
              >
                {yr}
              </button>
            ))}
          </div>
        ) : (
          <>
            {/* Weekday Labels */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px',
              textAlign: 'center',
              marginBottom: '6px'
            }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                <span 
                  key={d} 
                  style={{ 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: i === 0 ? '#ef4444' : (isLight ? '#64748b' : '#94a3b8')
                  }}
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '5px',
              marginBottom: '18px'
            }}>
              {/* Empty leading days */}
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} style={{ height: '36px' }} />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const dateISO = formatToISO(navYear, navMonth, day);
                const isSelected = selectedDate === dateISO;
                const isToday = todayStr === dateISO;

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => handleDayClick(day)}
                    style={{
                      height: '36px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: isSelected ? 900 : 700,
                      border: isSelected 
                        ? '1.5px solid #10b981' 
                        : (isToday ? '1px dashed #10b981' : 'none'),
                      background: isSelected 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                        : (isLight ? 'transparent' : 'rgba(255,255,255,0.02)'),
                      color: isSelected 
                        ? '#ffffff' 
                        : (isToday ? '#10b981' : (isLight ? '#1e293b' : '#f1f5f9')),
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none',
                      transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                      position: 'relative'
                    }}
                  >
                    <span>{day}</span>
                    {isToday && !isSelected && (
                      <span style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: '#10b981',
                        position: 'absolute',
                        bottom: '3px'
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '10px' }}>
          <button
            type="button"
            onClick={() => {
              setSelectedDate(todayStr);
              setCurrentNav(new Date());
            }}
            style={{
              padding: '11px',
              borderRadius: '14px',
              border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)'}`,
              background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.05)',
              color: isLight ? '#475569' : '#cbd5e1',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <RotateCcw size={13} />
            Today
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            style={{
              padding: '11px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}
          >
            <Check size={16} />
            Done
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInModal {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUpModal {
          from { opacity: 0; transform: scale(0.94) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};
