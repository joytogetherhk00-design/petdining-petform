import React from 'react';

export const MEAT_TYPES = [
  { value: 'duck',     label: '🦆 鴨肉', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'chicken',  label: '🐔 雞肉', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'beef',     label: '🐮 牛肉', className: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'lamb',     label: '🐑 羊肉', className: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'fish',     label: '🐟 魚肉', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'seafood',  label: '🦐 海鮮', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'other',    label: '📦 其他', className: 'bg-gray-100 text-gray-600 border-gray-200' },
];

export default function MeatBadge({ meatType }) {
  const config = MEAT_TYPES.find(m => m.value === meatType);
  if (!config) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
}