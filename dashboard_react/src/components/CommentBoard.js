import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import ReactWordcloud from 'react-wordcloud';
import moment from 'moment';
import apiClient from '../api/axios';

// Define color schemes
const COLORS = {
  primary: ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c'],
  secondary: ['#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'],
  modules: {
    'Nourishment': '#FF6B6B',
    'Physical': '#4ECDC4',
    'Mental': '#45B7D1',
    'Sleep': '#9370DB',
    'Caring for your body after treatment': '#FFA07A',
    'Social media and the internet': '#20B2AA',
    'Sexual wellbeing': '#FF69B4',
    'Self-identity': '#9370DB',
    'Practical issues': '#FF8C00',
    'Movement': '#32CD32',
    'Emotional wellbeing': '#4682B4',
    'Dealing with brain fog': '#B0C4DE',
    'Connections': '#8A2BE2',
    'Body Image': '#DA70D6',
    'Education and Vocation': '#CD5C5C',
    'default': '#9e9e9e'
  }
};

const CommentBoard = () => {
  // State variables
  const [activeTab, setActiveTab] = useState('1');
  const [wordCloudData, setWordCloudData] = useState([]);
  const [contentLengthData, setContentLengthData] = useState([]);
  const [dateDistributionData, setDateDistributionData] = useState([]);
  const [relationshipData, setRelationshipData] = useState({ modules: [], module_counts: [] });
  const [trendData, setTrendData] = useState({ overall_trend: [], module_trends: [] });
  const [moduleNotes, setModuleNotes] = useState({ module: '', notes: [], notes_count: 0 });
  const [availableModules, setAvailableModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [dateRange, setDateRange] = useState([moment().subtract(30, 'days'), moment()]);
  const [interval, setInterval] = useState('day');
  const [loading, setLoading] = useState({ wordCloud: false, relationship: false, trends: false, moduleNotes: false });
  const [error, setError] = useState({ wordCloud: null, relationship: null, trends: null, moduleNotes: null });

  // Memoized data
  const processedLengthData = useMemo(() => {
    if (!contentLengthData.length) return [];
    return contentLengthData.map(item => ({
      length: item.length,
      count: item.count
    }));
  }, [contentLengthData]);

  const processedDateData = useMemo(() => {
    if (!dateDistributionData.length) return [];
    const sorted = [...dateDistributionData].sort((a, b) => new Date(a.date) - new Date(b.date));
    if (sorted.length > 10) {
      const step = Math.floor(sorted.length / 10);
      return sorted.filter((_, idx) => idx % step === 0 || idx === sorted.length - 1);
    }
    return sorted;
  }, [dateDistributionData]);

  const [allModulesData, setAllModulesData] = useState({});

  // Load functions
  const loadWordCloudData = async () => {
    setLoading(prev => ({ ...prev, wordCloud: true }));
    setError(prev => ({ ...prev, wordCloud: null }));
    try {
      const response = await apiClient.get("note-text-analysis/");
      const data = response.data;
      setWordCloudData(data.word_frequency.map(([text, value]) => ({ text, value })));
      setContentLengthData(data.content_length_distribution || []);
      setDateDistributionData(data.date_distribution || []);
    } catch (err) {
      console.error('Error loading word cloud:', err);
      setError(prev => ({ ...prev, wordCloud: 'Failed to load text analysis data' }));
    } finally {
      setLoading(prev => ({ ...prev, wordCloud: false }));
    }
  };

  const loadRelationshipData = async () => {
    setLoading(prev => ({ ...prev, relationship: true }));
    setError(prev => ({ ...prev, relationship: null }));
    try {
      const response = await apiClient.get("model-note-relationship/");
      setRelationshipData(response.data);
    } catch (err) {
      console.error('Error loading relationship:', err);
      setError(prev => ({ ...prev, relationship: 'Failed to load module-note relationship data' }));
    } finally {
      setLoading(prev => ({ ...prev, relationship: false }));
    }
  };

  const loadTrendData = async () => {
    setLoading(prev => ({ ...prev, trends: true }));
    setError(prev => ({ ...prev, trends: null }));
    try {
      const start = dateRange[0].format('YYYY-MM-DD');
      const end = dateRange[1].format('YYYY-MM-DD');
      const response = await apiClient.get('note-upload-trends/', { params: { interval, start_date: start, end_date: end } });
      setTrendData(response.data);
    } catch (err) {
      console.error('Error loading trends:', err);
      setError(prev => ({ ...prev, trends: 'Failed to load upload trend data' }));
    } finally {
      setLoading(prev => ({ ...prev, trends: false }));
    }
  };

  const loadModuleNotes = async (module = '') => {
    setLoading(prev => ({ ...prev, moduleNotes: true }));
    setError(prev => ({ ...prev, moduleNotes: null }));
    
    try {
      const response = await apiClient.get('module-notes-content/', {
        params: module ? { module } : {}
      });
      
      const data = response.data;
      
      if (!module) {
        // If no module specified, set available modules list
        setAvailableModules(data.modules || []);
        
        // Load data for all modules in parallel
        if (data.modules && data.modules.length > 0) {
          // Only load all modules if we don't have them cached already
          if (Object.keys(allModulesData).length === 0) {
            const moduleDataPromises = data.modules.map(async (moduleName) => {
              try {
                const moduleResponse = await apiClient.get('module-notes-content/', {
                  params: { module: moduleName }
                });
                return { moduleName, data: moduleResponse.data };
              } catch (error) {
                console.error(`Error loading data for module ${moduleName}:`, error);
                return { moduleName, data: { notes: [], notes_count: 0 } };
              }
            });
            
            // Wait for all promises to resolve
            const moduleResults = await Promise.all(moduleDataPromises);
            
            // Build the combined data object
            const newAllModulesData = {};
            moduleResults.forEach(result => {
              newAllModulesData[result.moduleName] = result.data;
            });
            
            setAllModulesData(newAllModulesData);
          }
          
          if (!selectedModule) {
            setSelectedModule('');
          }
        }
      } else {
        // Set module notes content for a specific module
        setModuleNotes(data);
        
        // Also update the cached data
        setAllModulesData(prev => ({
          ...prev,
          [module]: data
        }));
      }
    } catch (err) {
      console.error('Error loading module notes:', err);
      setError(prev => ({ 
        ...prev, 
        moduleNotes: 'Failed to load module notes content' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, moduleNotes: false }));
    }
  };

  // Initial loading
  useEffect(() => {
    loadWordCloudData();
    loadRelationshipData();
    loadTrendData();
    loadModuleNotes();
  }, []);

  useEffect(() => {
    if (dateRange.length === 2) {
      loadTrendData();
    }
  }, [dateRange, interval]);

  useEffect(() => {
    if (selectedModule) {
      loadModuleNotes(selectedModule);
    }
  }, [selectedModule]);

  // Helpers
  const handleTabChange = (key) => setActiveTab(key);

  const wordcloudOptions = {
    colors: COLORS.primary,
    enableTooltip: true,
    deterministic: false,
    fontFamily: 'Arial',
    fontSizes: [16, 60],
    fontStyle: 'normal',
    fontWeight: 'normal',
    padding: 1,
    rotations: 3,
    rotationAngles: [0, 90],
    scale: 'linear',
    spiral: 'archimedean',
    transitionDuration: 1000
  };

  const formatDate = (date) => date ? moment(date).format('YYYY-MM-DD') : '';

    const renderWordCloud = () => (
    <div className="card chart-card">
      <div className="card-header">Text Analysis of Notes</div>
      <div className="card-body">
        {loading.wordCloud ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading text analysis...</p>
          </div>
        ) : error.wordCloud ? (
          <div className="alert alert-danger">{error.wordCloud}</div>
        ) : (
          <>
            <div className="row">
              <div className="col col-24">
                <h4 className="chart-title">Common Words in Notes</h4>
                <div className="wordcloud-container">
                  <ReactWordcloud words={wordCloudData} options={wordcloudOptions} />
                </div>
              </div>
            </div>

            <hr className="divider" />

            <div className="row">
              <div className="col col-md-6">
                <h4 className="chart-title">Content Length Distribution</h4>
                <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={processedLengthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                    dataKey="length"
                    angle={0}
                    textAnchor="middle"
                    interval={0}
                    tick={{ fontSize: 12 }}
                    height={60}
                    label={{
                      value: 'Content Length (characters)',
                      position: 'outsideBottom',
                      offset: 20,
                      style: { fontSize: 14, fontWeight: 'bold' }
                    }}/>
                    <YAxis />
                    <Bar
                    dataKey="count"
                    fill="#4a7cbe"
                    barSize={40}
                    label={{ position: 'top', fontSize: 12 }}
                    />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
              </div>

              <div className="col col-md-6">
                <h4 className="chart-title">Notes by Date</h4>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={processedDateData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(date) => moment(date).format('MM/DD')} />
                      <YAxis />
                      <RechartsTooltip labelFormatter={(date) => moment(date).format('YYYY-MM-DD')} />
                      <Line type="monotone" dataKey="count" stroke="#4CAF50" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderRelationship = () => (
    <div className="card chart-card">
      <div className="card-header">Module and Note Type Relationship</div>
      <div className="card-body">
        {loading.relationship ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading relationship data...</p>
          </div>
        ) : error.relationship ? (
          <div className="alert alert-danger">{error.relationship}</div>
        ) : (
          <div className="row">
            <div className="col col-12">
              <h4 className="chart-title">Note Distribution by Module</h4>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={relationshipData.module_counts}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="meta_value" 
                      interval={0} 
                      angle={-30} 
                      textAnchor="end" 
                      height={80}
                    />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => [`${value} notes`, 'Count']} />
                    <Bar 
                      dataKey="count" 
                      label={{ position: 'top' }}
                      barSize={40}
                    >
                      {relationshipData.module_counts.map((entry, index) => (
                        <Cell 
                          key={`bar-cell-${index}`} 
                          fill={COLORS.modules[entry.meta_value] || COLORS.modules.default} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );


  const renderTrends = () => (
  <div className="card chart-card">
    <div className="card-header d-flex justify-content-between align-items-center">
      <span>Note Upload Trends</span>
      <div className="chart-controls">
        <select className="form-select" value={interval} onChange={(e) => setInterval(e.target.value)} style={{ width: 120 }}>
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
          <option value="year">Yearly</option>
        </select>
        <div className="date-picker d-flex">
          <input type="date" value={dateRange[0].format('YYYY-MM-DD')} onChange={(e) => setDateRange([moment(e.target.value), dateRange[1]])} />
          <span className="mx-2">to</span>
          <input type="date" value={dateRange[1].format('YYYY-MM-DD')} onChange={(e) => setDateRange([dateRange[0], moment(e.target.value)])} />
        </div>
      </div>
    </div>
    <div className="card-body">
      {loading.trends ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading trend data...</p>
        </div>
      ) : error.trends ? (
        <div className="alert alert-danger">{error.trends}</div>
      ) : (
        <div>
          {/* Overall Trend Chart */}
          <h4 className="chart-title">Overall Upload Trend</h4>
          <div className="chart-container" style={{ height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={trendData.overall_trend.map(item => ({ ...item, date: formatDate(item.date) }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <RechartsTooltip />
                <Line type="monotone" dataKey="count" stroke="var(--chart-color-1)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <hr className="divider" />
          
          {/* Module Trends Chart - 修复这里 */}
          <h4 className="chart-title">Upload Trend by Module</h4>
          <div className="chart-container" style={{ height: 500 }}> {/* 增加高度 */}
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                margin={{ top: 20, right: 30, left: 20, bottom: 100 }} // 增加底部边距
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  type="category"
                  allowDuplicatedCategory={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <RechartsTooltip 
                  labelFormatter={(value) => `Date: ${value}`}
                  formatter={(value, name) => [value, name]}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={60}
                  wrapperStyle={{
                    paddingTop: '20px',
                    fontSize: '12px'
                  }}
                />
                
                {/* 为每个模块创建单独的 Line 组件 */}
                {trendData.module_trends && trendData.module_trends.map((moduleData, index) => {
                  // 处理数据，确保每个模块的数据格式正确
                  const processedData = moduleData.data ? moduleData.data.map(item => ({
                    ...item,
                    date: formatDate(item.date)
                  })) : [];
                  
                  return (
                    <Line
                      key={`module-${index}-${moduleData.module}`}
                      type="monotone"
                      data={processedData}
                      dataKey="count"
                      name={moduleData.module || `Module ${index + 1}`}
                      stroke={COLORS.modules[moduleData.module] || Object.values(COLORS.modules)[index % Object.values(COLORS.modules).length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      connectNulls={false}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* 添加数据摘要信息 */}
          {trendData.module_trends && trendData.module_trends.length > 0 && (
            <div className="chart-info mt-3">
              <p className="text-muted">
                Showing trends for {trendData.module_trends.length} modules. 
                Total data points: {trendData.module_trends.reduce((acc, mod) => acc + (mod.data ? mod.data.length : 0), 0)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

  const renderModuleNotes = () => (
    <div className="card chart-card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <span>Module Notes Content</span>
        <div className="control-group">
          <select
            className="form-select"
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            style={{ width: 180 }}
          >
            <option value="">Select Module</option>
            {availableModules.map(module => (
              <option key={module} value={module}>{module}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="card-body">
        {loading.moduleNotes ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading module notes...</p>
          </div>
        ) : error.moduleNotes ? (
          <div className="alert alert-danger">{error.moduleNotes}</div>
        ) : (
          <div>
            {selectedModule ? (
              <>
                <div className="module-header d-flex justify-content-between align-items-center">
                  <h4 className="chart-title">{moduleNotes.module}</h4>
                  <span className="badge bg-primary">
                    {moduleNotes.notes_count} Notes
                  </span>
                </div>
                
                <div className="notes-list">
                  {moduleNotes.notes && moduleNotes.notes.map(note => (
                    <div key={note.id} className="card note-card mb-3">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <span>{note.title || 'Untitled Note'}</span>
                        <span className="text-muted">{formatDate(note.date)}</span>
                      </div>
                      <div className="card-body">
                        <div className="note-content">
                          {note.content}
                        </div>
                        
                        {note.images && note.images.length > 0 && (
                          <div className="note-images">
                            {note.images.map((image, imageIndex) => (
                              <div key={`${image.id}-${imageIndex}`} className="note-image">
                                {/* 开发模式下显示图片详情 */}
                                {process.env.NODE_ENV === 'development' && (
                                  <div className="image-debug-info" style={{fontSize: '10px', color: 'gray'}}>
                                    ID: {image.id}
                                    {image.file_path && <span><br/>Path: {image.file_path}</span>}
                                    {image.fallback && <span><br/>Fallback: {image.year}/{image.month}</span>}
                                  </div>
                                )}
                                
                                {/* 处理不同类型的图片数据 */}
                                {image.urls ? (
                                  // 多个备选URL的情况
                                  <ImageWithFallbacks 
                                    urls={image.urls} 
                                    alt={`${note.title} - image ${imageIndex + 1}`} 
                                  />
                                ) : (
                                  // 单个URL的情况
                                  <img 
                                    src={image.url} 
                                    alt={`${note.title} - image ${imageIndex + 1}`} 
                                    className="thumbnail"
                                    onError={(e) => {
                                      console.error(`Failed to load image: ${image.url}`);
                                      // 尝试替换为不包含域名的相对路径
                                      if (image.url && image.url.includes('/wp-content/uploads/')) {
                                        const relativePath = image.url.split('/wp-content/uploads/')[1];
                                        const newUrl = `/wp-content/uploads/${relativePath}`;
                                        console.log(`Trying alternative path: ${newUrl}`);
                                        e.target.src = newUrl;
                                        
                                        // 在第二次失败时使用通用备用图片
                                        e.target.onerror = () => {
                                          e.target.src = '/static/image-placeholder.png';
                                          e.target.onerror = null; // 防止循环
                                        };
                                      } else {
                                        e.target.src = '/static/image-placeholder.png';
                                      }
                                    }}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {(!moduleNotes.notes || moduleNotes.notes.length === 0) && (
                    <div className="alert alert-info">
                      No notes found for this module
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="alert alert-info">
                <h5>Please select a module</h5>
                <p>Choose a module from the dropdown above to view its notes.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
  
  // 添加一个多备用URL的图片组件
  const ImageWithFallbacks = ({ urls, alt }) => {
    const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
    const [loaded, setLoaded] = useState(false);
  
    // 当当前URL加载失败时，尝试下一个URL
    const handleError = () => {
      if (currentUrlIndex < urls.length - 1) {
        setCurrentUrlIndex(currentUrlIndex + 1);
      } else {
        // 所有URL都失败时使用占位图
        console.error(`All image URLs failed for: ${alt}`);
      }
    };
  
    return (
      <>
        {!loaded && <div className="image-loading">Loading...</div>}
        <img 
          src={urls[currentUrlIndex]} 
          alt={alt} 
          className="thumbnail"
          style={{ display: loaded ? 'block' : 'none' }}
          onLoad={() => setLoaded(true)}
          onError={handleError}
        />
        {currentUrlIndex === urls.length - 1 && !loaded && (
          <img 
            src="/static/image-placeholder.png" 
            alt={`${alt} (placeholder)`} 
            className="thumbnail placeholder" 
          />
        )}
      </>
    );
  };

  // Main return
  return (
    <div className="comment-board">
      <div className="settings-tabs">
        <a href="#word-cloud" className={`nav-link ${activeTab === '1' ? 'active' : ''}`} onClick={() => handleTabChange('1')}>Word Cloud</a>
        <a href="#module-relationships" className={`nav-link ${activeTab === '2' ? 'active' : ''}`} onClick={() => handleTabChange('2')}>Module Relationships</a>
        <a href="#upload-trends" className={`nav-link ${activeTab === '3' ? 'active' : ''}`} onClick={() => handleTabChange('3')}>Upload Trends</a>
        <a href="#module-notes" className={`nav-link ${activeTab === '4' ? 'active' : ''}`} onClick={() => handleTabChange('4')}>Module Notes</a>
      </div>

      <div className="tab-content">
        {activeTab === '1' && renderWordCloud()}
        {activeTab === '2' && renderRelationship()}
        {activeTab === '3' && renderTrends()}
        {activeTab === '4' && renderModuleNotes()}
      </div>
    </div>
  );
};

export default CommentBoard;