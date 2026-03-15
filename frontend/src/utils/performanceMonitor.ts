/**
 * Performance Monitoring Utility
 * Track and measure app performance metrics
 */

import { InteractionManager } from 'react-native';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private metrics: PerformanceMetric[] = [];
  private enabled: boolean = __DEV__;

  /**
   * Mark the start of a performance measurement
   */
  mark(name: string): void {
    if (!this.enabled) return;
    
    this.marks.set(name, Date.now());
    
    if (__DEV__) {
      console.log(`[Performance Mark] ${name} at ${Date.now()}`);
    }
  }

  /**
   * Measure the duration since a mark was set
   */
  measure(name: string, startMark: string): number | null {
    if (!this.enabled) return null;
    
    const startTime = this.marks.get(startMark);
    if (!startTime) {
      console.warn(`[Performance] No mark found for: ${startMark}`);
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    const metric: PerformanceMetric = {
      name,
      startTime,
      endTime,
      duration,
    };

    this.metrics.push(metric);

    // Log the measurement
    console.log(`[Performance] ${name}: ${duration}ms`);

    // Warn if performance is slow
    if (duration > 1000) {
      console.warn(`[Performance Warning] ${name} took ${duration}ms (> 1s)`);
    }

    // Clean up the mark
    this.marks.delete(startMark);

    return duration;
  }

  /**
   * Measure an async interaction
   */
  async measureInteraction<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    if (!this.enabled) {
      return fn();
    }

    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      InteractionManager.runAfterInteractions(async () => {
        try {
          const result = await fn();
          const duration = Date.now() - startTime;

          this.metrics.push({
            name: `Interaction: ${name}`,
            startTime,
            endTime: Date.now(),
            duration,
          });

          console.log(`[Interaction] ${name}: ${duration}ms`);

          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get average duration for a specific metric name
   */
  getAverageDuration(metricName: string): number | null {
    const matching = this.metrics.filter((m) => m.name === metricName);
    if (matching.length === 0) return null;

    const total = matching.reduce((sum, m) => sum + (m.duration || 0), 0);
    return total / matching.length;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.marks.clear();
    this.metrics = [];
  }

  /**
   * Get a summary report
   */
  getReport(): string {
    if (this.metrics.length === 0) {
      return 'No performance metrics collected';
    }

    const report: string[] = ['\n=== Performance Report ===\n'];

    // Group by metric name
    const grouped = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.duration || 0);
      return acc;
    }, {} as Record<string, number[]>);

    // Generate stats for each metric
    Object.entries(grouped).forEach(([name, durations]) => {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);

      report.push(`${name}:`);
      report.push(`  Count: ${durations.length}`);
      report.push(`  Average: ${avg.toFixed(2)}ms`);
      report.push(`  Min: ${min}ms`);
      report.push(`  Max: ${max}ms`);
      report.push('');
    });

    return report.join('\n');
  }

  /**
   * Enable or disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export for convenience
export const { mark, measure, measureInteraction } = performanceMonitor;
