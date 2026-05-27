import React from 'react';

const ORIGIN_CONFIG = {
  '中國': { flag: '🇨🇳', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  '香港': { flag: '🇭🇰', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  '台灣': { flag: '🇹🇼', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  '日本': { flag: '🇯🇵', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  '韓國': { flag: '🇰🇷', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  '美國': { flag: '🇺🇸', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  '歐洲': { flag: '🇪🇺', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  '澳洲': { flag: '🇦🇺', bg: 'bg-gray-800', text: 'text-white', border: 'border-gray-700' },
  '泰國': { flag: '🇹🇭', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  '其他': { flag: '🌏', bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' },
};

export const ORIGINS = Object.keys(ORIGIN_CONFIG);

export default function OriginBadge({ origin, size = 'sm' }) {
  const config = ORIGIN_CONFIG[origin];
  if (!config) return null;
  const padding = size === 'xs' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs font-medium';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${config.bg} ${config.text} ${config.border} ${padding}`}>
      <span>{config.flag}</span>
      <span>{origin}</span>
    </span>
  );
}