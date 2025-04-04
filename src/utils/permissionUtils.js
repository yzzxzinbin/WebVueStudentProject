/**
 * 权限控制工具类
 * 集中管理所有与权限相关的逻辑判断
 */

export default {
  /**
   * 检查用户是否有系统管理员权限
   * @returns {boolean} 是否为管理员
   */
  isAdmin() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role === 'admin';
  },

  /**
   * 检查用户是否有经理权限
   * @returns {boolean} 是否为经理
   */
  isManager() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role === 'manager' || user.role === 'admin';
  },

  /**
   * 检查当前用户是否有创建/删除权限
   * @returns {boolean} 是否有创建/删除权限
   */
  hasCreateDeletePermission() {
    return this.isAdmin();
  },

  /**
   * 检查当前用户是否有对特定仓库的操作权限
   * @param {string} warehouseId - 仓库ID
   * @returns {boolean} 是否有操作权限
   */
  hasWarehousePermission(warehouseId) {
    // 管理员有所有仓库的权限
    if (this.isAdmin()) return true;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const authorizedWarehouses = user.authorizedWarehouses || [];
    
    return authorizedWarehouses.includes(warehouseId);
  },

  /**
   * 检查当前用户是否对多个仓库都有权限
   * @param {Array<string>} warehouseIds - 仓库ID数组
   * @returns {boolean} 是否对所有指定仓库都有权限
   */
  hasAllWarehousesPermission(warehouseIds) {
    // 管理员有所有仓库的权限
    if (this.isAdmin()) return true;
    
    // 空数组默认有权限
    if (!warehouseIds || warehouseIds.length === 0) return true;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const authorizedWarehouses = user.authorizedWarehouses || [];
    
    return warehouseIds.every(id => authorizedWarehouses.includes(id));
  },

  /**
   * 获取当前用户有权限的仓库ID列表
   * @returns {Array<string>} 有权限的仓库ID数组
   */
  getAuthorizedWarehouseIds() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // 管理员有所有仓库的权限
    if (user.role === 'admin') {
      const warehouses = JSON.parse(localStorage.getItem('warehouses') || '[]');
      return warehouses.map(w => w.id);
    }
    
    return user.authorizedWarehouses || [];
  },

  /**
   * 检查用户对仓库的读取权限
   * @param {string} warehouseId - 仓库ID
   * @returns {boolean} 是否有读取权限
   */
  canReadWarehouse(warehouseId) {
    return this.hasWarehousePermission(warehouseId);
  },

  /**
   * 检查用户对仓库的更新权限
   * @param {string} warehouseId - 仓库ID
   * @returns {boolean} 是否有更新权限
   */
  canUpdateWarehouse(warehouseId) {
    return this.hasWarehousePermission(warehouseId);
  },

  /**
   * 检查用户是否有创建仓库权限
   * @returns {boolean} 是否有创建仓库权限
   */
  canCreateWarehouse() {
    return this.hasCreateDeletePermission();
  },

  /**
   * 检查用户是否有删除仓库权限
   * @returns {boolean} 是否有删除仓库权限
   */
  canDeleteWarehouse() {
    return this.hasCreateDeletePermission();
  },

  /**
   * 检查用户是否有创建商品权限
   * @returns {boolean} 是否有创建商品权限
   */
  canCreateProduct() {
    return this.hasCreateDeletePermission();
  },

  /**
   * 检查用户是否有删除商品权限
   * @returns {boolean} 是否有删除商品权限
   */
  canDeleteProduct() {
    return this.hasCreateDeletePermission();
  },

  /**
   * 检查用户是否有进出库操作权限
   * @param {string} warehouseId - 仓库ID
   * @returns {boolean} 是否有操作权限
   */
  canOperateWarehouse(warehouseId) {
    return this.hasWarehousePermission(warehouseId);
  },

  /**
   * 过滤获取用户有权限的仓库列表
   * @param {Array} warehouses - 原始仓库列表
   * @returns {Array} 过滤后的仓库列表
   */
  filterAuthorizedWarehouses(warehouses) {
    if (this.isAdmin()) return warehouses;
    
    const authorizedIds = this.getAuthorizedWarehouseIds();
    return warehouses.filter(w => authorizedIds.includes(w.id));
  },

  /**
   * 过滤获取用户有权限的仓库商品列表
   * @param {Array} warehouseProducts - 原始仓库商品列表
   * @returns {Array} 过滤后的仓库商品列表
   */
  filterAuthorizedWarehouseProducts(warehouseProducts) {
    if (this.isAdmin()) return warehouseProducts;
    
    const authorizedIds = this.getAuthorizedWarehouseIds();
    return warehouseProducts.filter(wp => authorizedIds.includes(wp.warehouseId));
  },

  /**
   * 检查当前用户是否有指定仓库的越权操作批准权限
   * @param {string} warehouseId - 仓库ID
   * @returns {boolean} 是否有越权批准权限
   */
  hasOverrideApprovalPermission(warehouseId) {
    // 管理员有所有仓库的越权批准权限
    if (this.isAdmin()) return true;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const overrideApprovalWarehouses = user.overrideApprovalWarehouses || [];
    
    return overrideApprovalWarehouses.includes(warehouseId);
  },

  /**
   * 检查当前用户是否对多个仓库都有越权批准权限
   * @param {Array<string>} warehouseIds - 仓库ID数组
   * @returns {boolean} 是否对所有指定仓库都有越权批准权限
   */
  hasAllWarehousesOverrideApprovalPermission(warehouseIds) {
    // 管理员有所有仓库的越权批准权限
    if (this.isAdmin()) return true;
    
    // 空数组默认有权限
    if (!warehouseIds || warehouseIds.length === 0) return true;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const overrideApprovalWarehouses = user.overrideApprovalWarehouses || [];
    
    return warehouseIds.every(id => overrideApprovalWarehouses.includes(id));
  },

  /**
   * 获取当前用户有越权批准权限的仓库ID列表
   * @returns {Array<string>} 有越权批准权限的仓库ID数组
   */
  getOverrideApprovalWarehouseIds() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // 管理员有所有仓库的越权批准权限
    if (user.role === 'admin') {
      const warehouses = JSON.parse(localStorage.getItem('warehouses') || '[]');
      return warehouses.map(w => w.id);
    }
    
    return user.overrideApprovalWarehouses || [];
  }
}
