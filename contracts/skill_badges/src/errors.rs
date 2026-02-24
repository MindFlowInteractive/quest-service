use soroban_sdk::contracterror;

#[contracterror]
#[derive(Clone, Debug, PartialEq)]
pub enum ContractError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    BadgeNotFound = 4,
    CredentialNotFound = 5,
    CredentialRevoked = 6,
    InvalidPuzzleCount = 7,
    PlayerNotFound = 8,
    MaxLevelReached = 9,
    InvalidCategory = 10,
}
