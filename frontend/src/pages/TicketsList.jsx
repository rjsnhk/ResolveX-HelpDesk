import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../config/axiosInstance';
import { API_PATHS } from '../config/apiPaths';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';

const TicketsList = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ limit: 10, offset: 0, total: 0 });

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, pagination.offset]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let endpoint;
      if (user.role === 'admin') {
        endpoint = API_PATHS.ADMIN.TICKETS.LIST;
      } else if (user.role === 'agent') {
        endpoint = API_PATHS.AGENTS.TICKETS.LIST;
      } else {
        endpoint = API_PATHS.USERS.TICKETS.LIST;
      }

      const params = new URLSearchParams({
        limit: pagination.limit,
        offset: pagination.offset,
      });

      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const response = await axiosInstance.get(`${endpoint}?${params}`);

      const items = response.data.items || response.data.data || response.data.tickets || [];
      const total = response.data.total ?? response.data.totalTickets ?? items.length ?? 0;
      setTickets(items);
      setPagination(prev => ({ ...prev, total }));
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, offset: 0 }));
    fetchTickets();
  };

  const handleDelete = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;

    try {
      await axiosInstance.delete(API_PATHS.USERS.TICKETS.DELETE(ticketId));
      toast.success('Ticket deleted successfully');
      fetchTickets();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to delete ticket');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-green-100 text-green-800 border-green-200',
      in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      resolved: 'bg-purple-100 text-purple-800 border-purple-200',
      closed: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const nextPage = () => {
    if (pagination.offset + pagination.limit < pagination.total) {
      setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
    }
  };

  const prevPage = () => {
    if (pagination.offset > 0) {
      setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }));
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {user.role === 'admin' ? 'All Tickets' : user.role === 'agent' ? 'Assigned Tickets' : 'My Tickets'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {pagination.total} total tickets
            </p>
          </div>
          {user.role === 'user' && (
            <Link
              to="/tickets/new"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 transition-all duration-200 transform hover:scale-[1.02]"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Ticket
            </Link>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets by title, description, or comments..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination(prev => ({ ...prev, offset: 0 }));
                }}
                className="px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading tickets...</p>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tickets found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new ticket.</p>
            {user.role === 'user' && (
              <div className="mt-6">
                <Link
                  to="/tickets/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Ticket
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <Link
                            to={user.role === 'admin' ? `/admin/tickets/${ticket._id}` : user.role === 'agent' ? `/agent/tickets/${ticket._id}` : `/tickets/${ticket._id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {ticket.title}
                          </Link>
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                            <span>Created: {formatDate(ticket.createdAt)}</span>
                            {ticket.createdBy && (
                              <span>By: {ticket.createdBy.name}</span>
                            )}
                            {ticket.assignedTo && (
                              <span>Assigned: {ticket.assignedTo.name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-start gap-2">
                      <span className={`px-3 py-1 text-xs font-medium rounded-lg border ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {user.role === 'user' && ticket.status === 'open' && (
                        <button
                          onClick={() => handleDelete(ticket._id)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {pagination.total > pagination.limit && (
              <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4">
                <div className="text-sm text-gray-700">
                  Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={prevPage}
                    disabled={pagination.offset === 0}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={nextPage}
                    disabled={pagination.offset + pagination.limit >= pagination.total}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default TicketsList;
