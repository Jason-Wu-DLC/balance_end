import React, { useState, useEffect } from 'react';
import { 
  fetchSupportRequests, 
  fetchSupportRequestDetail, 
  updateSupportRequest, 
  deleteSupportRequest, 
  addSupportResponse 
} from '../../api/requests';
import { FaTicketAlt, FaReply, FaExclamationCircle, FaCheckCircle, FaHourglassHalf, FaTimes, FaUserCog, FaSearch } from 'react-icons/fa';

const SupportTicketManagement = () => {
  // States for ticket listing
  const [tickets, setTickets] = useState([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // States for ticket details
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  
  // Loading and error states
  const [loading, setLoading] = useState({
    list: false,
    detail: false,
    response: false,
    update: false
  });
  const [error, setError] = useState({
    list: '',
    detail: '',
    response: '',
    update: ''
  });
  
  // Alert message state
  const [alert, setAlert] = useState({ type: '', message: '' });
  
  // Fetch tickets on mount and when filters/page change
  useEffect(() => {
    loadTickets();
  }, [currentPage, statusFilter]);
  
  // Load tickets list
  const loadTickets = async () => {
    setLoading(prev => ({ ...prev, list: true }));
    setError(prev => ({ ...prev, list: '' }));
    
    try {
      const result = await fetchSupportRequests(currentPage, pageSize, statusFilter, searchQuery);
      setTickets(result.tickets);
      setTotalTickets(result.total);
    } catch (err) {
      console.error('Failed to load support tickets:', err);
      setError(prev => ({ 
        ...prev, 
        list: 'Failed to load tickets. Please try again.' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, list: false }));
    }
  };
  
  // Load ticket details
  const loadTicketDetails = async (ticketId) => {
    setLoading(prev => ({ ...prev, detail: true }));
    setError(prev => ({ ...prev, detail: '' }));
    
    try {
      const result = await fetchSupportRequestDetail(ticketId);
      setSelectedTicket(result);
      setShowTicketDetail(true);
    } catch (err) {
      console.error('Failed to load ticket details:', err);
      setError(prev => ({ 
        ...prev, 
        detail: 'Failed to load ticket details. Please try again.' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, detail: false }));
    }
  };
  
  // Submit response to ticket
  const submitResponse = async () => {
    if (!responseMessage.trim()) {
      setError(prev => ({ ...prev, response: 'Response message cannot be empty' }));
      return;
    }
    
    setLoading(prev => ({ ...prev, response: true }));
    setError(prev => ({ ...prev, response: '' }));
    
    try {
      await addSupportResponse(selectedTicket.id, responseMessage);
      
      // Refresh ticket details
      await loadTicketDetails(selectedTicket.id);
      
      // Clear response field
      setResponseMessage('');
      
      // Show success message
      setAlert({
        type: 'success',
        message: 'Response added successfully'
      });
      
      // Clear alert after 3 seconds
      setTimeout(() => setAlert({ type: '', message: '' }), 3000);
      
    } catch (err) {
      console.error('Failed to add response:', err);
      setError(prev => ({ 
        ...prev, 
        response: err.response?.data?.error || 'Failed to add response' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, response: false }));
    }
  };
  
  // Update ticket status
  const updateTicketStatus = async (status) => {
    if (!selectedTicket) return;
    
    setLoading(prev => ({ ...prev, update: true }));
    setError(prev => ({ ...prev, update: '' }));
    
    try {
      await updateSupportRequest(selectedTicket.id, { status });
      
      // Refresh ticket details
      await loadTicketDetails(selectedTicket.id);
      
      // Refresh ticket list
      loadTickets();
      
      // Show success message
      setAlert({
        type: 'success',
        message: `Ticket status updated to ${status}`
      });
      
      // Clear alert after 3 seconds
      setTimeout(() => setAlert({ type: '', message: '' }), 3000);
      
    } catch (err) {
      console.error('Failed to update ticket status:', err);
      setError(prev => ({ 
        ...prev, 
        update: err.response?.data?.error || 'Failed to update ticket status' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };
  
  // Update ticket assignment
  const assignToSelf = async () => {
    if (!selectedTicket) return;
    
    setLoading(prev => ({ ...prev, update: true }));
    setError(prev => ({ ...prev, update: '' }));
    
    try {
      // Get current user ID from local storage or context
      const currentUser = JSON.parse(localStorage.getItem('user')) || {};
      if (!currentUser.id) {
        throw new Error('Could not determine current user');
      }
      
      await updateSupportRequest(selectedTicket.id, { 
        assigned_to: currentUser.id,
        status: selectedTicket.status === 'new' ? 'in_progress' : selectedTicket.status
      });
      
      // Refresh ticket details
      await loadTicketDetails(selectedTicket.id);
      
      // Refresh ticket list
      loadTickets();
      
      // Show success message
      setAlert({
        type: 'success',
        message: 'Ticket assigned to you'
      });
      
      // Clear alert after 3 seconds
      setTimeout(() => setAlert({ type: '', message: '' }), 3000);
      
    } catch (err) {
      console.error('Failed to assign ticket:', err);
      setError(prev => ({ 
        ...prev, 
        update: err.response?.data?.error || 'Failed to assign ticket' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };
  
  // Delete ticket
  const deleteTicket = async () => {
    if (!selectedTicket) return;
    
    if (!window.confirm(`Are you sure you want to delete this ticket?\n\nSubject: ${selectedTicket.subject}\n\nThis action cannot be undone.`)) {
      return;
    }
    
    setLoading(prev => ({ ...prev, update: true }));
    
    try {
      await deleteSupportRequest(selectedTicket.id);
      
      // Close detail view
      setShowTicketDetail(false);
      setSelectedTicket(null);
      
      // Refresh ticket list
      loadTickets();
      
      // Show success message
      setAlert({
        type: 'success',
        message: 'Ticket deleted successfully'
      });
      
      // Clear alert after 3 seconds
      setTimeout(() => setAlert({ type: '', message: '' }), 3000);
      
    } catch (err) {
      console.error('Failed to delete ticket:', err);
      setError(prev => ({ 
        ...prev, 
        update: err.response?.data?.error || 'Failed to delete ticket' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };
  
  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    loadTickets();
  };
  
  // Close detail view
  const closeDetailView = () => {
    setShowTicketDetail(false);
    setSelectedTicket(null);
    setResponseMessage('');
    setError(prev => ({ ...prev, response: '', update: '' }));
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return <span className="badge bg-info">New</span>;
      case 'in_progress':
        return <span className="badge bg-warning">In Progress</span>;
      case 'resolved':
        return <span className="badge bg-success">Resolved</span>;
      case 'closed':
        return <span className="badge bg-secondary">Closed</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
  };
  
  // Get priority badge
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'low':
        return <span className="badge bg-secondary">Low</span>;
      case 'medium':
        return <span className="badge bg-primary">Medium</span>;
      case 'high':
        return <span className="badge bg-warning text-dark">High</span>;
      case 'urgent':
        return <span className="badge bg-danger">Urgent</span>;
      default:
        return <span className="badge bg-light text-dark">{priority}</span>;
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Calculate pagination
  const totalPages = Math.ceil(totalTickets / pageSize);
  
  return (
    <div className="support-ticket-management">
      {/* Alert message */}
      {alert.message && (
        <div className={`alert alert-${alert.type}`}>
          {alert.message}
        </div>
      )}
      
      {/* Main content area */}
      <div className="row">
        {/* Tickets list */}
        <div className={showTicketDetail ? "col-md-5" : "col-md-12"}>
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5><FaTicketAlt className="me-2" /> Support Tickets</h5>
              <div>
                <select 
                  className="form-select form-select-sm d-inline-block me-2"
                  style={{ width: 'auto' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <button 
                  className="btn btn-sm btn-outline-primary" 
                  onClick={loadTickets} 
                  disabled={loading.list}
                >
                  Refresh
                </button>
              </div>
            </div>
            
            <div className="card-body">
              {/* Search form */}
              <form className="mb-3" onSubmit={handleSearch}>
                <div className="input-group">
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="btn btn-outline-secondary" type="submit">
                    <FaSearch />
                  </button>
                </div>
              </form>
              
              {/* Error message */}
              {error.list && (
                <div className="alert alert-danger">{error.list}</div>
              )}
              
              {/* Loading indicator */}
              {loading.list && (
                <div className="text-center my-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading tickets...</p>
                </div>
              )}
              
              {/* Tickets table */}
              {!loading.list && tickets.length === 0 ? (
                <div className="alert alert-info">
                  No tickets found.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Subject</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map(ticket => (
                        <tr key={ticket.id} className="cursor-pointer" onClick={() => loadTicketDetails(ticket.id)}>
                          <td>{ticket.id}</td>
                          <td>
                            {ticket.subject}
                            <div className="small text-muted">
                              {ticket.user.username} ({ticket.user.email})
                            </div>
                          </td>
                          <td>{getStatusBadge(ticket.status)}</td>
                          <td>{getPriorityBadge(ticket.priority)}</td>
                          <td title={formatDate(ticket.created_at)}>
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <nav aria-label="Tickets pagination">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    
                    {[...Array(totalPages).keys()].map(page => (
                      <li 
                        key={page + 1} 
                        className={`page-item ${currentPage === page + 1 ? 'active' : ''}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(page + 1)}
                        >
                          {page + 1}
                        </button>
                      </li>
                    ))}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </div>
        
        {/* Ticket details */}
        {showTicketDetail && (
          <div className="col-md-7">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5>Ticket Details</h5>
                <button 
                  className="btn btn-sm btn-outline-secondary" 
                  onClick={closeDetailView}
                >
                  <FaTimes /> Close
                </button>
              </div>
              
              <div className="card-body">
                {loading.detail ? (
                  <div className="text-center my-3">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading ticket details...</p>
                  </div>
                ) : error.detail ? (
                  <div className="alert alert-danger">{error.detail}</div>
                ) : selectedTicket && (
                  <>
                    {/* Ticket header */}
                    <div className="ticket-header mb-4">
                      <div className="d-flex justify-content-between">
                        <h4>{selectedTicket.subject}</h4>
                        <div>
                          {getStatusBadge(selectedTicket.status)}
                          {' '}
                          {getPriorityBadge(selectedTicket.priority)}
                        </div>
                      </div>
                      <div className="ticket-meta">
                        <div className="small text-muted">
                          <strong>From:</strong> {selectedTicket.user.username} ({selectedTicket.user.email})
                        </div>
                        <div className="small text-muted">
                          <strong>Created:</strong> {formatDate(selectedTicket.created_at)}
                        </div>
                        <div className="small text-muted">
                          <strong>Assigned To:</strong> {selectedTicket.assigned_to ? 
                            `${selectedTicket.assigned_to.username} (${selectedTicket.assigned_to.email})` : 
                            'Unassigned'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Ticket actions */}
                    <div className="ticket-actions mb-4">
                      <div className="btn-group">
                        <button 
                          className="btn btn-sm btn-outline-primary" 
                          onClick={assignToSelf}
                          disabled={loading.update}
                        >
                          <FaUserCog className="me-1" /> Assign to Me
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-warning" 
                          onClick={() => updateTicketStatus('in_progress')}
                          disabled={loading.update || selectedTicket.status === 'in_progress'}
                        >
                          <FaHourglassHalf className="me-1" /> Mark In Progress
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-success" 
                          onClick={() => updateTicketStatus('resolved')}
                          disabled={loading.update || selectedTicket.status === 'resolved'}
                        >
                          <FaCheckCircle className="me-1" /> Mark Resolved
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-secondary" 
                          onClick={() => updateTicketStatus('closed')}
                          disabled={loading.update || selectedTicket.status === 'closed'}
                        >
                          <FaTimes className="me-1" /> Close Ticket
                        </button>
                      </div>
                      <button 
                        className="btn btn-sm btn-outline-danger ms-2" 
                        onClick={deleteTicket}
                        disabled={loading.update}
                      >
                        <FaTimes className="me-1" /> Delete
                      </button>
                    </div>
                    
                    {/* Update status error */}
                    {error.update && (
                      <div className="alert alert-danger mb-3">{error.update}</div>
                    )}
                    
                    {/* Original message */}
                    <div className="ticket-message card mb-4">
                      <div className="card-header bg-light">
                        <strong>Original Message</strong>
                      </div>
                      <div className="card-body">
                        <div className="ticket-content">
                          {selectedTicket.message}
                        </div>
                      </div>
                    </div>
                    
                    {/* Ticket responses */}
                    {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                      <div className="ticket-responses mb-4">
                        <h5 className="mb-3">Responses</h5>
                        {selectedTicket.responses.map(response => (
                          <div 
                            key={response.id} 
                            className={`card mb-2 ${response.user.is_staff ? 'border-primary' : 'border-secondary'}`}
                          >
                            <div className={`card-header ${response.user.is_staff ? 'bg-primary text-white' : 'bg-light'}`}>
                              <div className="d-flex justify-content-between">
                                <span>
                                  <strong>{response.user.username}</strong>
                                  {response.user.is_staff && ' (Staff)'}
                                </span>
                                <span>{formatDate(response.created_at)}</span>
                              </div>
                            </div>
                            <div className="card-body">
                              {response.message}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Add response form */}
                    <div className="add-response mb-3">
                      <h5 className="mb-3">Add Response</h5>
                      {error.response && (
                        <div className="alert alert-danger mb-3">{error.response}</div>
                      )}
                      <div className="mb-3">
                        <textarea 
                          className="form-control" 
                          rows="4"
                          placeholder="Enter your response..."
                          value={responseMessage}
                          onChange={(e) => setResponseMessage(e.target.value)}
                        ></textarea>
                      </div>
                      <button 
                        className="btn btn-primary" 
                        onClick={submitResponse}
                        disabled={loading.response}
                      >
                        {loading.response ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Sending...
                          </>
                        ) : (
                          <>
                            <FaReply className="me-2" /> Submit Response
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportTicketManagement;