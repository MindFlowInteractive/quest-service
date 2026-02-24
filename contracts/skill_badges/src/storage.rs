use soroban_sdk::{Address, Env, panic_with_error};
use crate::types::DataKey;
use crate::errors::ContractError;

pub struct Storage;

impl Storage {
    pub fn set_admin(env: &Env, admin: &Address) {
        env.storage().instance().set(&DataKey::Admin, admin);
    }

    pub fn get_admin(env: &Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic_with_error!(env, ContractError::NotInitialized))
    }

    pub fn require_admin(env: &Env, caller: &Address) {
        let admin = Self::get_admin(env);
        if admin != *caller {
            panic_with_error!(env, ContractError::Unauthorized);
        }
    }

    pub fn set_initialized(env: &Env) {
        if env.storage().instance().has(&DataKey::Initialized) {
            panic_with_error!(env, ContractError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Initialized, &true);
    }

    pub fn is_initialized(env: &Env) -> bool {
        env.storage().instance().has(&DataKey::Initialized)
    }

    pub fn next_badge_id(env: &Env) -> u64 {
        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::BadgeCounter)
            .unwrap_or(0u64);
        let next = id + 1;
        env.storage().instance().set(&DataKey::BadgeCounter, &next);
        next
    }

    pub fn next_credential_id(env: &Env) -> u64 {
        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::CredentialCounter)
            .unwrap_or(0u64);
        let next = id + 1;
        env.storage()
            .instance()
            .set(&DataKey::CredentialCounter, &next);
        next
    }
}
