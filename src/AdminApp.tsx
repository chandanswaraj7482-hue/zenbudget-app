import React, { useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { supabase } from './supabaseClient';
import { Toast } from './components/Toast';
import type { ToastMessage } from './components/Toast';

export const AdminApp: React.FC = () => {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const triggerToast = (message: string, type: 'success' | 'warning' | 'info') => {
    setToast({
      id: Date.now().toString(),
      message,
      type
    });
  };

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#09090f', color: '#fff', overflow: 'hidden' }}>
      <AdminDashboard
        isOpen={true}
        onClose={() => {}}
        supabaseClient={supabase}
        onShowToast={triggerToast}
      />
      {toast && (
        <Toast
          toast={toast}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AdminApp;
