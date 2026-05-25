import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusMap = {
  pending: { label: '待處理', class: 'bg-amber-100 text-amber-700 border-amber-200' },
  confirmed: { label: '已確認', class: 'bg-blue-100 text-blue-700 border-blue-200' },
  shipped: { label: '已出貨', class: 'bg-purple-100 text-purple-700 border-purple-200' },
  completed: { label: '已完成', class: 'bg-green-100 text-green-700 border-green-200' },
  active: { label: '啟用', class: 'bg-green-100 text-green-700 border-green-200' },
  inactive: { label: '停用', class: 'bg-gray-100 text-gray-500 border-gray-200' },
  suspended: { label: '暫停', class: 'bg-red-100 text-red-700 border-red-200' },
  approved: { label: '已批准', class: 'bg-green-100 text-green-700 border-green-200' },
  rejected: { label: '已拒絕', class: 'bg-red-100 text-red-700 border-red-200' },
  expired: { label: '已過期', class: 'bg-gray-100 text-gray-500 border-gray-200' },
};

export default function StatusBadge({ status }) {
  const config = statusMap[status] || { label: status, class: 'bg-gray-100 text-gray-500' };
  return (
    <Badge variant="outline" className={cn('font-medium text-xs', config.class)}>
      {config.label}
    </Badge>
  );
}