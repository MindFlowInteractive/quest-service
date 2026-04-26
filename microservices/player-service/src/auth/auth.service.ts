import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Player } from '../player/entities/player.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepo: Repository<Player>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ access_token: string }> {
    const { email, username, password } = registerDto;

    // Check if email or username already exists
    const existingPlayer = await this.playerRepo.findOne({
      where: [{ email }, { username }],
    });

    if (existingPlayer) {
      throw new ConflictException('Email or username already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create player
    const player = this.playerRepo.create({
      email,
      username,
      password: hashedPassword,
    });

    await this.playerRepo.save(player);

    // Generate JWT
    const payload = { sub: player.id, email: player.email, username: player.username };
    const access_token = this.jwtService.sign(payload);

    return { access_token };
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const { email, password } = loginDto;

    // Find player
    const player = await this.playerRepo.findOne({ where: { email } });
    if (!player) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, player.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    player.lastLoginAt = new Date();
    await this.playerRepo.save(player);

    // Generate JWT
    const payload = { sub: player.id, email: player.email, username: player.username };
    const access_token = this.jwtService.sign(payload);

    return { access_token };
  }

  async validatePlayer(payload: any): Promise<Player> {
    const player = await this.playerRepo.findOne({
      where: { id: payload.sub, isActive: true },
    });

    if (!player) {
      throw new UnauthorizedException('Player not found');
    }

    return player;
  }
}