import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomList } from './custom-list.entity';
import { ListItem } from './list-item.entity';
import { ListShare, SharePermission } from './list-share.entity';
import { CreateListDto, UpdateListDto, AddItemDto, ShareListDto } from './dto';

@Injectable()
export class ListsService {
  constructor(
    @InjectRepository(CustomList)
    private listRepository: Repository<CustomList>,
    @InjectRepository(ListItem)
    private itemRepository: Repository<ListItem>,
    @InjectRepository(ListShare)
    private shareRepository: Repository<ListShare>,
  ) {}

  async create(userId: string, dto: CreateListDto): Promise<CustomList> {
    const { name, description, isPublic, puzzleIds } = dto;

    const list = this.listRepository.create({
      userId,
      name,
      description,
      isPublic: isPublic || false,
    });

    const savedList = await this.listRepository.save(list);

    if (puzzleIds && puzzleIds.length > 0) {
      await this.addItems(
        savedList.id,
        puzzleIds.map((puzzleId, index) => ({
          puzzleId,
          order: index + 1,
        })),
      );
    }

    return this.findOne(savedList.id);
  }

  async findAll(userId: string): Promise<CustomList[]> {
    return this.listRepository.find({
      where: { userId, isActive: true },
      relations: ['items', 'shares'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<CustomList> {
    const list = await this.listRepository.findOne({
      where: { id, isActive: true },
      relations: ['items', 'shares'],
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    return list;
  }

  async findSharedWithUser(userId: string): Promise<CustomList[]> {
    const shares = await this.shareRepository.find({
      where: { sharedWithUserId: userId, isActive: true },
      relations: ['list'],
    });

    return shares.map((share) => share.list).filter((list) => list.isActive);
  }

  async findPublicLists(): Promise<CustomList[]> {
    return this.listRepository.find({
      where: { isPublic: true, isActive: true },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateListDto,
  ): Promise<CustomList> {
    const list = await this.findOne(id);

    if (list.userId !== userId) {
      throw new ForbiddenException('You can only update your own lists');
    }

    Object.assign(list, dto);
    await this.listRepository.save(list);

    return this.findOne(id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const list = await this.findOne(id);

    if (list.userId !== userId) {
      throw new ForbiddenException('You can only delete your own lists');
    }

    list.isActive = false;
    await this.listRepository.save(list);
  }

  async addItem(
    listId: string,
    userId: string,
    dto: AddItemDto,
  ): Promise<ListItem> {
    const list = await this.findOne(listId);

    if (list.userId !== userId) {
      throw new ForbiddenException('You can only modify your own lists');
    }

    const existing = await this.itemRepository.findOne({
      where: { listId, puzzleId: dto.puzzleId },
    });

    if (existing) {
      throw new Error('Puzzle already in list');
    }

    const maxOrder = await this.itemRepository
      .createQueryBuilder('item')
      .where('item.listId = :listId', { listId })
      .select('MAX(item.order)', 'max')
      .getRawOne();

    const order = dto.order || (maxOrder?.max || 0) + 1;

    const item = this.itemRepository.create({
      listId,
      puzzleId: dto.puzzleId,
      order,
      notes: dto.notes,
    });

    return this.itemRepository.save(item);
  }

  async addItems(
    listId: string,
    items: { puzzleId: string; order?: number; notes?: string }[],
  ): Promise<ListItem[]> {
    const savedItems: ListItem[] = [];

    for (const item of items) {
      const saved = await this.addItem(listId, '', item as AddItemDto);
      savedItems.push(saved);
    }

    return savedItems;
  }

  async removeItem(
    listId: string,
    itemId: string,
    userId: string,
  ): Promise<void> {
    const list = await this.findOne(listId);

    if (list.userId !== userId) {
      throw new ForbiddenException('You can only modify your own lists');
    }

    const item = await this.itemRepository.findOne({
      where: { id: itemId, listId },
    });

    if (!item) {
      throw new NotFoundException('Item not found in list');
    }

    await this.itemRepository.remove(item);
  }

  async reorderItems(
    listId: string,
    userId: string,
    itemOrders: { itemId: string; order: number }[],
  ): Promise<void> {
    const list = await this.findOne(listId);

    if (list.userId !== userId) {
      throw new ForbiddenException('You can only modify your own lists');
    }

    for (const { itemId, order } of itemOrders) {
      await this.itemRepository.update(itemId, { order });
    }
  }

  async shareList(
    listId: string,
    userId: string,
    dto: ShareListDto,
  ): Promise<ListShare> {
    const list = await this.findOne(listId);

    if (list.userId !== userId) {
      throw new ForbiddenException('You can only share your own lists');
    }

    const existing = await this.shareRepository.findOne({
      where: { listId, sharedWithUserId: dto.sharedWithUserId },
    });

    if (existing) {
      existing.permission = dto.permission;
      existing.isActive = true;
      return this.shareRepository.save(existing);
    }

    const share = this.shareRepository.create({
      listId,
      sharedWithUserId: dto.sharedWithUserId,
      permission: dto.permission,
    });

    return this.shareRepository.save(share);
  }

  async unshareList(
    listId: string,
    userId: string,
    sharedWithUserId: string,
  ): Promise<void> {
    const list = await this.findOne(listId);

    if (list.userId !== userId) {
      throw new ForbiddenException('You can only unshare your own lists');
    }

    const share = await this.shareRepository.findOne({
      where: { listId, sharedWithUserId },
    });

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    share.isActive = false;
    await this.shareRepository.save(share);
  }

  async canAccessList(listId: string, userId: string): Promise<boolean> {
    const list = await this.listRepository.findOne({
      where: { id: listId, isActive: true },
    });

    if (!list) return false;

    if (list.userId === userId) return true;
    if (list.isPublic) return true;

    const share = await this.shareRepository.findOne({
      where: { listId, sharedWithUserId: userId, isActive: true },
    });

    return !!share;
  }

  async getListPermissions(
    listId: string,
    userId: string,
  ): Promise<SharePermission | null> {
    const list = await this.listRepository.findOne({
      where: { id: listId, isActive: true },
    });

    if (!list) return null;

    if (list.userId === userId) return SharePermission.EDIT;
    if (list.isPublic) return SharePermission.VIEW;

    const share = await this.shareRepository.findOne({
      where: { listId, sharedWithUserId: userId, isActive: true },
    });

    return share ? share.permission : null;
  }

  async search(userId: string, query: string): Promise<CustomList[]> {
    const lists = await this.listRepository
      .createQueryBuilder('list')
      .leftJoinAndSelect('list.items', 'item')
      .where('list.userId = :userId', { userId })
      .andWhere('list.isActive = true')
      .andWhere('(list.name ILIKE :query OR list.description ILIKE :query)', {
        query: `%${query}%`,
      })
      .orderBy('list.createdAt', 'DESC')
      .getMany();

    return lists;
  }
}
