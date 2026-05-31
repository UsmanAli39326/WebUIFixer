// API Configuration
const API_BASE_URL = 'http://localhost:5000';

class WebFixerAPI {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `API Error: ${response.status}` }));
        // Handle nested error from express-validator which returns { errors: [...] }
        if (error.errors && Array.isArray(error.errors)) {
          throw new Error(error.errors.map(e => e.msg).join(", "));
        }
        throw new Error(error.error || `API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication
  async register(name, email, password) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async login(email, password) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      localStorage.setItem('token', response.token);
      this.token = response.token;
    }
    
    return response;
  }

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('token');
    this.token = null;
  }

  async forgotPassword(email) {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token, newPassword) {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // Website Analysis
  async analyzeWebsite(url, useAi = true) {
    return this.request(`/audit?url=${encodeURIComponent(url)}&ai=${useAi}`);
  }

  // Reports
  async generatePDF(auditId) {
    window.open(`${API_BASE_URL}/api/audit/${auditId}/report/pdf`, '_blank');
  }

  async getHTMLReport(auditId) {
    window.open(`${API_BASE_URL}/api/audit/${auditId}/report/html`, '_blank');
  }

  // User Profile
  async getUserProfile() {
    return this.request('/api/user/profile');
  }

  async updateProfile(profileData) {
    return this.request('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(oldPassword, newPassword) {
    return this.request('/api/user/change-password', {
      method: 'PUT',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  }

  async deleteAccount(password) {
    return this.request('/api/user/account', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
  }

  // Marketplace
  async getTemplates(search = '') {
    const url = search ? `/api/marketplace/templates?search=${encodeURIComponent(search)}` : '/api/marketplace/templates';
    return this.request(url);
  }

  async uploadTemplate(title, url, price, file) {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('url', url);
    formData.append('price', price);
    if (file) {
      formData.append('file', file);
    }

    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/marketplace/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `API Error: ${response.status}` }));
        throw new Error(error.error || `API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async getAdminUsers() {
    return this.request('/api/user/admin/users');
  }

  async getAdminAnalytics() {
    return this.request('/api/admin/analytics');
  }

  async deleteUser(id) {
    return this.request(`/api/admin/users/${id}`, { method: 'DELETE' });
  }

  async toggleBlockUser(id) {
    return this.request(`/api/admin/users/${id}/block`, { method: 'PATCH' });
  }

  // Health Check
  async checkHealth() {
    return this.request('/health');
  }
}

// Export singleton instance
window.api = new WebFixerAPI();
