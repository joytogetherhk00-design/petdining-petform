import React from 'react';
import { Card } from '@/components/ui/card';

export default function StatsCard({ title, value, icon: Icon, color }) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-2.5 rounded-xl ${color || 'bg-primary/10'}`}>
          <Icon className={`h-5 w-5 ${color ? 'text-white' : 'text-primary'}`} />
        </div>
      </div>
    </Card>
  );
}