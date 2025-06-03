/**
 * 从localStorage获取存储的主题
 * @returns {string} 当前主题（'light', 'dark', 或 'system'）
 */
export const getStoredTheme = () => {
    return localStorage.getItem('theme') || 'light';
  };
  
  /**
   * 应用主题到整个应用
   * @param {string} theme - 要应用的主题 ('light', 'dark', 或 'system')
   */
  export const applyTheme = (theme) => {
    // 设置数据属性
    document.documentElement.setAttribute('data-theme', theme);
    
    // 为body添加类
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else if (theme === 'light') {
      document.body.classList.add('light-mode'); 
      document.body.classList.remove('dark-mode');
    } else if (theme === 'system') {
      // 检测系统偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
      } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
      }
      
      // 添加系统主题变化监听
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (getStoredTheme() === 'system') {
          if (e.matches) {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
          } else {
            document.body.classList.add('light-mode');
            document.body.classList.remove('dark-mode');
          }
        }
      });
    }
    
    // 存储主题到localStorage
    localStorage.setItem('theme', theme);
  };