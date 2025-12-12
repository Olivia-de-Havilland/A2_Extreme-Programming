/**
 * 前端配置文件
 * 配置后端API地址
 */

// 后端API基础地址配置
// 开发环境：如果前后端在同一服务器不同目录，使用相对路径
// 生产环境：配置完整的后端服务器地址
const API_CONFIG = {
    // 方式一：使用相对路径（从frontend目录访问backend目录）
    BASE_URL: '../backend/api',
    
    // 方式二：使用绝对路径
    // BASE_URL: '/backend/api',
    
    // 方式三：使用完整URL（如果后端在不同端口）
    // BASE_URL: 'http://localhost:8000/backend/api'
};

// 导出配置
window.API_CONFIG = API_CONFIG;

