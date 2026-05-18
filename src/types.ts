export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: 'Stock' | 'Crypto' | 'Commodity' | 'Forex';
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  brokerage: string;
}

export interface UserProfile {
  name: string;
  currency: string;
  goal: string;
  targetAmount: number;
  riskTolerance: 'Low' | 'Medium' | 'High';
  knowledgeLevel: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface LearningSnippet {
  title: string;
  analogy: string;
  example: string;
  checks: {
    question: string;
    options: string[];
    answer: number;
  }[];
}

export interface MarketNews {
  title: string;
  sentiment: string;
  source: string;
}

export interface MarketData {
  symbol: string;
  price: string;
  change: string;
  history: { time: number; value: string }[];
}

export interface SocialSentiment {
  globalScore: number;
  trendingAssets: {
    symbol: string;
    mentions: number;
    sentiment: string;
  }[];
  topKeywords: string[];
  historicalSentiment: {
    time: string;
    score: number;
  }[];
}
