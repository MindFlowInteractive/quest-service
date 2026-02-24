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
        if Self::get_admin(env) != *caller {
            panic_with_error!(env, ContractError::Unauthorized);
        }
    }

    pub fn set_initialized(env: &Env) {
        if env.storage().instance().has(&DataKey::Initialized) {
            panic_with_error!(env, ContractError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Initialized, &true);
    }

    pub fn set_reward_token(env: &Env, token: &Address) {
        env.storage().instance().set(&DataKey::RewardToken, token);
    }

    pub fn get_reward_token(env: &Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::RewardToken)
            .unwrap_or_else(|| panic_with_error!(env, ContractError::NotInitialized))
    }

    pub fn set_platform_fee_bps(env: &Env, bps: u32) {
        env.storage().instance().set(&DataKey::PlatformFeeBps, &bps);
    }

    pub fn get_platform_fee_bps(env: &Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::PlatformFeeBps)
            .unwrap_or(500u32)
    }

    pub fn next_session_id(env: &Env) -> u64 {
        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::SessionCounter)
            .unwrap_or(0u64);
        let next = id + 1;
        env.storage().instance().set(&DataKey::SessionCounter, &next);
        next
    }
}
