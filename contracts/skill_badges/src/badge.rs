use soroban_sdk::{Address, Env, Vec, panic_with_error};
use crate::types::{Badge, BadgeLevel, BadgeStats, DataKey, LeaderboardEntry, LevelInfo, PuzzleCategory};
use crate::storage::Storage;
use crate::errors::ContractError;

const XP_PER_PUZZLE_BASE: u64 = 100;

pub struct BadgeManager;

impl BadgeManager {
    pub fn compute_level(puzzles_solved: u32) -> BadgeLevel {
        match puzzles_solved {
            0..=9 => BadgeLevel::Novice,
            10..=29 => BadgeLevel::Apprentice,
            30..=74 => BadgeLevel::Practitioner,
            75..=149 => BadgeLevel::Expert,
            150..=299 => BadgeLevel::Master,
            _ => BadgeLevel::Grandmaster,
        }
    }

    pub fn compute_xp(puzzles_solved: u32) -> u64 {
        let mut xp: u64 = 0;
        for i in 0..puzzles_solved {
            let multiplier = 1 + (i / 10) as u64;
            xp += XP_PER_PUZZLE_BASE * multiplier;
        }
        xp
    }

    pub fn level_thresholds() -> [(u32, u32); 6] {
        [
            (0, 10),
            (10, 30),
            (30, 75),
            (75, 150),
            (150, 300),
            (300, u32::MAX),
        ]
    }

    pub fn award_badge(
        env: &Env,
        player: &Address,
        category: PuzzleCategory,
        puzzles_solved: u32,
    ) -> Badge {
        let key = DataKey::Badge(player.clone(), category.clone());

        if env.storage().persistent().has(&key) {
            return Self::update_progress(env, player, category, puzzles_solved);
        }

        if puzzles_solved == 0 {
            panic_with_error!(env, ContractError::InvalidPuzzleCount);
        }

        let level = Self::compute_level(puzzles_solved);
        let xp = Self::compute_xp(puzzles_solved);
        let badge_id = Storage::next_badge_id(env);
        let now = env.ledger().timestamp();

        let badge = Badge {
            player: player.clone(),
            category: category.clone(),
            level: level.clone(),
            puzzles_solved,
            xp,
            issued_at: now,
            updated_at: now,
            badge_id,
        };

        env.storage().persistent().set(&key, &badge);
        Self::add_to_player_badges(env, player, &badge);
        Self::update_leaderboard(env, player, &badge);
        Self::update_stats(env, &badge.category, &level, None);

        badge
    }

    pub fn update_progress(
        env: &Env,
        player: &Address,
        category: PuzzleCategory,
        puzzles_solved: u32,
    ) -> Badge {
        let key = DataKey::Badge(player.clone(), category.clone());

        let mut badge: Badge = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic_with_error!(env, ContractError::BadgeNotFound));

        if puzzles_solved <= badge.puzzles_solved {
            return badge;
        }

        let old_level = badge.level.clone();
        let new_level = Self::compute_level(puzzles_solved);
        let new_xp = Self::compute_xp(puzzles_solved);

        badge.puzzles_solved = puzzles_solved;
        badge.xp = new_xp;
        badge.level = new_level.clone();
        badge.updated_at = env.ledger().timestamp();

        env.storage().persistent().set(&key, &badge);
        Self::update_leaderboard(env, player, &badge);

        if old_level != new_level {
            Self::update_stats(env, &badge.category, &new_level, Some(&old_level));
        }

        badge
    }

    pub fn get_badge(env: &Env, player: &Address, category: PuzzleCategory) -> Option<Badge> {
        let key = DataKey::Badge(player.clone(), category);
        env.storage().persistent().get(&key)
    }

    pub fn get_all_badges(env: &Env, player: &Address) -> Vec<Badge> {
        let key = DataKey::PlayerBadges(player.clone());
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(env))
    }

    pub fn get_level_info(env: &Env, player: &Address, category: PuzzleCategory) -> LevelInfo {
        let badge = Self::get_badge(env, player, category.clone());
        let (puzzles_solved, xp, current_level) = match badge {
            Some(b) => (b.puzzles_solved, b.xp, b.level),
            None => (0, 0, BadgeLevel::Novice),
        };

        let thresholds = Self::level_thresholds();
        let level_idx = match current_level {
            BadgeLevel::Novice => 0,
            BadgeLevel::Apprentice => 1,
            BadgeLevel::Practitioner => 2,
            BadgeLevel::Expert => 3,
            BadgeLevel::Master => 4,
            BadgeLevel::Grandmaster => 5,
        };

        let is_max_level = level_idx == 5;
        let (current_min, next_threshold) = thresholds[level_idx];
        let puzzles_to_next = if is_max_level {
            0
        } else {
            next_threshold.saturating_sub(puzzles_solved)
        };

        let xp_at_current = Self::compute_xp(current_min);
        let xp_to_next = if is_max_level {
            0
        } else {
            Self::compute_xp(next_threshold).saturating_sub(xp)
        };

        LevelInfo {
            current_level,
            current_xp: xp,
            xp_to_next_level: xp_to_next,
            puzzles_solved,
            puzzles_to_next_level: puzzles_to_next,
            is_max_level,
        }
    }

    pub fn get_leaderboard(env: &Env, category: PuzzleCategory, limit: u32) -> Vec<LeaderboardEntry> {
        let key = DataKey::CategoryLeaderboard(category.clone());
        let all_entries: Vec<LeaderboardEntry> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(env));

        let cap = if limit as usize > all_entries.len() {
            all_entries.len()
        } else {
            limit as usize
        };

        let mut result = Vec::new(env);
        for i in 0..cap {
            result.push_back(all_entries.get(i as u32).unwrap());
        }
        result
    }

    pub fn get_badge_stats(env: &Env, category: PuzzleCategory) -> BadgeStats {
        let key = DataKey::BadgeStats(category.clone());
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or(BadgeStats {
                category,
                total_badges: 0,
                novice_count: 0,
                apprentice_count: 0,
                practitioner_count: 0,
                expert_count: 0,
                master_count: 0,
                grandmaster_count: 0,
            })
    }

    fn add_to_player_badges(env: &Env, player: &Address, badge: &Badge) {
        let key = DataKey::PlayerBadges(player.clone());
        let mut badges: Vec<Badge> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(env));
        badges.push_back(badge.clone());
        env.storage().persistent().set(&key, &badges);
    }

    fn update_leaderboard(env: &Env, player: &Address, badge: &Badge) {
        let key = DataKey::CategoryLeaderboard(badge.category.clone());
        let mut entries: Vec<LeaderboardEntry> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(env));

        let mut found = false;
        let mut updated = Vec::new(env);

        for entry in entries.iter() {
            if entry.player == *player {
                updated.push_back(LeaderboardEntry {
                    player: player.clone(),
                    category: badge.category.clone(),
                    level: badge.level.clone(),
                    xp: badge.xp,
                    puzzles_solved: badge.puzzles_solved,
                    rank: 0,
                });
                found = true;
            } else {
                updated.push_back(entry);
            }
        }

        if !found {
            updated.push_back(LeaderboardEntry {
                player: player.clone(),
                category: badge.category.clone(),
                level: badge.level.clone(),
                xp: badge.xp,
                puzzles_solved: badge.puzzles_solved,
                rank: 0,
            });
        }

        // Sort by xp descending (insertion sort for determinism)
        let len = updated.len() as usize;
        for i in 1..len {
            for j in (0..i).rev() {
                let a = updated.get(j as u32).unwrap();
                let b = updated.get((j + 1) as u32).unwrap();
                if b.xp > a.xp {
                    updated.set(j as u32, b.clone());
                    updated.set((j + 1) as u32, a.clone());
                } else {
                    break;
                }
            }
        }

        // Re-rank
        let mut ranked = Vec::new(env);
        for (i, mut entry) in updated.iter().enumerate() {
            entry.rank = (i + 1) as u32;
            ranked.push_back(entry);
        }

        env.storage().persistent().set(&key, &ranked);
    }

    fn update_stats(
        env: &Env,
        category: &PuzzleCategory,
        new_level: &BadgeLevel,
        old_level: Option<&BadgeLevel>,
    ) {
        let key = DataKey::BadgeStats(category.clone());
        let mut stats: BadgeStats = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or(BadgeStats {
                category: category.clone(),
                total_badges: 0,
                novice_count: 0,
                apprentice_count: 0,
                practitioner_count: 0,
                expert_count: 0,
                master_count: 0,
                grandmaster_count: 0,
            });

        if old_level.is_none() {
            stats.total_badges += 1;
        } else {
            let old = old_level.unwrap();
            match old {
                BadgeLevel::Novice => stats.novice_count = stats.novice_count.saturating_sub(1),
                BadgeLevel::Apprentice => stats.apprentice_count = stats.apprentice_count.saturating_sub(1),
                BadgeLevel::Practitioner => stats.practitioner_count = stats.practitioner_count.saturating_sub(1),
                BadgeLevel::Expert => stats.expert_count = stats.expert_count.saturating_sub(1),
                BadgeLevel::Master => stats.master_count = stats.master_count.saturating_sub(1),
                BadgeLevel::Grandmaster => stats.grandmaster_count = stats.grandmaster_count.saturating_sub(1),
            }
        }

        match new_level {
            BadgeLevel::Novice => stats.novice_count += 1,
            BadgeLevel::Apprentice => stats.apprentice_count += 1,
            BadgeLevel::Practitioner => stats.practitioner_count += 1,
            BadgeLevel::Expert => stats.expert_count += 1,
            BadgeLevel::Master => stats.master_count += 1,
            BadgeLevel::Grandmaster => stats.grandmaster_count += 1,
        }

        env.storage().persistent().set(&key, &stats);
    }
}
