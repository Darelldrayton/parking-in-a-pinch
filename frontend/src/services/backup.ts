/**
 * Data backup service for Parking in a Pinch
 */

interface BackupData {
  userPreferences: any;
  draftListings: any[];
  bookingDrafts: any[];
  cachedData: any;
  performanceMetrics: any;
  timestamp: number;
  version: string;
}

class BackupService {
  private readonly BACKUP_KEY = 'parking_app_backup';
  private readonly MAX_BACKUPS = 5;
  private backupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startAutoBackup();
    this.setupBeforeUnloadBackup();
  }

  /**
   * Create a backup of important app data
   */
  createBackup(): BackupData {
    const backup: BackupData = {
      userPreferences: this.getUserPreferences(),
      draftListings: this.getDraftListings(),
      bookingDrafts: this.getBookingDrafts(),
      cachedData: this.getCachedData(),
      performanceMetrics: this.getPerformanceMetrics(),
      timestamp: Date.now(),
      version: '1.0.0'
    };

    console.log('💾 Creating backup...', backup);
    return backup;
  }

  /**
   * Save backup to localStorage
   */
  saveBackup(backup?: BackupData): void {
    try {
      const backupData = backup || this.createBackup();
      
      // Get existing backups
      const existingBackups = this.getExistingBackups();
      
      // Add new backup
      existingBackups.unshift(backupData);
      
      // Keep only the most recent backups
      const trimmedBackups = existingBackups.slice(0, this.MAX_BACKUPS);
      
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(trimmedBackups));
      console.log(`💾 Backup saved successfully. Total backups: ${trimmedBackups.length}`);
      
    } catch (error) {
      console.error('Failed to save backup:', error);
    }
  }

  /**
   * Restore from backup
   */
  restoreFromBackup(backupIndex: number = 0): boolean {
    try {
      const backups = this.getExistingBackups();
      
      if (!backups || backups.length === 0) {
        console.warn('No backups available to restore');
        return false;
      }

      if (backupIndex >= backups.length) {
        console.warn(`Backup index ${backupIndex} not found`);
        return false;
      }

      const backup = backups[backupIndex];
      console.log('🔄 Restoring backup from:', new Date(backup.timestamp));

      // Restore user preferences
      if (backup.userPreferences) {
        localStorage.setItem('user_preferences', JSON.stringify(backup.userPreferences));
      }

      // Restore draft listings
      if (backup.draftListings) {
        localStorage.setItem('draft_listings', JSON.stringify(backup.draftListings));
      }

      // Restore booking drafts
      if (backup.bookingDrafts) {
        localStorage.setItem('booking_drafts', JSON.stringify(backup.bookingDrafts));
      }

      // Restore cached data
      if (backup.cachedData) {
        Object.keys(backup.cachedData).forEach(key => {
          localStorage.setItem(key, JSON.stringify(backup.cachedData[key]));
        });
      }

      console.log('✅ Backup restored successfully');
      return true;

    } catch (error) {
      console.error('Failed to restore backup:', error);
      return false;
    }
  }

  /**
   * Get all available backups
   */
  getAvailableBackups(): BackupData[] {
    return this.getExistingBackups();
  }

  /**
   * Delete specific backup
   */
  deleteBackup(backupIndex: number): void {
    try {
      const backups = this.getExistingBackups();
      
      if (backupIndex >= 0 && backupIndex < backups.length) {
        backups.splice(backupIndex, 1);
        localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backups));
        console.log(`🗑️ Backup ${backupIndex} deleted`);
      }
    } catch (error) {
      console.error('Failed to delete backup:', error);
    }
  }

  /**
   * Clear all backups
   */
  clearAllBackups(): void {
    try {
      localStorage.removeItem(this.BACKUP_KEY);
      console.log('🗑️ All backups cleared');
    } catch (error) {
      console.error('Failed to clear backups:', error);
    }
  }

  /**
   * Export backup data as downloadable file
   */
  exportBackup(backupIndex: number = 0): void {
    try {
      const backups = this.getExistingBackups();
      const backup = backups[backupIndex];
      
      if (!backup) {
        console.warn('No backup to export');
        return;
      }

      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `parking-app-backup-${new Date(backup.timestamp).toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      console.log('📁 Backup exported successfully');
      
    } catch (error) {
      console.error('Failed to export backup:', error);
    }
  }

  /**
   * Import backup from file
   */
  importBackup(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const backupData = JSON.parse(event.target?.result as string);
          
          // Validate backup structure
          if (this.validateBackup(backupData)) {
            this.saveBackup(backupData);
            console.log('📥 Backup imported successfully');
            resolve(true);
          } else {
            console.error('Invalid backup file format');
            resolve(false);
          }
        } catch (error) {
          console.error('Failed to import backup:', error);
          resolve(false);
        }
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Start automatic backup every 10 minutes
   */
  private startAutoBackup(): void {
    this.backupInterval = setInterval(() => {
      this.saveBackup();
    }, 10 * 60 * 1000); // 10 minutes

    console.log('🔄 Auto-backup started (every 10 minutes)');
  }

  /**
   * Stop automatic backup
   */
  stopAutoBackup(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
      console.log('⏹️ Auto-backup stopped');
    }
  }

  /**
   * Setup backup before page unload
   */
  private setupBeforeUnloadBackup(): void {
    window.addEventListener('beforeunload', () => {
      this.saveBackup();
    });
  }

  /**
   * Get existing backups from localStorage
   */
  private getExistingBackups(): BackupData[] {
    try {
      const backupsStr = localStorage.getItem(this.BACKUP_KEY);
      return backupsStr ? JSON.parse(backupsStr) : [];
    } catch (error) {
      console.error('Failed to load existing backups:', error);
      return [];
    }
  }

  /**
   * Get user preferences from localStorage
   */
  private getUserPreferences(): any {
    try {
      const prefs = localStorage.getItem('user_preferences');
      return prefs ? JSON.parse(prefs) : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Get draft listings from localStorage
   */
  private getDraftListings(): any[] {
    try {
      const drafts = localStorage.getItem('draft_listings');
      return drafts ? JSON.parse(drafts) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get booking drafts from localStorage
   */
  private getBookingDrafts(): any[] {
    try {
      const drafts = localStorage.getItem('booking_drafts');
      return drafts ? JSON.parse(drafts) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get cached data from localStorage
   */
  private getCachedData(): any {
    const cachedData: any = {};
    
    try {
      // Get common cached keys
      const cacheKeys = [
        'listings_cache',
        'bookings_cache',
        'user_profile_cache',
        'search_cache',
        'messages_cache'
      ];

      cacheKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          cachedData[key] = JSON.parse(data);
        }
      });
    } catch (error) {
      console.error('Error collecting cached data:', error);
    }

    return cachedData;
  }

  /**
   * Get performance metrics
   */
  private getPerformanceMetrics(): any {
    try {
      const metrics = localStorage.getItem('parking_performance_metrics');
      return metrics ? JSON.parse(metrics) : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Validate backup data structure
   */
  private validateBackup(backup: any): boolean {
    return (
      backup &&
      typeof backup === 'object' &&
      typeof backup.timestamp === 'number' &&
      typeof backup.version === 'string'
    );
  }

  /**
   * Get backup size in MB
   */
  getBackupSize(): number {
    try {
      const backups = this.getExistingBackups();
      const sizeInBytes = new Blob([JSON.stringify(backups)]).size;
      return Number((sizeInBytes / (1024 * 1024)).toFixed(2));
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get backup statistics
   */
  getBackupStats() {
    const backups = this.getExistingBackups();
    
    return {
      totalBackups: backups.length,
      oldestBackup: backups.length > 0 ? new Date(backups[backups.length - 1].timestamp) : null,
      newestBackup: backups.length > 0 ? new Date(backups[0].timestamp) : null,
      totalSize: this.getBackupSize(),
      autoBackupEnabled: this.backupInterval !== null
    };
  }
}

// Create singleton instance
const backupService = new BackupService();

export default backupService;