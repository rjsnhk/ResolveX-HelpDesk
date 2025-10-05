import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../config/axiosInstance';
import { API_PATHS } from '../config/apiPaths';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';

const TicketDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [slaTimeRemaining, setSlaTimeRemaining] = useState('');
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ title: '', description: '' });

  useEffect(() => {
    fetchTicketDetails();
    if (user.role === 'admin') {
      fetchAgents();
    }
  }, [id]);

  useEffect(() => {
    if (ticket?.slaDeadline) {
      const interval = setInterval(() => {
        calculateSlaTime();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [ticket]);

  const fetchTicketDetails = async () => {
    try {
      let endpoint;
      if (user.role === 'admin') {
        endpoint = API_PATHS.ADMIN.TICKETS.GET(id);
      } else if (user.role === 'agent') {
        endpoint = API_PATHS.AGENTS.TICKETS.GET(id);
      } else {
        endpoint = API_PATHS.USERS.TICKETS.GET(id);
      }

      const response = await axiosInstance.get(endpoint);
      setTicket(response.data.ticket);
      setComments(response.data.comments || []);
      setEditData({ title: response.data.ticket.title, description: response.data.ticket.description });
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
      toast.error('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.ADMIN.AGENTS.LIST);
      setAgents(response.data.agents || []);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const calculateSlaTime = () => {
    const deadline = new Date(ticket.slaDeadline);
    const now = new Date();
    const diff = deadline - now;

    if (diff <= 0) {
      setSlaTimeRemaining('BREACHED');
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setSlaTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      let endpoint;
      if (user.role === 'admin') {
        endpoint = API_PATHS.ADMIN.TICKETS.ADD_COMMENT(id);
      } else if (user.role === 'agent') {
        endpoint = API_PATHS.AGENTS.TICKETS.ADD_COMMENT(id);
      } else {
        endpoint = API_PATHS.USERS.TICKETS.ADD_COMMENT(id);
      }

      await axiosInstance.post(endpoint, { text: newComment });
      setNewComment('');
      toast.success('Comment added');
      fetchTicketDetails();
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      let endpoint;
      if (user.role === 'admin') {
        endpoint = API_PATHS.ADMIN.TICKETS.UPDATE_STATUS(id);
      } else if (user.role === 'agent') {
        endpoint = API_PATHS.AGENTS.TICKETS.UPDATE_STATUS(id);
      } else {
        endpoint = API_PATHS.USERS.TICKETS.UPDATE_STATUS(id);
      }

      await axiosInstance.patch(endpoint, { status: newStatus, version: ticket.version });
      toast.success('Status updated');
      fetchTicketDetails();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to update status');
      if (error.response?.status === 409) {
        fetchTicketDetails();
      }
    }
  };

  const handleAssignAgent = async () => {
    if (!selectedAgent) return;

    try {
      await axiosInstance.patch(API_PATHS.ADMIN.TICKETS.ASSIGN_AGENT(id), { agentId: selectedAgent });
      toast.success('Agent assigned');
      fetchTicketDetails();
      setSelectedAgent('');
    } catch (error) {
      toast.error('Failed to assign agent');
    }
  };

  const handleEdit = async () => {
    if (!editData.title.trim() || !editData.description.trim()) {
      toast.error('Title and description are required');
      return;
    }

    try {
      await axiosInstance.put(API_PATHS.USERS.TICKETS.UPDATE(id), editData);
      toast.success('Ticket updated');
      setEditMode(false);
      fetchTicketDetails();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to update ticket');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;

    try {
      await axiosInstance.delete(API_PATHS.USERS.TICKETS.DELETE(id));
      toast.success('Ticket deleted');
      navigate('/tickets');
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
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (!ticket) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Ticket not found</p>
          <Link to="/tickets" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            Back to tickets
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to={user.role === 'admin' ? '/admin/tickets' : user.role === 'agent' ? '/agent/tickets' : '/tickets'} className="hover:text-blue-600">
            Tickets
          </Link>
          <span>/</span>
          <span className="text-gray-900">{ticket.title}</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            <div className="flex-1">
              {editMode ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Save
                    </button>
                    <button onClick={() => setEditMode(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-gray-900">{ticket.title}</h1>
                  <p className="mt-2 text-gray-600">{ticket.description}</p>
                </>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <span className={`px-4 py-2 text-sm font-medium rounded-xl border text-center ${getStatusColor(ticket.status)}`}>
                {ticket.status.replace('_', ' ').toUpperCase()}
              </span>
              {user.role === 'user' && ticket.status === 'open' && !editMode && (
                <>
                  <button onClick={() => setEditMode(true)} className="px-4 py-2 text-sm border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50">
                    Edit
                  </button>
                  <button onClick={handleDelete} className="px-4 py-2 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50">
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-4 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Created By</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{ticket.createdBy?.name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Assigned To</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{ticket.assignedTo?.name || 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Created At</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{formatDate(ticket.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">SLA Time</p>
              <p className={`mt-1 text-sm font-bold ${slaTimeRemaining === 'BREACHED' ? 'text-red-600' : 'text-green-600'}`}>
                {slaTimeRemaining || 'Calculating...'}
              </p>
            </div>
          </div>

          {user.role === 'admin' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Assign Agent</h3>
              <div className="flex gap-2">
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select an agent</option>
                  {agents.map((agent) => (
                    <option key={agent._id} value={agent._id}>
                      {agent.name} ({agent.email})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssignAgent}
                  disabled={!selectedAgent}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign
                </button>
              </div>
            </div>
          )}

          {(user.role === 'agent' || user.role === 'admin') && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Update Status</h3>
              <div className="flex flex-wrap gap-2">
                {['open', 'in_progress', 'resolved', 'closed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={ticket.status === status}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      ticket.status === status
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {status.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Comments ({comments.length})</h2>

          <form onSubmit={handleAddComment} className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment._id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {comment.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{comment.user?.name}</p>
                        <span className="text-xs text-gray-500 capitalize">({comment.user?.role})</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-700">{comment.text}</p>
                      <p className="mt-2 text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Timeline</h2>
          {(!ticket.timeline || ticket.timeline.length === 0) ? (
            <p className="text-sm text-gray-500 text-center py-8">No timeline events yet.</p>
          ) : (
            <div className="space-y-4">
              {ticket.timeline
                .slice()
                .sort((a, b) => new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt))
                .map((entry, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {(entry.user?.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-900 capitalize">{entry.action.replace('_',' ')}</span>
                        {entry.user?.name && <span className="text-gray-500">by {entry.user.name}</span>}
                        <span className="text-gray-400">• {formatDate(entry.timestamp || entry.createdAt)}</span>
                      </div>
                      {entry.details && (
                        <p className="mt-1 text-sm text-gray-700">{entry.details}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TicketDetail;
