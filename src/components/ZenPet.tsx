import React, { useState, useEffect } from 'react';
import { Sparkles, ShoppingBag, Check } from 'lucide-react';

interface ZenPetProps {
  currentProfileId: string;
  spentPercentage: number;
}

interface Accessory {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  svgPath: (_color: string) => React.ReactNode;
}

const ACCESSORIES: Accessory[] = [
  {
    id: 'sunglasses',
    name: 'Cool Sunglasses',
    emoji: '🕶️',
    cost: 150,
    svgPath: (_color) => (
      <g id="acc-sunglasses">
        {/* Left lens */}
        <polygon points="32,42 45,42 42,50 34,50" fill="#1e293b" stroke="#000" strokeWidth="1" />
        {/* Right lens */}
        <polygon points="55,42 68,42 66,50 58,50" fill="#1e293b" stroke="#000" strokeWidth="1" />
        {/* Bridge */}
        <line x1="45" y1="44" x2="55" y2="44" stroke="#000" strokeWidth="2" />
        {/* Left temple */}
        <line x1="32" y1="44" x2="26" y2="46" stroke="#000" strokeWidth="1.5" />
        {/* Right temple */}
        <line x1="68" y1="44" x2="74" y2="46" stroke="#000" strokeWidth="1.5" />
      </g>
    )
  },
  {
    id: 'detective_hat',
    name: 'Detective Hat',
    emoji: '🕵️',
    cost: 300,
    svgPath: (_color) => (
      <g id="acc-detective-hat">
        {/* Hat crown */}
        <path d="M 32,28 C 32,15 68,15 68,28 Z" fill="#64748b" stroke="#334155" strokeWidth="1" />
        {/* Ribbon */}
        <rect x="32" y="25" width="36" height="4" fill="#0f172a" />
        {/* Brim */}
        <ellipse cx="50" cy="29" rx="24" ry="3" fill="#475569" stroke="#334155" strokeWidth="1" />
      </g>
    )
  },
  {
    id: 'crown',
    name: 'Royal Crown',
    emoji: '👑',
    cost: 600,
    svgPath: (_color) => (
      <g id="acc-crown">
        {/* Crown base */}
        <path d="M 34,28 L 66,28 L 63,16 L 56,23 L 50,12 L 44,23 L 37,16 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
        {/* Gems */}
        <circle cx="50" cy="12" r="1.5" fill="#ef4444" />
        <circle cx="37" cy="16" r="1.5" fill="#3b82f6" />
        <circle cx="63" cy="16" r="1.5" fill="#10b981" />
        <rect x="37" y="26" width="26" height="2" fill="#ef4444" opacity="0.7" />
      </g>
    )
  },
  {
    id: 'fire_cape',
    name: 'Fire Cape (Lvl 2)',
    emoji: '🔥',
    cost: 800,
    svgPath: (_color) => (
      <g id="acc-fire-cape">
        <path d="M 12,54 C 5,74 20,84 16,92 L 30,86 L 24,70 Z" fill="#ea580c" stroke="#9a3412" strokeWidth="1" />
        <path d="M 88,54 C 95,74 80,84 84,92 L 70,86 L 76,70 Z" fill="#ea580c" stroke="#9a3412" strokeWidth="1" />
      </g>
    )
  },
  {
    id: 'wizard_hat',
    name: 'Wizard Hat (Lvl 2)',
    emoji: '🧙',
    cost: 1000,
    svgPath: (_color) => (
      <g id="acc-wizard-hat">
        <path d="M 24,26 L 50,2 L 76,26 Z" fill="#4338ca" stroke="#312e81" strokeWidth="1.5" />
        <ellipse cx="50" cy="27" rx="30" ry="4" fill="#312e81" />
        <polygon points="46,14 54,14 50,6" fill="#fbbf24" />
      </g>
    )
  },
  {
    id: 'laser_eyes',
    name: 'Laser Eyes (Lvl 2)',
    emoji: '🔴',
    cost: 1500,
    svgPath: (_color) => (
      <g id="acc-laser-eyes">
        <line x1="38" y1="46" x2="10" y2="40" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" opacity="0.95" />
        <line x1="62" y1="46" x2="90" y2="40" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" opacity="0.95" />
        <circle cx="38" cy="46" r="4.5" fill="#fca5a5" />
        <circle cx="62" cy="46" r="4.5" fill="#fca5a5" />
      </g>
    )
  }
];

export const ZenPet: React.FC<ZenPetProps> = ({ currentProfileId, spentPercentage }) => {
  const [points, setPoints] = useState<number>(0);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [equippedId, setEquippedId] = useState<string>('');
  const [showShop, setShowShop] = useState(false);
  const [todayMood, setTodayMood] = useState<string>(() => {
    const todayObj = new Date();
    const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
    const moodLogs = JSON.parse(localStorage.getItem('zb_mood_logs') || '{}');
    return moodLogs[todayStr] || '';
  });



  // Load pet state on profile swap
  useEffect(() => {
    const loadedPoints = parseInt(localStorage.getItem(`zb_pet_points_${currentProfileId}`) || '0'); // starting points 0
    const loadedUnlocked = JSON.parse(localStorage.getItem(`zb_pet_unlocked_${currentProfileId}`) || '[]');
    const loadedEquipped = localStorage.getItem(`zb_pet_equipped_${currentProfileId}`) || '';
    
    const todayObj = new Date();
    const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
    const moodLogs = JSON.parse(localStorage.getItem('zb_mood_logs') || '{}');
    
    setPoints(loadedPoints);
    setUnlockedIds(loadedUnlocked);
    setEquippedId(loadedEquipped);
    setTodayMood(moodLogs[todayStr] || '');
  }, [currentProfileId]);

  // Sync state modifications
  const saveState = (newPoints: number, newUnlocked: string[], newEquipped: string) => {
    localStorage.setItem(`zb_pet_points_${currentProfileId}`, newPoints.toString());
    localStorage.setItem(`zb_pet_unlocked_${currentProfileId}`, JSON.stringify(newUnlocked));
    localStorage.setItem(`zb_pet_equipped_${currentProfileId}`, newEquipped);
    setPoints(newPoints);
    setUnlockedIds(newUnlocked);
    setEquippedId(newEquipped);
  };

  // Determine active level based on unlocked default items or milestone checkin points (500 pts per level milestone)
  const companionLevel = Math.max(1, Math.floor(points / 500) + 1);
  const isLevel2Unlocked = companionLevel >= 2 || (unlockedIds.includes('sunglasses') && unlockedIds.includes('detective_hat') && unlockedIds.includes('crown'));

  // Compute status expressions
  const getPetExpression = () => {
    if (todayMood === '😊' || todayMood === '😀') {
      return {
        status: isLevel2Unlocked ? 'Draco Cheerful 😊' : 'Happy 😊',
        description: 'Your Zen Companion is cheerful and content. Keep up the good spending habits!',
        faceColor: isLevel2Unlocked ? '#fbbf24' : '#fecdd3',
        earsColor: isLevel2Unlocked ? '#d97706' : '#fda4af',
        eyeLeft: <path d="M 33,48 Q 38,42 43,48" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
        eyeRight: <path d="M 57,48 Q 62,42 67,48" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
        mouth: <path d="M 45,58 Q 50,64 55,58" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
        extra: (
          <>
            <circle cx="33" cy="53" r="3" fill="#f43f5e" opacity="0.4" />
            <circle cx="67" cy="53" r="3" fill="#f43f5e" opacity="0.4" />
            {isLevel2Unlocked && (
              <>
                <path d="M 28,26 Q 20,12 30,8 Q 32,15 34,22" fill="#ef4444" stroke="#1e293b" strokeWidth="1.5" />
                <path d="M 72,26 Q 80,12 70,8 Q 68,15 66,22" fill="#ef4444" stroke="#1e293b" strokeWidth="1.5" />
              </>
            )}
          </>
        )
      };
    }

    if (todayMood === '🤩' || todayMood === '😍') {
      return {
        status: isLevel2Unlocked ? 'Draco Thrilled 🤩' : 'Excited 🤩',
        description: 'Wow! Your Zen Companion is absolutely thrilled with your positive energy today!',
        faceColor: '#ec4899',
        earsColor: '#db2777',
        eyeLeft: <path d="M 33,48 Q 38,42 43,48" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
        eyeRight: <path d="M 57,48 Q 62,42 67,48" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
        mouth: <path d="M 44,56 Q 50,66 56,56" fill="#f43f5e" stroke="#1e293b" strokeWidth="2" strokeLinejoin="round" />,
        extra: (
          <>
            <circle cx="33" cy="53" r="4" fill="#f43f5e" opacity="0.6" />
            <circle cx="67" cy="53" r="4" fill="#f43f5e" opacity="0.6" />
            {isLevel2Unlocked && (
              <>
                <path d="M 28,26 Q 20,12 30,8 Q 32,15 34,22" fill="#fbbf24" stroke="#1e293b" strokeWidth="1.5" />
                <path d="M 72,26 Q 80,12 70,8 Q 68,15 66,22" fill="#fbbf24" stroke="#1e293b" strokeWidth="1.5" />
              </>
            )}
          </>
        )
      };
    }

    if (todayMood === '😌' || todayMood === '😅') {
      return {
        status: isLevel2Unlocked ? 'Draco Peaceful 😌' : 'Calm 😌',
        description: 'Breathe in, breathe out. Zen Companion feels peaceful and calm with you.',
        faceColor: '#10b981',
        earsColor: '#059669',
        eyeLeft: <path d="M 32,46 Q 38,50 44,46" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
        eyeRight: <path d="M 56,46 Q 62,50 68,46" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
        mouth: <path d="M 46,58 Q 50,60 54,58" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />,
        extra: (
          <>
            <circle cx="33" cy="53" r="3" fill="#34d399" opacity="0.4" />
            <circle cx="67" cy="53" r="3" fill="#34d399" opacity="0.4" />
          </>
        )
      };
    }

    if (todayMood === '😐') {
      return {
        status: isLevel2Unlocked ? 'Draco Mindful 😐' : 'Neutral 😐',
        description: 'Zen Companion is focused and steady. Ready for mindful budgeting.',
        faceColor: '#a1a1aa',
        earsColor: '#71717a',
        eyeLeft: <circle cx="38" cy="46" r="2.5" fill="#1e293b" />,
        eyeRight: <circle cx="62" cy="46" r="2.5" fill="#1e293b" />,
        mouth: <line x1="44" y1="58" x2="56" y2="58" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />,
        extra: null
      };
    }

    if (todayMood === '😢' || todayMood === '😭') {
      return {
        status: isLevel2Unlocked ? 'Draco Comforting 🫂' : 'Sad 😢',
        description: 'Zen Companion feels your sadness. Let\'s do some mindful budgeting to cheer you up.',
        faceColor: '#60a5fa',
        earsColor: '#3b82f6',
        eyeLeft: <path d="M 33,48 Q 38,54 43,48" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
        eyeRight: <path d="M 57,48 Q 62,54 67,48" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
        mouth: <path d="M 45,62 Q 50,56 55,62" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
        extra: (
          <>
            <circle cx="33" cy="53" r="3" fill="#3b82f6" opacity="0.4" />
            <circle cx="67" cy="53" r="3" fill="#3b82f6" opacity="0.4" />
            <path d="M 38,52 L 38,64" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
            <path d="M 62,52 L 62,64" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
          </>
        )
      };
    }

    if (todayMood === '😰') {
      return {
        status: isLevel2Unlocked ? 'Draco Concerned 🔥' : 'Concerned 😰',
        description: 'Take a deep breath. Budgeting mindfully helps release stress!',
        faceColor: '#c084fc',
        earsColor: '#a855f7',
        eyeLeft: <circle cx="38" cy="46" r="2.5" fill="#1e293b" />,
        eyeRight: <circle cx="62" cy="46" r="2.5" fill="#1e293b" />,
        mouth: <line x1="45" y1="58" x2="55" y2="58" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />,
        extra: (
          <>
            <path d="M 68,36 Q 66,32 64,36 C 62,38 65,42 68,42" fill="#c084fc" />
          </>
        )
      };
    }

    if (todayMood === '😡') {
      return {
        status: isLevel2Unlocked ? 'Draco Fiery 🔥' : 'Fuming 😡',
        description: 'Take a deep breath. Let\'s budget mindfully to release frustration!',
        faceColor: '#f87171',
        earsColor: '#ef4444',
        eyeLeft: <path d="M 31,44 L 41,47" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />,
        eyeRight: <path d="M 59,47 L 69,44" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />,
        mouth: <path d="M 46,62 Q 50,56 54,62" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
        extra: (
          <>
            <circle cx="33" cy="53" r="3" fill="#b91c1c" opacity="0.3" />
            <circle cx="67" cy="53" r="3" fill="#b91c1c" opacity="0.3" />
          </>
        )
      };
    }

    if (todayMood === '😔') {
      return {
        status: isLevel2Unlocked ? 'Draco Reflective 😔' : 'Regretful 😔',
        description: 'Tomorrow is another day to budget better. Be kind to yourself.',
        faceColor: '#94a3b8',
        earsColor: '#64748b',
        eyeLeft: <path d="M 32,48 L 42,50" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />,
        eyeRight: <path d="M 68,48 L 58,50" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />,
        mouth: <path d="M 46,60 L 54,60" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />,
        extra: null
      };
    }

    // Default spentPercentage-based logic
    if (spentPercentage < 70) {
      return {
        status: isLevel2Unlocked ? 'Draco Happy ✨' : 'Happy 💖',
        description: isLevel2Unlocked ? 'Zen Dragon level active! Your savings are flying high.' : 'Zen Piggy is happy! Your spending is safe and healthy.',
        faceColor: isLevel2Unlocked ? '#fbbf24' : '#fecdd3', // gold vs pink
        earsColor: isLevel2Unlocked ? '#d97706' : '#fda4af',
        eyeLeft: <path d="M 33,48 Q 38,42 43,48" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
        eyeRight: <path d="M 57,48 Q 62,42 67,48" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
        mouth: <path d="M 45,58 Q 50,64 55,58" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
        extra: (
          <>
            <circle cx="33" cy="53" r="3" fill="#f43f5e" opacity="0.4" />
            <circle cx="67" cy="53" r="3" fill="#f43f5e" opacity="0.4" />
            {isLevel2Unlocked && (
              <>
                <path d="M 28,26 Q 20,12 30,8 Q 32,15 34,22" fill="#ef4444" stroke="#1e293b" strokeWidth="1.5" />
                <path d="M 72,26 Q 80,12 70,8 Q 68,15 66,22" fill="#ef4444" stroke="#1e293b" strokeWidth="1.5" />
                <circle cx="50" cy="72" r="2" fill="#f97316" className="animate-pulse" />
              </>
            )}
          </>
        )
      };
    } else if (spentPercentage < 100) {
      return {
        status: isLevel2Unlocked ? 'Draco Concerned 🔥' : 'Concerned 😰',
        description: isLevel2Unlocked ? 'Zen Dragon feels heat. You spent over 70% budget.' : 'Zen Piggy is worried. You have spent over 70% of your limits.',
        faceColor: isLevel2Unlocked ? '#f59e0b' : '#fee2e2',
        earsColor: isLevel2Unlocked ? '#b45309' : '#fca5a5',
        eyeLeft: <circle cx="38" cy="46" r="2.5" fill="#1e293b" />,
        eyeRight: <circle cx="62" cy="46" r="2.5" fill="#1e293b" />,
        mouth: <line x1="45" y1="58" x2="55" y2="58" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />,
        extra: (
          <>
            {isLevel2Unlocked ? (
              <path d="M 46,65 L 50,70 L 54,65" fill="#ef4444" opacity="0.8" />
            ) : (
              <path d="M 68,36 Q 66,32 64,36 C 62,38 65,42 68,42 C 71,42 70,38 68,36" fill="#60a5fa" />
            )}
          </>
        )
      };
    } else {
      return {
        status: isLevel2Unlocked ? 'Draco Alert 🚨' : 'Exceeded 😭',
        description: isLevel2Unlocked ? 'Zen Dragon is breathing fire! Limits crossed.' : 'Zen Piggy is crying! Budget limit exceeded. Cut back now!',
        faceColor: isLevel2Unlocked ? '#ef4444' : '#f1f5f9',
        earsColor: isLevel2Unlocked ? '#b91c1c' : '#cbd5e1',
        eyeLeft: (
          <g>
            <line x1="35" y1="43" x2="41" y2="49" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="41" y1="43" x2="35" y2="49" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        ),
        eyeRight: (
          <g>
            <line x1="59" y1="43" x2="65" y2="49" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="65" y1="43" x2="59" y2="49" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        ),
        mouth: <path d="M 46,62 Q 50,56 54,62" stroke="#475569" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
        extra: (
          <>
            {isLevel2Unlocked ? (
              <path d="M 42,66 C 45,78 55,78 58,66 Z" fill="#ea580c" />
            ) : (
              <>
                <path d="M 38,50 L 38,62 Q 38,65 36,62" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 62,50 L 62,62 Q 62,65 60,62" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
              </>
            )}
          </>
        )
      };
    }
  };

  const expression = getPetExpression();

  const handleBuy = (item: Accessory) => {
    if (points >= item.cost) {
      const nextPoints = points - item.cost;
      const nextUnlocked = [...unlockedIds, item.id];
      saveState(nextPoints, nextUnlocked, item.id);
    }
  };

  const handleEquip = (itemId: string) => {
    const nextEquipped = equippedId === itemId ? '' : itemId;
    saveState(points, unlockedIds, nextEquipped);
  };

  const activeAccessory = ACCESSORIES.find(a => a.id === equippedId);

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-card)', position: 'relative' }}>
      
      {/* Top bar with points */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '18px' }}>{isLevel2Unlocked ? '🐲' : '🐷'}</span>
          <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {isLevel2Unlocked ? `Zen Dragon (Lvl ${companionLevel})` : `Zen Companion (Lvl ${companionLevel})`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(251, 191, 36, 0.1)', padding: '4px 8px', borderRadius: '12px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
            <Sparkles size={11} style={{ color: '#fbbf24' }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#d97706' }}>{points} pts</span>
          </div>
          <button
            onClick={() => setShowShop(!showShop)}
            style={{
              background: showShop ? 'var(--primary)' : 'var(--bg-input)',
              border: '1px solid var(--border-input)',
              borderRadius: '8px',
              padding: '6px 10px',
              color: showShop ? '#ffffff' : 'var(--text-primary)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ShoppingBag size={13} />
            <span>Shop</span>
          </button>
        </div>
      </div>

      {/* Pet Graphic View (Always Visible) */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'center', borderBottom: showShop ? '1px solid var(--border-input)' : 'none', paddingBottom: showShop ? '12px' : '0' }} className="animate-fade-in">
        {/* SVG Vector Piggy graphics */}
        <div style={{ width: '85px', height: '85px', flexShrink: 0, position: 'relative' }}>
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="piggyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={expression.faceColor} />
                <stop offset="100%" stopColor={expression.faceColor} />
              </linearGradient>
            </defs>

            {/* Ears (Dragon spikes if level 2) */}
            {!isLevel2Unlocked ? (
              <>
                <polygon points="20,38 12,22 30,30" fill={expression.earsColor} stroke="#1e293b" strokeWidth="2" strokeLinejoin="round" />
                <polygon points="80,38 88,22 70,30" fill={expression.earsColor} stroke="#1e293b" strokeWidth="2" strokeLinejoin="round" />
              </>
            ) : (
              <>
                <polygon points="24,34 16,14 32,24" fill={expression.earsColor} stroke="#1e293b" strokeWidth="2" />
                <polygon points="76,34 84,14 68,24" fill={expression.earsColor} stroke="#1e293b" strokeWidth="2" />
              </>
            )}

            {/* Body / Face */}
            <circle cx="50" cy="54" r="38" fill="url(#piggyGrad)" stroke="#1e293b" strokeWidth="2.5" />

            {/* Eyes */}
            {expression.eyeLeft}
            {expression.eyeRight}

            {/* Snout (or Dragon nose plates) */}
            <ellipse cx="50" cy="58" rx="14" ry="9" fill={expression.earsColor} stroke="#1e293b" strokeWidth="2" />
            <circle cx="45" cy="58" r="2.2" fill="#1e293b" />
            <circle cx="55" cy="58" r="2.2" fill="#1e293b" />

            {/* Mouth */}
            {expression.mouth}

            {/* Blushes or Tears */}
            {expression.extra}

            {/* Equipped Accessory Overlay */}
            {activeAccessory && activeAccessory.svgPath(expression.faceColor)}
          </svg>
        </div>

        <div style={{ textAlign: 'left', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {isLevel2Unlocked ? 'Golden Zen Dragon' : 'Zen Piggy'}
            </span>
            <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '8px', background: activeAccessory ? 'rgba(251,191,36,0.15)' : 'rgba(239, 68, 68, 0.15)', color: activeAccessory ? '#d97706' : '#dc2626' }}>
              {(() => {
                if (equippedId === 'crown') return 'Thrilled & Royal 👑';
                if (equippedId === 'detective_hat') return 'Smart & Proud 🎩';
                if (equippedId === 'sunglasses') return 'Cool & Cheerful 😎';
                return 'Regretful 😔';
              })()}
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
            {(() => {
              if (equippedId === 'crown') return 'Wearing Royal Crown! Your Zen Companion feels 100% thrilled, royal, and invincible!';
              if (equippedId === 'detective_hat') return 'Wearing Detective Hat! Zen Companion feels proud, smart, and ready for budgeting.';
              if (equippedId === 'sunglasses') return 'Wearing Cool Sunglasses! Your companion is cheered up and feeling great!';
              return 'Zen Piggy feels low and regretful. Equip items in the shop to cheer up your companion step-by-step!';
            })()}
          </p>

          {/* 🌟 Step-by-Step Happiness & Bond Progress Bar */}
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 800 }}>
              <span style={{ color: 'var(--primary)', letterSpacing: '0.05em' }}>COMPANION HAPPINESS</span>
              <span style={{ color: activeAccessory ? '#d97706' : '#dc2626' }}>
                {(() => {
                  if (equippedId === 'crown') return '100% (Thrilled ✨)';
                  if (equippedId === 'detective_hat') return '75% (Proud 🎓)';
                  if (equippedId === 'sunglasses') return '45% (Cheered Up 😊)';
                  return '0% (Needs Attention 😴)';
                })()}
              </span>
            </div>
            <div style={{ height: '6px', width: '100%', background: 'var(--bg-input)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                width: (() => {
                  if (equippedId === 'crown') return '100%';
                  if (equippedId === 'detective_hat') return '75%';
                  if (equippedId === 'sunglasses') return '45%';
                  return '0%';
                })(), 
                background: activeAccessory 
                  ? 'linear-gradient(90deg, #22c55e 0%, #fbbf24 100%)' 
                  : 'linear-gradient(90deg, #ef4444 0%, #f59e0b 100%)', 
                borderRadius: '10px', 
                transition: 'all 0.4s ease-in-out' 
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Companion Shop (Rendered below only when showShop is true) */}
      {showShop && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
          <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, textAlign: 'left' }}>
            Companion Shop 🛍️
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {ACCESSORIES.map(item => {
              const isUnlocked = unlockedIds.includes(item.id);
              const isEquipped = equippedId === item.id;

              return (
                <div 
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-input)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{item.emoji}</span>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>{item.name}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Cost: {item.cost} pts</span>
                    </div>
                  </div>

                  {isUnlocked ? (
                    <button
                      onClick={() => handleEquip(item.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-input)',
                        background: isEquipped ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-card)',
                        color: isEquipped ? 'var(--primary)' : 'var(--text-primary)',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      {isEquipped ? <Check size={10} /> : null}
                      {isEquipped ? 'Equipped' : 'Equip'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={points < item.cost || (item.name.includes('Lvl 2') && !isLevel2Unlocked)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-input)',
                        background: (points >= item.cost && !(item.name.includes('Lvl 2') && !isLevel2Unlocked)) ? 'var(--primary)' : 'var(--bg-card)',
                        color: (points >= item.cost && !(item.name.includes('Lvl 2') && !isLevel2Unlocked)) ? '#ffffff' : 'var(--text-secondary)',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: (points >= item.cost && !(item.name.includes('Lvl 2') && !isLevel2Unlocked)) ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {item.name.includes('Lvl 2') && !isLevel2Unlocked ? 'Lvl 2 Lock 🔒' : 'Buy 🔓'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}



    </div>
  );
};
