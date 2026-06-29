import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TestService } from './test.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { TestCategory, TestDifficulty } from './entities/test.entity';

@ApiTags('tests')
@Controller('tests')
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new test' })
  @ApiResponse({ status: 201, description: 'Test created successfully' })
  create(@Body() createTestDto: CreateTestDto) {
    return this.testService.create(createTestDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tests' })
  @ApiResponse({ status: 200, description: 'Tests retrieved successfully' })
  findAll() {
    return this.testService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get test by ID' })
  @ApiResponse({ status: 200, description: 'Test retrieved successfully' })
  findOne(@Param('id') id: string) {
    return this.testService.findOne(id);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get tests by category' })
  @ApiResponse({ status: 200, description: 'Tests retrieved successfully' })
  findByCategory(@Param('category') category: TestCategory) {
    return this.testService.findByCategory(category);
  }

  @Get('difficulty/:difficulty')
  @ApiOperation({ summary: 'Get tests by difficulty' })
  @ApiResponse({ status: 200, description: 'Tests retrieved successfully' })
  findByDifficulty(@Param('difficulty') difficulty: TestDifficulty) {
    return this.testService.findByDifficulty(difficulty);
  }

  @Get('adaptive/:category')
  @ApiOperation({ summary: 'Get adaptive test based on current difficulty' })
  @ApiResponse({ status: 200, description: 'Adaptive test retrieved successfully' })
  getAdaptiveTest(
    @Param('category') category: TestCategory,
    @Query('difficulty') difficulty: string,
  ) {
    return this.testService.getAdaptiveTest(category, parseInt(difficulty, 10));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a test' })
  @ApiResponse({ status: 200, description: 'Test updated successfully' })
  update(@Param('id') id: string, @Body() updateTestDto: UpdateTestDto) {
    return this.testService.update(id, updateTestDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a test' })
  @ApiResponse({ status: 200, description: 'Test deleted successfully' })
  remove(@Param('id') id: string) {
    return this.testService.remove(id);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a test' })
  @ApiResponse({ status: 200, description: 'Test deactivated successfully' })
  deactivate(@Param('id') id: string) {
    return this.testService.deactivate(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a test' })
  @ApiResponse({ status: 200, description: 'Test activated successfully' })
  activate(@Param('id') id: string) {
    return this.testService.activate(id);
  }
}
