/**
 * Performance monitoring service for Parking in a Pinch
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface ErrorLog {
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  userId?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorLog[] = [];
  private readonly MAX_METRICS = 1000;
  private readonly MAX_ERRORS = 100;

  constructor() {
    this.setupErrorHandling();
    this.setupPerformanceObserver();
    this.startMetricsCollection();
  }

  /**
   * Record a custom performance metric
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags
    };

    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    console.log(`📊 Performance metric: ${name} = ${value}ms`, tags);
  }

  /**
   * Record an error
   */
  recordError(error: Error, additionalInfo?: Record<string, any>) {
    const errorLog: ErrorLog = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...additionalInfo
    };

    this.errors.push(errorLog);
    
    // Keep only the most recent errors
    if (this.errors.length > this.MAX_ERRORS) {
      this.errors = this.errors.slice(-this.MAX_ERRORS);
    }

    console.error('🚨 Error logged:', errorLog);
  }

  /**
   * Setup global error handling
   */
  private setupErrorHandling() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError(new Error(event.reason), {
        type: 'unhandled_rejection'
      });
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.recordError(new Error(event.message), {
        type: 'javascript_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
  }

  /**
   * Setup performance observer for Core Web Vitals
   */
  private setupPerformanceObserver() {
    try {
      // Observe Largest Contentful Paint (LCP)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('lcp', lastEntry.startTime, { type: 'core_web_vital' });
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // Observe First Input Delay (FID)
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          this.recordMetric('fid', entry.processingStart - entry.startTime, { type: 'core_web_vital' });
        }
      }).observe({ entryTypes: ['first-input'] });

      // Observe Cumulative Layout Shift (CLS)
      new PerformanceObserver((entryList) => {
        let clsValue = 0;
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.recordMetric('cls', clsValue, { type: 'core_web_vital' });
      }).observe({ entryTypes: ['layout-shift'] });

    } catch (error) {
      console.warn('Performance observer not supported:', error);
    }
  }

  /**
   * Start collecting general performance metrics
   */
  private startMetricsCollection() {
    // Collect metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Collect initial page load metrics
    setTimeout(() => {
      this.collectPageLoadMetrics();
    }, 1000);
  }

  /**
   * Collect system performance metrics
   */
  private collectSystemMetrics() {
    // Memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.recordMetric('memory_used', memory.usedJSHeapSize, { type: 'memory' });
      this.recordMetric('memory_total', memory.totalJSHeapSize, { type: 'memory' });
    }

    // Connection information
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.recordMetric('network_speed', connection.downlink, { 
        type: 'network',
        connection_type: connection.effectiveType 
      });
    }
  }

  /**
   * Collect page load performance metrics
   */
  private collectPageLoadMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      this.recordMetric('dns_lookup', navigation.domainLookupEnd - navigation.domainLookupStart, { type: 'page_load' });
      this.recordMetric('tcp_connect', navigation.connectEnd - navigation.connectStart, { type: 'page_load' });
      this.recordMetric('ttfb', navigation.responseStart - navigation.requestStart, { type: 'page_load' });
      this.recordMetric('dom_load', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart, { type: 'page_load' });
      this.recordMetric('page_load', navigation.loadEventEnd - navigation.navigationStart, { type: 'page_load' });
    }
  }

  /**
   * Time a function execution
   */
  timeFunction<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, { type: 'function_timing' });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, { type: 'function_timing', error: 'true' });
      this.recordError(error as Error, { function: name });
      throw error;
    }
  }

  /**
   * Time an async function execution
   */
  async timeAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, { type: 'async_function_timing' });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, { type: 'async_function_timing', error: 'true' });
      this.recordError(error as Error, { function: name });
      throw error;
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const recentMetrics = this.metrics.filter(m => m.timestamp > Date.now() - 300000); // Last 5 minutes
    const recentErrors = this.errors.filter(e => e.timestamp > Date.now() - 300000);

    return {
      metrics: {
        total: recentMetrics.length,
        types: this.groupBy(recentMetrics, 'name'),
        averages: this.calculateAverages(recentMetrics)
      },
      errors: {
        total: recentErrors.length,
        types: this.groupBy(recentErrors, 'message')
      },
      timestamp: Date.now()
    };
  }

  /**
   * Export metrics for backup/analysis
   */
  exportMetrics() {
    return {
      metrics: this.metrics,
      errors: this.errors,
      summary: this.getPerformanceSummary(),
      timestamp: Date.now(),
      version: '1.0.0'
    };
  }

  /**
   * Save metrics to localStorage as backup
   */
  saveToLocalStorage() {
    try {
      const data = this.exportMetrics();
      localStorage.setItem('parking_performance_metrics', JSON.stringify(data));
      console.log('📊 Performance metrics saved to localStorage');
    } catch (error) {
      console.warn('Failed to save metrics to localStorage:', error);
    }
  }

  /**
   * Load metrics from localStorage
   */
  loadFromLocalStorage() {
    try {
      const data = localStorage.getItem('parking_performance_metrics');
      if (data) {
        const parsed = JSON.parse(data);
        this.metrics = parsed.metrics || [];
        this.errors = parsed.errors || [];
        console.log('📊 Performance metrics loaded from localStorage');
      }
    } catch (error) {
      console.warn('Failed to load metrics from localStorage:', error);
    }
  }

  private groupBy(array: any[], key: string) {
    return array.reduce((result, item) => {
      const group = item[key];
      result[group] = (result[group] || 0) + 1;
      return result;
    }, {});
  }

  private calculateAverages(metrics: PerformanceMetric[]) {
    const groups: Record<string, number[]> = {};
    
    metrics.forEach(metric => {
      if (!groups[metric.name]) {
        groups[metric.name] = [];
      }
      groups[metric.name].push(metric.value);
    });

    const averages: Record<string, number> = {};
    Object.keys(groups).forEach(key => {
      const values = groups[key];
      averages[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
    });

    return averages;
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Auto-save metrics every 5 minutes
setInterval(() => {
  performanceMonitor.saveToLocalStorage();
}, 5 * 60 * 1000);

// Load existing metrics on startup
performanceMonitor.loadFromLocalStorage();

export default performanceMonitor;