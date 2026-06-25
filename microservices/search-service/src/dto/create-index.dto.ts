export class CreateIndexDto {
  type: 'puzzle' | 'player';
  data: Record<string, any>;
}
