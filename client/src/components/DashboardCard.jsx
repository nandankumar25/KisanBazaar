import React from 'react';

const DashboardCard = ({ title, value, subtitle, icon: Icon, color = 'emerald' }) => {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-50 border-emerald-200',
      iconBg: 'bg-emerald-600 text-white',
      text: 'text-emerald-700',
    },
    blue: {
      bg: 'bg-blue-50 border-blue-200',
      iconBg: 'bg-blue-600 text-white',
      text: 'text-blue-700',
    },
    amber: {
      bg: 'bg-amber-50 border-amber-200',
      iconBg: 'bg-amber-600 text-white',
      text: 'text-amber-700',
    },
    purple: {
      bg: 'bg-purple-50 border-purple-200',
      iconBg: 'bg-purple-600 text-white',
      text: 'text-purple-700',
    },
  };

  const theme = colorMap[color] || colorMap.emerald;

  return (
    <div className={`rounded-2xl p-5 border shadow-sm ${theme.bg} transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${theme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
        {value}
      </div>
      {subtitle && (
        <p className={`text-xs mt-1 font-medium ${theme.text}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default DashboardCard;
