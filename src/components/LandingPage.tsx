import { Clock, Users, Bell, TrendingUp, Building2, UtensilsCrossed, Smartphone, BarChart3 } from 'lucide-react';

export default function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Qnnect
              </span>
            </div>
            <button
              onClick={onGetStarted}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/30"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Clock className="w-4 h-4" />
            <span>Smart Queue Management</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
            Smart queues.
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Zero waiting.
            </span>
          </h1>

          <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-2xl mx-auto">
            Join virtual queues from anywhere. Get real-time updates. Never waste time waiting in line again.
            Perfect for hospitals, clinics, and restaurants.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-2xl shadow-blue-500/40 hover:scale-105"
            >
              Join a Queue
            </button>
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-white text-slate-700 rounded-xl font-semibold text-lg border-2 border-slate-200 hover:border-blue-300 hover:text-blue-600 transition-all"
            >
              For Businesses
            </button>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-slate-200 hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center mb-6">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Hospitals & Clinics</h3>
            <p className="text-slate-600 leading-relaxed">
              Reduce waiting room congestion. Let patients wait safely from home with real-time updates.
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-slate-200 hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center mb-6">
              <UtensilsCrossed className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Restaurants</h3>
            <p className="text-slate-600 leading-relaxed">
              Handle rush hours smoothly. Let guests explore nearby while they wait for their table.
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-slate-200 hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-fuchsia-400 rounded-xl flex items-center justify-center mb-6">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Any Business</h3>
            <p className="text-slate-600 leading-relaxed">
              Scale your service capacity intelligently with data-driven crowd management.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              How it works
            </h2>
            <p className="text-xl text-slate-600">
              Simple, fast, and powerful queue management
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-8">For Users</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-2">Browse & Join</h4>
                    <p className="text-slate-600">Find your hospital, clinic, or restaurant and join the queue instantly with one tap.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-2">Live Updates</h4>
                    <p className="text-slate-600">See real-time wait times and your position in queue. Know exactly when to arrive.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Bell className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-2">Smart Notifications</h4>
                    <p className="text-slate-600">Get notified when your turn is approaching. Never miss your spot.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-8">For Businesses</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-2">Queue Dashboard</h4>
                    <p className="text-slate-600">Manage your entire queue from one powerful dashboard. Call, serve, or notify customers.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-fuchsia-100 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-fuchsia-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-2">Analytics & Insights</h4>
                    <p className="text-slate-600">Track peak hours, average wait times, and optimize your service flow with data.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-2">Capacity Control</h4>
                    <p className="text-slate-600">Set daily limits and service times. Prevent overcrowding automatically.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-blue-600 to-cyan-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to skip the wait?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join thousands using Qnnect to save time and reduce stress.
          </p>
          <button
            onClick={onGetStarted}
            className="px-10 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all shadow-2xl hover:scale-105"
          >
            Get Started Now
          </button>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Qnnect</span>
          </div>
          <p className="text-sm">Smart queues for a smarter future.</p>
        </div>
      </footer>
    </div>
  );
}
