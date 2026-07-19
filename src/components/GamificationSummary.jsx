import React from 'react';
import GamificationPanel from './gamification/GamificationPanel.jsx';
import { buildRewardSummary } from '../gamification/index.js';

export default function GamificationSummary({ profile = {}, className = '' }) {
  return <GamificationPanel rewardSummary={buildRewardSummary(profile)} className={className} />;
}
