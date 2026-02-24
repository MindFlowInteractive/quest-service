# Player Profile System

A comprehensive player profile system with extensive customization options including avatars, banners, badges, and detailed privacy controls.

## Features

### Core Profile Features
- **User Profiles**: Complete player profiles with bio, title, location, and website
- **Avatar Management**: Upload and manage profile avatars with validation
- **Banner Themes**: Customizable banner themes with unlockable options
- **Badge System**: Display earned badges with flexible configuration
- **Social Links**: Integration with social media platforms
- **Custom Fields**: Extensible custom profile fields
- **Privacy Controls**: Granular privacy settings for all profile elements
- **Statistics Display**: Comprehensive game statistics and achievements

### Privacy & Security
- **Granular Privacy**: Control visibility of bio, badges, stats, social links, location, and website
- **Profile Visibility**: Public/private profile settings
- **File Upload Security**: Validated file uploads with size and type restrictions
- **Access Control**: Proper authentication and authorization

### Customization Options
- **Banner Themes**: 10 built-in themes (cosmic, forest, ocean, sunset, neon, minimal, dark, light, gradient, custom)
- **Badge Display**: Configurable badge layouts (grid, list, compact)
- **Display Preferences**: Customizable profile layouts and achievement progress display
- **Unlockable Content**: Themes and badges that unlock based on achievements

## API Endpoints

### Profile Management
```
GET    /profile/:userId              - Get user profile
PUT    /profile                      - Update own profile
POST   /profile/avatar               - Upload avatar
POST   /profile/banner               - Upload banner
PUT    /profile/badges               - Update displayed badges
PUT    /profile/statistics           - Update profile statistics
GET    /profile/statistics/:userId   - Get profile statistics
GET    /profile/search               - Search public profiles
GET    /profile/public               - Get public profiles list
```

### Customization
```
GET    /profile/customization/badges                    - Get all badges
GET    /profile/customization/badges/category/:category - Get badges by category
GET    /profile/customization/badges/rarity/:rarity     - Get badges by rarity
GET    /profile/customization/themes                    - Get all themes
GET    /profile/customization/themes/available          - Get available themes for user
GET    /profile/customization/themes/unlockable         - Get unlockable themes
GET    /profile/customization/themes/:themeId           - Get specific theme
GET    /profile/customization/themes/:themeId/unlocked  - Check if theme is unlocked
```

## Data Models

### PlayerProfile Entity
```typescript
{
  id: string;
  userId: string;
  avatarUrl?: string;
  bannerTheme?: string;
  bannerUrl?: string;
  bio?: string;
  title?: string;
  location?: string;
  website?: string;
  badges: string[];
  customFields: Record<string, any>;
  socialLinks: {
    twitter?: string;
    discord?: string;
    twitch?: string;
    youtube?: string;
    github?: string;
  };
  privacySettings: {
    isProfilePublic: boolean;
    showBadges: boolean;
    showBio: boolean;
    showStats: boolean;
    showSocialLinks: boolean;
    showLocation: boolean;
    showWebsite: boolean;
  };
  displayPreferences: {
    theme?: string;
    badgeLayout?: 'grid' | 'list' | 'compact';
    showAchievementProgress?: boolean;
    profileLayout?: 'default' | 'compact' | 'detailed';
  };
  statistics: {
    totalGamesPlayed?: number;
    totalWins?: number;
    winRate?: number;
    averageScore?: number;
    bestScore?: number;
    totalPlayTime?: number;
    favoriteCategory?: string;
    currentStreak?: number;
    longestStreak?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Badge System
```typescript
{
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  category: 'achievement' | 'skill' | 'event' | 'special' | 'tournament';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
}
```

### Banner Themes
```typescript
{
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
  };
  gradient?: {
    from: string;
    to: string;
    direction?: string;
  };
  backgroundImage?: string;
  isUnlockable: boolean;
  unlockRequirement?: string;
}
```

## Usage Examples

### Update Profile
```typescript
const updateData = {
  bio: 'Passionate puzzle solver and tournament champion',
  title: 'Grandmaster',
  location: 'San Francisco, CA',
  website: 'https://mypuzzlesite.com',
  socialLinks: {
    twitter: '@puzzlemaster',
    discord: 'puzzlemaster#1234',
    twitch: 'puzzlemaster_live'
  },
  privacySettings: {
    isProfilePublic: true,
    showBadges: true,
    showBio: true,
    showStats: true,
    showSocialLinks: true,
    showLocation: false,
    showWebsite: true
  }
};

await fetch('/profile', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(updateData)
});
```

### Upload Avatar
```typescript
const formData = new FormData();
formData.append('file', avatarFile);

await fetch('/profile/avatar', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Update Displayed Badges
```typescript
const badgeUpdate = {
  displayedBadges: ['tournament-winner', 'speed-demon', 'puzzle-master']
};

await fetch('/profile/badges', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(badgeUpdate)
});
```

### Search Profiles
```typescript
const profiles = await fetch('/profile/search?q=puzzle&limit=20')
  .then(res => res.json());
```

## Services

### PlayerProfileService
Main service handling profile CRUD operations, file uploads, and privacy controls.

### BadgeService
Manages badge definitions, validation, and categorization.

### BannerThemeService
Handles banner theme management, unlock logic, and user theme access.

## File Upload Configuration

### Avatar Upload
- **Allowed Types**: JPEG, PNG, GIF, WebP
- **Max Size**: 5MB
- **Storage Path**: `uploads/avatars/`
- **Naming**: `avatar-{userId}-{timestamp}.{ext}`

### Banner Upload
- **Allowed Types**: JPEG, PNG, GIF, WebP
- **Max Size**: 10MB
- **Storage Path**: `uploads/banners/`
- **Naming**: `banner-{userId}-{timestamp}.{ext}`

## Privacy Controls

The system implements granular privacy controls:

1. **Profile Visibility**: Public/private profile access
2. **Bio Privacy**: Show/hide bio information
3. **Badge Privacy**: Show/hide earned badges
4. **Statistics Privacy**: Show/hide game statistics
5. **Social Links Privacy**: Show/hide social media links
6. **Location Privacy**: Show/hide location information
7. **Website Privacy**: Show/hide website URL

## Badge Categories

- **Achievement**: General game achievements
- **Skill**: Skill-based accomplishments
- **Event**: Special event participation
- **Special**: Unique or rare badges
- **Tournament**: Tournament-related achievements

## Banner Theme Unlock System

Themes can be unlocked based on player achievements:

- **Sunset Theme**: Complete 50 puzzles
- **Neon Theme**: Win a tournament
- **Gradient Theme**: Achieve 10 perfect scores

## Testing

The system includes comprehensive tests:

- **Unit Tests**: Service and controller logic
- **Integration Tests**: End-to-end API testing
- **File Upload Tests**: Upload validation and security
- **Privacy Tests**: Access control verification

Run tests:
```bash
npm test -- --testPathPattern=player-profile
```

## Database Schema

The system uses a single `player_profiles` table with JSONB fields for flexible data storage and efficient querying. Indexes are created for:

- Statistics queries (total games, win rate)
- Privacy settings (public profile filtering)
- Custom fields (flexible search)

## Performance Considerations

- **JSONB Indexing**: Efficient queries on nested JSON data
- **File Storage**: Local file system with configurable paths
- **Caching**: Profile data can be cached for frequently accessed profiles
- **Pagination**: Public profile listings support offset/limit pagination

## Security Features

- **Authentication Required**: All profile modifications require valid JWT
- **File Validation**: Strict file type and size validation
- **Privacy Enforcement**: Server-side privacy setting enforcement
- **Input Sanitization**: All user inputs are validated and sanitized
- **Access Control**: Users can only modify their own profiles

## Future Enhancements

- **Cloud Storage**: Integration with AWS S3 or similar services
- **Image Processing**: Automatic image resizing and optimization
- **Profile Templates**: Pre-designed profile layouts
- **Achievement Integration**: Automatic badge awarding based on game events
- **Social Features**: Profile following and friend systems
- **Analytics**: Profile view tracking and engagement metrics