import { PageOptionsDto } from './page-options.dto';

export class PageMetaDto {
  readonly page: number;
  readonly limit: number;
  readonly itemCount: number;
  readonly pageCount: number;
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;
  readonly nextCursor?: string;

  constructor({
    pageOptionsDto,
    itemCount,
    nextCursor,
  }: {
    pageOptionsDto: PageOptionsDto;
    itemCount: number;
    nextCursor?: string;
  }) {
    this.page = pageOptionsDto.page;
    this.limit = pageOptionsDto.limit;
    this.itemCount = itemCount;
    this.pageCount = Math.ceil(this.itemCount / this.limit);
    this.hasPreviousPage = this.page > 1;
    this.hasNextPage = this.page < this.pageCount;
    this.nextCursor = nextCursor;
  }
}
