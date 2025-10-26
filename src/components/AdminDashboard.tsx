import { useState, useEffect } from 'react';
import { Users, Clock, TrendingUp, Bell, LogOut, Plus, X, Loader2, BarChart3, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type Business = Database['public']['Tables']['businesses']['Row'];
type QueueEntry = Database['public']['Tables']['queue_entries']['Row'] & {
  user_profiles: {
    full_name: string;
    phone: string | null;
  };
};

interface AdminDashboardProps {
  userId: string;
  onSignOut: () => void;
}

export default function AdminDashboard({ userId, onSignOut }: AdminDashboardProps) {
  const [myBusiness, setMyBusiness] = useState<Business | null>(null);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [stats, setStats] = useState({
    waiting: 0,
    serving: 0,
    completedToday: 0,
    avgWaitTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'clinic' as 'hospital' | 'clinic' | 'restaurant',
    description: '',
    address: '',
    phone: '',
    email: '',
    max_daily_capacity: 100,
    avg_service_time: 15,
  });

  useEffect(() => {
    fetchData();

    const subscription = supabase
      .channel('admin_queue_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_entries',
        },
        () => {
          fetchQueueEntries();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const fetchData = async () => {
    await Promise.all([fetchMyBusiness()]);
    setLoading(false);
  };

  const fetchMyBusiness = async () => {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', userId)
      .maybeSingle();

    if (!error && data) {
      setMyBusiness(data);
      await fetchQueueEntries(data.id);
    }
  };

  const fetchQueueEntries = async (businessId?: string) => {
    const id = businessId || myBusiness?.id;
    if (!id) return;

    const { data, error } = await supabase
      .from('queue_entries')
      .select('*, user_profiles(full_name, phone)')
      .eq('business_id', id)
      .in('status', ['waiting', 'serving'])
      .order('queue_number');

    if (!error && data) {
      setQueueEntries(data as QueueEntry[]);

      const waiting = data.filter((q) => q.status === 'waiting').length;
      const serving = data.filter((q) => q.status === 'serving').length;

      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('queue_entries')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', id)
        .eq('status', 'completed')
        .gte('joined_at', today);

      setStats({
        waiting,
        serving,
        completedToday: count || 0,
        avgWaitTime: myBusiness?.avg_service_time || 0,
      });
    }
  };

  const createBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const { error } = await supabase.from('businesses').insert({
        ...formData,
        owner_id: userId,
      });

      if (error) throw error;

      await fetchMyBusiness();
      setShowCreateModal(false);
      setFormData({
        name: '',
        type: 'clinic',
        description: '',
        address: '',
        phone: '',
        email: '',
        max_daily_capacity: 100,
        avg_service_time: 15,
      });
    } catch (err) {
      console.error('Error creating business:', err);
    } finally {
      setCreating(false);
    }
  };

  const updateQueueStatus = async (queueId: string, status: 'serving' | 'completed') => {
    const updates: { status: string; called_at?: string; completed_at?: string } = { status };

    if (status === 'serving') {
      updates.called_at = new Date().toISOString();
    } else if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await supabase.from('queue_entries').update(updates).eq('id', queueId);

    if (!error) {
      await fetchQueueEntries();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!myBusiness) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Qnnect Admin
              </span>
              <button
                onClick={onSignOut}
                className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Create Your Business</h1>
          <p className="text-slate-600 mb-8">
            Get started by registering your hospital, clinic, or restaurant
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/30"
          >
            Create Business
          </button>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Create Business</h2>

                <form onSubmit={createBusiness} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Business Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="City General Hospital"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            type: e.target.value as 'hospital' | 'clinic' | 'restaurant',
                          })
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="hospital">Hospital</option>
                        <option value="clinic">Clinic</option>
                        <option value="restaurant">Restaurant</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      rows={3}
                      placeholder="Brief description of your business"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="123 Main St, City, State"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="+1 234 567 8900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="contact@business.com"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Max Daily Capacity
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.max_daily_capacity}
                        onChange={(e) =>
                          setFormData({ ...formData, max_daily_capacity: parseInt(e.target.value) })
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Avg Service Time (minutes)
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.avg_service_time}
                        onChange={(e) =>
                          setFormData({ ...formData, avg_service_time: parseInt(e.target.value) })
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Creating...' : 'Create Business'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Qnnect Admin
              </span>
              <p className="text-sm text-slate-600">{myBusiness.name}</p>
            </div>
            <button
              onClick={onSignOut}
              className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-sm font-medium">Waiting</span>
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.waiting}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-sm font-medium">Serving</span>
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.serving}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-sm font-medium">Completed Today</span>
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.completedToday}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-sm font-medium">Avg Wait</span>
              <BarChart3 className="w-5 h-5 text-cyan-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.avgWaitTime}m</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900">Current Queue</h2>
          </div>

          {queueEntries.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {queueEntries.map((entry) => (
                <div key={entry.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xl font-bold text-blue-600">#{entry.queue_number}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {entry.user_profiles.full_name}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {entry.user_profiles.phone || 'No phone'}
                        </p>
                        <p className="text-xs text-slate-500">
                          Joined at{' '}
                          {new Date(entry.joined_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {entry.status === 'waiting' && (
                        <button
                          onClick={() => updateQueueStatus(entry.id, 'serving')}
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30"
                        >
                          Call Now
                        </button>
                      )}
                      {entry.status === 'serving' && (
                        <button
                          onClick={() => updateQueueStatus(entry.id, 'completed')}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/30"
                        >
                          Complete
                        </button>
                      )}
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          entry.status === 'waiting'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {entry.status === 'waiting' ? 'Waiting' : 'Serving'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Queue Entries</h3>
              <p className="text-slate-600">Queue entries will appear here when users join</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
