import React from 'react';
import { Crown } from 'lucide-react';
import { Badge } from './ui/badge';
import { useRevenueCat } from '../contexts/RevenueCatContext';

export const ProBadge = ({ className = '' }) => {
  const { isProUser } = useRevenueCat();

  if (!isProUser) return null;

  return (
    <Badge
      variant="default"
      className={`bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 ${className}`}
    >
      <Crown className="h-3 w-3 mr-1" />
      PRO
    </Badge>
  );
};
