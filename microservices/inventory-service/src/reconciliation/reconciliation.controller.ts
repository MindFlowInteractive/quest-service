import { Controller, Post, Get, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

class ReconcileDto {
  inventoryId: string;
  physicalQuantity: number;
  reason?: string;
}

@ApiTags('reconciliation')
@Controller('reconciliation')
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Post()
  @ApiOperation({ summary: 'Reconcile stock with physical count' })
  @ApiBody({ type: ReconcileDto })
  async reconcile(@Body() reconcileDto: ReconcileDto) {
    return this.reconciliationService.reconcileStock(
      reconcileDto.inventoryId,
      reconcileDto.physicalQuantity,
      reconcileDto.reason,
    );
  }

  @Get('report')
  @ApiOperation({ summary: 'Get stock reconciliation report' })
  async getReport() {
    return this.reconciliationService.getReconciliationReport();
  }

  @Get('validate/:inventoryId')
  @ApiOperation({ summary: 'Validate stock consistency for an inventory item' })
  async validate(@Param('inventoryId', ParseUUIDPipe) inventoryId: string) {
    const isValid = await this.reconciliationService.validateStockConsistency(inventoryId);
    return { inventoryId, valid: isValid };
  }
}