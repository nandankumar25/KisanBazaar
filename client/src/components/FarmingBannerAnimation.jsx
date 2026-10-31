import React from 'react';
import { Sun, Wind, CloudSun, Sparkles } from 'lucide-react';

const FarmingBannerAnimation = () => {
  return (
    <div className="relative w-full h-full min-h-[220px] sm:min-h-[280px] flex items-center justify-center overflow-hidden pointer-events-none select-none">
      {/* 1. Ambient Warm Golden Sun Glow */}
      <div className="absolute top-4 right-10 sm:right-16 w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-amber-400/90 to-yellow-200/95 blur-md animate-farm-sun-pulse shadow-[0_0_50px_rgba(251,191,36,0.6)]" />

      {/* Sun Ray Halos */}
      <div className="absolute top-1 right-7 sm:right-13 w-32 h-32 sm:w-40 sm:h-40 rounded-full border border-yellow-300/30 animate-pulse pointer-events-none" />
      <div className="absolute -top-3 right-3 sm:right-9 w-40 h-40 sm:w-48 sm:h-48 rounded-full border border-amber-300/20 pointer-events-none" />

      {/* 2. Floating Agri-Advisory Micro Card */}
      <div className="absolute top-6 left-2 sm:left-6 z-20 animate-farm-float pointer-events-auto">
        <div className="bg-black/35 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-3.5 shadow-xl text-white max-w-[210px] space-y-1.5 transform hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
            <span className="flex items-center space-x-1">
              <CloudSun className="w-3.5 h-3.5 text-amber-400" />
              <span>Optimal Harvest</span>
            </span>
            <span className="flex items-center space-x-1 text-[9px] bg-emerald-500/30 text-emerald-200 px-1.5 py-0.5 rounded-full border border-emerald-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Active</span>
            </span>
          </div>
          <div className="text-xs font-black text-white tracking-wide">
            28°C • Sunny & Dry
          </div>
          <div className="text-[10px] text-emerald-200/90 font-medium flex items-center justify-between pt-1 border-t border-white/10">
            <span>Wheat (Kanak)</span>
            <span className="font-bold text-amber-300">MSP ₹2,275</span>
          </div>
        </div>
      </div>

      {/* 3. Floating Organic Leaves & Golden Spores */}
      <div className="absolute bottom-16 right-20 w-3 h-3 text-emerald-300 animate-farm-leaf-1 pointer-events-none">
        🍃
      </div>
      <div className="absolute bottom-20 right-36 w-3 h-3 text-emerald-200 animate-farm-leaf-2 pointer-events-none">
        🌱
      </div>
      <div className="absolute bottom-28 right-12 w-2 h-2 rounded-full bg-amber-300/80 animate-ping pointer-events-none" />
      <div className="absolute bottom-24 right-28 w-1.5 h-1.5 rounded-full bg-yellow-200/90 animate-pulse pointer-events-none" />

      {/* 4. Layered Farmland & Windmill SVG Scene */}
      <svg
        viewBox="0 0 460 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full max-h-[260px] object-contain object-bottom relative z-10"
      >
        <defs>
          <linearGradient id="hillFar" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#047857" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#065f46" stopOpacity="0.6" />
          </linearGradient>

          <linearGradient id="hillMid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#047857" stopOpacity="0.9" />
          </linearGradient>

          <linearGradient id="hillFront" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          <linearGradient id="wheatGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>

          <linearGradient id="wheatLush" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
        </defs>

        {/* Far Background Rolling Hills */}
        <path
          d="M-20 200 Q 110 130 260 170 T 480 150 L 480 260 L -20 260 Z"
          fill="url(#hillFar)"
        />

        {/* Farm Windmill Tower on Hill */}
        <g transform="translate(140, 105)">
          {/* Windmill Tower Body */}
          <polygon points="12,65 17,65 16,22 13,22" fill="#e2e8f0" opacity="0.85" />
          <polygon points="13,22 16,22 15,16 14,16" fill="#cbd5e1" />
          <circle cx="14.5" cy="18" r="3" fill="#0f172a" />

          {/* Windmill Rotating Propeller Blades */}
          <g
            className="animate-spin-windmill"
            style={{ transformOrigin: '14.5px 18px' }}
          >
            {/* Blade 1 */}
            <path d="M14.5 18 L13 2 L16 2 Z" fill="#f8fafc" />
            <line x1="14.5" y1="18" x2="14.5" y2="2" stroke="#94a3b8" strokeWidth="0.5" />
            {/* Blade 2 */}
            <path d="M14.5 18 L28 26 L26 29 Z" fill="#f8fafc" />
            {/* Blade 3 */}
            <path d="M14.5 18 L2 27 L4 30 Z" fill="#f8fafc" />
            {/* Center Cap */}
            <circle cx="14.5" cy="18" r="1.5" fill="#f59e0b" />
          </g>
        </g>

        {/* Midground Rolling Hills */}
        <path
          d="M-30 220 Q 90 160 230 190 T 490 175 L 490 260 L -30 260 Z"
          fill="url(#hillMid)"
        />

        {/* Farm Tractor driving across hill */}
        <g transform="translate(60, 185) scale(0.65)" opacity="0.95">
          {/* Tractor Cabin & Body */}
          <rect x="18" y="8" width="18" height="18" rx="2" fill="#ef4444" />
          <rect x="22" y="11" width="12" height="8" rx="1" fill="#bae6fd" />
          <rect x="36" y="14" width="16" height="12" rx="2" fill="#ef4444" />
          <rect x="46" y="8" width="3" height="6" fill="#334155" />
          {/* Exhaust Smoke */}
          <circle cx="47.5" cy="5" r="1.5" fill="#cbd5e1" opacity="0.6" className="animate-ping" />
          {/* Wheels */}
          <circle cx="24" cy="27" r="7" fill="#1e293b" />
          <circle cx="24" cy="27" r="3.5" fill="#f8fafc" />
          <circle cx="46" cy="27" r="4.5" fill="#1e293b" />
          <circle cx="46" cy="27" r="2" fill="#f8fafc" />
        </g>

        {/* Foreground Lush Terrace */}
        <path
          d="M-10 235 Q 160 195 330 225 T 480 215 L 480 260 L -10 260 Z"
          fill="url(#hillFront)"
        />

        {/* --- 5. Swaying Golden Wheat Stalks (गेहूं की बालियां) --- */}

        {/* Wheat Stalk 1 (Golden, Left) */}
        <g className="animate-farm-sway-slow" style={{ transformOrigin: '210px 255px' }}>
          <path d="M210 255 Q212 185 220 145" stroke="#ca8a04" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Wheat Grains / Ear */}
          <ellipse cx="220" cy="142" rx="4" ry="7" fill="url(#wheatGold)" transform="rotate(15 220 142)" />
          <ellipse cx="217" cy="153" rx="4" ry="7" fill="url(#wheatGold)" transform="rotate(-15 217 153)" />
          <ellipse cx="223" cy="164" rx="4" ry="7" fill="url(#wheatGold)" transform="rotate(18 223 164)" />
          <ellipse cx="216" cy="175" rx="3.5" ry="6" fill="url(#wheatGold)" transform="rotate(-12 216 175)" />
          <ellipse cx="222" cy="186" rx="3.5" ry="6" fill="url(#wheatGold)" transform="rotate(15 222 186)" />
          {/* Whiskers / Awns */}
          <line x1="220" y1="136" x2="228" y2="120" stroke="#fef08a" strokeWidth="1" />
          <line x1="218" y1="138" x2="210" y2="122" stroke="#fef08a" strokeWidth="1" />
          <line x1="223" y1="148" x2="235" y2="135" stroke="#fef08a" strokeWidth="1" />
        </g>

        {/* Wheat Stalk 2 (Tall Center Golden) */}
        <g className="animate-farm-sway" style={{ transformOrigin: '255px 255px' }}>
          <path d="M255 255 Q258 175 268 128" stroke="#ca8a04" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Wheat Head */}
          <ellipse cx="268" cy="125" rx="4.5" ry="8" fill="url(#wheatGold)" transform="rotate(10 268 125)" />
          <ellipse cx="263" cy="138" rx="4.5" ry="8" fill="url(#wheatGold)" transform="rotate(-20 263 138)" />
          <ellipse cx="271" cy="151" rx="4.5" ry="8" fill="url(#wheatGold)" transform="rotate(16 271 151)" />
          <ellipse cx="264" cy="164" rx="4" ry="7" fill="url(#wheatGold)" transform="rotate(-15 264 164)" />
          <ellipse cx="270" cy="177" rx="4" ry="7" fill="url(#wheatGold)" transform="rotate(14 270 177)" />
          {/* Whiskers */}
          <line x1="268" y1="118" x2="276" y2="98" stroke="#fef08a" strokeWidth="1.2" />
          <line x1="266" y1="120" x2="256" y2="102" stroke="#fef08a" strokeWidth="1.2" />
          <line x1="272" y1="132" x2="286" y2="116" stroke="#fef08a" strokeWidth="1.2" />
        </g>

        {/* Wheat Stalk 3 (Lush Greenish Golden, Mid) */}
        <g className="animate-farm-sway-fast" style={{ transformOrigin: '295px 255px' }}>
          <path d="M295 255 Q290 190 282 150" stroke="#65a30d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Wheat Grains */}
          <ellipse cx="282" cy="147" rx="4" ry="7" fill="url(#wheatLush)" transform="rotate(-12 282 147)" />
          <ellipse cx="287" cy="158" rx="4" ry="7" fill="url(#wheatLush)" transform="rotate(18 287 158)" />
          <ellipse cx="280" cy="169" rx="4" ry="7" fill="url(#wheatLush)" transform="rotate(-16 280 169)" />
          <ellipse cx="286" cy="180" rx="3.5" ry="6" fill="url(#wheatLush)" transform="rotate(15 286 180)" />
          {/* Whiskers */}
          <line x1="282" y1="140" x2="275" y2="124" stroke="#bef264" strokeWidth="1" />
          <line x1="284" y1="142" x2="294" y2="126" stroke="#bef264" strokeWidth="1" />
        </g>

        {/* Wheat Stalk 4 (Right Golden Stalk) */}
        <g className="animate-farm-sway-slow" style={{ transformOrigin: '340px 255px' }}>
          <path d="M340 255 Q348 180 358 135" stroke="#ca8a04" strokeWidth="2.8" fill="none" strokeLinecap="round" />
          {/* Wheat Head */}
          <ellipse cx="358" cy="132" rx="4.5" ry="7.5" fill="url(#wheatGold)" transform="rotate(18 358 132)" />
          <ellipse cx="352" cy="144" rx="4.5" ry="7.5" fill="url(#wheatGold)" transform="rotate(-16 352 144)" />
          <ellipse cx="360" cy="157" rx="4" ry="7" fill="url(#wheatGold)" transform="rotate(20 360 157)" />
          <ellipse cx="353" cy="170" rx="4" ry="6.5" fill="url(#wheatGold)" transform="rotate(-14 353 170)" />
          {/* Whiskers */}
          <line x1="358" y1="125" x2="370" y2="108" stroke="#fef08a" strokeWidth="1.2" />
          <line x1="356" y1="128" x2="344" y2="112" stroke="#fef08a" strokeWidth="1.2" />
        </g>

        {/* Wheat Stalk 5 (Far Right) */}
        <g className="animate-farm-sway" style={{ transformOrigin: '380px 255px' }}>
          <path d="M380 255 Q385 195 392 155" stroke="#ca8a04" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <ellipse cx="392" cy="152" rx="3.5" ry="6.5" fill="url(#wheatGold)" transform="rotate(12 392 152)" />
          <ellipse cx="387" cy="163" rx="3.5" ry="6.5" fill="url(#wheatGold)" transform="rotate(-15 387 163)" />
          <ellipse cx="393" cy="174" rx="3.5" ry="6.5" fill="url(#wheatGold)" transform="rotate(14 393 174)" />
        </g>
      </svg>
    </div>
  );
};

export default FarmingBannerAnimation;
