/**
 * Permission utility functions for role-based access control
 */

// Permission types for different resources
export const PERMISSIONS = {
  BRANCH: {
    READ: 'can_read_branch',
    EDIT: 'can_edit_branch',
    DELETE: 'can_delete_branch'
  },
  WAREHOUSE: {
    READ: 'can_read_warehouse',
    EDIT: 'can_edit_warehouse',
    DELETE: 'can_delete_warehouse'
  },
  ASSET: {
    READ: 'can_read_asset',
    EDIT: 'can_edit_asset',
    DELETE: 'can_delete_asset'
  },
  BARCODE: {
    PRINT: 'can_print_barcode'
  }
};

/**
 * Check if user has a specific permission
 * @param {Object} user - User object with permissions
 * @param {string} permission - Permission key to check
 * @returns {boolean} - True if user has permission
 */
export const hasPermission = (user, permission) => {
  if (!user || !permission) return false;
  return Boolean(user[permission]);
};

/**
 * Check if user has read access to a resource
 * @param {Object} user - User object with permissions
 * @param {string} resource - Resource type (BRANCH, WAREHOUSE, ASSET)
 * @returns {boolean} - True if user has read access
 */
export const canRead = (user, resource) => {
  const permission = PERMISSIONS[resource]?.READ;
  return hasPermission(user, permission);
};

/**
 * Check if user has edit access to a resource
 * @param {Object} user - User object with permissions
 * @param {string} resource - Resource type (BRANCH, WAREHOUSE, ASSET)
 * @returns {boolean} - True if user has edit access
 */
export const canEdit = (user, resource) => {
  const permission = PERMISSIONS[resource]?.EDIT;
  return hasPermission(user, permission);
};

/**
 * Check if user has delete access to a resource
 * @param {Object} user - User object with permissions
 * @param {string} resource - Resource type (BRANCH, WAREHOUSE, ASSET)
 * @returns {boolean} - True if user has delete access
 */
export const canDelete = (user, resource) => {
  const permission = PERMISSIONS[resource]?.DELETE;
  return hasPermission(user, permission);
};

/**
 * Check if user can print barcodes
 * @param {Object} user - User object with permissions
 * @returns {boolean} - True if user can print barcodes
 */
export const canPrintBarcode = (user) => {
  return hasPermission(user, PERMISSIONS.BARCODE.PRINT);
};

/**
 * Get all permissions for a resource
 * @param {Object} user - User object with permissions
 * @param {string} resource - Resource type (BRANCH, WAREHOUSE, ASSET)
 * @returns {Object} - Object with read, edit, delete permissions
 */
export const getResourcePermissions = (user, resource) => {
  return {
    read: canRead(user, resource),
    edit: canEdit(user, resource),
    delete: canDelete(user, resource)
  };
};

/**
 * Check if navigation item should be visible based on permissions
 * @param {Object} user - User object with permissions
 * @param {string} itemId - Navigation item ID
 * @returns {boolean} - True if item should be visible
 */
export const isNavigationItemVisible = (user, itemId) => {
  if (!user) return false;

  switch (itemId) {
    case 'assets':
      return canRead(user, 'ASSET');
    case 'warehouses':
      return canRead(user, 'WAREHOUSE');
    case 'branches':
      return canRead(user, 'BRANCH');
    case 'dashboard':
    case 'categories':
    case 'users':
    case 'jobroles':
    case 'settings':
    case 'transactions':
    case 'reports':
      // These are always visible for authenticated users
      return true;
    default:
      return true;
  }
};

/**
 * Filter menu items based on user permissions
 * @param {Array} menuItems - Array of menu items
 * @param {Object} user - User object with permissions
 * @returns {Array} - Filtered menu items
 */
export const filterMenuItems = (menuItems, user) => {
  if (!user) return [];

  return menuItems.filter(item => isNavigationItemVisible(user, item.id));
};

/**
 * Check if user should see action buttons based on permissions
 * @param {Object} user - User object with permissions
 * @param {string} resource - Resource type
 * @param {string} action - Action type (edit, delete)
 * @returns {boolean} - True if action button should be visible
 */
export const shouldShowActionButton = (user, resource, action) => {
  if (!user) return false;

  switch (action) {
    case 'edit':
      return canEdit(user, resource);
    case 'delete':
      return canDelete(user, resource);
    case 'add':
      // For add actions, we typically check edit permission
      return canEdit(user, resource);
    case 'barcode':
      return canPrintBarcode(user);
    default:
      return false;
  }
};
