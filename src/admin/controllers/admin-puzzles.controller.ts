import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    ParseUUIDPipe,
    HttpStatus,
    HttpCode,
    Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/constants';
import { PuzzlesService } from '../../puzzles/puzzles.service';
import { CreatePuzzleDto, UpdatePuzzleDto, SearchPuzzleDto } from '../../puzzles/dto';
import { AdminAuditLogService } from '../services/admin-audit-log.service';
import { ActiveUser } from '../../auth/decorators/active-user.decorator';

@Controller('admin/puzzles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminPuzzlesController {
    constructor(
        private readonly puzzlesService: PuzzlesService,
        private readonly auditLogService: AdminAuditLogService,
    ) { }

    @Get()
    async findAll(@Body() searchDto: SearchPuzzleDto) {
        return await this.puzzlesService.findAll(searchDto);
    }

    @Post()
    async create(@Body() createPuzzleDto: CreatePuzzleDto, @ActiveUser() user: any) {
        const puzzle = await this.puzzlesService.create(createPuzzleDto, user.id);
        await this.auditLogService.log({
            adminId: user.id,
            action: 'CREATE_PUZZLE',
            targetType: 'PUZZLE',
            targetId: puzzle.id,
            details: { title: puzzle.title },
        });
        return puzzle;
    }

    @Patch(':id')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updatePuzzleDto: UpdatePuzzleDto,
        @ActiveUser() user: any,
    ) {
        const puzzle = await this.puzzlesService.update(id, updatePuzzleDto, user.id);
        await this.auditLogService.log({
            adminId: user.id,
            action: 'UPDATE_PUZZLE',
            targetType: 'PUZZLE',
            targetId: id,
            details: updatePuzzleDto,
        });
        return puzzle;
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseUUIDPipe) id: string, @ActiveUser() user: any) {
        await this.puzzlesService.remove(id, user.id);
        await this.auditLogService.log({
            adminId: user.id,
            action: 'DELETE_PUZZLE',
            targetType: 'PUZZLE',
            targetId: id,
        });
    }
}
