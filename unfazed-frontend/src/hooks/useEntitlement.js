import { useState, useEffect } from 'react';
import api from '../utils/api';

export const useEntitlement = (featureKey) => {
  const [hasAccess, setHasAccess] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!featureKey) {
      setLoading(false);
      return;
    }
    checkAccess();
  }, [featureKey]);

  const checkAccess = async () => {
    try {
      const res = await api.get(`/subscriptions/check/${featureKey}`);
      setHasAccess(res.data.hasAccess);
    } catch {
      setHasAccess(true);
    } finally {
      setLoading(false);
    }
  };

  return { hasAccess, loading, checkAccess };
};

export default useEntitlement;
