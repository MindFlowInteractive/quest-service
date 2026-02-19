/**
 * Performance Testing Script for Recommendation System
 * 
 * Tests the performance of recommendation generation under various loads
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { RecommendationEngineService } from '../services/recommendation-engine.service';

interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
}

async function runPerformanceTests() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const recommendationEngine = app.get(RecommendationEngineService);

  console.log('🚀 Starting Performance Tests for Recommendation System...\n');

  // Test 1: Single user recommendation performance
  console.log('📊 Test 1: Single User Recommendation Performance');
  const singleUserMetrics = await testSingleUserPerformance(recommendationEngine);
  console.log('Results:', singleUserMetrics);

  // Test 2: Concurrent user recommendations
  console.log('\n📊 Test 2: Concurrent User Recommendations (10 users)');
  const concurrentMetrics = await testConcurrentRecommendations(recommendationEngine, 10);
  console.log('Results:', concurrentMetrics);

  // Test 3: High load test
  console.log('\n📊 Test 3: High Load Test (50 concurrent users)');
  const highLoadMetrics = await testConcurrentRecommendations(recommendationEngine, 50);
  console.log('Results:', highLoadMetrics);

  // Test 4: Algorithm comparison performance
  console.log('\n📊 Test 4: Algorithm Performance Comparison');
  await testAlgorithmPerformance(recommendationEngine);

  console.log('\n🎉 Performance testing completed!');
  await app.close();
}

async function testSingleUserPerformance(
  service: RecommendationEngineService,
  iterations: number = 100
): Promise<PerformanceMetrics> {
  const responseTimes: number[] = [];
  let successCount = 0;
  let failCount = 0;

  const startTime = Date.now();

  for (let i = 0; i < iterations; i++) {
    const requestStart = Date.now();
    
    try {
      await service.generateRecommendations(`test-user-${i}`, 10);
      const responseTime = Date.now() - requestStart;
      responseTimes.push(responseTime);
      successCount++;
    } catch (error) {
      failCount++;
      console.log(`Request ${i} failed:`, error.message);
    }
  }

  const totalTime = Date.now() - startTime;
  const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

  return {
    totalRequests: iterations,
    successfulRequests: successCount,
    failedRequests: failCount,
    averageResponseTime: Math.round(averageResponseTime),
    minResponseTime: Math.min(...responseTimes),
    maxResponseTime: Math.max(...responseTimes),
    requestsPerSecond: Math.round((successCount / totalTime) * 1000),
  };
}

async function testConcurrentRecommendations(
  service: RecommendationEngineService,
  concurrentUsers: number
): Promise<PerformanceMetrics> {
  const promises: Promise<number>[] = [];
  const startTime = Date.now();

  // Create concurrent requests
  for (let i = 0; i < concurrentUsers; i++) {
    const promise = measureRecommendationTime(service, `concurrent-user-${i}`);
    promises.push(promise);
  }

  // Wait for all requests to complete
  const results = await Promise.allSettled(promises);
  const totalTime = Date.now() - startTime;

  const successfulResults = results
    .filter(result => result.status === 'fulfilled')
    .map(result => (result as PromiseFulfilledResult<number>).value);

  const failedCount = results.filter(result => result.status === 'rejected').length;

  if (successfulResults.length === 0) {
    return {
      totalRequests: concurrentUsers,
      successfulRequests: 0,
      failedRequests: failedCount,
      averageResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      requestsPerSecond: 0,
    };
  }

  const averageResponseTime = successfulResults.reduce((a, b) => a + b, 0) / successfulResults.length;

  return {
    totalRequests: concurrentUsers,
    successfulRequests: successfulResults.length,
    failedRequests: failedCount,
    averageResponseTime: Math.round(averageResponseTime),
    minResponseTime: Math.min(...successfulResults),
    maxResponseTime: Math.max(...successfulResults),
    requestsPerSecond: Math.round((successfulResults.length / totalTime) * 1000),
  };
}

async function measureRecommendationTime(
  service: RecommendationEngineService,
  userId: string
): Promise<number> {
  const startTime = Date.now();
  await service.generateRecommendations(userId, 10);
  return Date.now() - startTime;
}

async function testAlgorithmPerformance(service: RecommendationEngineService) {
  const algorithms = ['collaborative', 'content-based', 'hybrid', 'popular'] as const;
  const userId = 'performance-test-user';

  console.log('Algorithm Performance Comparison:');
  
  for (const algorithm of algorithms) {
    const times: number[] = [];
    
    // Test each algorithm 10 times
    for (let i = 0; i < 10; i++) {
      const startTime = Date.now();
      
      try {
        await service.generateRecommendations(userId, 10, undefined, undefined, algorithm);
        times.push(Date.now() - startTime);
      } catch (error) {
        console.log(`${algorithm} algorithm failed:`, error.message);
      }
    }
    
    if (times.length > 0) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`  ${algorithm}: ${Math.round(avgTime)}ms average (${times.length}/10 successful)`);
    } else {
      console.log(`  ${algorithm}: All requests failed`);
    }
  }
}

// Memory usage monitoring
function logMemoryUsage(label: string) {
  const usage = process.memoryUsage();
  console.log(`${label} Memory Usage:`);
  console.log(`  RSS: ${Math.round(usage.rss / 1024 / 1024)}MB`);
  console.log(`  Heap Used: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);
  console.log(`  Heap Total: ${Math.round(usage.heapTotal / 1024 / 1024)}MB`);
}

// Run performance tests
if ((require as any).main === module) {
  logMemoryUsage('Before Tests');
  runPerformanceTests()
    .then(() => {
      logMemoryUsage('After Tests');
    })
    .catch(console.error);
}

export { runPerformanceTests, testSingleUserPerformance, testConcurrentRecommendations };