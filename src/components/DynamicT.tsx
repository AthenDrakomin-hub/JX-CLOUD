import React, { useState, useEffect } from 'react';
import { tSync } from '../services/i18n';

interface DynamicTProps {
  k: string;
  params?: Record<string, any>;
  namespace?: string;
  fallback?: string;
  className?: string;
}

const DynamicT: React.FC<DynamicTProps> = ({ 
  k, 
  params, 
  namespace = 'common', 
  fallback,
  className 
}) => {
  const [translation, setTranslation] = useState<string>(() => {
    // Initialize with sync translation to avoid flickering
    return tSync(k, params, namespace) || fallback || k;
  });

  useEffect(() => {
    // Update translation when props change
    const newTranslation = tSync(k, params, namespace) || fallback || k;
    setTranslation(newTranslation);
  }, [k, params, namespace, fallback]);

  return <span className={className}>{translation}</span>;
};

export default DynamicT;