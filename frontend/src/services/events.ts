import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type {
  CampusEvent,
  CampusEventDetail,
  CreateEventPayload,
  EventCategory,
} from "@/types/event";

export async function fetchEvents(params?: {
  category?: EventCategory;
  upcoming?: boolean;
  mine?: "created" | "joined";
  limit?: number;
}): Promise<CampusEvent[]> {
  const { data } = await api.get<ApiResponse<CampusEvent[]>>("/events", {
    params,
  });
  return data.data;
}

export async function updateEvent(
  eventId: number,
  payload: Partial<CreateEventPayload>
): Promise<CampusEventDetail> {
  const { data } = await api.put<ApiResponse<CampusEventDetail>>(
    `/events/${eventId}`,
    payload
  );
  return data.data;
}

export async function endEvent(eventId: number): Promise<CampusEventDetail> {
  const { data } = await api.post<ApiResponse<CampusEventDetail>>(
    `/events/${eventId}/end`
  );
  return data.data;
}

export async function deleteEvent(eventId: number): Promise<void> {
  await api.delete(`/events/${eventId}`);
}

export async function fetchEventDetail(
  eventId: number
): Promise<CampusEventDetail> {
  const { data } = await api.get<ApiResponse<CampusEventDetail>>(
    `/events/${eventId}`
  );
  return data.data;
}

export async function createEvent(
  payload: CreateEventPayload
): Promise<CampusEventDetail> {
  const { data } = await api.post<ApiResponse<CampusEventDetail>>(
    "/events",
    payload
  );
  return data.data;
}

export async function joinEvent(eventId: number): Promise<CampusEventDetail> {
  const { data } = await api.post<ApiResponse<CampusEventDetail>>(
    `/events/${eventId}/join`
  );
  return data.data;
}

export async function leaveEvent(eventId: number): Promise<CampusEventDetail> {
  const { data } = await api.delete<ApiResponse<CampusEventDetail>>(
    `/events/${eventId}/leave`
  );
  return data.data;
}
