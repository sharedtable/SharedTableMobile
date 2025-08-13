import { Alert } from 'react-native';

import { AuthService } from '../../supabase/auth';
import { authMonitoring } from '../../supabase/client';
import { BiometricAuthService } from '../services/biometricAuth';
import { RateLimitService } from '../services/rateLimitService';
import { SessionService } from '../services/sessionService';

export interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  duration: number;
  metadata?: any;
}

export interface TestSuite {
  suiteName: string;
  results: TestResult[];
  totalPassed: number;
  totalFailed: number;
  totalDuration: number;
}

export class AuthFlowTestRunner {
  private static testEmail = 'test@stanford.edu';
  private static testOtpCode = '123456';

  /**
   * Run comprehensive auth flow tests
   */
  static async runAllTests(): Promise<TestSuite[]> {
    console.log('🧪 Starting comprehensive auth flow tests...');

    const suites: TestSuite[] = [];

    try {
      // Run test suites
      suites.push(await this.runEmailValidationTests());
      suites.push(await this.runRateLimitingTests());
      suites.push(await this.runBiometricTests());
      suites.push(await this.runSessionTests());
      suites.push(await this.runSecurityTests());

      // Generate summary
      this.generateTestSummary(suites);

      return suites;
    } catch (error) {
      console.error('❌ Test runner failed:', error);
      throw error;
    }
  }

  /**
   * Test email validation and sanitization
   */
  private static async runEmailValidationTests(): Promise<TestSuite> {
    const results: TestResult[] = [];

    const testCases = [
      {
        name: 'Valid Stanford email',
        email: 'student@stanford.edu',
        shouldPass: true,
      },
      {
        name: 'Valid alumni email',
        email: 'alumni@alumni.stanford.edu',
        shouldPass: true,
      },
      {
        name: 'Invalid email format',
        email: 'invalid-email',
        shouldPass: false,
      },
      {
        name: 'Email with HTML injection',
        email: 'test<script>@stanford.edu',
        shouldPass: false,
      },
      {
        name: 'Email with SQL injection',
        email: "test'OR'1'='1@stanford.edu",
        shouldPass: false,
      },
      {
        name: 'Empty email',
        email: '',
        shouldPass: false,
      },
      {
        name: 'Email too long',
        email: `${'a'.repeat(250)}@stanford.edu`,
        shouldPass: false,
      },
    ];

    for (const testCase of testCases) {
      const result = await this.runTest(testCase.name, async () => {
        const isValid = AuthService.isValidEmail(testCase.email);
        const isStanford = AuthService.isStanfordEmail(testCase.email);

        if (testCase.shouldPass && !isValid) {
          throw new Error('Valid email was rejected');
        }

        if (!testCase.shouldPass && isValid) {
          throw new Error('Invalid email was accepted');
        }

        return { isValid, isStanford };
      });

      results.push(result);
    }

    return this.createTestSuite('Email Validation', results);
  }

  /**
   * Test rate limiting functionality
   */
  private static async runRateLimitingTests(): Promise<TestSuite> {
    const results: TestResult[] = [];
    const testIdentifier = 'test-rate-limit';

    // Clear any existing rate limits
    await RateLimitService.clearAttempts('auth_login', testIdentifier);

    // Test normal usage
    results.push(
      await this.runTest('Rate limit allows normal requests', async () => {
        const result = await RateLimitService.checkRateLimit('auth_login', testIdentifier);
        if (!result.allowed) {
          throw new Error('Normal request was blocked');
        }
        return result;
      })
    );

    // Test rate limit enforcement
    results.push(
      await this.runTest('Rate limit blocks excessive requests', async () => {
        // Record multiple attempts
        for (let i = 0; i < 6; i++) {
          await RateLimitService.recordAttempt('auth_login', testIdentifier);
        }

        const result = await RateLimitService.checkRateLimit('auth_login', testIdentifier);
        if (result.allowed) {
          throw new Error('Excessive requests were not blocked');
        }

        return result;
      })
    );

    // Test rate limit status
    results.push(
      await this.runTest('Rate limit status reporting', async () => {
        const status = await RateLimitService.getStatus('auth_login', testIdentifier);
        if (status.attemptCount === 0) {
          throw new Error('Attempt count not tracked correctly');
        }
        return status;
      })
    );

    // Cleanup
    await RateLimitService.clearAttempts('auth_login', testIdentifier);

    return this.createTestSuite('Rate Limiting', results);
  }

  /**
   * Test biometric authentication capabilities
   */
  private static async runBiometricTests(): Promise<TestSuite> {
    const results: TestResult[] = [];

    results.push(
      await this.runTest('Biometric capabilities check', async () => {
        const capabilities = await BiometricAuthService.getCapabilities();
        return capabilities;
      })
    );

    results.push(
      await this.runTest('Biometric type name generation', async () => {
        const name = BiometricAuthService.getBiometricTypeName([]);
        if (!name || typeof name !== 'string') {
          throw new Error('Invalid biometric type name');
        }
        return { typeName: name };
      })
    );

    results.push(
      await this.runTest('Biometric security requirements check', async () => {
        const requirements = await BiometricAuthService.checkSecurityRequirements();
        return requirements;
      })
    );

    return this.createTestSuite('Biometric Authentication', results);
  }

  /**
   * Test session management
   */
  private static async runSessionTests(): Promise<TestSuite> {
    const results: TestResult[] = [];

    // Clear any existing session
    await SessionService.clearStoredSession();

    results.push(
      await this.runTest('Session storage and retrieval', async () => {
        // This test would need a mock session
        // For now, just test that no session exists
        const session = await SessionService.getStoredSession();
        if (session !== null) {
          throw new Error('Unexpected session found');
        }
        return { hasSession: false };
      })
    );

    results.push(
      await this.runTest('Session statistics', async () => {
        const stats = await SessionService.getSessionStats();
        if (stats.hasSession) {
          throw new Error('Session should not exist');
        }
        return stats;
      })
    );

    results.push(
      await this.runTest('Session refresh check', async () => {
        const shouldRefresh = await SessionService.shouldRefreshSession();
        // Should be false when no session exists
        if (shouldRefresh) {
          throw new Error('Should not need refresh when no session exists');
        }
        return { shouldRefresh };
      })
    );

    return this.createTestSuite('Session Management', results);
  }

  /**
   * Test security features
   */
  private static async runSecurityTests(): Promise<TestSuite> {
    const results: TestResult[] = [];

    results.push(
      await this.runTest('Auth error message generation', async () => {
        const errorMessage = AuthService.getAuthErrorMessage(new Error('Test error'));
        if (!errorMessage || typeof errorMessage !== 'string') {
          throw new Error('Invalid error message generated');
        }
        return { errorMessage };
      })
    );

    results.push(
      await this.runTest('Email verification status check', async () => {
        // Test with null user
        const isVerified = AuthService.isEmailVerified(null);
        if (isVerified) {
          throw new Error('Null user should not be verified');
        }
        return { isVerified };
      })
    );

    results.push(
      await this.runTest('Security monitoring logging', async () => {
        // Test that monitoring functions don't throw errors
        authMonitoring.logAuthEvent('test_event', { test: true });
        authMonitoring.logSecurityEvent('test_security_event', 'low', { test: true });
        return { logged: true };
      })
    );

    return this.createTestSuite('Security Features', results);
  }

  /**
   * Run individual test with timing and error handling
   */
  private static async runTest(
    testName: string,
    testFunction: () => Promise<any>
  ): Promise<TestResult> {
    const startTime = Date.now();

    try {
      console.log(`  ⏳ Running: ${testName}`);
      const metadata = await testFunction();
      const duration = Date.now() - startTime;

      console.log(`  ✅ Passed: ${testName} (${duration}ms)`);
      return {
        testName,
        passed: true,
        duration,
        metadata,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      console.log(`  ❌ Failed: ${testName} - ${errorMessage} (${duration}ms)`);
      return {
        testName,
        passed: false,
        error: errorMessage,
        duration,
      };
    }
  }

  /**
   * Create test suite summary
   */
  private static createTestSuite(suiteName: string, results: TestResult[]): TestSuite {
    const totalPassed = results.filter((r) => r.passed).length;
    const totalFailed = results.filter((r) => !r.passed).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    return {
      suiteName,
      results,
      totalPassed,
      totalFailed,
      totalDuration,
    };
  }

  /**
   * Generate comprehensive test summary
   */
  private static generateTestSummary(suites: TestSuite[]): void {
    console.log('\n📊 Test Summary:');
    console.log('='.repeat(50));

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalDuration = 0;

    for (const suite of suites) {
      totalTests += suite.results.length;
      totalPassed += suite.totalPassed;
      totalFailed += suite.totalFailed;
      totalDuration += suite.totalDuration;

      const successRate =
        suite.results.length > 0
          ? ((suite.totalPassed / suite.results.length) * 100).toFixed(1)
          : '0.0';

      console.log(`\n🧪 ${suite.suiteName}:`);
      console.log(`   Tests: ${suite.results.length}`);
      console.log(`   Passed: ${suite.totalPassed}`);
      console.log(`   Failed: ${suite.totalFailed}`);
      console.log(`   Success Rate: ${successRate}%`);
      console.log(`   Duration: ${suite.totalDuration}ms`);

      // Show failed tests
      const failedTests = suite.results.filter((r) => !r.passed);
      if (failedTests.length > 0) {
        console.log(`   Failed Tests:`);
        for (const test of failedTests) {
          console.log(`     - ${test.testName}: ${test.error}`);
        }
      }
    }

    const overallSuccessRate =
      totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';

    console.log('\n🎯 Overall Results:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Total Passed: ${totalPassed}`);
    console.log(`   Total Failed: ${totalFailed}`);
    console.log(`   Success Rate: ${overallSuccessRate}%`);
    console.log(`   Total Duration: ${totalDuration}ms`);

    if (totalFailed === 0) {
      console.log('\n🎉 All tests passed! Your auth system is ready for production.');
    } else {
      console.log(`\n⚠️  ${totalFailed} test(s) failed. Please review and fix before production.`);
    }

    console.log('='.repeat(50));
  }

  /**
   * Show test results in Alert (for development)
   */
  static showTestResultsAlert(suites: TestSuite[]): void {
    const totalTests = suites.reduce((sum, suite) => sum + suite.results.length, 0);
    const totalPassed = suites.reduce((sum, suite) => sum + suite.totalPassed, 0);
    const totalFailed = suites.reduce((sum, suite) => sum + suite.totalFailed, 0);
    const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';

    const title = totalFailed === 0 ? '✅ All Tests Passed!' : `⚠️ ${totalFailed} Tests Failed`;
    const message = `
Total Tests: ${totalTests}
Passed: ${totalPassed}
Failed: ${totalFailed}
Success Rate: ${successRate}%

Check console for detailed results.
    `.trim();

    Alert.alert(title, message);
  }
}
