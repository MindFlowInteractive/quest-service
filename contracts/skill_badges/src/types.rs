use soroban_sdk::{contracttype, Address, String};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum PuzzleCategory {
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
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub enum BadgeLevel {
    Novice,
    Apprentice,
    Practitioner,
    Expert,
    Master,
    Grandmaster,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Badge {
    pub player: Address,
    pub category: PuzzleCategory,
    pub level: BadgeLevel,
    pub puzzles_solved: u32,
    pub xp: u64,
    pub issued_at: u64,
    pub updated_at: u64,
    pub badge_id: u64,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Credential {
    pub credential_id: u64,
    pub player: Address,
    pub badge: Badge,
    pub metadata: String,
    pub issued_at: u64,
    pub is_valid: bool,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct LevelInfo {
    pub current_level: BadgeLevel,
    pub current_xp: u64,
    pub xp_to_next_level: u64,
    pub puzzles_solved: u32,
    pub puzzles_to_next_level: u32,
    pub is_max_level: bool,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct LeaderboardEntry {
    pub player: Address,
    pub category: PuzzleCategory,
    pub level: BadgeLevel,
    pub xp: u64,
    pub puzzles_solved: u32,
    pub rank: u32,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct BadgeStats {
    pub category: PuzzleCategory,
    pub total_badges: u32,
    pub novice_count: u32,
    pub apprentice_count: u32,
    pub practitioner_count: u32,
    pub expert_count: u32,
    pub master_count: u32,
    pub grandmaster_count: u32,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Initialized,
    Badge(Address, PuzzleCategory),
    PlayerBadges(Address),
    Credential(u64),
    PlayerCredentials(Address),
    CredentialCounter,
    BadgeCounter,
    CategoryLeaderboard(PuzzleCategory),
    BadgeStats(PuzzleCategory),
}
