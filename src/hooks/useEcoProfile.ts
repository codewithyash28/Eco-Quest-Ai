import { useState, useEffect } from 'react';
import { UserProfile } from '../types';

const STORAGE_KEY = 'ecoquest_user_profile';

const INITIAL_PROFILE: UserProfile = {
  name: 'Eco Explorer',
  points: 0,
  level: 1,
  badges: [],
  streak: 0,
  lastActive: new Date().toISOString(),
  footprint: {
    transportation: 0,
    energy: 0,
    diet: 0,
    waste: 0,
    shopping: 0,
  },
  completedActions: [],
  history: Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    co2Saved: 0
  })),
  isWorkplaceMode: false,
  language: 'en',
};

export function useEcoProfile() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure history exists for older profiles
      if (!parsed.history) parsed.history = INITIAL_PROFILE.history;
      return parsed;
    }
    return INITIAL_PROFILE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const updateFootprint = (data: Partial<UserProfile['footprint']>) => {
    setProfile(prev => ({
      ...prev,
      footprint: { ...prev.footprint, ...data }
    }));
  };

  const completeAction = (actionId: string, points: number, impact: number) => {
    setProfile(prev => {
      const today = new Date().toISOString().split('T')[0];
      const newPoints = prev.points + points;
      const newLevel = Math.floor(newPoints / 500) + 1;
      const leveledUp = newLevel > prev.level;
      
      if (leveledUp) {
        window.dispatchEvent(new CustomEvent('eco-level-up', { detail: { level: newLevel } }));
      }

      // Update history
      const newHistory = [...prev.history];
      const todayIndex = newHistory.findIndex(h => h.date === today);
      if (todayIndex !== -1) {
        newHistory[todayIndex] = { ...newHistory[todayIndex], co2Saved: newHistory[todayIndex].co2Saved + impact };
      } else {
        newHistory.push({ date: today, co2Saved: impact });
        if (newHistory.length > 30) newHistory.shift();
      }

      // Update streak
      const lastActiveDate = prev.lastActive.split('T')[0];
      let newStreak = prev.streak;
      if (lastActiveDate !== today) {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        if (lastActiveDate === yesterday) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }

      return {
        ...prev,
        points: newPoints,
        completedActions: [...prev.completedActions, actionId],
        level: newLevel,
        history: newHistory,
        streak: newStreak,
        lastActive: new Date().toISOString()
      };
    });
  };

  return { profile, updateFootprint, completeAction };
}
