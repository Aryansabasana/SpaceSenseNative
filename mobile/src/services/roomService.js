/**
 * Room API Service
 * Handles all room CRUD requests against /api/rooms.
 */
import { apiRequest } from './api';

export async function fetchRooms({ page = 1, limit = 10, roomType = '', search = '' } = {}) {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));

  if (roomType && roomType !== 'All') {
    params.append('roomType', roomType);
  }
  if (search && search.trim()) {
    params.append('search', search.trim());
  }

  return apiRequest(`/rooms?${params.toString()}`, { method: 'GET' });
}

export async function createRoom({ roomName, roomType, notes }) {
  return apiRequest('/rooms', {
    method: 'POST',
    body: { roomName, roomType, notes },
  });
}

export async function fetchRoomById(roomId) {
  return apiRequest(`/rooms/${roomId}`, { method: 'GET' });
}

export async function updateRoom(roomId, updates) {
  return apiRequest(`/rooms/${roomId}`, {
    method: 'PUT',
    body: updates,
  });
}

export async function saveRoomMeasurements(roomId, { length, width, height, openings }) {
  return apiRequest(`/rooms/${roomId}/measurements`, {
    method: 'PUT',
    body: { length, width, height, openings },
  });
}

export async function deleteRoom(roomId) {
  return apiRequest(`/rooms/${roomId}`, {
    method: 'DELETE',
  });
}
