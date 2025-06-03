import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaServer,
  FaSearch,
  FaFileAlt,
  FaPlus,
  FaEdit,
  FaLock,
  FaUnlock,
  FaTicketAlt,
} from "react-icons/fa";
import apiClient from "../../api/axios";
import SupportTicketManagement from "../support/SupportTicketManagement";


const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState("users");

  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const [systemInfo, setSystemInfo] = useState(null);

  const [logs, setLogs] = useState([]);
  const [logType, setLogType] = useState("all");
  const [logLimit, setLogLimit] = useState(100);

  const [loading, setLoading] = useState({
    users: false,
    system: false,
    logs: false,
  });
  const [error, setError] = useState({
    users: "",
    system: "",
    logs: "",
  });


useEffect(() => {
  if (activeTab === "users" && usersLoaded) {
    fetchUsers();
  }
}, [currentPage, pageSize, searchQuery]);


  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    is_active: true,
    is_staff: false,
  });

  const [usersLoaded, setUsersLoaded] = useState(false);
  const [systemLoaded, setSystemLoaded] = useState(false);
  const [logsLoaded, setLogsLoaded] = useState(false);

  const fetchUsers = async () => {
    setLoading((prev) => ({ ...prev, users: true }));
    try {
      const response = await apiClient.get("admin/users/", {
        params: { page: currentPage, page_size: pageSize, search: searchQuery },
      });
      setUsers(response.data.users);
      setTotalUsers(response.data.total);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError((prev) => ({
        ...prev,
        users: err.response?.data?.error || "Failed to load users.",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, users: false }));
    }
  };

  const fetchSystemInfo = async () => {
    setLoading((prev) => ({ ...prev, system: true }));
    try {
      const response = await apiClient.get("admin/system/info/");
      setSystemInfo(response.data);
    } catch (err) {
      console.error("Error fetching system info:", err);
      setError((prev) => ({
        ...prev,
        system:
          err.response?.data?.error || "Failed to load system information.",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, system: false }));
    }
  };

  const fetchLogs = async () => {
    setLoading((prev) => ({ ...prev, logs: true }));
    try {
      const response = await apiClient.get("admin/system/logs/", {
        params: { type: logType, limit: logLimit },
      });
      setLogs(response.data.logs);
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError((prev) => ({
        ...prev,
        logs: err.response?.data?.error || "Failed to load system logs.",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, logs: false }));
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "users" && !usersLoaded) {
      fetchUsers();
      setUsersLoaded(true);
    } else if (tab === "system" && !systemLoaded) {
      fetchSystemInfo();
      setSystemLoaded(true);
    } else if (tab === "logs" && !logsLoaded) {
      fetchLogs();
      setLogsLoaded(true);
    }
  };
  const resetUserForm = () => {
    setEditingUser(null);
    setUserFormData({
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      is_active: true,
      is_staff: false,
      is_superuser: false,
    });
  };

  const handleNewUser = () => {
    resetUserForm();
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserFormData({
      username: user.username,
      email: user.email,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      password: "",
      is_active: user.is_active,
      is_staff: user.is_staff,
      is_superuser: user.is_superuser,
    });
    setShowUserModal(true);
  };

  const toggleUserStatus = async (userId, field, currentValue) => {
    try {
      await apiClient.put(`admin/users/${userId}/`, {
        [field]: !currentValue,
      });
      fetchUsers();
    } catch (err) {
      console.error(`Error toggling user ${field}:`, err);
      alert(err.response?.data?.error || `Failed to update user ${field}.`);
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await apiClient.put(`admin/users/${editingUser.id}/`, userFormData);
      } else {
        await apiClient.post("admin/users/create/", userFormData);
      }
      fetchUsers();
      setShowUserModal(false);
      resetUserForm();
    } catch (err) {
      console.error("Error saving user:", err);
      alert(err.response?.data?.error || "Failed to save user.");
    }
  };

  const handleUserFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const totalPages = Math.ceil(totalUsers / pageSize);
  const paginationItems = [];
  for (let number = 1; number <= totalPages; number++) {
    paginationItems.push(
      <li
        key={number}
        className={`page-item ${number === currentPage ? "active" : ""}`}
      >
        <a
          className="page-link"
          href="#"
          onClick={() => setCurrentPage(number)}
        >
          {number}
        </a>
      </li>
    );
  }

  return (
    <div className="settings-page settings-system">
      {/* Tabs navigation */}
      <div className="settings-tabs mb-4">
        <a
          href="#users"
          className={`nav-link ${activeTab === "users" ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            handleTabChange("users");
          }}
        >
          <FaUsers className="me-2" /> User Management
        </a>
        <a
          href="#system"
          className={`nav-link ${activeTab === "system" ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            handleTabChange("system");
          }}
        >
          <FaServer className="me-2" /> System Information
        </a>
        <a
          href="#logs"
          className={`nav-link ${activeTab === "logs" ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            handleTabChange("logs");
          }}
        >
          <FaFileAlt className="me-2" /> System Logs
        </a>
        <a
          href="#support"
          className={`nav-link ${activeTab === "support" ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            handleTabChange("support");
          }}
        >
          <FaTicketAlt className="me-2" /> Support Tickets
        </a>
      </div>

      {/* Tabs content */}
      <div className="tab-content">
        {activeTab === "users" && (
          <>
            <div className="card mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="search-box">
                    <div className="form-group d-flex">
                      <div className="position-relative">
                        <input
                          className="form-control"
                          type="text"
                          placeholder="Search users..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <FaSearch className="search-icon" />
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={handleNewUser}>
                    <FaPlus className="me-1" /> Add User
                  </button>
                </div>

                {error.users && (
                  <div className="alert alert-danger">{error.users}</div>
                )}

                {loading.users ? (
                  <div className="loading-container">
                    <div className="spinner"></div>
                    <p className="mt-2">Loading users...</p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-hover user-management-table">
                        <thead>
                          <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Role</th>
                            <th>Last Login</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.length > 0 ? (
                            users.map((user) => (
                              <tr key={user.id}>
                                <td>{user.username}</td>
                                <td>{user.email}</td>
                                <td>
                                  {`${user.first_name || ""} ${
                                    user.last_name || ""
                                  }`.trim() || "-"}
                                </td>
                                <td>
                                  <span
                                    className={`badge ${
                                      user.is_active
                                        ? "bg-success"
                                        : "bg-secondary"
                                    }`}
                                  >
                                    {user.is_active ? "Active" : "Inactive"}
                                  </span>
                                </td>
                                <td>
                                  <span
                                    className={`badge ${
                                      user.is_superuser
                                        ? "bg-danger"
                                        : user.is_staff
                                        ? "bg-info"
                                        : "bg-dark"
                                    }`}
                                  >
                                    {user.is_superuser
                                      ? "Admin"
                                      : user.is_staff
                                      ? "Staff"
                                      : "User"}
                                  </span>
                                </td>
                                <td>{formatDate(user.last_login)}</td>
                                <td>
                                  <div className="action-buttons">
                                    <button
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={() => handleEditUser(user)}
                                      title="Edit user"
                                    >
                                      <FaEdit />
                                    </button>

                                    <button
                                      className={`btn ${
                                        user.is_active
                                          ? "btn-outline-warning"
                                          : "btn-outline-success"
                                      } btn-sm`}
                                      onClick={() =>
                                        toggleUserStatus(
                                          user.id,
                                          "is_active",
                                          user.is_active
                                        )
                                      }
                                      title={
                                        user.is_active
                                          ? "Deactivate user"
                                          : "Activate user"
                                      }
                                    >
                                      {user.is_active ? (
                                        <FaLock />
                                      ) : (
                                        <FaUnlock />
                                      )}
                                    </button>

                                    <button
                                      className={`btn ${
                                        user.is_staff
                                          ? "btn-outline-secondary"
                                          : "btn-outline-info"
                                      } btn-sm`}
                                      onClick={() =>
                                        toggleUserStatus(
                                          user.id,
                                          "is_staff",
                                          user.is_staff
                                        )
                                      }
                                      title={
                                        user.is_staff
                                          ? "Remove staff role"
                                          : "Make staff"
                                      }
                                    >
                                      {user.is_staff
                                        ? "Remove Staff"
                                        : "Make Staff"}
                                    </button>
                                    <button
                                      className={`btn ${
                                        user.is_superuser
                                          ? "btn-outline-secondary"
                                          : "btn-outline-info"
                                      } btn-sm`}
                                      onClick={() =>
                                        toggleUserStatus(
                                          user.id,
                                          "is_superuser",
                                          user.is_superuser
                                        )
                                      }
                                      title={
                                        user.is_superuser
                                          ? "Remove superuser role"
                                          : "Make superuser"
                                      }
                                    >
                                      {user.is_superuser
                                        ? "Remove superuser"
                                        : "Make superuser"}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="7" className="text-center">
                                No users found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          Showing {(currentPage - 1) * pageSize + 1} to{" "}
                          {Math.min(currentPage * pageSize, totalUsers)} of{" "}
                          {totalUsers} users
                        </div>
                        <nav aria-label="User pagination">
                          <ul className="pagination">
                            <li
                              className={`page-item ${
                                currentPage === 1 ? "disabled" : ""
                              }`}
                            >
                              <a
                                className="page-link"
                                href="#"
                                onClick={() => setCurrentPage(1)}
                              >
                                First
                              </a>
                            </li>
                            <li
                              className={`page-item ${
                                currentPage === 1 ? "disabled" : ""
                              }`}
                            >
                              <a
                                className="page-link"
                                href="#"
                                onClick={() =>
                                  setCurrentPage((prev) =>
                                    Math.max(prev - 1, 1)
                                  )
                                }
                              >
                                Previous
                              </a>
                            </li>
                            {paginationItems}
                            <li
                              className={`page-item ${
                                currentPage === totalPages ? "disabled" : ""
                              }`}
                            >
                              <a
                                className="page-link"
                                href="#"
                                onClick={() =>
                                  setCurrentPage((prev) =>
                                    Math.min(prev + 1, totalPages)
                                  )
                                }
                              >
                                Next
                              </a>
                            </li>
                            <li
                              className={`page-item ${
                                currentPage === totalPages ? "disabled" : ""
                              }`}
                            >
                              <a
                                className="page-link"
                                href="#"
                                onClick={() => setCurrentPage(totalPages)}
                              >
                                Last
                              </a>
                            </li>
                          </ul>
                        </nav>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
        {/* System Info Tab */}
        {activeTab === "system" && (
          <div id="system" className="tab-content">
            <div className="card mb-4">
              <div className="card-body">
                {error.system && (
                  <div className="alert alert-danger">{error.system}</div>
                )}

                {loading.system ? (
                  <div className="loading-container">
                    <div className="spinner"></div>
                    <p className="mt-2">Loading system information...</p>
                  </div>
                ) : systemInfo ? (
                  <div className="system-info">
                    <div className="row">
                      <div className="col col-md-6 mb-4">
                        <h5>System Details</h5>
                        <div className="system-info-card">
                          <div className="table-responsive">
                            <table className="table table-bordered">
                              <tbody>
                                <tr className="system-info-item">
                                  <th className="item-label">
                                    Operating System
                                  </th>
                                  <td className="item-value">
                                    {systemInfo.system.os || "N/A"}
                                  </td>
                                </tr>
                                <tr className="system-info-item">
                                  <th className="item-label">Hostname</th>
                                  <td className="item-value">
                                    {systemInfo.system.hostname || "N/A"}
                                  </td>
                                </tr>
                                <tr className="system-info-item">
                                  <th className="item-label">Python Version</th>
                                  <td className="item-value">
                                    {systemInfo.system.python_version || "N/A"}
                                  </td>
                                </tr>
                                <tr className="system-info-item">
                                  <th className="item-label">Django Version</th>
                                  <td className="item-value">
                                    {systemInfo.system.django_version || "N/A"}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      <div className="col col-md-6 mb-4">
                        <h5>Resource Usage</h5>
                        <div className="system-info-card">
                          <div className="table-responsive">
                            <table className="table table-bordered">
                              <tbody>
                                <tr className="system-info-item">
                                  <th className="item-label">CPU Usage</th>
                                  <td className="item-value">
                                    {systemInfo.system.cpu &&
                                    !systemInfo.system.cpu.error ? (
                                      <div>
                                        {systemInfo.system.cpu.percent}% (
                                        {systemInfo.system.cpu.cores} cores)
                                        <div className="resource-bar">
                                          <div
                                            className="resource-progress"
                                            style={{
                                              width: `${systemInfo.system.cpu.percent}%`,
                                            }}
                                          ></div>
                                        </div>
                                      </div>
                                    ) : (
                                      "N/A"
                                    )}
                                  </td>
                                </tr>
                                <tr className="system-info-item">
                                  <th className="item-label">Memory Usage</th>
                                  <td className="item-value">
                                    {systemInfo.system.memory &&
                                    !systemInfo.system.memory.error ? (
                                      <div>
                                        {systemInfo.system.memory.percent_used}%
                                        ({systemInfo.system.memory.available} GB
                                        available of{" "}
                                        {systemInfo.system.memory.total} GB)
                                        <div className="resource-bar">
                                          <div
                                            className="resource-progress"
                                            style={{
                                              width: `${systemInfo.system.memory.percent_used}%`,
                                            }}
                                          ></div>
                                        </div>
                                      </div>
                                    ) : (
                                      "N/A"
                                    )}
                                  </td>
                                </tr>
                                <tr className="system-info-item">
                                  <th className="item-label">Disk Usage</th>
                                  <td className="item-value">
                                    {systemInfo.system.disk &&
                                    !systemInfo.system.disk.error ? (
                                      <div>
                                        {systemInfo.system.disk.percent_used}% (
                                        {systemInfo.system.disk.free} GB free of{" "}
                                        {systemInfo.system.disk.total} GB)
                                        <div className="resource-bar">
                                          <div
                                            className="resource-progress"
                                            style={{
                                              width: `${systemInfo.system.disk.percent_used}%`,
                                            }}
                                          ></div>
                                        </div>
                                      </div>
                                    ) : (
                                      "N/A"
                                    )}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col col-md-6 mb-4">
                        <h5>Application Status</h5>
                        <div className="system-info-card">
                          <div className="table-responsive">
                            <table className="table table-bordered">
                              <tbody>
                                <tr className="system-info-item">
                                  <th className="item-label">Debug Mode</th>
                                  <td className="item-value">
                                    <span
                                      className={`badge ${
                                        systemInfo.application.debug_mode
                                          ? "bg-warning"
                                          : "bg-success"
                                      }`}
                                    >
                                      {systemInfo.application.debug_mode
                                        ? "Enabled"
                                        : "Disabled"}
                                    </span>
                                  </td>
                                </tr>
                                <tr className="system-info-item">
                                  <th className="item-label">Total Users</th>
                                  <td className="item-value">
                                    {systemInfo.application.total_users}
                                  </td>
                                </tr>
                                <tr className="system-info-item">
                                  <th className="item-label">
                                    Active Users Today
                                  </th>
                                  <td className="item-value">
                                    {systemInfo.application.active_users_today}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      <div className="col col-md-6 mb-4">
                        <h5>Database Connections</h5>
                        <div className="system-info-card">
                          <div className="table-responsive">
                            <table className="table table-bordered">
                              <tbody>
                                {Object.entries(
                                  systemInfo.application.database
                                ).map(([name, db]) => (
                                  <tr key={name} className="system-info-item">
                                    <th className="item-label">{name}</th>
                                    <td className="item-value">
                                      <div>
                                        <span
                                          className={`database-status ${
                                            db.status === "Connected"
                                              ? "connected"
                                              : "error"
                                          }`}
                                        >
                                          {db.status}
                                        </span>
                                      </div>
                                      <small>
                                        {db.engine} - {db.name} ({db.host})
                                      </small>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center mt-3">
                      <button
                        className="btn btn-primary"
                        onClick={fetchSystemInfo}
                      >
                        <FaServer className="me-2" /> Refresh System Info
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="alert alert-warning">
                      No system information available
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* System Logs Tab */}
        {activeTab === "logs" && (
          <div id="logs" className="tab-content">
            <div className="card mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <select
                      className="form-select d-inline-block me-2"
                      value={logType}
                      onChange={(e) => setLogType(e.target.value)}
                      style={{ width: "auto" }}
                    >
                      <option value="all">All Logs</option>
                      <option value="system">System Logs</option>
                      <option value="auth">Authentication Logs</option>
                    </select>

                    <select
                      className="form-select d-inline-block"
                      value={logLimit}
                      onChange={(e) => setLogLimit(parseInt(e.target.value))}
                      style={{ width: "auto" }}
                    >
                      <option value="50">Last 50 entries</option>
                      <option value="100">Last 100 entries</option>
                      <option value="200">Last 200 entries</option>
                      <option value="500">Last 500 entries</option>
                    </select>
                  </div>

                  <button className="btn btn-primary" onClick={fetchLogs}>
                    <FaFileAlt className="me-2" /> Refresh Logs
                  </button>
                </div>

                {error.logs && (
                  <div className="alert alert-danger">{error.logs}</div>
                )}

                {loading.logs ? (
                  <div className="loading-container">
                    <div className="spinner"></div>
                    <p className="mt-2">Loading logs...</p>
                  </div>
                ) : (
                  <div className="logs-container">
                    {logs.length > 0 ? (
                      <div className="settings-system-logs">
                        {logs.map((log, index) => (
                          <div
                            key={index}
                            className={`settings-log-entry ${log.type}`}
                          >
                            <span
                              className={`badge ${
                                log.type === "system" ? "bg-info" : "bg-warning"
                              } me-2`}
                            >
                              {log.type}
                            </span>
                            <span className="log-content">{log.content}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="alert alert-info">No logs available</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* User Modal */}
        {showUserModal && (
          <div
            className="modal user-modal"
            tabIndex="-1"
            role="dialog"
            style={{ display: "block" }}
          >
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingUser ? "Edit User" : "Create New User"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowUserModal(false)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleUserSubmit}>
                    <div className="row">
                      <div className="col col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Username</label>
                          <input
                            className="form-control"
                            type="text"
                            name="username"
                            value={userFormData.username}
                            onChange={handleUserFormChange}
                            required
                            disabled={editingUser}
                          />
                          {editingUser && (
                            <small className="form-text text-muted">
                              Username cannot be changed after creation.
                            </small>
                          )}
                        </div>
                      </div>
                      <div className="col col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Email</label>
                          <input
                            className="form-control"
                            type="email"
                            name="email"
                            value={userFormData.email}
                            onChange={handleUserFormChange}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">First Name</label>
                          <input
                            className="form-control"
                            type="text"
                            name="first_name"
                            value={userFormData.first_name}
                            onChange={handleUserFormChange}
                          />
                        </div>
                      </div>
                      <div className="col col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Last Name</label>
                          <input
                            className="form-control"
                            type="text"
                            name="last_name"
                            value={userFormData.last_name}
                            onChange={handleUserFormChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group mb-3">
                      <label className="form-label">
                        {editingUser
                          ? "New Password (leave blank to keep current)"
                          : "Password"}
                      </label>
                      <input
                        className="form-control"
                        type="password"
                        name="password"
                        value={userFormData.password}
                        onChange={handleUserFormChange}
                        required={!editingUser}
                      />
                    </div>

                    <div className="row">
                      <div className="col col-md-6">
                        <div className="form-group mb-3">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="is-active"
                              name="is_active"
                              checked={userFormData.is_active}
                              onChange={handleUserFormChange}
                            />
                            <label
                              className="form-check-label"
                              htmlFor="is-active"
                            >
                              Active Account
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="col col-md-6">
                        <div className="form-group mb-3">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="is-staff"
                              name="is_staff"
                              checked={userFormData.is_staff}
                              onChange={handleUserFormChange}
                            />
                            <label
                              className="form-check-label"
                              htmlFor="is-staff"
                            >
                              Staff Access
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-end mt-4">
                      <button
                        type="button"
                        className="btn btn-secondary me-2"
                        onClick={() => setShowUserModal(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        {editingUser ? "Update User" : "Create User"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "support" && (
          <div id="support" className="tab-content">
            <SupportTicketManagement />
          </div>
        )}

        {/* Modal Backdrop */}
        {showUserModal && <div className="modal-backdrop fade show"></div>}
      </div>
    </div>
  );
};

export default SystemSettings;
