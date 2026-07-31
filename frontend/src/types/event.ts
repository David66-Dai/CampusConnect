export const EVENT_CATEGORIES = [
  "Academic",
  "Club",
  "Sports",
  "Volunteer",
  "Competition",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export type EventCreator = {
  id: number;
  name: string;
  avatar_url: string | null;
  school: string;
};

export type EventMemberInfo = {
  id: number;
  name: string;
  avatar_url: string | null;
  school: string;
  grade: string;
  joined_at: string;
};

export type CampusEvent = {
  id: number;
  title: string;
  description: string;
  category: EventCategory;
  location: string;
  /** ISO 日期，如 2026-08-01 */
  date: string;
  /** 时间，如 14:00:00 */
  time: string;
  max_participants: number;
  /** active：进行中；ended：发起人已结束 */
  status: "active" | "ended";
  creator_id: number;
  created_at: string;
  creator: EventCreator;
  member_count: number;
  is_joined: boolean;
  is_creator: boolean;
};

export type CampusEventDetail = CampusEvent & {
  members: EventMemberInfo[];
};

export type CreateEventPayload = {
  title: string;
  description: string;
  category: EventCategory;
  location: string;
  date: string;
  time: string;
  max_participants: number;
};
