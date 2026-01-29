import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
} from 'typeorm';
// import { Profile } from '../profile/profile.entity';
// import { Progress } from '../progress/progress.entity';

@Entity()
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  //to be uncommented when Profile entity is created
//   @OneToOne(() => Profile, profile => profile.player)
//   profile: Profile;  

//   @OneToMany(() => Progress, progress => progress.player)
//   progress: Progress[];
}
