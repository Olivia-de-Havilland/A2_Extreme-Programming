/**
 * 通讯录管理系统 - 前端逻辑
 * 前后端分离架构
 */

// API配置（从config.js获取）
const API_BASE_URL = window.API_CONFIG.BASE_URL;
const API = {
    list: `${API_BASE_URL}/list.php`,
    get: `${API_BASE_URL}/get.php`,
    add: `${API_BASE_URL}/add.php`,
    update: `${API_BASE_URL}/update.php`,
    delete: `${API_BASE_URL}/delete.php`,
    favorite: `${API_BASE_URL}/favorite.php`,
    contactMethods: `${API_BASE_URL}/contact_methods.php`,
    export: `${API_BASE_URL}/export.php`,
    import: `${API_BASE_URL}/import.php`
};

// 全局状态
let currentEditId = null;
let deleteContactId = null;
let searchTimeout = null;
let showFavoriteOnly = false;
let extraMethods = []; // 存储额外联系方式
let methodIdCounter = 0; // 用于生成临时ID

// DOM元素
const elements = {
    contactsList: document.getElementById('contactsList'),
    contactCount: document.getElementById('contactCount'),
    emptyState: document.getElementById('emptyState'),
    searchInput: document.getElementById('searchInput'),
    addBtn: document.getElementById('addBtn'),
    filterFavoriteBtn: document.getElementById('filterFavoriteBtn'),
    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    contactModal: document.getElementById('contactModal'),
    deleteModal: document.getElementById('deleteModal'),
    importModal: document.getElementById('importModal'),
    contactForm: document.getElementById('contactForm'),
    modalTitle: document.getElementById('modalTitle'),
    contactId: document.getElementById('contactId'),
    nameInput: document.getElementById('name'),
    phoneInput: document.getElementById('phone'),
    emailInput: document.getElementById('email'),
    addressInput: document.getElementById('address'),
    notesInput: document.getElementById('notes'),
    extraContactMethods: document.getElementById('extraContactMethods'),
    addMethodBtn: document.getElementById('addMethodBtn'),
    closeModal: document.getElementById('closeModal'),
    cancelBtn: document.getElementById('cancelBtn'),
    submitBtn: document.getElementById('submitBtn'),
    closeDeleteModal: document.getElementById('closeDeleteModal'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
    deleteContactName: document.getElementById('deleteContactName'),
    closeImportModal: document.getElementById('closeImportModal'),
    cancelImportBtn: document.getElementById('cancelImportBtn'),
    confirmImportBtn: document.getElementById('confirmImportBtn'),
    importFileInput: document.getElementById('importFileInput'),
    loading: document.getElementById('loading'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage')
};

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function() {
    loadContacts();
    bindEvents();
});

// ===== 事件绑定 =====
function bindEvents() {
    // 搜索
    elements.searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadContacts(this.value.trim());
        }, 300);
    });
    
    // 新增按钮
    elements.addBtn.addEventListener('click', openAddModal);
    
    // 筛选收藏
    elements.filterFavoriteBtn.addEventListener('click', toggleFavoriteFilter);
    
    // 导出按钮
    elements.exportBtn.addEventListener('click', exportContacts);
    
    // 导入按钮
    elements.importBtn.addEventListener('click', openImportModal);
    
    // 添加联系方式
    elements.addMethodBtn.addEventListener('click', addMethodField);
    
    // 关闭模态框
    elements.closeModal.addEventListener('click', closeContactModal);
    elements.cancelBtn.addEventListener('click', closeContactModal);
    elements.closeDeleteModal.addEventListener('click', closeDeleteModal);
    elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    elements.closeImportModal.addEventListener('click', closeImportModal);
    elements.cancelImportBtn.addEventListener('click', closeImportModal);
    
    // 点击模态框背景关闭
    elements.contactModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeContactModal();
        }
    });
    
    elements.deleteModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeDeleteModal();
        }
    });
    
    elements.importModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeImportModal();
        }
    });
    
    // 表单提交
    elements.contactForm.addEventListener('submit', handleFormSubmit);
    
    // 确认删除
    elements.confirmDeleteBtn.addEventListener('click', confirmDelete);
    
    // 确认导入
    elements.confirmImportBtn.addEventListener('click', confirmImport);
}

// ===== 加载联系人列表 =====
async function loadContacts(keyword = '') {
    try {
        showLoading();
        
        let url = API.list;
        const params = [];
        if (keyword) {
            params.push(`keyword=${encodeURIComponent(keyword)}`);
        }
        if (showFavoriteOnly) {
            params.push('favorite=1');
        }
        if (params.length > 0) {
            url += '?' + params.join('&');
        }
        
        const response = await fetch(url);
        const result = await response.json();
        
        hideLoading();
        
        if (result.success) {
            renderContacts(result.data);
            updateCount(result.count);
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        hideLoading();
        showToast('加载联系人列表失败，请检查后端服务是否启动', 'error');
        console.error('加载失败:', error);
    }
}

// ===== 渲染联系人列表 =====
function renderContacts(contacts) {
    if (!contacts || contacts.length === 0) {
        elements.contactsList.innerHTML = '';
        elements.emptyState.style.display = 'block';
        return;
    }
    
    elements.emptyState.style.display = 'none';
    
    let html = '';
    contacts.forEach(contact => {
        const isFavorite = contact.is_favorite == 1;
        html += `
            <div class="contact-card ${isFavorite ? 'favorite' : ''}" data-id="${contact.id}">
                <div class="contact-header">
                    <div>
                        <div class="contact-name">
                            ${escapeHtml(contact.name)}
                            ${isFavorite ? '<i class="fas fa-star favorite-icon" title="收藏"></i>' : ''}
                        </div>
                    </div>
                    <div class="contact-actions">
                        <button class="icon-btn favorite ${isFavorite ? 'active' : ''}" onclick="toggleFavorite(${contact.id})" title="${isFavorite ? '取消收藏' : '添加收藏'}">
                            <i class="fas fa-star"></i>
                        </button>
                        <button class="icon-btn edit" onclick="openEditModal(${contact.id})" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="icon-btn delete" onclick="openDeleteModal(${contact.id}, '${escapeHtml(contact.name)}')" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="contact-info">
                    <div class="info-item">
                        <i class="fas fa-phone"></i>
                        <span>${escapeHtml(contact.phone)}</span>
                    </div>
                    ${contact.email ? `
                        <div class="info-item">
                            <i class="fas fa-envelope"></i>
                            <span>${escapeHtml(contact.email)}</span>
                        </div>
                    ` : ''}
                    ${contact.address ? `
                        <div class="info-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${escapeHtml(contact.address)}</span>
                        </div>
                    ` : ''}
                    ${contact.notes ? `
                        <div class="info-item">
                            <i class="fas fa-sticky-note"></i>
                            <span>${escapeHtml(contact.notes)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    elements.contactsList.innerHTML = html;
}

// ===== 更新计数 =====
function updateCount(count) {
    elements.contactCount.textContent = `共 ${count} 人`;
}

// ===== 打开新增模态框 =====
function openAddModal() {
    currentEditId = null;
    extraMethods = [];
    elements.modalTitle.textContent = '新增联系人';
    elements.contactForm.reset();
    elements.contactId.value = '';
    elements.extraContactMethods.innerHTML = '';
    elements.contactModal.classList.add('show');
}

// ===== 打开编辑模态框 =====
async function openEditModal(id) {
    try {
        showLoading();
        
        // 从后端数据库读取最新数据（禁止使用缓存）
        const response = await fetch(`${API.get}?id=${id}&t=${Date.now()}`);
        const result = await response.json();
        
        hideLoading();
        
        if (result.success) {
            currentEditId = id;
            const contact = result.data;
            
            elements.modalTitle.textContent = '编辑联系人';
            elements.contactId.value = contact.id;
            elements.nameInput.value = contact.name;
            elements.phoneInput.value = contact.phone;
            elements.emailInput.value = contact.email || '';
            elements.addressInput.value = contact.address || '';
            elements.notesInput.value = contact.notes || '';
            
            // 加载额外联系方式
            extraMethods = contact.contact_methods || [];
            renderExtraMethods();
            
            elements.contactModal.classList.add('show');
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        hideLoading();
        showToast('获取联系人信息失败', 'error');
        console.error('获取失败:', error);
    }
}

// ===== 关闭联系人模态框 =====
function closeContactModal() {
    elements.contactModal.classList.remove('show');
    elements.contactForm.reset();
    currentEditId = null;
}

// ===== 表单提交 =====
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // 获取表单数据
    const formData = {
        name: elements.nameInput.value.trim(),
        phone: elements.phoneInput.value.trim(),
        email: elements.emailInput.value.trim(),
        address: elements.addressInput.value.trim(),
        notes: elements.notesInput.value.trim()
    };
    
    // 验证
    if (!formData.name) {
        showToast('请输入姓名', 'error');
        elements.nameInput.focus();
        return;
    }
    
    if (!formData.phone) {
        showToast('请输入电话号码', 'error');
        elements.phoneInput.focus();
        return;
    }
    
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
        showToast('电话号码格式不正确', 'error');
        elements.phoneInput.focus();
        return;
    }
    
    // 获取额外联系方式的值
    const methodItems = elements.extraContactMethods.querySelectorAll('.method-item');
    const updatedMethods = [];
    methodItems.forEach((item, index) => {
        const type = item.querySelector('.method-type').value;
        const value = item.querySelector('.method-value').value.trim();
        const label = item.querySelector('.method-label').value.trim();
        
        if (value) {
            updatedMethods.push({
                id: extraMethods[index].id,
                method_type: type,
                method_value: value,
                label: label,
                isNew: extraMethods[index].isNew || false
            });
        }
    });
    
    try {
        showLoading();
        
        let url = API.add;
        let method = 'POST';
        
        if (currentEditId) {
            url = API.update;
            formData.id = currentEditId;
        }
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            const contactId = currentEditId || result.id;
            
            // 如果是编辑模式，先删除所有旧的联系方式
            if (currentEditId) {
                for (const oldMethod of extraMethods) {
                    if (!oldMethod.isNew && oldMethod.id) {
                        try {
                            await fetch(API.contactMethods, {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ id: oldMethod.id })
                            });
                        } catch (e) {
                            console.error('删除旧联系方式失败:', e);
                        }
                    }
                }
            }
            
            // 添加新的联系方式
            for (const newMethod of updatedMethods) {
                try {
                    await fetch(API.contactMethods, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            contact_id: contactId,
                            method_type: newMethod.method_type,
                            method_value: newMethod.method_value,
                            label: newMethod.label
                        })
                    });
                } catch (e) {
                    console.error('添加联系方式失败:', e);
                }
            }
            
            hideLoading();
            showToast(result.message, 'success');
            closeContactModal();
            loadContacts(elements.searchInput.value.trim());
        } else {
            hideLoading();
            showToast(result.message, 'error');
        }
    } catch (error) {
        hideLoading();
        showToast('操作失败，请重试', 'error');
        console.error('提交失败:', error);
    }
}

// ===== 打开删除确认模态框 =====
function openDeleteModal(id, name) {
    deleteContactId = id;
    elements.deleteContactName.textContent = name;
    elements.deleteModal.classList.add('show');
}

// ===== 关闭删除模态框 =====
function closeDeleteModal() {
    elements.deleteModal.classList.remove('show');
    deleteContactId = null;
}

// ===== 确认删除 =====
async function confirmDelete() {
    if (!deleteContactId) return;
    
    try {
        showLoading();
        
        const response = await fetch(API.delete, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: deleteContactId })
        });
        
        const result = await response.json();
        
        hideLoading();
        
        if (result.success) {
            showToast(result.message, 'success');
            closeDeleteModal();
            loadContacts(elements.searchInput.value.trim());
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        hideLoading();
        showToast('删除失败，请重试', 'error');
        console.error('删除失败:', error);
    }
}

// ===== 显示加载提示 =====
function showLoading() {
    elements.loading.style.display = 'flex';
}

// ===== 隐藏加载提示 =====
function hideLoading() {
    elements.loading.style.display = 'none';
}

// ===== 显示Toast提示 =====
function showToast(message, type = 'success') {
    elements.toastMessage.textContent = message;
    elements.toast.className = 'toast show ' + type;
    
    // 更新图标
    const icon = elements.toast.querySelector('i');
    if (type === 'success') {
        icon.className = 'fas fa-check-circle';
    } else if (type === 'error') {
        icon.className = 'fas fa-exclamation-circle';
    }
    
    // 3秒后自动隐藏
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// ===== HTML转义（防XSS攻击）=====
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

// ===== 切换收藏筛选 =====
function toggleFavoriteFilter() {
    showFavoriteOnly = !showFavoriteOnly;
    if (showFavoriteOnly) {
        elements.filterFavoriteBtn.classList.add('active');
    } else {
        elements.filterFavoriteBtn.classList.remove('active');
    }
    loadContacts(elements.searchInput.value.trim());
}

// ===== 切换收藏状态 =====
async function toggleFavorite(id) {
    try {
        const response = await fetch(API.favorite, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: id })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(result.message, 'success');
            loadContacts(elements.searchInput.value.trim());
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('操作失败，请重试', 'error');
        console.error('收藏失败:', error);
    }
}

// ===== 添加联系方式字段 =====
function addMethodField() {
    const tempId = 'temp_' + (methodIdCounter++);
    extraMethods.push({
        id: tempId,
        method_type: 'phone',
        method_value: '',
        label: '',
        isNew: true
    });
    renderExtraMethods();
}

// ===== 渲染额外联系方式 =====
function renderExtraMethods() {
    let html = '';
    extraMethods.forEach((method, index) => {
        html += `
            <div class="method-item" data-index="${index}">
                <select class="method-type">
                    <option value="phone" ${method.method_type === 'phone' ? 'selected' : ''}>电话</option>
                    <option value="email" ${method.method_type === 'email' ? 'selected' : ''}>邮箱</option>
                    <option value="wechat" ${method.method_type === 'wechat' ? 'selected' : ''}>微信</option>
                    <option value="qq" ${method.method_type === 'qq' ? 'selected' : ''}>QQ</option>
                    <option value="weibo" ${method.method_type === 'weibo' ? 'selected' : ''}>微博</option>
                    <option value="address" ${method.method_type === 'address' ? 'selected' : ''}>地址</option>
                </select>
                <input type="text" class="method-value" placeholder="请输入联系方式" value="${escapeHtml(method.method_value)}">
                <input type="text" class="method-label" placeholder="标签(可选)" value="${escapeHtml(method.label || '')}">
                <button type="button" class="btn-remove" onclick="removeMethodField(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    });
    elements.extraContactMethods.innerHTML = html;
}

// ===== 删除联系方式字段 =====
function removeMethodField(index) {
    extraMethods.splice(index, 1);
    renderExtraMethods();
}

// ===== 导出通讯录 =====
async function exportContacts() {
    try {
        showLoading();
        
        const response = await fetch(API.export);
        const result = await response.json();
        
        hideLoading();
        
        if (result.success) {
            // 解码base64并下载
            const byteCharacters = atob(result.content);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'text/csv;charset=utf-8;' });
            
            // 创建下载链接
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = result.filename;
            link.click();
            
            showToast(`成功导出 ${result.count} 条联系人`, 'success');
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        hideLoading();
        showToast('导出失败，请重试', 'error');
        console.error('导出失败:', error);
    }
}

// ===== 打开导入模态框 =====
function openImportModal() {
    elements.importFileInput.value = '';
    elements.importModal.classList.add('show');
}

// ===== 关闭导入模态框 =====
function closeImportModal() {
    elements.importModal.classList.remove('show');
    elements.importFileInput.value = '';
}

// ===== 确认导入 =====
async function confirmImport() {
    const file = elements.importFileInput.files[0];
    if (!file) {
        showToast('请选择文件', 'error');
        return;
    }
    
    try {
        showLoading();
        closeImportModal();
        
        // 读取文件内容
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const content = e.target.result;
                const base64Content = btoa(unescape(encodeURIComponent(content)));
                
                const response = await fetch(API.import, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ content: base64Content })
                });
                
                const result = await response.json();
                
                hideLoading();
                
                if (result.success) {
                    let message = result.message;
                    if (result.errors && result.errors.length > 0) {
                        message += '\n错误详情:\n' + result.errors.join('\n');
                    }
                    showToast(message, 'success');
                    loadContacts();
                } else {
                    showToast(result.message, 'error');
                }
            } catch (error) {
                hideLoading();
                showToast('导入失败，请检查文件格式', 'error');
                console.error('导入失败:', error);
            }
        };
        
        reader.readAsText(file, 'UTF-8');
    } catch (error) {
        hideLoading();
        showToast('读取文件失败', 'error');
        console.error('读取失败:', error);
    }
}

// ===== 暴露全局函数供HTML调用 =====
window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;
window.toggleFavorite = toggleFavorite;
window.removeMethodField = removeMethodField;

