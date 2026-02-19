/**
 * Manual Testing Script for Recommendation System
 * 
 * This script demonstrates how to manually test the recommendation system
 * Run this after setting up test data in your database
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { RecommendationEngineService } from '../services/recommendation-engine.service';
import { PreferenceTrackingService } from '../services/preference-tracking.service';
import { ABTestingService } from '../services/ab-testing.service';

async function runManualTests() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const recommendationEngine = app.get(RecommendationEngineService);
  const preferenceTracking = app.get(PreferenceTrackingService);
  const abTesting = app.get(ABTestingService);

  console.log('🚀 Starting Manual Recommendation System Tests...\n');

  // Test 1: Generate recommendations for a new user
  console.log('📋 Test 1: New User Recommendations');
  try {
    const newUserRecommendations = await recommendationEngine.generateRecommendations(
      'new-user-test-123',
      5
    );
    console.log(`✅ Generated ${newUserRecommendations.length} recommendations for new user`);
    console.log('Sample recommendation:', newUserRecommendations[0]);
  } catch (error) {
    console.log('❌ Error generating new user recommendations:', error.message);
  }

  // Test 2: Test A/B group assignment
  console.log('\n📋 Test 2: A/B Test Assignment');
  try {
    const testGroup = abTesting.assignUserToTest('test-user-456', 0);
    console.log(`✅ User assigned to A/B test group: ${testGroup || 'No test group'}`);
  } catch (error) {
    console.log('❌ Error in A/B test assignment:', error.message);
  }

  // Test 3: Track user interactions
  console.log('\n📋 Test 3: Track User Interactions');
  try {
    await recommendationEngine.trackInteraction(
      'test-user-789',
      'puzzle-123',
      'view'
    );
    
    await recommendationEngine.trackInteraction(
      'test-user-789',
      'puzzle-123',
      'click'
    );
    
    await recommendationEngine.trackInteraction(
      'test-user-789',
      'puzzle-123',
      'complete',
      4.5,
      { completionTime: 120, hintsUsed: 1 }
    );
    
    console.log('✅ Successfully tracked user interactions');
  } catch (error) {
    console.log('❌ Error tracking interactions:', error.message);
  }

  // Test 4: Record puzzle completion for preference learning
  console.log('\n📋 Test 4: Preference Learning');
  try {
    await preferenceTracking.onPuzzleCompleted(
      'test-user-789',
      'puzzle-123',
      120, // completion time
      1,   // hints used
      2,   // attempts
      850  // score
    );
    
    console.log('✅ Successfully recorded puzzle completion for preference learning');
  } catch (error) {
    console.log('❌ Error in preference learning:', error.message);
  }

  // Test 5: Get user preference insights
  console.log('\n📋 Test 5: User Preference Insights');
  try {
    const insights = await preferenceTracking.getPreferenceInsights('test-user-789');
    console.log('✅ User preference insights:', insights);
  } catch (error) {
    console.log('❌ Error getting preference insights:', error.message);
  }

  // Test 6: Generate recommendations with filters
  console.log('\n📋 Test 6: Filtered Recommendations');
  try {
    const filteredRecommendations = await recommendationEngine.generateRecommendations(
      'test-user-789',
      3,
      'logic', // category filter
      'medium' // difficulty filter
    );
    console.log(`✅ Generated ${filteredRecommendations.length} filtered recommendations`);
  } catch (error) {
    console.log('❌ Error generating filtered recommendations:', error.message);
  }

  // Test 7: Get recommendation metrics
  console.log('\n📋 Test 7: Recommendation Metrics');
  try {
    const metrics = await recommendationEngine.getRecommendationMetrics();
    console.log('✅ Recommendation metrics:', metrics);
  } catch (error) {
    console.log('❌ Error getting metrics:', error.message);
  }

  // Test 8: A/B test results
  console.log('\n📋 Test 8: A/B Test Results');
  try {
    const activeTests = await abTesting.getActiveTests();
    console.log('✅ Active A/B tests:', activeTests);
    
    if (activeTests.length > 0) {
      const testResults = await abTesting.getTestResults(activeTests[0]);
      console.log('✅ Test results for', activeTests[0], ':', testResults);
    }
  } catch (error) {
    console.log('❌ Error getting A/B test results:', error.message);
  }

  console.log('\n🎉 Manual testing completed!');
  await app.close();
}

// Utility function to create test data
async function createTestData() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  console.log('🔧 Creating test data...');
  
  // This would create sample users, puzzles, and interactions
  // You would implement this based on your specific data models
  
  console.log('✅ Test data created!');
  await app.close();
}

// Run the tests
if ((require as any).main === module) {
  runManualTests().catch(console.error);
}

export { runManualTests, createTestData };