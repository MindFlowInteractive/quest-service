use soroban_sdk::{Address, Env, panic_with_error};
use crate::types::{DataKey, MenteeProfile};
use crate::errors::ContractError;

pub struct MenteeManager;

impl MenteeManager {
    pub fn register(env: &Env, caller: &Address) -> MenteeProfile {
        let key = DataKey::MenteeProfile(caller.clone());
        if env.storage().persistent().has(&key) {
            panic_with_error!(env, ContractError::AlreadyRegistered);
        }

        let profile = MenteeProfile {
            address: caller.clone(),
            total_sessions: 0,
            completed_sessions: 0,
            total_spent: 0,
            registered_at: env.ledger().timestamp(),
            is_active: true,
        };

        env.storage().persistent().set(&key, &profile);
        profile
    }

    pub fn get(env: &Env, mentee: &Address) -> Option<MenteeProfile> {
        env.storage()
            .persistent()
            .get(&DataKey::MenteeProfile(mentee.clone()))
    }

    pub fn require_active(env: &Env, mentee: &Address) -> MenteeProfile {
        let profile = Self::get(env, mentee)
            .unwrap_or_else(|| panic_with_error!(env, ContractError::MenteeNotFound));
        if !profile.is_active {
            panic_with_error!(env, ContractError::MenteeNotActive);
        }
        profile
    }

    pub fn record_session_created(env: &Env, mentee: &Address) {
        let key = DataKey::MenteeProfile(mentee.clone());
        let mut profile: MenteeProfile = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic_with_error!(env, ContractError::MenteeNotFound));
        profile.total_sessions += 1;
        env.storage().persistent().set(&key, &profile);
    }

    pub fn record_completion(env: &Env, mentee: &Address, spent: i128) {
        let key = DataKey::MenteeProfile(mentee.clone());
        let mut profile: MenteeProfile = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic_with_error!(env, ContractError::MenteeNotFound));
        profile.completed_sessions += 1;
        profile.total_spent += spent;
        env.storage().persistent().set(&key, &profile);
    }
}
