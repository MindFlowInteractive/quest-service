use soroban_sdk::{Address, Env, Vec, panic_with_error};
use crate::types::{DataKey, MentorLeaderboardEntry, MentorProfile, SkillCategory};
use crate::errors::ContractError;

pub struct MentorManager;

impl MentorManager {
    pub fn register(
        env: &Env,
        caller: &Address,
        skills: Vec<SkillCategory>,
        hourly_rate: i128,
    ) -> MentorProfile {
        let key = DataKey::MentorProfile(caller.clone());
        if env.storage().persistent().has(&key) {
            panic_with_error!(env, ContractError::AlreadyRegistered);
        }

        if hourly_rate <= 0 {
            panic_with_error!(env, ContractError::InvalidRewardAmount);
        }

        let profile = MentorProfile {
            address: caller.clone(),
            skills,
            hourly_rate,
            total_sessions: 0,
            completed_sessions: 0,
            total_rating: 0,
            rating_count: 0,
            reputation_score: 0,
            total_earned: 0,
            registered_at: env.ledger().timestamp(),
            is_active: true,
        };

        env.storage().persistent().set(&key, &profile);
        profile
    }

    pub fn get(env: &Env, mentor: &Address) -> Option<MentorProfile> {
        env.storage()
            .persistent()
            .get(&DataKey::MentorProfile(mentor.clone()))
    }

    pub fn require_active(env: &Env, mentor: &Address) -> MentorProfile {
        let profile = Self::get(env, mentor)
            .unwrap_or_else(|| panic_with_error!(env, ContractError::MentorNotFound));
        if !profile.is_active {
            panic_with_error!(env, ContractError::MentorNotActive);
        }
        profile
    }

    pub fn set_active(env: &Env, mentor: &Address, active: bool) {
        let key = DataKey::MentorProfile(mentor.clone());
        let mut profile: MentorProfile = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic_with_error!(env, ContractError::MentorNotFound));
        profile.is_active = active;
        env.storage().persistent().set(&key, &profile);
    }

    pub fn record_session_accepted(env: &Env, mentor: &Address) {
        let key = DataKey::MentorProfile(mentor.clone());
        let mut profile: MentorProfile = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic_with_error!(env, ContractError::MentorNotFound));
        profile.total_sessions += 1;
        env.storage().persistent().set(&key, &profile);
    }

    pub fn record_completion(env: &Env, mentor: &Address, rating: u32, earned: i128) {
        let key = DataKey::MentorProfile(mentor.clone());
        let mut profile: MentorProfile = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic_with_error!(env, ContractError::MentorNotFound));

        profile.completed_sessions += 1;
        profile.total_rating += rating;
        profile.rating_count += 1;
        profile.total_earned += earned;
        profile.reputation_score = Self::compute_reputation(&profile);

        env.storage().persistent().set(&key, &profile);
        Self::update_leaderboard(env, mentor, &profile);
    }

    pub fn compute_reputation(profile: &MentorProfile) -> u32 {
        if profile.rating_count == 0 {
            return 0;
        }
        let avg_rating = profile.total_rating / profile.rating_count;
        let completion_rate = if profile.total_sessions > 0 {
            (profile.completed_sessions * 100) / profile.total_sessions
        } else {
            0
        };
        (avg_rating * 60 / 5) + (completion_rate * 40 / 100)
    }

    pub fn get_top_mentors(env: &Env, limit: u32) -> Vec<MentorLeaderboardEntry> {
        let board: Vec<MentorLeaderboardEntry> = env
            .storage()
            .persistent()
            .get(&DataKey::Leaderboard)
            .unwrap_or_else(|| Vec::new(env));

        let cap = (limit as usize).min(board.len());
        let mut result = Vec::new(env);
        for i in 0..cap {
            result.push_back(board.get(i as u32).unwrap());
        }
        result
    }

    fn update_leaderboard(env: &Env, mentor: &Address, profile: &MentorProfile) {
        let mut board: Vec<MentorLeaderboardEntry> = env
            .storage()
            .persistent()
            .get(&DataKey::Leaderboard)
            .unwrap_or_else(|| Vec::new(env));

        let avg_rating = if profile.rating_count > 0 {
            profile.total_rating / profile.rating_count
        } else {
            0
        };

        let new_entry = MentorLeaderboardEntry {
            mentor: mentor.clone(),
            reputation_score: profile.reputation_score,
            completed_sessions: profile.completed_sessions,
            average_rating: avg_rating,
            total_earned: profile.total_earned,
            rank: 0,
        };

        let mut updated = Vec::new(env);
        let mut found = false;
        for entry in board.iter() {
            if entry.mentor == *mentor {
                updated.push_back(new_entry.clone());
                found = true;
            } else {
                updated.push_back(entry);
            }
        }
        if !found {
            updated.push_back(new_entry);
        }

        let len = updated.len() as usize;
        for i in 1..len {
            for j in (0..i).rev() {
                let a = updated.get(j as u32).unwrap();
                let b = updated.get((j + 1) as u32).unwrap();
                if b.reputation_score > a.reputation_score {
                    updated.set(j as u32, b.clone());
                    updated.set((j + 1) as u32, a.clone());
                } else {
                    break;
                }
            }
        }

        let mut ranked = Vec::new(env);
        for (i, mut entry) in updated.iter().enumerate() {
            entry.rank = (i + 1) as u32;
            ranked.push_back(entry);
        }

        env.storage().persistent().set(&DataKey::Leaderboard, &ranked);
    }
}
