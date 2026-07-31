import React from 'react';
import { AdminDashboard } from './AdminDashboard';
import { supabase } from './supabaseClient';

export const App: React.FC = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#09090f', color: '#fff', overflow: 'hidden' }}>
      <AdminDashboard
        isOpen={true}
        onClose={() => {}}
        supabaseClient={supabase}
        onShowToast={(msg, type) => {
          console.log(`[Admin Toast ${type}]: ${msg}`);
        }}
      />
    </div>
  );
};

export default App;
