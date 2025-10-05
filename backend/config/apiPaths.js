
// BASE URL for frontend requests
export const BASE_URL = "http://localhost:5000";

export const API_PATHS = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    ME: "/api/auth/me",
  },

  USERS: {
    TICKETS: {
      CREATE: "/api/users/add-ticket",
      LIST: "/api/users/tickets",
      GET: (id) => `/api/users/tickets/${id}`,
      UPDATE: (id) => `/api/users/update-ticket/${id}`,
      DELETE: (id) => `/api/users/delete-ticket/${id}`,
      ADD_COMMENT: (id) => `/api/users/add-comment/${id}/comments`,
      UPDATE_STATUS: (id) => `/api/users/tickets/${id}/status`,
    },
    DASHBOARD: "/api/users/dashboard",
  },

  AGENTS: {
    TICKETS: {
      LIST: "/api/agents/tickets",
      GET: (id) => `/api/agents/tickets/${id}`,
      ADD_COMMENT: (id) => `/api/agents/tickets/${id}/comments`,
      UPDATE_STATUS: (id) => `/api/agents/tickets/${id}/status`,
    },
    DASHBOARD: "/api/agents/dashboard",
  },

  ADMIN: {
    REGISTER: "/api/admin/register",
    TICKETS: {
      LIST: "/api/admin/tickets",
      GET: (id) => `/api/admin/tickets/${id}`,
      ASSIGN_AGENT: (id) => `/api/admin/tickets/${id}/assign`,
      UPDATE_STATUS: (id) => `/api/admin/tickets/${id}/status`,
      ADD_COMMENT: (id) => `/api/admin/tickets/${id}/comments`,
    },
    AGENTS: {
      ADD: "/api/admin/add-agent",
      LIST: "/api/admin/agents",
      GET: (id) => `/api/admin/agents/${id}`,
      UPDATE: (id) => `/api/admin/agents/${id}`,
      DELETE: (id) => `/api/admin/agents/${id}`,
    },
    DASHBOARD: "/api/admin/dashboard",
  },
};
