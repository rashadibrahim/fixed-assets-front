// API utility functions for the Fixed Assets Management System

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorData}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  }

  // Auth API
  async login(credentials) {
    try {
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      if (response.access_token) {
        this.setToken(response.access_token);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    this.setToken(null);
  }

  async getUserProfile() {
    return this.request('/auth/me');
  }

  async getStatistics() {
    return this.request('/auth/stats');
  }

  // Assets API
  async getAssets(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/assets/${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  async createAsset(assetData) {
    return this.request('/assets/', {
      method: 'POST',
      body: JSON.stringify(assetData),
    });
  }

  async updateAsset(assetId, assetData) {
    return this.request(`/assets/${assetId}`, {
      method: 'PUT',
      body: JSON.stringify(assetData),
    });
  }

  async deleteAsset(assetId) {
    return this.request(`/assets/${assetId}`, {
      method: 'DELETE',
    });
  }

  async getAsset(assetId) {
    return this.request(`/assets/${assetId}`);
  }

  async getAssetBarcode(assetId) {
    return this.request(`/assets/${assetId}/barcode`);
  }

  // Branches API
  async getBranches(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/branches/${queryString ? `?${queryString}` : ''}`);
  }

  async createBranch(branchData) {
    return this.request('/branches/', {
      method: 'POST',
      body: JSON.stringify(branchData),
    });
  }

  async updateBranch(branchId, branchData) {
    return this.request(`/branches/${branchId}`, {
      method: 'PUT',
      body: JSON.stringify(branchData),
    });
  }

  async deleteBranch(branchId) {
    return this.request(`/branches/${branchId}`, {
      method: 'DELETE',
    });
  }

  // Warehouses API
  async getWarehouses(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/warehouses/${queryString ? `?${queryString}` : ''}`);
  }

  async createWarehouse(warehouseData) {
    return this.request('/warehouses/', {
      method: 'POST',
      body: JSON.stringify(warehouseData),
    });
  }

  async updateWarehouse(warehouseId, warehouseData) {
    return this.request(`/warehouses/${warehouseId}`, {
      method: 'PUT',
      body: JSON.stringify(warehouseData),
    });
  }

  async deleteWarehouse(warehouseId) {
    return this.request(`/warehouses/${warehouseId}`, {
      method: 'DELETE',
    });
  }

  // Users API
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/auth/users${queryString ? `?${queryString}` : ''}`);
  }

  async createUser(userData) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId, userData) {
    return this.request(`/auth/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId) {
    return this.request(`/auth/${userId}`, {
      method: 'DELETE',
    });
  }

  // Job Roles API
  async getJobRoles(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/jobroles/${queryString ? `?${queryString}` : ''}`);
  }

  async createJobRole(roleData) {
    return this.request('/jobroles/', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  }

  async updateJobRole(roleId, roleData) {
    return this.request(`/jobroles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  }

  async deleteJobRole(roleId) {
    return this.request(`/jobroles/${roleId}`, {
      method: 'DELETE',
    });
  }
}

const apiClient = new ApiClient();
export { apiClient };
export default apiClient;