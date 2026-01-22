import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ListsService } from './lists.service';
import { CreateListDto, UpdateListDto, AddItemDto, ShareListDto } from './dto';

// Note: In a real implementation, you would have auth guards here
// This is a simplified version for demonstration

@Controller('lists')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post()
  create(@Body() createListDto: CreateListDto) {
    // In real implementation, get userId from JWT token
    const userId = ''; // TODO: Get from auth
    return this.listsService.create(userId, createListDto);
  }

  @Get()
  findAll() {
    // In real implementation, get userId from JWT token
    const userId = ''; // TODO: Get from auth
    return this.listsService.findAll(userId);
  }

  @Get('shared')
  findShared() {
    // In real implementation, get userId from JWT token
    const userId = ''; // TODO: Get from auth
    return this.listsService.findSharedWithUser(userId);
  }

  @Get('public')
  findPublic() {
    return this.listsService.findPublicLists();
  }

  @Get('search')
  search(@Query('q') query: string) {
    // In real implementation, get userId from JWT token
    const userId = ''; // TODO: Get from auth
    return this.listsService.search(userId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateListDto: UpdateListDto) {
    // In real implementation, get userId from JWT token
    const userId = ''; // TODO: Get from auth
    return this.listsService.update(id, userId, updateListDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // In real implementation, get userId from JWT token
    const userId = ''; // TODO: Get from auth
    return this.listsService.remove(id, userId);
  }

  @Post(':id/items')
  addItem(@Param('id') id: string, @Body() addItemDto: AddItemDto) {
    // In real implementation, get userId from JWT token
    const userId = ''; // TODO: Get from auth
    return this.listsService.addItem(id, userId, addItemDto);
  }

  @Delete(':id/items/:itemId')
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    // In real implementation, get userId from JWT token
    const userId = ''; // TODO: Get from auth
    return this.listsService.removeItem(id, itemId, userId);
  }

  @Put(':id/share')
  shareList(@Param('id') id: string, @Body() shareListDto: ShareListDto) {
    // In real implementation, get userId from JWT token
    const userId = ''; // TODO: Get from auth
    return this.listsService.shareList(id, userId, shareListDto);
  }

  @Delete(':id/share/:sharedWithUserId')
  unshareList(
    @Param('id') id: string,
    @Param('sharedWithUserId') sharedWithUserId: string,
  ) {
    // In real implementation, get userId from JWT token
    const userId = ''; // TODO: Get from auth
    return this.listsService.unshareList(id, userId, sharedWithUserId);
  }
}
