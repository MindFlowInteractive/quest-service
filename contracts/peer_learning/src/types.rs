use soroban_sdk::{contracttype, Address, String, Vec};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum SkillCategory {
    Logic,
    Math,
    Pattern,
    Cryptography,
    Spatial,
    WordPuzzle,
    Strategy,
    MemoryChallenge,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum SessionStatus {
    Pending,
    Active,
    PendingVerification,
    Completed,
    Disputed,
    Resolved,
    Cancelled,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum DisputeOutcome {
    FavorMentor,
    FavorMentee,
    Split,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct MentorProfile {
    pub address: Address,
    pub skills: Vec<SkillCategory>,
    pub hourly_rate: i128,
    pub total_sessions: u32,
    pub completed_sessions: u32,
    pub total_rating: u32,
    pub rating_count: u32,
    pub reputation_score: u32,
    pub total_earned: i128,
    pub registered_at: u64,
    pub is_active: bool,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct MenteeProfile {
    pub address: Address,
    pub total_sessions: u32,
    pub completed_sessions: u32,
    pub total_spent: i128,
    pub registered_at: u64,
    pub is_active: bool,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct MentorshipSession {
    pub session_id: u64,
    pub mentor: Address,
    pub mentee: Address,
    pub category: SkillCategory,
    pub goal: String,
    pub reward_amount: i128,
    pub platform_fee: i128,
    pub status: SessionStatus,
    pub mentor_rating: u32,
    pub mentee_feedback: String,
    pub outcome_notes: String,
    pub dispute_reason: String,
    pub dispute_outcome: Option<DisputeOutcome>,
    pub created_at: u64,
    pub accepted_at: u64,
    pub completed_at: u64,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct MentorLeaderboardEntry {
    pub mentor: Address,
    pub reputation_score: u32,
    pub completed_sessions: u32,
    pub average_rating: u32,
    pub total_earned: i128,
    pub rank: u32,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct PlatformStats {
    pub total_mentors: u32,
    pub total_mentees: u32,
    pub total_sessions: u32,
    pub completed_sessions: u32,
    pub disputed_sessions: u32,
    pub total_rewards_distributed: i128,
    pub total_fees_collected: i128,
}

#[contracttype]
pub enum DataKey {
    Admin,
    RewardToken,
    Initialized,
    PlatformFeeBps,
    SessionCounter,
    MentorProfile(Address),
    MenteeProfile(Address),
    Session(u64),
    MentorSessions(Address),
    MenteeSessions(Address),
    Leaderboard,
    PlatformStats,
    EscrowBalance(u64),
}
