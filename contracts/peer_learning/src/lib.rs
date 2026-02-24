mod types;
mod errors;
mod storage;
mod mentor;
mod mentee;
mod session;
mod stats;
mod events;
mod test;

pub use types::*;
pub use errors::ContractError;

use soroban_sdk::{contract, contractimpl, Address, Env, String, Vec};
use storage::Storage;
use mentor::MentorManager;
use mentee::MenteeManager;
use session::SessionManager;
use stats::StatsManager;

#[contract]
pub struct PeerLearningContract;

#[contractimpl]
impl PeerLearningContract {
    pub fn initialize(env: Env, admin: Address, reward_token: Address, platform_fee_bps: u32) {
        if platform_fee_bps > 3000 {
            panic!("fee cannot exceed 30%");
        }
        Storage::set_initialized(&env);
        Storage::set_admin(&env, &admin);
        Storage::set_reward_token(&env, &reward_token);
        Storage::set_platform_fee_bps(&env, platform_fee_bps);
        events::emit_initialized(&env, &admin, &reward_token);
    }

    pub fn register_mentor(
        env: Env,
        caller: Address,
        skills: Vec<SkillCategory>,
        hourly_rate: i128,
    ) -> MentorProfile {
        caller.require_auth();
        let profile = MentorManager::register(&env, &caller, skills, hourly_rate);
        StatsManager::increment_mentors(&env);
        events::emit_mentor_registered(&env, &caller);
        profile
    }

    pub fn register_mentee(env: Env, caller: Address) -> MenteeProfile {
        caller.require_auth();
        let profile = MenteeManager::register(&env, &caller);
        StatsManager::increment_mentees(&env);
        events::emit_mentee_registered(&env, &caller);
        profile
    }

    pub fn set_mentor_active(env: Env, caller: Address, active: bool) {
        caller.require_auth();
        MentorManager::set_active(&env, &caller, active);
    }

    pub fn create_session(
        env: Env,
        mentee: Address,
        mentor: Address,
        category: SkillCategory,
        goal: String,
        reward_amount: i128,
    ) -> MentorshipSession {
        mentee.require_auth();
        let session = SessionManager::create(&env, &mentee, &mentor, category.clone(), goal, reward_amount);
        events::emit_session_created(&env, session.session_id, &mentor, &mentee, &category);
        session
    }

    pub fn accept_session(env: Env, mentor: Address, session_id: u64) -> MentorshipSession {
        mentor.require_auth();
        let session = SessionManager::accept(&env, &mentor, session_id);
        events::emit_session_accepted(&env, session_id, &mentor);
        session
    }

    pub fn submit_completion(
        env: Env,
        mentor: Address,
        session_id: u64,
        outcome_notes: String,
    ) -> MentorshipSession {
        mentor.require_auth();
        let session = SessionManager::submit_completion(&env, &mentor, session_id, outcome_notes);
        events::emit_completion_submitted(&env, session_id, &mentor);
        session
    }

    pub fn verify_completion(
        env: Env,
        mentee: Address,
        session_id: u64,
        rating: u32,
        feedback: String,
    ) -> MentorshipSession {
        mentee.require_auth();
        let session = SessionManager::verify_completion(&env, &mentee, session_id, rating, feedback);
        events::emit_session_completed(&env, session_id, &mentee, rating);
        session
    }

    pub fn dispute_session(
        env: Env,
        caller: Address,
        session_id: u64,
        reason: String,
    ) -> MentorshipSession {
        caller.require_auth();
        let session = SessionManager::dispute(&env, &caller, session_id, reason);
        events::emit_session_disputed(&env, session_id, &caller);
        session
    }

    pub fn resolve_dispute(
        env: Env,
        admin: Address,
        session_id: u64,
        outcome: DisputeOutcome,
    ) -> MentorshipSession {
        admin.require_auth();
        let session = SessionManager::resolve_dispute(&env, &admin, session_id, outcome.clone());
        events::emit_dispute_resolved(&env, session_id, &outcome);
        session
    }

    pub fn cancel_session(env: Env, mentee: Address, session_id: u64) -> MentorshipSession {
        mentee.require_auth();
        let session = SessionManager::cancel(&env, &mentee, session_id);
        events::emit_session_cancelled(&env, session_id, &mentee);
        session
    }

    pub fn get_mentor_profile(env: Env, mentor: Address) -> Option<MentorProfile> {
        MentorManager::get(&env, &mentor)
    }

    pub fn get_mentee_profile(env: Env, mentee: Address) -> Option<MenteeProfile> {
        MenteeManager::get(&env, &mentee)
    }

    pub fn get_session(env: Env, session_id: u64) -> Option<MentorshipSession> {
        SessionManager::get(&env, session_id)
    }

    pub fn get_mentor_sessions(env: Env, mentor: Address) -> Vec<u64> {
        SessionManager::get_mentor_sessions(&env, &mentor)
    }

    pub fn get_mentee_sessions(env: Env, mentee: Address) -> Vec<u64> {
        SessionManager::get_mentee_sessions(&env, &mentee)
    }

    pub fn get_top_mentors(env: Env, limit: u32) -> Vec<MentorLeaderboardEntry> {
        MentorManager::get_top_mentors(&env, limit)
    }

    pub fn get_platform_stats(env: Env) -> PlatformStats {
        StatsManager::get_stats(&env)
    }

    pub fn get_admin(env: Env) -> Address {
        Storage::get_admin(&env)
    }

    pub fn get_reward_token(env: Env) -> Address {
        Storage::get_reward_token(&env)
    }

    pub fn transfer_admin(env: Env, caller: Address, new_admin: Address) {
        caller.require_auth();
        Storage::require_admin(&env, &caller);
        Storage::set_admin(&env, &new_admin);
        events::emit_admin_transferred(&env, &caller, &new_admin);
    }

    pub fn update_platform_fee(env: Env, caller: Address, new_fee_bps: u32) {
        caller.require_auth();
        Storage::require_admin(&env, &caller);
        if new_fee_bps > 3000 {
            panic!("fee cannot exceed 30%");
        }
        Storage::set_platform_fee_bps(&env, new_fee_bps);
    }
}
