import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import { Loader2 } from 'lucide-react';

type UserRole = 'user' | 'admin';

function App() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [role, setRole] = useState<UserRole>('user');
  const [showAuth, setShowAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        ensureUserProfile(session.user);
      }
      setUser(session?.user || null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (session?.user) {
          await ensureUserProfile(session.user);
        }
        setUser(session?.user || null);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const ensureUserProfile = async (user: { id: string; user_metadata?: { full_name?: string; name?: string }; email?: string }) => {
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!existingProfile) {
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';

      await supabase.from('user_profiles').insert({
        id: user.id,
        full_name: fullName,
        phone: null,
        notification_enabled: true,
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole('user');
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
  };

  const handleGetStarted = () => {
    setShowAuth(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LandingPage onGetStarted={handleGetStarted} />
        {showAuth && (
          <AuthModal onClose={() => setShowAuth(false)} onAuthSuccess={handleAuthSuccess} />
        )}
      </>
    );
  }

  if (!showAuth && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-6">Choose Your Portal</h1>
          <p className="text-xl text-slate-600 mb-12">
            Are you a user looking to join queues or a business owner?
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => setRole('user')}
              className="p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all group"
            >
              <div className="text-5xl mb-4">👤</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">User Portal</h3>
              <p className="text-slate-600">Join queues and manage your wait times</p>
            </button>
            <button
              onClick={() => setRole('admin')}
              className="p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all group"
            >
              <div className="text-5xl mb-4">👔</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Business Portal</h3>
              <p className="text-slate-600">Manage your business queues and analytics</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return role === 'user' ? (
    <UserDashboard userId={user.id} onSignOut={handleSignOut} />
  ) : (
    <AdminDashboard userId={user.id} onSignOut={handleSignOut} />
  );
}

export default App;
