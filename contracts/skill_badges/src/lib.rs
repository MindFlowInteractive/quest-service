mod types;
mod storage;
mod badge;
mod credential;
mod errors;
mod events;
mod test;

pub use types::*;
pub use errors::ContractError;

use soroban_sdk::{contract, contractimpl, Address, Env, String, Vec};
use storage::Storage;
use badge::BadgeManager;
use credential::CredentialManager;

#[contract]
pub struct SkillBadgeContract;

#[contractimpl]
impl SkillBadgeContract {
    pub fn initialize(env: Env, admin: Address) {
        Storage::set_admin(&env, &admin);
        Storage::set_initialized(&env);
        events::emit_initialized(&env, &admin);
    }

    pub fn award_badge(
        env: Env,
        caller: Address,
        player: Address,
        category: PuzzleCategory,
        puzzles_solved: u32,
    ) -> Badge {
        caller.require_auth();
        Storage::require_admin(&env, &caller);

        let badge = BadgeManager::award_badge(&env, &player, category, puzzles_solved);
        events::emit_badge_awarded(&env, &player, &badge);
        badge
    }

    pub fn update_progress(
        env: Env,
        caller: Address,
        player: Address,
        category: PuzzleCategory,
        puzzles_solved: u32,
    ) -> Badge {
        caller.require_auth();
        Storage::require_admin(&env, &caller);

        let badge = BadgeManager::update_progress(&env, &player, category, puzzles_solved);
        events::emit_progress_updated(&env, &player, &badge);
        badge
    }

    pub fn issue_credential(
        env: Env,
        caller: Address,
        player: Address,
        category: PuzzleCategory,
        metadata: String,
    ) -> Credential {
        caller.require_auth();
        Storage::require_admin(&env, &caller);

        let badge = BadgeManager::get_badge(&env, &player, category.clone())
            .unwrap_or_else(|| panic!("Badge not found"));

        let credential = CredentialManager::issue_credential(&env, &player, badge, metadata);
        events::emit_credential_issued(&env, &player, &credential);
        credential
    }

    pub fn get_badge(env: Env, player: Address, category: PuzzleCategory) -> Option<Badge> {
        BadgeManager::get_badge(&env, &player, category)
    }

    pub fn get_all_badges(env: Env, player: Address) -> Vec<Badge> {
        BadgeManager::get_all_badges(&env, &player)
    }

    pub fn get_credential(env: Env, credential_id: u64) -> Option<Credential> {
        CredentialManager::get_credential(&env, credential_id)
    }

    pub fn get_player_credentials(env: Env, player: Address) -> Vec<Credential> {
        CredentialManager::get_player_credentials(&env, &player)
    }

    pub fn get_level_info(env: Env, player: Address, category: PuzzleCategory) -> LevelInfo {
        BadgeManager::get_level_info(&env, &player, category)
    }

    pub fn get_leaderboard(env: Env, category: PuzzleCategory, limit: u32) -> Vec<LeaderboardEntry> {
        BadgeManager::get_leaderboard(&env, category, limit)
    }

    pub fn revoke_credential(env: Env, caller: Address, credential_id: u64) {
        caller.require_auth();
        Storage::require_admin(&env, &caller);
        CredentialManager::revoke_credential(&env, credential_id);
        events::emit_credential_revoked(&env, credential_id);
    }

    pub fn transfer_admin(env: Env, caller: Address, new_admin: Address) {
        caller.require_auth();
        Storage::require_admin(&env, &caller);
        Storage::set_admin(&env, &new_admin);
        events::emit_admin_transferred(&env, &caller, &new_admin);
    }

    pub fn get_admin(env: Env) -> Address {
        Storage::get_admin(&env)
    }

    pub fn get_badge_stats(env: Env, category: PuzzleCategory) -> BadgeStats {
        BadgeManager::get_badge_stats(&env, category)
    }
}
