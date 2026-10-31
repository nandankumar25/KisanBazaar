import React from 'react';

const DashboardCard = ({ title, value, subtitle, icon: Icon, color = 'emerald' }) => {
  const colorMap = {
    emerald: {
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/25',
      glow: 'bg-emerald-500',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      hoverBorder: 'group-hover:border-emerald-300',
      accent: 'text-emerald-600',
    },
    blue: {
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/25',
      glow: 'bg-blue-500',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      hoverBorder: 'group-hover:border-blue-300',
      accent: 'text-blue-600',
    },
    amber: {
      gradient: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/25',
      glow: 'bg-amber-500',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      hoverBorder: 'group-hover:border-amber-300',
      accent: 'text-amber-600',
    },
    purple: {
      gradient: 'from-purple-500 to-fuchsia-600',
      shadow: 'shadow-purple-500/25',
      glow: 'bg-purple-500',
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
      hoverBorder: 'group-hover:border-purple-300',
      accent: 'text-purple-600',
    },
    teal: {
      gradient: 'from-teal-500 to-emerald-600',
      shadow: 'shadow-teal-500/25',
      glow: 'bg-teal-500',
      badge: 'bg-teal-50 text-teal-700 border-teal-200',
      hoverBorder: 'group-hover:border-teal-300',
      accent: 'text-teal-600',
    },
    rose: {
      gradient: 'from-rose-500 to-pink-600',
      shadow: 'shadow-rose-500/25',
      glow: 'bg-rose-500',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      hoverBorder: 'group-hover:border-rose-300',
      accent: 'text-rose-600',
    },
    slate: {
      gradient: 'from-slate-700 to-slate-900',
      shadow: 'shadow-slate-700/25',
      glow: 'bg-slate-700',
      badge: 'bg-slate-100 text-slate-700 border-slate-300',
      hoverBorder: 'group-hover:border-slate-400',
      accent: 'text-slate-600',
    },
  };

  const theme = colorMap[color] || colorMap.emerald;

  return (
    <div
      className={`group relative overflow-hidden bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${theme.hoverBorder}`}
    >
      {/* Ambient gradient glow in the corner */}
      <div
        className={`absolute -right-8 -top-8 w-28 h-28 rounded-full ${theme.glow} opacity-10 blur-2xl pointer-events-none group-hover:opacity-25 transition-opacity duration-300`}
      />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            {title}
          </span>
          <div className={`font-black text-slate-900 tracking-tight truncate ${String(value).length > 6 ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'}`}>
            {value}
          </div>
        </div>

        {/* Glowing gradient icon container */}
        <div
          className={`p-3.5 rounded-2xl bg-gradient-to-br ${theme.gradient} text-white shadow-lg ${theme.shadow} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}
        >
          <Icon className="w-6 h-6 stroke-[2.2]" />
        </div>
      </div>

      {subtitle && (
        <div className="relative z-10 mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className={`text-xs font-semibold ${theme.accent}`}>
            {subtitle}
          </span>
          <span className="text-[10px] text-slate-400 font-medium group-hover:text-slate-600 transition-colors">
            Live Metric
          </span>
        </div>
      )}
    </div>
  );
};

export default DashboardCard;
