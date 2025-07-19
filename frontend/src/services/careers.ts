import api from './api';

export interface JobApplication {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  applied_date: string;
  status: 'new' | 'reviewing' | 'interview' | 'hired' | 'rejected';
  rating: number;
  experience_level: string;
  location: string;
  linkedin?: string;
  portfolio?: string;
  cover_letter: string;
  resume_url?: string;
}

export interface JobApplicationStats {
  total: number;
  new: number;
  reviewing: number;
  interview: number;
  hired: number;
  rejected: number;
}

class CareersService {
  async getAllApplications(): Promise<JobApplication[]> {
    try {
      console.log('📝 CareersService: Fetching all job applications from /careers/applications/');
      const response = await api.get('/careers/applications/');
      const applications = response.data.results || response.data;
      console.log('📝 CareersService: Received', applications.length, 'job applications');
      console.log('📝 CareersService: Application data:', applications);
      return applications;
    } catch (error) {
      console.error('❌ CareersService: Error fetching job applications:', error);
      console.error('❌ CareersService: Error details:', error.response?.data || error.message);
      throw error;
    }
  }

  async getApplicationById(id: string | number): Promise<JobApplication | null> {
    try {
      const response = await api.get(`/careers/applications/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching job application:', error);
      return null;
    }
  }

  async getApplicationStats(): Promise<JobApplicationStats> {
    try {
      const response = await api.get('/careers/applications/stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching application stats:', error);
      throw error;
    }
  }

  async updateApplicationStatus(id: string | number, status: JobApplication['status']): Promise<JobApplication | null> {
    try {
      const response = await api.patch(`/careers/applications/${id}/`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating application status:', error);
      return null;
    }
  }

  async updateApplicationRating(id: string | number, rating: number): Promise<JobApplication | null> {
    try {
      const response = await api.patch(`/careers/applications/${id}/update_rating/`, { rating });
      return response.data;
    } catch (error) {
      console.error('Error updating application rating:', error);
      return null;
    }
  }

  async filterApplications(filters: {
    status?: JobApplication['status'];
    department?: string;
    experience_level?: string;
    search?: string;
  }): Promise<JobApplication[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) {
        params.append('status', filters.status);
      }
      
      if (filters.department) {
        params.append('department', filters.department);
      }
      
      if (filters.experience_level) {
        params.append('experience_level', filters.experience_level);
      }
      
      if (filters.search) {
        params.append('search', filters.search);
      }
      
      const response = await api.get(`/careers/applications/?${params}`);
      return response.data.results || response.data;
    } catch (error) {
      console.error('Error filtering applications:', error);
      throw error;
    }
  }

  async exportApplicationsToCSV(): Promise<string> {
    try {
      const response = await api.get('/careers/applications/export_csv/', {
        responseType: 'text'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting applications:', error);
      throw error;
    }
  }

  async bulkUpdateStatus(ids: (string | number)[], status: JobApplication['status']): Promise<JobApplication[]> {
    try {
      const response = await api.post('/careers/applications/bulk_update_status/', {
        application_ids: ids,
        status
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk updating status:', error);
      throw error;
    }
  }

  async submitApplication(applicationData: {
    name: string;
    email: string;
    phone: string;
    position: string;
    department: string;
    experience_level?: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
    cover_letter?: string;
    resume?: File | null;
  }): Promise<JobApplication> {
    try {
      const formData = new FormData();
      
      // Add required fields with correct backend field names
      formData.append('name', applicationData.name);
      formData.append('email', applicationData.email);
      formData.append('phone', applicationData.phone);
      formData.append('position', applicationData.position); // Send job title directly
      formData.append('department', applicationData.department);
      
      // Add optional fields
      if (applicationData.experience_level) {
        formData.append('experience_level', applicationData.experience_level);
      }
      
      if (applicationData.location) {
        formData.append('location', applicationData.location);
      }
      
      if (applicationData.linkedin) {
        formData.append('linkedin', applicationData.linkedin);
      }
      
      if (applicationData.portfolio) {
        formData.append('portfolio', applicationData.portfolio);
      }
      
      if (applicationData.cover_letter) {
        formData.append('cover_letter', applicationData.cover_letter);
      }
      
      // Add resume file if present
      if (applicationData.resume) {
        formData.append('resume', applicationData.resume);
      }
      
      console.log('📝 CareersService: Submitting application to /careers/applications/');
      console.log('📝 CareersService: Form data keys:', Array.from(formData.keys()));
      
      const response = await api.post('/careers/applications/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ CareersService: Application submitted successfully');
      console.log('✅ CareersService: Response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error submitting application:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const careersService = new CareersService();