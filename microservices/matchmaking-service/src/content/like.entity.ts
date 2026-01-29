import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Content } from './contents.entity';
import { User } from '../users/entities/user.entity';

@Entity('likes')
export class Like {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Content, (content) => content.likes)
    content: Content;

    @ManyToOne(() => User)
    user: User;
}
