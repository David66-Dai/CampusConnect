export type MatchedUserInfo = {
  id: number;
  name: string;
  avatar_url: string | null;
  school: string;
  grade: string;
  bio: string | null;
  interests: string[];
  skills: string[];
  goals: string[];
};

export type MatchResult = {
  user: MatchedUserInfo;
  /** 加权匹配分 0-100（兴趣 50% / 目标 30% / 技能 20%） */
  score: number;
  common_interests: string[];
  common_skills: string[];
  common_goals: string[];
};
