#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn setup() -> (Env, Address, SkillBadgeContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, SkillBadgeContract);
    let client = SkillBadgeContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    client.initialize(&admin);
    (env, admin, client)
}

#[test]
fn test_initialize() {
    let (_, admin, client) = setup();
    assert_eq!(client.get_admin(), admin);
}

#[test]
fn test_award_badge_novice() {
    let (env, admin, client) = setup();
    let player = Address::generate(&env);

    let badge = client.award_badge(&admin, &player, &PuzzleCategory::Logic, &5u32);
    assert_eq!(badge.level, BadgeLevel::Novice);
    assert_eq!(badge.puzzles_solved, 5);
    assert!(badge.xp > 0);
}

#[test]
fn test_award_badge_apprentice() {
    let (env, admin, client) = setup();
    let player = Address::generate(&env);

    let badge = client.award_badge(&admin, &player, &PuzzleCategory::Math, &15u32);
    assert_eq!(badge.level, BadgeLevel::Apprentice);
}

#[test]
fn test_award_badge_practitioner() {
    let (env, admin, client) = setup();
    let player = Address::generate(&env);

    let badge = client.award_badge(&admin, &player, &PuzzleCategory::Cryptography, &50u32);
    assert_eq!(badge.level, BadgeLevel::Practitioner);
}

#[test]
fn test_award_badge_expert() {
    let (env, admin, client) = setup();
    let player = Address::generate(&env);

    let badge = client.award_badge(&admin, &player, &PuzzleCategory::Spatial, &100u32);
    assert_eq!(badge.level, BadgeLevel::Expert);
}

#[test]
fn test_award_badge_master() {
    let (env, admin, client) = setup();
    let player = Address::generate(&env);

    let badge = client.award_badge(&admin, &player, &PuzzleCategory::Strategy, &200u32);
    assert_eq!(badge.level, BadgeLevel::Master);
}

#[test]
fn test_award_badge_grandmaster() {
    let (env, admin, client) = setup();
    let player = Address::generate(&env);

    let badge = client.award_badge(&admin, &player, &PuzzleCategory::Pattern, &350u32);
    assert_eq!(badge.level, BadgeLevel::Grandmaster);
}

#[test]
fn test_update_progress_upgrades_level() {
    let (env, admin, client) = setup();
    let player = Address::generate(&env);

    client.award_badge(&admin, &player, &PuzzleCategory::Logic, &5u32);
    let updated = client.update_progress(&admin, &player, &PuzzleCategory::Logic, &15u32);

    assert_eq!(updated.level, BadgeLevel::Apprentice);
    assert_eq!(updated.puzzles_solved, 15);
}

#[test]
fn test_update_progress_no_downgrade() {
    let (env, admin, client) = setup();
    let player = Address::generate(&env);

    client.award_badge(&admin, &player, &PuzzleCategory::Logic, &15u32);
    let badge = client.update_progress(&admin, &player, &PuzzleCategory::Logic, &5u32);

    assert_eq!(badge.puzzles_solved, 15);
    assert_eq!(badge.level, BadgeLevel::Apprentice);
}

#[test]
fn test_get_all_badges() {
    let (env, admin, client) = setup();
    let player = Address::generate(&env);

    client.award_badge(&admin, &player, &PuzzleCategory::Logic, &5u32);
    client.award_badge(&admin, &player, &PuzzleCategory::Math, &20u32);

    let badges = client.get_all_badges(&player);
    assert_eq!(badges.len(), 2);
}

#[test]
fn test_issue_credential() {
    let (env, admin, client) = setup();
    let player = Address::generate(&env);

    client.award_badge(&admin, &player, &PuzzleCategory::Logic, &50u32);
    let meta = String::from_str(&env, "Logic Expert Badge - Verified");
    let credential = client.issue_credential(&admin, &player, &PuzzleCategory::Logic, &meta);

    assert_eq!(credential.is_valid, true);
    assert_eq!(credential.player, player);
}

#[test]
fn test_revoke_credential() {
    let (env, admin, client) = setup();
    let player = Address::generate(&env);

    client.award_badge(&admin, &player, &PuzzleCategory::Math, &30u32);
    let meta = String::from_str(&env, "Credential metadata");
    let credential = client.issue_credential(&admin, &player, &PuzzleCategory::Math, &meta);

    client.revoke_credential(&admin, &credential.credential_id);

    let fetched = client.get_credential(&credential.credential_id).unwrap();
    assert_eq!(fetched.is_valid, false);
}

#[test]
fn test_get_player_credentials() {
    let (env, admin, client) = setup();
    let player = Address::generate(&env);

    client.award_badge(&admin, &player, &PuzzleCategory::Logic, &50u32);
    client.award_badge(&admin, &player, &PuzzleCategory::Math, &50u32);

    let meta1 = String::from_str(&env, "Logic credential");
    let meta2 = String::from_str(&env, "Math credential");

    client.issue_credential(&admin, &player, &PuzzleCategory::Logic, &meta1);
    client.issue_credential(&admin, &player, &PuzzleCategory::Math, &meta2);

    let credentials = client.get_player_credentials(&player);
    assert_eq!(credentials.len(), 2);
}

#[test]
fn test_get_level_info() {
    let (env, admin, client) = setup();
    let player = Address::generate(&env);

    client.award_badge(&admin, &player, &PuzzleCategory::Logic, &15u32);
    let info = client.get_level_info(&player, &PuzzleCategory::Logic);

    assert_eq!(info.current_level, BadgeLevel::Apprentice);
    assert_eq!(info.puzzles_solved, 15);
    assert!(!info.is_max_level);
    assert!(info.puzzles_to_next_level > 0);
}

#[test]
fn test_grandmaster_is_max_level() {
    let (env, admin, client) = setup();
    let player = Address::generate(&env);

    client.award_badge(&admin, &player, &PuzzleCategory::Logic, &350u32);
    let info = client.get_level_info(&player, &PuzzleCategory::Logic);

    assert_eq!(info.is_max_level, true);
    assert_eq!(info.puzzles_to_next_level, 0);
    assert_eq!(info.xp_to_next_level, 0);
}

#[test]
fn test_leaderboard_ordering() {
    let (env, admin, client) = setup();
    let player1 = Address::generate(&env);
    let player2 = Address::generate(&env);
    let player3 = Address::generate(&env);

    client.award_badge(&admin, &player1, &PuzzleCategory::Logic, &10u32);
    client.award_badge(&admin, &player2, &PuzzleCategory::Logic, &100u32);
    client.award_badge(&admin, &player3, &PuzzleCategory::Logic, &50u32);

    let board = client.get_leaderboard(&PuzzleCategory::Logic, &10u32);
    assert_eq!(board.len(), 3);

    let first = board.get(0).unwrap();
    let second = board.get(1).unwrap();
    assert!(first.xp >= second.xp);
    assert_eq!(first.rank, 1);
    assert_eq!(second.rank, 2);
}

#[test]
fn test_badge_stats_tracking() {
    let (env, admin, client) = setup();
    let player1 = Address::generate(&env);
    let player2 = Address::generate(&env);

    client.award_badge(&admin, &player1, &PuzzleCategory::Math, &5u32);
    client.award_badge(&admin, &player2, &PuzzleCategory::Math, &15u32);

    let stats = client.get_badge_stats(&PuzzleCategory::Math);
    assert_eq!(stats.total_badges, 2);
    assert_eq!(stats.novice_count, 1);
    assert_eq!(stats.apprentice_count, 1);
}

#[test]
fn test_transfer_admin() {
    let (env, admin, client) = setup();
    let new_admin = Address::generate(&env);

    client.transfer_admin(&admin, &new_admin);
    assert_eq!(client.get_admin(), new_admin);
}

#[test]
#[should_panic]
fn test_unauthorized_award_badge() {
    let (env, _, client) = setup();
    let non_admin = Address::generate(&env);
    let player = Address::generate(&env);

    client.award_badge(&non_admin, &player, &PuzzleCategory::Logic, &10u32);
}

#[test]
#[should_panic]
fn test_double_initialize() {
    let (_, admin, client) = setup();
    client.initialize(&admin);
}
