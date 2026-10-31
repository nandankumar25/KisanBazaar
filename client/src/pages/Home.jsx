import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  MapPin, 
  Users, 
  Truck, 
  CheckCircle2, 
  ArrowRight, 
  Sprout,
  Store,
  DollarSign,
  LayoutDashboard
} from 'lucide-react';

const Home = () => {
  const { user } = useAuth();

  const getDashboardLink = (role) => {
    switch (role) {
      case 'FARMER':
        return '/dashboard';
      case 'BUYER':
        return '/buyer-dashboard';
      case 'TRANSPORTER':
        return '/transporter-dashboard';
      case 'MANDI_ADMIN':
        return '/mandi-dashboard';
      case 'ADMIN':
        return '/admin';
      default:
        return '/dashboard';
    }
  };
  const steps = [
    {
      id: 1,
      title: 'Farmer',
      desc: 'Register crop lot with quantity, quality & location',
      icon: Sprout,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200'
    },
    {
      id: 2,
      title: 'Compare Markets',
      desc: 'Check live mandi crop rates in nearby markets',
      icon: Store,
      color: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    {
      id: 3,
      title: 'Find Buyer',
      desc: 'Receive competitive offers from verified buyers',
      icon: Users,
      color: 'bg-amber-50 text-amber-600 border-amber-200'
    },
    {
      id: 4,
      title: 'Arrange Transport',
      desc: 'Find affordable transport & estimate net income',
      icon: Truck,
      color: 'bg-purple-50 text-purple-600 border-purple-200'
    },
    {
      id: 5,
      title: 'Sell',
      desc: 'Complete seamless harvest trade with best realization',
      icon: DollarSign,
      color: 'bg-green-50 text-green-600 border-green-200'
    }
  ];

  const features = [
    {
      icon: MapPin,
      title: 'Nearby Mandi Discovery',
      description: 'Locate local mandis around your farm and view real-time crop rates.'
    },
    {
      icon: TrendingUp,
      title: 'Guaranteed Fair Pricing',
      description: 'Sell at fair market prices without hidden deductions or middleman commissions.'
    },
    {
      icon: Users,
      title: 'Direct Buyer Connect',
      description: 'Receive direct offers from verified buyers without middlemen markup.'
    },
    {
      icon: Truck,
      title: 'Affordable Logistics',
      description: 'Compare transport rates and book reliable produce haulers.'
    }
  ];

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/80 via-white to-slate-50 pt-16 pb-20 border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* Tagline Badge */}
            <div className="inline-flex items-center space-x-2 bg-emerald-100/80 text-emerald-800 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide shadow-sm border border-emerald-200">
              <Sprout className="w-4 h-4 text-emerald-600" />
              <span>Better Prices. Better Markets. Better Farming.</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Kisan<span className="text-emerald-600">Bazaar</span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              Helping farmers discover nearby markets, compare crop prices, connect with buyers, and find affordable transportation.
            </p>

            {/* Action Buttons */}
            {user ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link
                  to={getDashboardLink(user.role)}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 group"
                >
                  <LayoutDashboard className="mr-2 w-5 h-5" />
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                {user.role === 'FARMER' && (
                  <Link
                    to="/mandi-prices"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-slate-300 text-base font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 shadow-sm hover:border-slate-400 transition-all duration-200"
                  >
                    View Mandi Prices
                  </Link>
                )}
                {user.role === 'BUYER' && (
                  <Link
                    to="/find-crops"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-slate-300 text-base font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 shadow-sm hover:border-slate-400 transition-all duration-200"
                  >
                    Find Crops
                  </Link>
                )}
                {user.role === 'TRANSPORTER' && (
                  <Link
                    to="/my-vehicles"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-slate-300 text-base font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 shadow-sm hover:border-slate-400 transition-all duration-200"
                  >
                    My Vehicles
                  </Link>
                )}
                {user.role === 'MANDI_ADMIN' && (
                  <Link
                    to="/mandi-offers"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-slate-300 text-base font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 shadow-sm hover:border-slate-400 transition-all duration-200"
                  >
                    Mandi Offers
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 group"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-slate-300 text-base font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 shadow-sm hover:border-slate-400 transition-all duration-200"
                >
                  Login
                </Link>
              </div>
            )}

            {/* Feature Pills */}
            <div className="pt-8 flex flex-wrap justify-center gap-6 text-slate-500 text-xs sm:text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero Middlemen Pricing</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Mandi Price Comparison</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Transparent Transport Rates</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How KisanBazaar Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
            How KisanBazaar Works
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            A seamless 5-step process empowering farmers to maximize crop profits.
          </p>
        </div>

        {/* Steps Flow Diagram */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-center text-center relative group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${step.color} mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-emerald-600 mb-1 uppercase tracking-wider">
                  Step 0{step.id}
                </span>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Key Benefits Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Why Farmers Choose KisanBazaar
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Built specifically to bridge the market gap between crop producers, nearby mandis, and transport providers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="bg-slate-800/60 backdrop-blur border border-slate-700/60 p-6 rounded-2xl">
                  <div className="bg-emerald-500/20 text-emerald-400 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-lg text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
