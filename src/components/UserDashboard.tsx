import { useState, useEffect } from 'react';
import { Clock, MapPin, Phone, Mail, LogOut, Plus, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type Business = Database['public']['Tables']['businesses']['Row'];
type QueueEntry = Database['public']['Tables']['queue_entries']['Row'] & {
  businesses: Business;
};

interface UserDashboardProps {
  userId: string;
  onSignOut: () => void;
}

export default function UserDashboard({ userId, onSignOut }: UserDashboardProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [myQueues, setMyQueues] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [joiningQueue, setJoiningQueue] = useState(false);

  useEffect(() => {
    fetchData();
    const subscription = supabase
      .channel('queue_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_entries',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchMyQueues();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const fetchData = async () => {
    await Promise.all([fetchBusinesses(), fetchMyQueues()]);
    setLoading(false);
  };

  const fetchBusinesses = async () => {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .order('name');

    if (!error && data) {
      setBusinesses(data);
    }
  };

  const fetchMyQueues = async () => {
    const { data, error } = await supabase
      .from('queue_entries')
      .select('*, businesses(*)')
      .eq('user_id', userId)
      .in('status', ['waiting', 'serving'])
      .order('joined_at', { ascending: false });

    if (!error && data) {
      setMyQueues(data as QueueEntry[]);
    }
  };

  const joinQueue = async (business: Business) => {
    setJoiningQueue(true);

    try {
      const { data: todayQueues } = await supabase
        .from('queue_entries')
        .select('queue_number')
        .eq('business_id', business.id)
        .gte('joined_at', new Date().toISOString().split('T')[0])
        .order('queue_number', { ascending: false })
        .limit(1);

      const nextQueueNumber = (todayQueues?.[0]?.queue_number || 0) + 1;

      const { data: waitingCount } = await supabase
        .from('queue_entries')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .eq('status', 'waiting');

      const estimatedWait = (waitingCount || 0) * business.avg_service_time;

      const { error } = await supabase.from('queue_entries').insert({
        business_id: business.id,
        user_id: userId,
        queue_number: nextQueueNumber,
        status: 'waiting',
        estimated_wait_time: estimatedWait,
        notes: '',
      });

      if (error) throw error;

      await fetchMyQueues();
      setShowJoinModal(false);
      setSelectedBusiness(null);
    } catch (err) {
      console.error('Error joining queue:', err);
    } finally {
      setJoiningQueue(false);
    }
  };

  const cancelQueue = async (queueId: string) => {
    const { error } = await supabase
      .from('queue_entries')
      .update({ status: 'cancelled' })
      .eq('id', queueId);

    if (!error) {
      await fetchMyQueues();
    }
  };

  const getBusinessIcon = (type: string) => {
    return type === 'hospital' || type === 'clinic' ? '🏥' : '🍽️';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'serving':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Qnnect
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Queues</h1>
          <p className="text-slate-600">Manage your active queue positions</p>
        </div>

        {myQueues.length > 0 ? (
          <div className="grid gap-4 mb-12">
            {myQueues.map((queue) => (
              <div
                key={queue.id}
                className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="text-4xl">{getBusinessIcon(queue.businesses.type)}</div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{queue.businesses.name}</h3>
                      <p className="text-slate-600 text-sm">{queue.businesses.type}</p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                      queue.status
                    )}`}
                  >
                    {queue.status === 'waiting' ? 'Waiting' : 'Your Turn!'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 mb-1">Queue Number</p>
                    <p className="text-2xl font-bold text-blue-600">#{queue.queue_number}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 mb-1">Estimated Wait</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {queue.estimated_wait_time}m
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 mb-1">Joined At</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {new Date(queue.joined_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 mb-1">Status</p>
                    <p className="text-lg font-semibold text-slate-900 capitalize">
                      {queue.status}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => cancelQueue(queue.id)}
                  className="w-full py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                >
                  Cancel Queue
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 border border-slate-200 text-center mb-12">
            <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Queues</h3>
            <p className="text-slate-600 mb-6">Join a queue to get started</p>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Available Businesses</h2>
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/30"
          >
            <Plus className="w-5 h-5" />
            <span>Join Queue</span>
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((business) => (
            <div
              key={business.id}
              className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedBusiness(business);
                setShowJoinModal(true);
              }}
            >
              <div className="text-4xl mb-4">{getBusinessIcon(business.type)}</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{business.name}</h3>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">{business.description}</p>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-1">{business.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>{business.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>~{business.avg_service_time} min avg</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showJoinModal && selectedBusiness && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => {
                setShowJoinModal(false);
                setSelectedBusiness(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-8">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">{getBusinessIcon(selectedBusiness.type)}</div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  {selectedBusiness.name}
                </h2>
                <p className="text-slate-600">{selectedBusiness.description}</p>
              </div>

              <div className="space-y-3 mb-6 bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Average Service Time</span>
                  <span className="font-semibold text-slate-900">
                    {selectedBusiness.avg_service_time} minutes
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedBusiness.address}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Phone className="w-4 h-4" />
                  <span>{selectedBusiness.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4" />
                  <span>{selectedBusiness.email}</span>
                </div>
              </div>

              <button
                onClick={() => joinQueue(selectedBusiness)}
                disabled={joiningQueue}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joiningQueue ? 'Joining...' : 'Join Queue Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
