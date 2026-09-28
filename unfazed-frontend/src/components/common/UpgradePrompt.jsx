import React from 'react';
import { Link } from 'react-router-dom';

const UpgradePrompt = ({ feature, onClose }) => {
  return (
    <div className="text-center py-4">
      <div className="text-6xl mb-4">ðŸ”’</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Upgrade Required</h3>
      <p className="text-gray-600 mb-6">
        The <strong>{feature}</strong> feature is not available in your current plan.
        Upgrade to unlock this and many more features.
      </p>
      <div className="flex justify-center gap-3">
        <button onClick={onClose} className="btn-secondary">Maybe Later</button>
        <Link to="/therapist/settings" className="btn-primary">View Plans</Link>
      </div>
    </div>
  );
};

export default UpgradePrompt;
