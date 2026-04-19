import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Todos API
export const todosApi = {
  getAll: (params = {}) => axios.get(`${API_URL}/todos`, { params }),
  getById: (id) => axios.get(`${API_URL}/todos/${id}`),
  create: (data) => axios.post(`${API_URL}/todos`, data),
  update: (id, data) => axios.patch(`${API_URL}/todos/${id}`, data),
  delete: (id) => axios.delete(`${API_URL}/todos/${id}`),
};

// Tags API
export const tagsApi = {
  getAll: () => axios.get(`${API_URL}/tags`),
  create: (data) => axios.post(`${API_URL}/tags`, data),
  delete: (id) => axios.delete(`${API_URL}/tags/${id}`),
};

// Habits API
export const habitsApi = {
  getAll: (params = {}) => axios.get(`${API_URL}/habits`, { params }),
  create: (data) => axios.post(`${API_URL}/habits`, data),
  update: (id, data) => axios.patch(`${API_URL}/habits/${id}`, data),
  delete: (id) => axios.delete(`${API_URL}/habits/${id}`),
};

// Habit Logs API
export const habitLogsApi = {
  getAll: (params = {}) => axios.get(`${API_URL}/habit-logs`, { params }),
  create: (data) => axios.post(`${API_URL}/habit-logs`, data),
  delete: (id) => axios.delete(`${API_URL}/habit-logs/${id}`),
};

// Analytics API
export const analyticsApi = {
  getHabits: (params = {}) => axios.get(`${API_URL}/analytics/habits`, { params }),
};

// Activity Types API
export const activityTypesApi = {
  getAll: () => axios.get(`${API_URL}/activity-types`),
  create: (data) => axios.post(`${API_URL}/activity-types`, data),
  delete: (id) => axios.delete(`${API_URL}/activity-types/${id}`),
};

// Activity Logs API
export const activityLogsApi = {
  getAll: (params = {}) => axios.get(`${API_URL}/activity-logs`, { params }),
  create: (data) => axios.post(`${API_URL}/activity-logs`, data),
  update: (id, data) => axios.patch(`${API_URL}/activity-logs/${id}`, data),
  delete: (id) => axios.delete(`${API_URL}/activity-logs/${id}`),
};

export default {
  todos: todosApi,
  tags: tagsApi,
  habits: habitsApi,
  habitLogs: habitLogsApi,
  analytics: analyticsApi,
  activityTypes: activityTypesApi,
  activityLogs: activityLogsApi,
};
