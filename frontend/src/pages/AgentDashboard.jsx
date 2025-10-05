import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../config/axiosInstance';
import { API_PATHS } from '../config/apiPaths';
import Layout from '../components/Layout';

const AgentDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.AGENTS.DASHBOARD);
      setDashboard(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  const statusCounts = dashboard?.statusCounts?.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {}) || {};

  const stats = [
    { label: 'Total Assigned', value: dashboard?.totalTickets || 0, color: 'bg-blue-500', icon: '📋' },
    { label: 'Open', value: statusCounts.open || 0, color: 'bg-green-500', icon: '🟢' },
    { label: 'In Progress', value: statusCounts.in_progress || 0, color: 'bg-yellow-500', icon: '🟡' },
    { label: 'Resolved', value: statusCounts.resolved || 0, color: 'bg-purple-500', icon: '✅' },
    { label: 'Closed', value: statusCounts.closed || 0, color: 'bg-gray-500', icon: '🔒' },
    { label: 'SLA Active', value: dashboard?.sla?.active || 0, color: 'bg-purple-500', icon: '⏰' },
    { label: 'SLA Breached', value: dashboard?.sla?.breached || 0, color: 'bg-red-500', icon: '⚠️' },
  ];

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-purple-100 text-purple-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your assigned tickets and track SLA compliance.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl ${stat.color} flex items-center justify-center text-2xl shadow-lg`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Tickets</h2>
            {dashboard?.recentTickets?.length > 0 ? (
              <div className="space-y-3">
                {dashboard.recentTickets.map((ticket) => (
                  <Link
                    key={ticket._id}
                    to={`/agent/tickets/${ticket._id}`}
                    className="block p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{ticket.title}</p>
                        <p className="text-xs text-gray-500 mt-1">By: {ticket.createdBy?.name}</p>
                      </div>
                      <div className="inline-flex">
                        <span className={`px-2 py-1 text-xs font-medium rounded-lg ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{formatDate(ticket.updatedAt)}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent tickets</p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">SLA Breached Tickets</h2>
            {dashboard?.breachedTickets?.length > 0 ? (
              <div className="space-y-3">
                {dashboard.breachedTickets.map((ticket) => (
                  <Link
                    key={ticket._id}
                    to={`/agent/tickets/${ticket._id}`}
                    className="block p-4 border-2 border-red-200 bg-red-50 rounded-xl hover:border-red-500 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{ticket.title}</p>
                        <p className="text-xs text-gray-500 mt-1">By: {ticket.createdBy?.name}</p>
                      </div>
                      <div className="inline-flex">
                        <span className="px-2 py-1 text-xs font-medium rounded-lg bg-red-100 text-red-800">
                          Breached
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-red-600 mt-2">SLA: {formatDate(ticket.slaDeadline)}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-green-600">No SLA breaches</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <Link
            to="/agent/tickets"
            className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-gray-900">View All Assigned Tickets</p>
              <p className="text-xs text-gray-500">Manage and respond to tickets</p>
            </div>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default AgentDashboard;
