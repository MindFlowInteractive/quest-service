import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import {
  Tutorial,
  TutorialStep,
  UserTutorialProgress,
  ContextualHelp,
  ContextualHelpInteraction,
  TutorialAnalyticsEvent,
} from './entities';

// Services
import {
  TutorialService,
  TutorialProgressService,
  ContextualHelpService,
  TutorialAnalyticsService,
  LocalizationService,
} from './services';

// Controllers
import {
  TutorialController,
  TutorialProgressController,
  ContextualHelpController,
  TutorialAnalyticsController,
} from './controllers';

// External modules
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tutorial,
      TutorialStep,
      UserTutorialProgress,
      ContextualHelp,
      ContextualHelpInteraction,
      TutorialAnalyticsEvent,
    ]),
    forwardRef(() => UsersModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [
    TutorialController,
    TutorialProgressController,
    ContextualHelpController,
    TutorialAnalyticsController,
  ],
  providers: [
    TutorialService,
    TutorialProgressService,
    ContextualHelpService,
    TutorialAnalyticsService,
    LocalizationService,
  ],
  exports: [
    TutorialService,
    TutorialProgressService,
    ContextualHelpService,
    TutorialAnalyticsService,
    LocalizationService,
  ],
})
export class TutorialModule {}
