/**
 * Background worker for processing user features
 * Monitors the feature_processing_queue and processes users asynchronously
 */

import { supabase } from '../config/supabase';
import { embeddingService } from './embeddingService';

interface ProcessingQueueItem {
  id: string;
  user_id: string;
  trigger_source: string;
  priority: number;
  status: string;
  retry_count: number;
  max_retries: number;
}

export class FeatureProcessingWorker {
  private isRunning: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private batchSize: number = 5;
  private pollIntervalMs: number = 10000; // 10 seconds
  
  /**
   * Start the worker
   */
  start(): void {
    if (this.isRunning) {
      console.log('Feature processing worker already running');
      return;
    }
    
    this.isRunning = true;
    console.log('Starting feature processing worker...');
    
    // Initial processing
    this.processQueue();
    
    // Set up interval for continuous processing
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, this.pollIntervalMs);
  }
  
  /**
   * Stop the worker
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    console.log('Feature processing worker stopped');
  }
  
  /**
   * Process items from the queue
   */
  private async processQueue(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    
    try {
      // Fetch pending items ordered by priority and creation time
      const { data: queueItems, error } = await supabase
        .from('feature_processing_queue')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(this.batchSize);
      
      if (error) {
        console.error('Error fetching queue items:', error);
        return;
      }
      
      if (!queueItems || queueItems.length === 0) {
        return; // No items to process
      }
      
      console.log(`Processing ${queueItems.length} feature queue items...`);
      
      // Process items in parallel
      const processingPromises = queueItems.map(item => 
        this.processQueueItem(item as ProcessingQueueItem)
      );
      
      await Promise.allSettled(processingPromises);
      
    } catch (error) {
      console.error('Error in processQueue:', error);
    }
  }
  
  /**
   * Process a single queue item
   */
  private async processQueueItem(item: ProcessingQueueItem): Promise<void> {
    try {
      // Mark as processing
      await supabase
        .from('feature_processing_queue')
        .update({
          status: 'processing',
          started_at: new Date().toISOString()
        })
        .eq('id', item.id);
      
      // Process the user's features
      console.log(`Processing features for user ${item.user_id}...`);
      const features = await embeddingService.processUserProfile(item.user_id);
      
      // Store the features
      await embeddingService.storeUserFeatures(features);
      
      // Mark as completed
      await supabase
        .from('feature_processing_queue')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', item.id);
      
      // Update feature processing status
      await supabase
        .from('user_features')
        .update({
          processing_status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('user_id', item.user_id);
      
      console.log(`✅ Successfully processed features for user ${item.user_id}`);
      
    } catch (error) {
      console.error(`Error processing item ${item.id}:`, error);
      
      // Increment retry count
      const newRetryCount = item.retry_count + 1;
      
      if (newRetryCount >= item.max_retries) {
        // Max retries reached, mark as failed
        await supabase
          .from('feature_processing_queue')
          .update({
            status: 'failed',
            retry_count: newRetryCount,
            error_message: error instanceof Error ? error.message : 'Unknown error',
            completed_at: new Date().toISOString()
          })
          .eq('id', item.id);
        
        // Update feature status
        await supabase
          .from('user_features')
          .update({
            processing_status: 'failed',
            processing_error: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('user_id', item.user_id);
        
      } else {
        // Reset to pending for retry
        await supabase
          .from('feature_processing_queue')
          .update({
            status: 'pending',
            retry_count: newRetryCount,
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', item.id);
      }
    }
  }
  
  /**
   * Manually trigger processing for a specific user
   */
  async processUser(userId: string, priority: number = 1): Promise<void> {
    try {
      // Add to queue with high priority
      const { error } = await supabase
        .from('feature_processing_queue')
        .insert({
          user_id: userId,
          trigger_source: 'manual',
          priority: priority,
          status: 'pending'
        })
        .single();
      
      if (error && !error.message.includes('duplicate')) {
        throw error;
      }
      
      console.log(`User ${userId} added to processing queue with priority ${priority}`);
      
      // Trigger immediate processing if worker is running
      if (this.isRunning) {
        this.processQueue();
      }
      
    } catch (error) {
      console.error(`Error adding user ${userId} to queue:`, error);
      throw error;
    }
  }
  
  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    avgProcessingTime: number;
  }> {
    const { data, error } = await supabase
      .from('feature_processing_queue')
      .select('status, started_at, completed_at');
    
    if (error || !data) {
      throw error || new Error('No data');
    }
    
    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      avgProcessingTime: 0
    };
    
    let totalProcessingTime = 0;
    let processedCount = 0;
    
    data.forEach(item => {
      stats[item.status as keyof typeof stats]++;
      
      if (item.status === 'completed' && item.started_at && item.completed_at) {
        const duration = new Date(item.completed_at).getTime() - 
                        new Date(item.started_at).getTime();
        totalProcessingTime += duration;
        processedCount++;
      }
    });
    
    if (processedCount > 0) {
      stats.avgProcessingTime = totalProcessingTime / processedCount;
    }
    
    return stats;
  }
  
  /**
   * Clear completed items from queue older than specified days
   */
  async cleanupQueue(daysOld: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const { data, error } = await supabase
      .from('feature_processing_queue')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('completed_at', cutoffDate.toISOString())
      .select('id');
    
    if (error) {
      console.error('Error cleaning up queue:', error);
      throw error;
    }
    
    const deletedCount = data?.length || 0;
    console.log(`Cleaned up ${deletedCount} old queue items`);
    
    return deletedCount;
  }
}

// Create singleton instance
export const featureProcessingWorker = new FeatureProcessingWorker();

// Auto-start worker if in production
if (process.env.NODE_ENV === 'production') {
  featureProcessingWorker.start();
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down feature processing worker...');
  featureProcessingWorker.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down feature processing worker...');
  featureProcessingWorker.stop();
  process.exit(0);
});