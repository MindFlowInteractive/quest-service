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

@Controller('lists')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post()
  create(@Body() createListDto: CreateListDto) {
    const userId = '';
    return this.listsService.create(userId, createListDto);
  }

  @Get()
  findAll() {
    const userId = '';
    return this.listsService.findAll(userId);
  }

  @Get('shared')
  findShared() {
    const userId = '';
    return this.listsService.findSharedWithUser(userId);
  }

  @Get('public')
  findPublic() {
    return this.listsService.findPublicLists();
  }

  @Get('search')
  search(@Query('q') query: string) {
    const userId = '';
    return this.listsService.search(userId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateListDto: UpdateListDto) {
    const userId = '';
    return this.listsService.update(id, userId, updateListDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const userId = '';
    return this.listsService.remove(id, userId);
  }

  @Post(':id/items')
  addItem(@Param('id') id: string, @Body() addItemDto: AddItemDto) {
    const userId = '';
    return this.listsService.addItem(id, userId, addItemDto);
  }

  @Delete(':id/items/:itemId')
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    const userId = '';
    return this.listsService.removeItem(id, itemId, userId);
  }

  @Put(':id/share')
  shareList(@Param('id') id: string, @Body() shareListDto: ShareListDto) {
    const userId = '';
    return this.listsService.shareList(id, userId, shareListDto);
  }

  @Delete(':id/share/:sharedWithUserId')
  unshareList(
    @Param('id') id: string,
    @Param('sharedWithUserId') sharedWithUserId: string,
  ) {
    const userId = '';
    return this.listsService.unshareList(id, userId, sharedWithUserId);
  }
}
