use soroban_sdk::Env;
use crate::types::{DataKey, PlatformStats};

pub struct StatsManager;

impl StatsManager {
    fn get(env: &Env) -> PlatformStats {
        env.storage()
            .instance()
            .get(&DataKey::PlatformStats)
            .unwrap_or(PlatformStats {
                total_mentors: 0,
                total_mentees: 0,
                total_sessions: 0,
                completed_sessions: 0,
                disputed_sessions: 0,
                total_rewards_distributed: 0,
                total_fees_collected: 0,
            })
    }

    fn save(env: &Env, stats: &PlatformStats) {
        env.storage().instance().set(&DataKey::PlatformStats, stats);
    }

    pub fn increment_mentors(env: &Env) {
        let mut s = Self::get(env);
        s.total_mentors += 1;
        Self::save(env, &s);
    }

    pub fn increment_mentees(env: &Env) {
        let mut s = Self::get(env);
        s.total_mentees += 1;
        Self::save(env, &s);
    }

    pub fn increment_total_sessions(env: &Env) {
        let mut s = Self::get(env);
        s.total_sessions += 1;
        Self::save(env, &s);
    }

    pub fn increment_disputed(env: &Env) {
        let mut s = Self::get(env);
        s.disputed_sessions += 1;
        Self::save(env, &s);
    }

    pub fn record_completion(env: &Env, reward: i128, fee: i128) {
        let mut s = Self::get(env);
        s.completed_sessions += 1;
        s.total_rewards_distributed += reward - fee;
        s.total_fees_collected += fee;
        Self::save(env, &s);
    }

    pub fn get_stats(env: &Env) -> PlatformStats {
        Self::get(env)
    }
}
