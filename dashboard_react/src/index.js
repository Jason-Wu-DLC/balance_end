import React from 'react';
import ReactDOM from 'react-dom';
import './index.css'; // 全局样式
import App from './App'; // 主应用组件

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root') // 绑定到 public/index.html 中的 <div id="root"></div>
);
