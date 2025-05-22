import ApiService from './api.service';

class DashboardService extends ApiService {
  constructor() {
    super('/dashboard');
  }

  async getStats() {
    return this.get('stats');
  }

  async getAttendance() {
    return this.get('attendance');
  }

  async getDepartments() {
    return this.get('departments');
  }
}

const dashboardService = new DashboardService();
export default dashboardService; 