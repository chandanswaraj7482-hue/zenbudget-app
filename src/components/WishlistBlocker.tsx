import React, { useState, useEffect } from 'react';
import { Clock, Trash2, CheckCircle2, Plus, ArrowLeft, Pencil } from 'lucide-react';

export interface WishlistItem {
  id: string;
  name: string;
  amount: number;
  category?: string;
  reason?: string;
  createdAt: string;
  status: 'locked' | 'unlocked' | 'saved';
}

export interface ImpulseLockCheckResult {
  isLocked: boolean;
  item?: WishlistItem;
  msRemaining?: number;
}

export function checkImpulseLock(profileId: string, title: string, amount: number): ImpulseLockCheckResult {
  if (!profileId || !title) return { isLocked: false };
  try {
    const raw = localStorage.getItem(`zb_wishlist_${profileId}`);
    if (!raw) return { isLocked: false };
    const items: WishlistItem[] = JSON.parse(raw);
    const now = Date.now();
    const LOCK_PERIOD_MS = 48 * 3600 * 1000;

    for (const item of items) {
      if (item.status === 'saved') continue;
      const elapsed = now - new Date(item.createdAt).getTime();
      const msRemaining = LOCK_PERIOD_MS - elapsed;
      if (msRemaining <= 0) continue;

      const normTitle = title.trim().toLowerCase();
      const normItemName = item.name.trim().toLowerCase();

      const titleMatches = normTitle.length >= 2 && (normTitle.includes(normItemName) || normItemName.includes(normTitle));
      const priceMatches = amount > 0 && Math.abs(amount - item.amount) < 0.01;

      if (titleMatches || (priceMatches && normTitle === normItemName)) {
        return {
          isLocked: true,
          item,
          msRemaining
        };
      }
    }
  } catch (e) {
    console.warn('Impulse lock check error:', e);
  }
  return { isLocked: false };
}

interface WishlistBlockerProps {
  onBack: () => void;
  currentProfileId: string;
  currencySymbol: string;
  onAddTransaction: (title: string, amount: number, category: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const WishlistBlocker: React.FC<WishlistBlockerProps> = ({
  onBack,
  currentProfileId,
  currencySymbol,
  onAddTransaction,
  onShowToast
}) => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('shopping');
  const [newItemReason, setNewItemReason] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Editing states
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState('');
  const [editingItemAmount, setEditingItemAmount] = useState('');
  const [editingItemCategory, setEditingItemCategory] = useState('shopping');
  const [editingItemReason, setEditingItemReason] = useState('');

  // Reload wishlist on mount / profile swap
  useEffect(() => {
    const cached = localStorage.getItem(`zb_wishlist_${currentProfileId}`);
    if (cached) {
      setItems(JSON.parse(cached));
    } else {
      setItems([]);
    }
  }, [currentProfileId]);

  // Tick timer every second to update countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const saveItems = (newItems: WishlistItem[]) => {
    setItems(newItems);
    localStorage.setItem(`zb_wishlist_${currentProfileId}`, JSON.stringify(newItems));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newItemAmount);
    if (!newItemName.trim() || isNaN(amount) || amount <= 0) {
      if (onShowToast) onShowToast('Please enter a valid item name and price.', 'warning');
      return;
    }

    const newItem: WishlistItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      amount,
      category: newItemCategory,
      reason: newItemReason.trim() || undefined,
      createdAt: new Date().toISOString(),
      status: 'locked'
    };

    saveItems([newItem, ...items]);
    setNewItemName('');
    setNewItemAmount('');
    setNewItemCategory('shopping');
    setNewItemReason('');
  };

  const handleDeleteItem = (id: string) => {
    const filtered = items.filter(item => item.id !== id);
    saveItems(filtered);
  };

  const handleStartEdit = (item: WishlistItem) => {
    setEditingItemId(item.id);
    setEditingItemName(item.name);
    setEditingItemAmount(item.amount.toString());
    setEditingItemCategory(item.category || 'shopping');
    setEditingItemReason(item.reason || '');
  };

  const handleSaveEdit = (id: string) => {
    const amt = parseFloat(editingItemAmount);
    if (!editingItemName.trim() || isNaN(amt) || amt <= 0) {
      if (onShowToast) onShowToast('Please enter a valid item name and price.', 'warning');
      return;
    }

    const updated = items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          name: editingItemName.trim(),
          amount: amt,
          category: editingItemCategory,
          reason: editingItemReason.trim() || undefined
        };
      }
      return item;
    });

    saveItems(updated);
    setEditingItemId(null);
  };

  const handleSavedIt = (item: WishlistItem) => {
    // 1. Award +100 Zen Pet points!
    const petPointsKey = `zb_pet_points_${currentProfileId}`;
    const currentPoints = parseInt(localStorage.getItem(petPointsKey) || '0');
    localStorage.setItem(petPointsKey, (currentPoints + 100).toString());

    // 2. Play Audio chime
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {}

    const successMsg = `🎉 Awesome! You saved ${currencySymbol}${item.amount.toLocaleString()} by waiting! +100 Zen Points awarded to your Companion.`;
    if (onShowToast) {
      onShowToast(successMsg, 'success');
    }
    
    // Remove from wishlist
    handleDeleteItem(item.id);
  };

  const handleBuyAnyway = (item: WishlistItem) => {
    // Add to transactions list directly as selected category or default to shopping expense
    onAddTransaction(item.name, item.amount, item.category || 'shopping');
    // Remove from wishlist
    handleDeleteItem(item.id);
  };

  // Fast forward helper for demo / testing purposes
  const handleFastForward = (id: string) => {
    const updated = items.map(item => {
      if (item.id === id) {
        // shift created time back by 48.5 hours
        const backDate = new Date(Date.now() - 48.5 * 60 * 60 * 1000).toISOString();
        return { ...item, createdAt: backDate };
      }
      return item;
    });
    saveItems(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '80px', animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          onClick={onBack}
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-input)',
            borderRadius: '12px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            transition: 'all 0.2s ease'
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Manrope', sans-serif", margin: 0 }}>
            Impulse Blocker ⏳
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            Pause impulse purchases for 48 hours before deciding.
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', textAlign: 'left' }}>
          Add Desired Purchase
        </h3>
        <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              required
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="What do you want to buy? (e.g. Zara Shoes)"
              className="glass-input"
              style={{ flex: 2, padding: '10px 14px', fontSize: '13px' }}
            />
            <input
              type="text"
              inputMode="numeric"
              required
              value={newItemAmount}
              onChange={(e) => setNewItemAmount(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Price"
              className="glass-input"
              style={{ flex: 1, padding: '10px 14px', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value)}
              className="glass-input"
              style={{ flex: 1, padding: '10px 14px', fontSize: '13px', background: '#0f172a', color: '#fff' }}
            >
              <option value="shopping">Shopping 🛍️</option>
              <option value="food">Food/Drinks 🍔</option>
              <option value="entertainment">Entertainment 🍿</option>
              <option value="travel">Travel ✈️</option>
              <option value="bills">Bills & Rent 💳</option>
              <option value="other">Other 📦</option>
            </select>
            <input
              type="text"
              value={newItemReason}
              onChange={(e) => setNewItemReason(e.target.value)}
              placeholder="Why do you want it? (e.g. Instagram Ad)"
              className="glass-input"
              style={{ flex: 2, padding: '10px 14px', fontSize: '13px' }}
            />
          </div>

          <button
            type="submit"
            className="glass-button active"
            style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 700, fontSize: '12px', border: 'none', cursor: 'pointer', background: 'linear-gradient(to right, #ec4899, #8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Plus size={14} /> Put on 48h Hold
          </button>
        </form>
      </div>

      {/* Wishlist Items list */}
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '10px 0 0 0', textAlign: 'left' }}>
        Active Cooling-Off List
      </h3>

      {items.length === 0 ? (
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: '32px' }}>🛡️</span>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginTop: '10px', marginBottom: '4px' }}>Wishlist is Empty</p>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', maxWidth: '240px', margin: '0 auto', lineHeight: 1.4 }}>
            Great job! You have no active impulsive buying temptations on hold. Keep it up.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map(item => {
            const timeDiffMs = currentTime - new Date(item.createdAt).getTime();
            const totalWaitMs = 48 * 60 * 60 * 1000;
            const isUnlocked = timeDiffMs >= totalWaitMs;
            const progress = Math.min(100, Math.round((timeDiffMs / totalWaitMs) * 100));

            // Calculate hours and minutes remaining
            const msRemaining = Math.max(0, totalWaitMs - timeDiffMs);
            const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
            const minsRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
            const secsRemaining = Math.floor((msRemaining % (1000 * 60)) / 1000);

            const isEditing = editingItemId === item.id;

            return (
              <div 
                key={item.id}
                className="glass-panel animate-fade-in"
                style={{
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: isUnlocked 
                    ? 'linear-gradient(to bottom, rgba(34,197,94,0.05) 0%, rgba(9,9,15,0.6) 100%)' 
                    : 'linear-gradient(to bottom, rgba(255,255,255,0.02) 0%, rgba(9,9,15,0.6) 100%)',
                  border: isUnlocked ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.08)'
                }}
              >
                {isEditing ? (
                  /* Inline Editor Mode */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>Edit Wishlist Item</h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        value={editingItemName} 
                        onChange={(e) => setEditingItemName(e.target.value)} 
                        className="glass-input" 
                        style={{ flex: 2, padding: '8px 12px', fontSize: '13px' }} 
                      />
                      <input 
                        type="number" 
                        value={editingItemAmount} 
                        onChange={(e) => setEditingItemAmount(e.target.value)} 
                        className="glass-input" 
                        style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }} 
                      />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select
                        value={editingItemCategory}
                        onChange={(e) => setEditingItemCategory(e.target.value)}
                        className="glass-input"
                        style={{ flex: 1, padding: '8px 12px', fontSize: '13px', background: '#0f172a', color: '#fff' }}
                      >
                        <option value="shopping">Shopping 🛍️</option>
                        <option value="food">Food/Drinks 🍔</option>
                        <option value="entertainment">Entertainment 🍿</option>
                        <option value="travel">Travel ✈️</option>
                        <option value="bills">Bills & Rent 💳</option>
                        <option value="other">Other 📦</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Why do you want it? (Note)"
                        value={editingItemReason}
                        onChange={(e) => setEditingItemReason(e.target.value)}
                        className="glass-input"
                        style={{ flex: 2, padding: '8px 12px', fontSize: '13px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                      <button
                        onClick={() => setEditingItemId(null)}
                        style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: '#fff', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Standard Display Mode */
                  <>
                    {/* Item Details */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', margin: 0 }}>{item.name}</h4>
                          <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                            {item.category || 'shopping'}
                          </span>
                        </div>
                        {item.reason && (
                          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0 0', fontStyle: 'italic' }}>
                            💡 Trigger: "{item.reason}"
                          </p>
                        )}
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                          Added: {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: isUnlocked ? 'var(--success)' : '#ec4899' }}>
                          {currencySymbol}{item.amount.toLocaleString()}
                        </span>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          <button 
                            onClick={() => handleStartEdit(item)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '2px', cursor: 'pointer' }}
                            title="Edit Item"
                          >
                            <Pencil size={12} />
                          </button>
                          <button 
                            onClick={() => handleDeleteItem(item.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '2px', cursor: 'pointer' }}
                            title="Delete Item"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar / Countdown */}
                    {!isUnlocked ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={11} /> Locking: {hoursRemaining}h {minsRemaining}m {secsRemaining}s left
                          </span>
                          <span>{progress}% Cooled</span>
                        </div>
                        <div style={{ width: '100%', height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                          <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(to right, #ec4899, #8b5cf6)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                        </div>
                        {/* Fast Forward demo button */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                          <button 
                            onClick={() => handleFastForward(item.id)}
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '8px',
                              padding: '3px 8px',
                              fontSize: '9px',
                              fontWeight: 700,
                              color: 'var(--text-secondary)',
                              cursor: 'pointer'
                            }}
                          >
                            Fast-Forward 48h ⏩
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} className="animate-fade-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34,197,94,0.08)', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(34,197,94,0.2)' }}>
                          <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                          <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 700 }}>Decision Time: Cooling completed!</span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <button
                            onClick={() => handleSavedIt(item)}
                            style={{
                              flex: 1,
                              padding: '10px',
                              borderRadius: '10px',
                              border: 'none',
                              background: 'rgba(34, 197, 94, 0.15)',
                              color: 'var(--success)',
                              fontSize: '11px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            Saved it! 💎
                          </button>
                          <button
                            onClick={() => handleBuyAnyway(item)}
                            style={{
                              flex: 1,
                              padding: '10px',
                              borderRadius: '10px',
                              border: '1px solid rgba(255,255,255,0.1)',
                              background: 'rgba(255,255,255,0.03)',
                              color: '#fff',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Buy Anyway 🛒
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
