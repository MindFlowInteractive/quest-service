import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ABTestingService } from '../services/ab-testing.service';

@ApiTags('ab-testing')
@Controller('ab-testing')
export class ABTestingController {
  constructor(private abTestingService: ABTestingService) {}

  @Get('assign/:userId')
  @ApiOperation({ summary: 'Assign user to A/B test group' })
  @ApiResponse({ status: 200, description: 'User assigned to test group' })
  @ApiQuery({ name: 'interactionCount', required: false, type: Number })
  async assignUserToTest(
    @Param('userId') userId: string,
    @Query('interactionCount') interactionCount?: number,
  ): Promise<{ testGroup: string | null }> {
    try {
      const testGroup = this.abTestingService.assignUserToTest(
        userId,
        interactionCount || 0,
      );
      return { testGroup };
    } catch (error) {
      throw new HttpException(
        'Failed to assign user to test',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('active-tests')
  @ApiOperation({ summary: 'Get list of active A/B tests' })
  @ApiResponse({ status: 200, description: 'List of active tests' })
  async getActiveTests(): Promise<{ tests: string[] }> {
    try {
      const tests = await this.abTestingService.getActiveTests();
      return { tests };
    } catch (error) {
      throw new HttpException(
        'Failed to get active tests',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('results/:testName')
  @ApiOperation({ summary: 'Get A/B test results' })
  @ApiResponse({ status: 200, description: 'Test results' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getTestResults(
    @Param('testName') testName: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<any> {
    try {
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;

      const results = await this.abTestingService.getTestResults(
        testName,
        start,
        end,
      );

      return { testName, results };
    } catch (error) {
      throw new HttpException(
        'Failed to get test results',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('significance/:testName')
  @ApiOperation({ summary: 'Calculate statistical significance for A/B test' })
  @ApiResponse({ status: 200, description: 'Statistical significance results' })
  @ApiQuery({ 
    name: 'metric', 
    required: false, 
    enum: ['clickThroughRate', 'completionRate'],
    description: 'Metric to test for significance'
  })
  async calculateSignificance(
    @Param('testName') testName: string,
    @Query('metric') metric?: 'clickThroughRate' | 'completionRate',
  ): Promise<any> {
    try {
      const significance = await this.abTestingService.calculateStatisticalSignificance(
        testName,
        metric || 'clickThroughRate',
      );

      return significance;
    } catch (error) {
      throw new HttpException(
        'Failed to calculate statistical significance',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('stop/:testName')
  @ApiOperation({ summary: 'Stop an active A/B test' })
  @ApiResponse({ status: 200, description: 'Test stopped successfully' })
  async stopTest(@Param('testName') testName: string): Promise<{ success: boolean }> {
    try {
      this.abTestingService.stopTest(testName);
      return { success: true };
    } catch (error) {
      throw new HttpException(
        'Failed to stop test',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}