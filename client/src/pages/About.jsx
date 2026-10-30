import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  TrendingUp,
  Truck,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Store,
  MapPin,
  HeartHandshake,
} from 'lucide-react';

const About = () => {
  const pillars = [
    {
      icon: TrendingUp,
      title: 'Mandi Price Intelligence',
      description:
        'Live daily crop rate tracking across local and regional agricultural mandis to keep farmers informed before trading.',
      badge: 'Transparency',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      icon: Users,
      title: 'Direct Farmer-Buyer Match',
      description:
        'Farmers list harvested lots and negotiate directly with verified commercial buyers without predatory middleman margins.',
      badge: 'Fair Trade',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      icon: Truck,
      title: 'Integrated Rural Logistics',
      description:
        'Local commercial haulers list verified vehicle fleets with clear per-kilometer freight pricing for hassle-free transport.',
      badge: 'Logistics',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  ];

  const stakeholders = [
    {
      role: 'For Farmers',
      icon: Sprout,
      description:
        'Eliminate distress sales. List lots, compare market prices, receive competitive bids, and book reliable transport.',
      link: '/register',
      linkText: 'Join as Farmer',
      color: 'border-emerald-200 hover:border-emerald-400',
    },
    {
      role: 'For Mandi Buyers',
      icon: Store,
      description:
        'Access graded crops directly at the farm gate. Place bids, counter-offer, and arrange pickup seamlessly.',
      link: '/register',
      linkText: 'Join as Buyer',
      color: 'border-blue-200 hover:border-blue-400',
    },
    {
      role: 'For Transporters',
      icon: Truck,
      description:
        'Maximize fleet utilization. Register trucks, set per-KM rates, and receive transit assignments from local farmers.',
      link: '/register',
      linkText: 'Join as Transporter',
      color: 'border-amber-200 hover:border-amber-400',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100/80 text-emerald-800 rounded-full text-xs sm:text-sm font-semibold border border-emerald-200 shadow-xs">
          <Sprout className="w-4 h-4 text-emerald-600" />
          <span>Transforming Agricultural Trade in India</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
          About <span className="text-emerald-700">KisanBazaar</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          KisanBazaar is a digital agricultural marketplace built to eliminate market inefficiencies.
          We connect crop producers directly with mandi buyers and transport operators, ensuring fair price discovery and transparent farm-to-market logistics.
        </p>
      </div>

      {/* Core Mission & Value Proposition */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-3xl p-8 sm:p-12 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Our Mission
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
              Empowering Indian Farmers with Real Choice & True Market Realization
            </h2>
            <p className="text-emerald-100 text-sm leading-relaxed">
              Historically, smallholder farmers lose up to 30% of their harvest value due to lack of real-time market data, middlemen commissions, and inaccessible transport. KisanBazaar democratizes trade by giving farmers price visibility, direct buyer communication, and fair freight options.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <div className="text-3xl font-black text-white">0%</div>
              <div className="text-xs text-emerald-200 font-semibold mt-1">Hidden Middleman Fees</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <div className="text-3xl font-black text-white">100%</div>
              <div className="text-xs text-emerald-200 font-semibold mt-1">Direct Negotiations</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <div className="text-3xl font-black text-white">Live</div>
              <div className="text-xs text-emerald-200 font-semibold mt-1">Mandi Daily Rates</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <div className="text-3xl font-black text-white">Instant</div>
              <div className="text-xs text-emerald-200 font-semibold mt-1">Net Realization Math</div>
            </div>
          </div>
        </div>
      </div>

      {/* Core Pillars */}
      <div>
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            What Sets KisanBazaar Apart
          </h2>
          <p className="text-sm text-slate-600">
            A complete agricultural ecosystem combining produce marketing, buyer matchmaking, and freight logistics.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border mb-4 ${pillar.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {pillar.badge}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1 mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Who We Serve */}
      <div>
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Serving the Entire Agricultural Supply Chain
          </h2>
          <p className="text-sm text-slate-600">
            Dedicated portals and purpose-built toolsets tailored for each platform participant.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stakeholders.map((sh, idx) => {
            const Icon = sh.icon;
            return (
              <div
                key={idx}
                className={`bg-white rounded-3xl p-8 border shadow-xs transition hover:shadow-md flex flex-col justify-between ${sh.color}`}
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-800 mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{sh.role}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-6">
                    {sh.description}
                  </p>
                </div>
                <Link
                  to={sh.link}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 pt-3 border-t border-slate-100"
                >
                  <span>{sh.linkText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Ready to experience fair agri-trade?
        </h2>
        <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          Join thousands of farmers, traders, and logistics operators already collaborating on KisanBazaar.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to="/mandi-prices"
            className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl font-bold text-sm shadow-xs transition"
          >
            Explore Mandi Prices
          </Link>
          <Link
            to="/register"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition"
          >
            Join Free Today
          </Link>
        </div>
      </div>
    </div>
  );
};

export default About;
