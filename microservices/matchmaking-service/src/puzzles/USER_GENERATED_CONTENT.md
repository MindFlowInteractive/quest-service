# User-Generated Content System Documentation

## Overview

This document describes the comprehensive user-generated content (UGC) system that allows players to create, share, and discover custom puzzles within the Quest Service platform. The system includes submission workflows, moderation, community features, and creator rewards.

## Architecture

### Core Components

1. **User Puzzle Submissions**: Custom puzzles created by users
2. **Validation System**: Automated quality checks and duplicate detection
3. **Moderation Queue**: Manual review process for submitted puzzles
4. **Community Features**: Ratings, comments, sharing, and discovery
5. **Featured Puzzle Rotation**: Automated selection of top-quality puzzles
6. **Creator Rewards System**: Points, levels, and recognition for creators

## User Puzzle Submission Workflow

### 1. Creation Phase
- Users create puzzles using the submission interface
- Support for multiple puzzle types: multiple-choice, fill-blank, drag-drop, code, visual, logic-grid
- Rich content support: images, videos, audio, interactive components
- Creator notes and metadata for better discoverability

### 2. Validation Phase
- **Automated Checks**:
  - Answer validation
  - Content quality assessment
  - Difficulty consistency verification
  - Media validation
  - Duplicate detection using Levenshtein distance
- **Scoring System**: 0-100 scale based on various quality metrics
- **Auto-Approval**: High-quality puzzles (85+ score) auto-approved

### 3. Moderation Phase
- **Queue Management**: Submissions reviewed in order of submission
- **Moderator Actions**: Approve, reject, or request changes
- **Reason Tracking**: Detailed feedback for rejected submissions
- **Quality Scoring**: 1-10 scale for approved puzzles

### 4. Publication Phase
- Approved puzzles become publicly discoverable
- Shareable links generated for public puzzles
- Analytics tracking begins (views, plays, ratings)
- Eligibility for featured rotation

## Community Features

### Rating System
- **5-Star Rating**: Overall puzzle quality assessment
- **Detailed Breakdown**: Creativity, clarity, difficulty, enjoyment, educational value
- **Rating Analytics**: Distribution and trends tracking
- **User Ratings**: One rating per user per puzzle

### Comment System
- **Threaded Comments**: Support for replies and nested discussions
- **Moderation**: Auto-flagging and manual review
- **Voting**: Upvote/downvote system for comments
- **Creator Identification**: Special badges for puzzle creators

### Sharing Mechanisms
- **Shareable Links**: Unique URLs for puzzle sharing
- **Social Media Integration**: Direct sharing to popular platforms
- **Embed Codes**: Allow embedding on external sites
- **Sharing Analytics**: Track shares by platform and engagement

### Discovery Features
- **Advanced Search**: Filter by category, difficulty, tags, ratings
- **Trending Algorithm**: Based on recent activity and engagement
- **Personalized Recommendations**: Machine learning-based suggestions
- **Featured Puzzles**: Curated selection of top-quality content

## Featured Puzzle Rotation

### Automated Selection
- **Daily Rotation**: 5 new featured puzzles daily at midnight
- **Weekly Selection**: Top performers from the past week
- **Diversity Requirements**: Ensures variety in categories and creators
- **Quality Thresholds**: Minimum ratings and play counts required

### Selection Criteria
- **Community Score**: Weighted combination of ratings and plays
- **Recency Bonus**: Newer puzzles get slight preference
- **Quality Indicators**: Completion rates, rating counts
- **Category Diversity**: Prevents overrepresentation of any category

### Manual Curation
- **Admin Override**: Manual featuring of exceptional puzzles
- **Special Events**: Themed selections for holidays or events
- **Creator Spotlights**: Featured puzzles from top creators

## Creator Rewards System

### Creator Levels
1. **Novice Creator** (0 points): Basic tools, community support
2. **Apprentice Creator** (100 points): Advanced analytics, priority support
3. **Journeyman Creator** (500 points): Custom themes, enhanced visibility
4. **Expert Creator** (1500 points): Monetization tools, creator marketplace
5. **Master Creator** (5000 points): Premium features, revenue sharing
6. **Legendary Creator** (15000 points): Exclusive content, partner program

### Points System
- **Puzzle Plays**: 1-10 points per play (based on puzzle quality)
- **High Ratings**: 2-10 points for 4-5 star ratings
- **Featured Puzzles**: 50-100 points for being featured
- **Social Shares**: 1-5 points per share (varies by platform)
- **Achievements**: 25 points per milestone achievement

### Monthly Rewards
- **Leaderboard Bonuses**: Top creators receive monthly point bonuses
- **Performance Metrics**: Based on plays, ratings, and engagement
- **Creator Recognition**: Badges and titles for top performers

## API Endpoints

### Puzzle Submission Management
```
POST   /community-puzzles/submissions           # Create submission
GET    /community-puzzles/submissions           # Get user submissions
GET    /community-puzzles/submissions/:id        # Get specific submission
PUT    /community-puzzles/submissions/:id        # Update submission
DELETE /community-puzzles/submissions/:id        # Delete submission
POST   /community-puzzles/submissions/:id/submit-review # Submit for review
POST   /community-puzzles/submissions/:id/publish     # Publish puzzle
```

### Community Discovery
```
GET    /community-puzzles/discover               # Search puzzles
GET    /community-puzzles/featured               # Get featured puzzles
GET    /community-puzzles/trending               # Get trending puzzles
GET    /community-puzzles/recommended            # Get personalized recommendations
GET    /community-puzzles/shared/:link          # Access shared puzzle
```

### Rating and Comments
```
POST   /community-puzzles/:id/rate              # Rate puzzle
GET    /community-puzzles/:id/ratings            # Get puzzle ratings
GET    /community-puzzles/:id/my-rating          # Get user's rating
POST   /community-puzzles/:id/comments           # Create comment
GET    /community-puzzles/:id/comments           # Get puzzle comments
PUT    /community-puzzles/comments/:id            # Update comment
DELETE /community-puzzles/comments/:id            # Delete comment
POST   /community-puzzles/comments/:id/vote       # Vote on comment
```

### Sharing and Analytics
```
POST   /community-puzzles/:id/share              # Share puzzle
GET    /community-puzzles/:id/share-stats        # Get sharing statistics
POST   /community-puzzles/:id/play               # Track puzzle play
POST   /community-puzzles/:id/report             # Report puzzle
```

### Creator Features
```
GET    /community-puzzles/creator-stats          # Get creator statistics
GET    /community-puzzles/leaderboard           # Get creator leaderboard
GET    /community-puzzles/top-creators          # Get top creators
GET    /community-puzzles/my-rewards            # Get creator rewards
```

### Admin/Moderation
```
GET    /community-puzzles/admin/moderation-queue # Get moderation queue
POST   /community-puzzles/admin/:id/moderate     # Moderate puzzle
POST   /community-puzzles/admin/:id/feature      # Feature puzzle
POST   /community-puzzles/admin/:id/unfeature    # Unfeature puzzle
GET    /community-puzzles/admin/featured-stats  # Get featured statistics
GET    /community-puzzles/admin/moderation-stats # Get moderation statistics
```

## Database Schema

### User Puzzle Submissions
- **Basic Info**: Title, description, category, difficulty, points
- **Content**: Puzzle data, media, interactive components
- **Metadata**: Tags, creator notes, sharing settings
- **Status**: Draft, submitted, under review, approved, published, featured
- **Analytics**: Views, plays, ratings, completion rates
- **Moderation**: Validation results, moderation decisions

### Puzzle Ratings
- **User Ratings**: 1-5 star ratings with detailed breakdown
- **Review Content**: Optional text reviews and metadata
- **Helpfulness**: Community voting on review helpfulness

### Puzzle Comments
- **Threaded Discussions**: Support for replies and nested comments
- **Moderation**: Auto-flagging and manual review systems
- **Voting**: Upvote/downvote system for comment quality

## Quality Assurance

### Automated Validation
- **Answer Validation**: Ensures correct answers are present and valid
- **Content Quality**: Assesses completeness and clarity
- **Difficulty Consistency**: Verifies difficulty matches content
- **Media Validation**: Checks media files and accessibility
- **Duplicate Detection**: Prevents duplicate submissions

### Manual Moderation
- **Review Queue**: Organized workflow for moderators
- **Standardized Criteria**: Clear guidelines for approval/rejection
- **Feedback System**: Constructive feedback for creators
- **Appeal Process**: Mechanism for creators to appeal decisions

## Performance Considerations

### Database Optimization
- **Indexing Strategy**: Optimized indexes for common queries
- **Partitioning**: Large tables partitioned by date or status
- **Caching**: Redis caching for frequently accessed data
- **Connection Pooling**: Efficient database connection management

### Scalability
- **Horizontal Scaling**: Service can scale across multiple instances
- **Load Balancing**: Even distribution of API requests
- **Background Processing**: Async processing for heavy operations
- **Rate Limiting**: Prevents abuse and ensures fair usage

## Security Measures

### Content Security
- **Input Validation**: Comprehensive validation of all user inputs
- **XSS Protection**: Sanitization of user-generated content
- **CSRF Protection**: Cross-site request forgery prevention
- **Content Filtering**: Automated detection of inappropriate content

### Access Control
- **JWT Authentication**: Secure user authentication
- **Role-Based Access**: Different permissions for users, moderators, admins
- **Rate Limiting**: Prevents API abuse and spam
- **Audit Logging**: Comprehensive logging of all actions

## Monitoring and Analytics

### Key Metrics
- **Submission Volume**: Number of puzzles submitted daily/weekly/monthly
- **Approval Rate**: Percentage of submissions that get approved
- **Community Engagement**: Ratings, comments, shares per puzzle
- **Creator Retention**: Active creators over time
- **Quality Trends**: Average quality scores over time

### Alerts and Notifications
- **Moderation Queue**: High queue length alerts
- **System Performance**: Response time and error rate monitoring
- **Content Issues**: Spike in reports or flags
- **Creator Milestones**: Achievement and level-up notifications

## Future Enhancements

### Planned Features
- **AI-Assisted Creation**: Tools to help users create better puzzles
- **Collaborative Creation**: Multiple users working on puzzles together
- **Monetization Options**: Direct creator earnings and marketplace
- **Advanced Analytics**: More detailed creator and puzzle analytics
- **Mobile App**: Native mobile app for puzzle creation and play

### Technical Improvements
- **Machine Learning**: Better recommendation algorithms
- **Real-time Features**: Live collaboration and commenting
- **Video Integration**: Video tutorials and walkthroughs
- **Voice Support**: Audio-based puzzles and accessibility features

## Best Practices

### For Creators
- **Quality Over Quantity**: Focus on creating high-quality, engaging puzzles
- **Clear Instructions**: Provide clear explanations and hints
- **Appropriate Difficulty**: Match difficulty to intended audience
- **Engaging Content**: Use media and interactive elements effectively
- **Community Engagement**: Respond to comments and feedback

### For Moderators
- **Consistent Standards**: Apply guidelines uniformly
- **Constructive Feedback**: Provide helpful feedback for improvements
- **Timely Reviews**: Process submissions promptly
- **Quality Focus**: Prioritize player experience over quantity
- **Community Building**: Foster positive creator community

This comprehensive UGC system provides a robust foundation for user-generated puzzle content while maintaining quality standards and fostering an engaged creator community.
