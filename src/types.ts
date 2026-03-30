export interface FootprintData {
  transportation: number; // kg CO2 per month
  energy: number;
  diet: number;
  waste: number;
  shopping: number;
}

export interface UserProfile {
  name: string;
  points: number;
  level: number;
  badges: string[];
  streak: number;
  lastActive: string;
  footprint: FootprintData;
  completedActions: string[];
  history: { date: string; co2Saved: number }[];
  isWorkplaceMode: boolean;
  language: 'en' | 'es' | 'fr' | 'de';
}

export interface CommunityStats {
  globalCO2Saved: number;
  activeUsers: number;
  currentChallenge: {
    title: string;
    target: number;
    current: number;
    deadline: string;
  };
}

export interface CorporateStats {
  companyName: string;
  teamCO2Saved: number;
  rank: number;
  topPerformers: { name: string; points: number }[];
}

export interface EcoAction {
  id: string;
  title: string;
  description: string;
  impact: number; // kg CO2 saved
  savings: number; // $ saved
  points: number;
  category: 'transport' | 'energy' | 'diet' | 'waste' | 'shopping';
}

export const DEFAULT_ACTIONS: EcoAction[] = [
  { id: '1', title: 'Use Public Transport', description: 'Take the bus or train instead of driving.', impact: 5, savings: 3, points: 50, category: 'transport' },
  { id: '2', title: 'Meat-free Day', description: 'Skip meat for a whole day.', impact: 8, savings: 5, points: 80, category: 'diet' },
  { id: '3', title: 'Turn off Unused Lights', description: 'Save energy by switching off lights.', impact: 0.5, savings: 0.2, points: 10, category: 'energy' },
  { id: '4', title: 'Compost Waste', description: 'Start composting your organic waste.', impact: 2, savings: 0, points: 40, category: 'waste' },
  { id: '5', title: 'Reusable Coffee Cup', description: 'Bring your own cup to the cafe.', impact: 0.1, savings: 0.5, points: 15, category: 'shopping' },
];
