use soroban_sdk::contracterror;

#[contracterror]
#[derive(Clone, Debug, PartialEq)]
pub enum ContractError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    MentorNotFound = 4,
    MenteeNotFound = 5,
    SessionNotFound = 6,
    AlreadyRegistered = 7,
    MentorNotActive = 8,
    MenteeNotActive = 9,
    InvalidStatus = 10,
    InvalidRating = 11,
    InvalidRewardAmount = 12,
    InsufficientEscrow = 13,
    SkillNotOffered = 14,
    SelfMentorship = 15,
    SessionAlreadyDisputed = 16,
    DisputeNotResolved = 17,
    InvalidFeeRate = 18,
    RewardAlreadyClaimed = 19,
    InvalidGoal = 20,
}
