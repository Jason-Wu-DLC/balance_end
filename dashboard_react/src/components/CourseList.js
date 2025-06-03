import React, { useState } from 'react';
import { SearchOutlined, TeamOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import moment from 'moment';

const CourseList = ({ coursesData, loading }) => {
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [sortColumn, setSortColumn] = useState('title');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  // Sort function
  const sortData = (data, column, direction) => {
    return [...data].sort((a, b) => {
      if (column === 'title') {
        return direction === 'asc' 
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      } else if (column === 'completion_rate') {
        return direction === 'asc' 
          ? a.completion_rate - b.completion_rate
          : b.completion_rate - a.completion_rate;
      } else if (column === 'date_created' || column === 'date_modified') {
        const dateA = new Date(a[column] || 0);
        const dateB = new Date(b[column] || 0);
        return direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
  };
  
  // Handle sorting
  const handleSort = (column) => {
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(newDirection);
  };
  
  // Filter data based on search
  const filterData = (data) => {
    if (!searchText) return data;
    
    return data.filter(item => {
      if (searchedColumn === 'title') {
        return item.title.toLowerCase().includes(searchText.toLowerCase());
      }
      return true;
    });
  };
  
  // Handle search
  const handleSearch = (e, column) => {
    const value = e.target.value;
    setSearchText(value);
    setSearchedColumn(column);
    setCurrentPage(1); // Reset to first page on search
  };
  
  // Reset search
  const handleReset = () => {
    setSearchText('');
    setSearchedColumn('');
  };
  
  // Format date
  const formatDate = (date) => {
    return date ? moment(date).format('YYYY-MM-DD') : '-';
  };
  
  // Process data: sort and filter
  const processData = (data) => {
    if (!data) return [];
    
    const filteredData = filterData(data);
    return sortData(filteredData, sortColumn, sortDirection);
  };
  
  // Get current page data
  const getCurrentPageData = (data) => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  };
  
  // Prepare data
  const processedData = processData(coursesData);
  const currentData = getCurrentPageData(processedData);
  const totalPages = Math.ceil(processedData.length / pageSize);
  
  // Build pagination
  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
          <button className="page-link" onClick={() => setCurrentPage(i)}>
            {i}
          </button>
        </li>
      );
    }
    
    return (
      <nav aria-label="Course pagination" className="mt-3">
        <ul className="pagination">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button 
              className="page-link" 
              onClick={() => setCurrentPage(curr => Math.max(curr - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
          </li>
          
          {pages}
          
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button 
              className="page-link" 
              onClick={() => setCurrentPage(curr => Math.min(curr + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </li>
        </ul>
      </nav>
    );
  };
  
  // Render sort icon
  const renderSortIcon = (column) => {
    if (sortColumn !== column) return null;
    
    return (
      <span className={`table-sort ${sortDirection}`}>
        {sortDirection === 'asc' ? '▲' : '▼'}
      </span>
    );
  };
  
  return (
    <div className="card course-list-card">
      <div className="card-header">Courses List</div>
      <div className="card-body">
        <div className="search-box mb-3">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search course title..."
              value={searchText}
              onChange={(e) => handleSearch(e, 'title')}
            />
            <button 
              className="btn btn-outline-secondary" 
              type="button"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading courses...</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('title')} className="sortable-header">
                      Course Title {renderSortIcon('title')}
                    </th>
                    <th onClick={() => handleSort('completion_rate')} className="sortable-header">
                      Completion Rate {renderSortIcon('completion_rate')}
                    </th>
                    <th>Users</th>
                    <th onClick={() => handleSort('date_created')} className="sortable-header">
                      Created Date {renderSortIcon('date_created')}
                    </th>
                    <th onClick={() => handleSort('date_modified')} className="sortable-header">
                      Last Modified {renderSortIcon('date_modified')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map(course => (
                      <tr key={course.id}>
                        <td>
                          {searchedColumn === 'title' && searchText ? (
                            <span className="highlight-text">
                              {course.title.split(new RegExp(`(${searchText})`, 'gi')).map((part, i) => 
                                part.toLowerCase() === searchText.toLowerCase() 
                                  ? <span key={i} className="highlighted-text">{part}</span> 
                                  : part
                              )}
                            </span>
                          ) : (
                            course.title
                          )}
                        </td>
                        <td>
                          <div className="progress">
                            <div 
                              className={`progress-bar ${course.completion_rate >= 75 ? 'bg-success' : ''}`}
                              role="progressbar"
                              style={{ width: `${course.completion_rate}%` }}
                              aria-valuenow={course.completion_rate}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            />
                          </div>
                          <span className="ms-2">{course.completion_rate}%</span>
                        </td>
                        <td>
                          <div className="tag-group">
                            <span className="badge bg-primary">
                              <TeamOutlined /> {course.total_users} Total
                            </span>
                            <span className="badge bg-success">
                              <CheckCircleOutlined /> {course.completed_users} Completed
                            </span>
                            <span className="badge bg-warning">
                              <ClockCircleOutlined /> {course.in_progress_users} In Progress
                            </span>
                          </div>
                        </td>
                        <td>{formatDate(course.date_created)}</td>
                        <td>{formatDate(course.date_modified)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">No courses found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && renderPagination()}
          </>
        )}
      </div>
    </div>
  );
};

export default CourseList;