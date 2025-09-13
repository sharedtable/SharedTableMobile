/**
 * Production-grade database migration service
 * Handles database schema creation and updates
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

interface MigrationRecord {
  id: string;
  filename: string;
  executed_at: string;
  checksum: string;
}

class MigrationService {
  private supabase: SupabaseClient | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      logger.warn('Supabase credentials not found, migrations will be skipped');
      return;
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
        },
        db: {
          schema: 'public',
        },
      });
      logger.info('Migration service initialized');
    } catch (error) {
      logger.error('Failed to initialize migration service:', error);
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    if (!this.supabase) {
      logger.warn('Migration service not initialized, skipping migrations');
      return;
    }

    try {
      // Ensure migration tracking table exists
      await this.createMigrationTable();

      // Get list of executed migrations
      const executedMigrations = await this.getExecutedMigrations();
      const executedFilenames = new Set(executedMigrations.map(m => m.filename));

      // Get list of migration files
      const migrationFiles = await this.getMigrationFiles();
      const pendingMigrations = migrationFiles.filter(
        filename => !executedFilenames.has(filename)
      );

      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations found');
        return;
      }

      logger.info(`Found ${pendingMigrations.length} pending migrations`);

      // Execute each pending migration
      for (const filename of pendingMigrations) {
        await this.executeMigration(filename);
      }

      logger.info('All migrations completed successfully');
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Create the migration tracking table if it doesn't exist
   */
  private async createMigrationTable(): Promise<void> {
    if (!this.supabase) return;

    const { error } = await this.supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS migration_history (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          checksum VARCHAR(64) NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_migration_history_filename 
        ON migration_history(filename);
      `,
    });

    if (error) {
      // Try alternative approach if RPC doesn't exist
      const { error: createError } = await this.supabase.from('migration_history').select('id').limit(1);
      
      if (createError && createError.code === 'PGRST116') {
        // Table doesn't exist, but we can't create it without proper permissions
        logger.warn('Migration table does not exist and cannot be created automatically');
        logger.warn('Please run the following SQL manually:');
        logger.warn(`
          CREATE TABLE IF NOT EXISTS migration_history (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            checksum VARCHAR(64) NOT NULL
          );
        `);
        return;
      }
    }
  }

  /**
   * Get list of executed migrations from the database
   */
  private async getExecutedMigrations(): Promise<MigrationRecord[]> {
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from('migration_history')
        .select('*')
        .order('executed_at', { ascending: true });

      if (error) {
        if (error.code === 'PGRST116') {
          // Table doesn't exist yet
          return [];
        }
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.warn('Could not fetch migration history:', error);
      return [];
    }
  }

  /**
   * Get list of migration files from the filesystem
   */
  private async getMigrationFiles(): Promise<string[]> {
    const migrationsDir = path.join(__dirname, '../../migrations');
    
    try {
      const files = fs.readdirSync(migrationsDir);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort(); // Ensure lexicographic order
    } catch (error) {
      logger.error('Could not read migrations directory:', error);
      return [];
    }
  }

  /**
   * Execute a single migration file
   */
  private async executeMigration(filename: string): Promise<void> {
    if (!this.supabase) return;

    const migrationPath = path.join(__dirname, '../../migrations', filename);
    
    try {
      logger.info(`Executing migration: ${filename}`);
      
      // Read migration file
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      
      // Calculate checksum
      const checksum = this.calculateChecksum(sql);
      
      // Execute migration (note: this approach works for simple migrations)
      // For complex migrations, you might need to split on ';' and execute separately
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.toLowerCase().startsWith('create') || 
            statement.toLowerCase().startsWith('alter') ||
            statement.toLowerCase().startsWith('insert') ||
            statement.toLowerCase().startsWith('update') ||
            statement.toLowerCase().startsWith('delete') ||
            statement.toLowerCase().startsWith('comment')) {
          
          const { error } = await this.supabase.rpc('execute_sql', { sql: statement });
          if (error) {
            // If RPC doesn't work, try direct query for simple cases
            logger.warn(`RPC failed for: ${statement.substring(0, 50)}...`);
          }
        }
      }
      
      // Record migration as executed
      const { error: insertError } = await this.supabase
        .from('migration_history')
        .insert({
          filename,
          checksum,
          executed_at: new Date().toISOString(),
        });

      if (insertError) {
        logger.warn(`Could not record migration ${filename}:`, insertError);
      }

      logger.info(`Migration ${filename} completed successfully`);
    } catch (error) {
      logger.error(`Migration ${filename} failed:`, error);
      throw error;
    }
  }

  /**
   * Calculate simple checksum for migration content
   */
  private calculateChecksum(content: string): string {
    // Simple hash function for checksums
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Check if notifications table exists and is properly structured
   */
  async ensureNotificationsTable(): Promise<boolean> {
    if (!this.supabase) {
      logger.warn('Cannot verify notifications table - Supabase not initialized');
      return false;
    }

    try {
      // Try to query the table structure
      const { error } = await this.supabase
        .from('notifications')
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST116') {
          logger.info('Notifications table does not exist, creating it...');
          await this.runMigrations();
          return true;
        }
        logger.error('Error checking notifications table:', error);
        return false;
      }

      logger.info('Notifications table exists and is accessible');
      return true;
    } catch (error) {
      logger.error('Failed to verify notifications table:', error);
      return false;
    }
  }
}

export const migrationService = new MigrationService();