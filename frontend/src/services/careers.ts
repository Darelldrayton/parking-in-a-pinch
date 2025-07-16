import api from './api';

export interface JobApplication {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  appliedDate: string;
  status: 'new' | 'reviewing' | 'interview' | 'hired' | 'rejected';
  rating: number;
  experience: string;
  location: string;
  linkedin?: string;
  portfolio?: string;
  coverLetter: string;
  resumeUrl?: string;
}

export interface JobApplicationStats {
  total: number;
  new: number;
  reviewing: number;
  interview: number;
  hired: number;
  rejected: number;
}

// Sample data for development - will be replaced with real API calls
const sampleApplications: JobApplication[] = [
  {
    id: 1,
    name: 'Sarah Chen',
    email: 'sarah.chen@email.com',
    phone: '+1 (555) 123-4567',
    position: 'Founding Full-Stack Engineer',
    department: 'Engineering',
    appliedDate: '2024-01-15',
    status: 'interview',
    rating: 4,
    experience: 'Senior',
    location: 'New York, NY',
    linkedin: 'https://linkedin.com/in/sarahchen',
    portfolio: 'https://sarahchen.dev',
    coverLetter: 'I am excited about the opportunity to join Parking in a Pinch as a founding engineer. With 6 years of full-stack development experience, I have built scalable web applications using React, Node.js, and Python. I am particularly drawn to your mission of solving urban mobility challenges and believe my technical expertise can help scale your platform to serve millions of users.\n\nIn my previous role at TechFlow, I led the development of a real-time booking system that handled 10,000+ transactions daily. I have experience with microservices architecture, API design, database optimization, and implementing robust testing frameworks. I am particularly skilled in React, TypeScript, Node.js, Python, and AWS cloud services.\n\nWhat excites me most about this opportunity is the chance to work on a product that directly impacts urban transportation and sustainability. I would love to contribute to building features like dynamic pricing algorithms, advanced search capabilities, and seamless mobile experiences.',
    resumeUrl: '/resumes/sarah-chen-resume.pdf'
  },
  {
    id: 2,
    name: 'Marcus Johnson',
    email: 'marcus.j@email.com',
    phone: '+1 (555) 234-5678',
    position: 'Mobile Developer',
    department: 'Engineering',
    appliedDate: '2024-01-12',
    status: 'reviewing',
    rating: 5,
    experience: 'Mid',
    location: 'New York, NY',
    linkedin: 'https://linkedin.com/in/marcusjohnson',
    portfolio: 'https://marcusapps.com',
    coverLetter: 'As a mobile developer with 4 years of experience building React Native apps, I am thrilled about the opportunity to help create the next generation of parking solutions. I have shipped 8 mobile apps to both iOS and Android app stores, with a combined download count of over 500,000 users.\n\nMy expertise includes React Native, Swift, Kotlin, Firebase, and mobile-first design principles. I have experience with geolocation services, push notifications, offline functionality, and payment integrations. In my current role at MobileFirst, I built a location-based service app that achieved 4.8-star ratings on both platforms.\n\nI am particularly excited about the mobile-first approach that modern parking solutions require. I would love to contribute to building features like real-time space availability, seamless check-in/check-out flows, and intuitive map interfaces that make finding parking effortless.',
    resumeUrl: '/resumes/marcus-johnson-resume.pdf'
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@email.com',
    phone: '+1 (555) 345-6789',
    position: 'UI/UX Designer',
    department: 'Design',
    appliedDate: '2024-01-10',
    status: 'new',
    rating: 0,
    experience: 'Mid',
    location: 'Brooklyn, NY',
    linkedin: 'https://linkedin.com/in/emilyrodriguez',
    portfolio: 'https://emilydesigns.com',
    coverLetter: 'I am passionate about creating intuitive user experiences and would love to contribute to making parking more accessible through great design. With 5 years of UX/UI design experience, I have worked on everything from fintech apps to e-commerce platforms, always with a focus on user-centered design.\n\nMy design process involves extensive user research, wireframing, prototyping, and usability testing. I am proficient in Figma, Sketch, Adobe Creative Suite, and have experience with design systems and accessibility guidelines. I have led design projects that resulted in 40% increases in user engagement and 25% improvements in conversion rates.\n\nWhat draws me to Parking in a Pinch is the opportunity to solve a real urban problem through design. I believe that finding parking should be stress-free and intuitive, and I would love to contribute to creating interfaces that make this vision a reality.',
    resumeUrl: '/resumes/emily-rodriguez-resume.pdf'
  },
  {
    id: 4,
    name: 'David Kim',
    email: 'david.kim@email.com',
    phone: '+1 (555) 456-7890',
    position: 'Growth Marketing Manager',
    department: 'Marketing',
    appliedDate: '2024-01-08',
    status: 'hired',
    rating: 5,
    experience: 'Senior',
    location: 'Manhattan, NY',
    linkedin: 'https://linkedin.com/in/davidkim',
    portfolio: 'https://davidgrowth.com',
    coverLetter: 'With 5 years of growth marketing experience at tech startups, I have driven user acquisition and retention strategies that resulted in 300% growth in user base and 250% increase in revenue. I am excited about the opportunity to bring this expertise to Parking in a Pinch.\n\nMy background includes performance marketing, SEO/SEM, content marketing, email marketing, and conversion optimization. I have managed marketing budgets of up to $500K monthly and have experience with tools like Google Ads, Facebook Ads, Mixpanel, and HubSpot. At my previous company, I led a team of 4 marketers and achieved a 30% reduction in customer acquisition cost.\n\nI am particularly excited about the opportunity to work in the mobility space and help solve urban parking challenges. I believe that effective marketing can drive both user adoption and behavioral change, making cities more livable for everyone.',
    resumeUrl: '/resumes/david-kim-resume.pdf'
  },
  {
    id: 5,
    name: 'Lisa Park',
    email: 'lisa.park@email.com',
    phone: '+1 (555) 567-8901',
    position: 'Customer Success Manager',
    department: 'Operations',
    appliedDate: '2024-01-05',
    status: 'rejected',
    rating: 2,
    experience: 'Mid',
    location: 'Queens, NY',
    linkedin: 'https://linkedin.com/in/lisapark',
    portfolio: null,
    coverLetter: 'I am excited about the opportunity to help customers succeed with Parking in a Pinch. My background in customer support and account management has given me the skills to ensure users have positive experiences with your platform.\n\nIn my previous role at ServicePro, I managed a portfolio of 200+ B2B clients and achieved a 95% customer satisfaction rate. I have experience with customer onboarding, troubleshooting, and building long-term relationships. I am proficient in CRM systems, help desk software, and have strong communication skills.\n\nI believe that excellent customer success is crucial for any platform that depends on user trust and satisfaction. I would love to contribute to building processes that ensure every user has a seamless experience with your parking solutions.',
    resumeUrl: '/resumes/lisa-park-resume.pdf'
  },
  {
    id: 6,
    name: 'Alex Thompson',
    email: 'alex.thompson@email.com',
    phone: '+1 (555) 678-9012',
    position: 'Data Analyst',
    department: 'Engineering',
    appliedDate: '2024-01-03',
    status: 'new',
    rating: 0,
    experience: 'Mid',
    location: 'Brooklyn, NY',
    linkedin: 'https://linkedin.com/in/alexthompson',
    portfolio: 'https://alexdata.com',
    coverLetter: 'As a data analyst with 3 years of experience, I am excited about the opportunity to help Parking in a Pinch make data-driven decisions. I have worked with large datasets and built analytics systems that provide actionable insights for business growth.\n\nMy technical skills include Python, SQL, R, Tableau, and machine learning frameworks. I have experience with A/B testing, statistical analysis, and building predictive models. In my current role, I built a demand forecasting model that improved inventory efficiency by 25%.\n\nI am particularly interested in the opportunity to work with location data, user behavior patterns, and pricing optimization. I believe that data can help solve complex urban challenges and would love to contribute to making parking more efficient and accessible.',
    resumeUrl: '/resumes/alex-thompson-resume.pdf'
  }
];

class CareersService {
  // In a real implementation, this would be replaced with actual API calls
  private applications: JobApplication[] = [...sampleApplications];
  
  // Simulate API delay
  private async delay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getAllApplications(): Promise<JobApplication[]> {
    await this.delay();
    return [...this.applications];
  }

  async getApplicationById(id: string | number): Promise<JobApplication | null> {
    await this.delay();
    return this.applications.find(app => app.id.toString() === id.toString()) || null;
  }

  async getApplicationStats(): Promise<JobApplicationStats> {
    await this.delay();
    const stats: JobApplicationStats = {
      total: this.applications.length,
      new: this.applications.filter(app => app.status === 'new').length,
      reviewing: this.applications.filter(app => app.status === 'reviewing').length,
      interview: this.applications.filter(app => app.status === 'interview').length,
      hired: this.applications.filter(app => app.status === 'hired').length,
      rejected: this.applications.filter(app => app.status === 'rejected').length,
    };
    return stats;
  }

  async updateApplicationStatus(id: string | number, status: JobApplication['status']): Promise<JobApplication | null> {
    await this.delay();
    const applicationIndex = this.applications.findIndex(app => app.id.toString() === id.toString());
    if (applicationIndex === -1) return null;
    
    this.applications[applicationIndex].status = status;
    return this.applications[applicationIndex];
  }

  async updateApplicationRating(id: string | number, rating: number): Promise<JobApplication | null> {
    await this.delay();
    const applicationIndex = this.applications.findIndex(app => app.id.toString() === id.toString());
    if (applicationIndex === -1) return null;
    
    this.applications[applicationIndex].rating = Math.max(0, Math.min(5, rating));
    return this.applications[applicationIndex];
  }

  async filterApplications(filters: {
    status?: JobApplication['status'];
    department?: string;
    experience?: string;
    search?: string;
  }): Promise<JobApplication[]> {
    await this.delay();
    
    let filtered = [...this.applications];
    
    if (filters.status) {
      filtered = filtered.filter(app => app.status === filters.status);
    }
    
    if (filters.department) {
      filtered = filtered.filter(app => app.department === filters.department);
    }
    
    if (filters.experience) {
      filtered = filtered.filter(app => app.experience === filters.experience);
    }
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(app => 
        app.name.toLowerCase().includes(search) ||
        app.email.toLowerCase().includes(search) ||
        app.position.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }

  async exportApplicationsToCSV(): Promise<string> {
    await this.delay();
    
    const headers = ['Name', 'Email', 'Phone', 'Position', 'Department', 'Applied Date', 'Status', 'Experience', 'Location', 'Rating'];
    const rows = this.applications.map(app => [
      app.name,
      app.email,
      app.phone,
      app.position,
      app.department,
      app.appliedDate,
      app.status,
      app.experience,
      app.location,
      app.rating.toString()
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    return csvContent;
  }

  async bulkUpdateStatus(ids: (string | number)[], status: JobApplication['status']): Promise<JobApplication[]> {
    await this.delay();
    
    const updated: JobApplication[] = [];
    for (const id of ids) {
      const result = await this.updateApplicationStatus(id, status);
      if (result) updated.push(result);
    }
    
    return updated;
  }
}

// Create singleton instance
export const careersService = new CareersService();

// Future: When backend is ready, replace with actual API calls
// export const careersService = {
//   async getAllApplications() {
//     const response = await api.get('/careers/applications/');
//     return response.data;
//   },
//   
//   async getApplicationById(id: string | number) {
//     const response = await api.get(`/careers/applications/${id}/`);
//     return response.data;
//   },
//   
//   async getApplicationStats() {
//     const response = await api.get('/careers/applications/stats/');
//     return response.data;
//   },
//   
//   async updateApplicationStatus(id: string | number, status: JobApplication['status']) {
//     const response = await api.patch(`/careers/applications/${id}/`, { status });
//     return response.data;
//   },
//   
//   async updateApplicationRating(id: string | number, rating: number) {
//     const response = await api.patch(`/careers/applications/${id}/`, { rating });
//     return response.data;
//   },
//   
//   async filterApplications(filters: any) {
//     const params = new URLSearchParams();
//     Object.entries(filters).forEach(([key, value]) => {
//       if (value) params.append(key, value as string);
//     });
//     const response = await api.get(`/careers/applications/?${params}`);
//     return response.data;
//   },
//   
//   async exportApplicationsToCSV() {
//     const response = await api.get('/careers/applications/export_csv/');
//     return response.data;
//   },
//   
//   async bulkUpdateStatus(ids: (string | number)[], status: JobApplication['status']) {
//     const response = await api.post('/careers/applications/bulk_update_status/', { application_ids: ids, status });
//     return response.data;
//   }
// };