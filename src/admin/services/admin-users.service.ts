import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Role } from '../../auth/entities/role.entity';
import { UserRole } from '../../auth/constants';

@Injectable()
export class AdminUsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Role)
        private rolesRepository: Repository<Role>,
    ) { }

    async findAll() {
        return await this.usersRepository.find({
            relations: ['role'],
            order: { createdAt: 'DESC' },
        });
    }

    async updateRole(userId: string, roleName: UserRole) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const role = await this.rolesRepository.findOne({ where: { name: roleName } });
        if (!role) {
            throw new NotFoundException(`Role ${roleName} not found`);
        }

        user.role = role;
        return await this.usersRepository.save(user);
    }

    async updateStatus(userId: string, isVerified: boolean) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        user.isVerified = isVerified;
        return await this.usersRepository.save(user);
    }
}
