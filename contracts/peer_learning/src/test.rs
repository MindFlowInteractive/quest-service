#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, MockAuth, MockAuthInvoke},
    token, Address, Env, IntoVal, String, Vec,
};

fn create_token(env: &Env, admin: &Address) -> Address {
    let token_id = env.register_stellar_asset_contract(admin.clone());
    token_id
}

fn mint_tokens(env: &Env, token: &Address, admin: &Address, to: &Address, amount: i128) {
    let token_admin = token::StellarAssetClient::new(env, token);
    token_admin.mint(to, &amount);
}

fn setup() -> (Env, Address, Address, PeerLearningContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let reward_token = create_token(&env, &admin);
    let contract_id = env.register_contract(None, PeerLearningContract);
    let client = PeerLearningContractClient::new(&env, &contract_id);
    client.initialize(&admin, &reward_token, &500u32);
    (env, admin, reward_token, client)
}

fn default_skills(env: &Env) -> Vec<SkillCategory> {
    let mut skills = Vec::new(env);
    skills.push_back(SkillCategory::Logic);
    skills.push_back(SkillCategory::Math);
    skills
}

#[test]
fn test_initialize() {
    let (_, admin, reward_token, client) = setup();
    assert_eq!(client.get_admin(), admin);
    assert_eq!(client.get_reward_token(), reward_token);
}

#[test]
fn test_register_mentor() {
    let (env, _, _, client) = setup();
    let mentor = Address::generate(&env);
    let skills = default_skills(&env);

    let profile = client.register_mentor(&mentor, &skills, &1000i128);
    assert_eq!(profile.address, mentor);
    assert_eq!(profile.hourly_rate, 1000);
    assert!(profile.is_active);
    assert_eq!(profile.total_sessions, 0);
}

#[test]
fn test_register_mentee() {
    let (env, _, _, client) = setup();
    let mentee = Address::generate(&env);

    let profile = client.register_mentee(&mentee);
    assert_eq!(profile.address, mentee);
    assert!(profile.is_active);
    assert_eq!(profile.total_sessions, 0);
}

#[test]
#[should_panic]
fn test_register_mentor_twice() {
    let (env, _, _, client) = setup();
    let mentor = Address::generate(&env);
    let skills = default_skills(&env);

    client.register_mentor(&mentor, &skills, &1000i128);
    client.register_mentor(&mentor, &skills, &1000i128);
}

#[test]
#[should_panic]
fn test_register_mentee_twice() {
    let (env, _, _, client) = setup();
    let mentee = Address::generate(&env);

    client.register_mentee(&mentee);
    client.register_mentee(&mentee);
}

#[test]
fn test_create_session() {
    let (env, _, reward_token, client) = setup();
    let mentor = Address::generate(&env);
    let mentee = Address::generate(&env);
    let skills = default_skills(&env);

    client.register_mentor(&mentor, &skills, &500i128);
    client.register_mentee(&mentee);
    mint_tokens(&env, &reward_token, &env.current_contract_address(), &mentee, 10_000);

    let goal = String::from_str(&env, "Learn logic puzzles");
    let session = client.create_session(&mentee, &mentor, &SkillCategory::Logic, &goal, &1000i128);

    assert_eq!(session.mentor, mentor);
    assert_eq!(session.mentee, mentee);
    assert_eq!(session.reward_amount, 1000);
    assert_eq!(session.status, SessionStatus::Pending);
}

#[test]
fn test_accept_session() {
    let (env, _, reward_token, client) = setup();
    let mentor = Address::generate(&env);
    let mentee = Address::generate(&env);

    client.register_mentor(&mentor, &default_skills(&env), &500i128);
    client.register_mentee(&mentee);
    mint_tokens(&env, &reward_token, &env.current_contract_address(), &mentee, 10_000);

    let goal = String::from_str(&env, "Learn math puzzles");
    let session = client.create_session(&mentee, &mentor, &SkillCategory::Math, &goal, &1000i128);

    let accepted = client.accept_session(&mentor, &session.session_id);
    assert_eq!(accepted.status, SessionStatus::Active);
}

#[test]
fn test_full_session_lifecycle() {
    let (env, _, reward_token, client) = setup();
    let mentor = Address::generate(&env);
    let mentee = Address::generate(&env);

    client.register_mentor(&mentor, &default_skills(&env), &500i128);
    client.register_mentee(&mentee);
    mint_tokens(&env, &reward_token, &env.current_contract_address(), &mentee, 10_000);

    let goal = String::from_str(&env, "Master logic puzzles");
    let session = client.create_session(&mentee, &mentor, &SkillCategory::Logic, &goal, &2000i128);

    client.accept_session(&mentor, &session.session_id);

    let notes = String::from_str(&env, "Covered all core patterns");
    client.submit_completion(&mentor, &session.session_id, &notes);

    let feedback = String::from_str(&env, "Very helpful mentor");
    let completed = client.verify_completion(&mentee, &session.session_id, &5u32, &feedback);

    assert_eq!(completed.status, SessionStatus::Completed);
    assert_eq!(completed.mentor_rating, 5);

    let mentor_profile = client.get_mentor_profile(&mentor).unwrap();
    assert_eq!(mentor_profile.completed_sessions, 1);
    assert_eq!(mentor_profile.rating_count, 1);
    assert!(mentor_profile.reputation_score > 0);
}

#[test]
fn test_cancel_pending_session() {
    let (env, _, reward_token, client) = setup();
    let mentor = Address::generate(&env);
    let mentee = Address::generate(&env);

    client.register_mentor(&mentor, &default_skills(&env), &500i128);
    client.register_mentee(&mentee);
    mint_tokens(&env, &reward_token, &env.current_contract_address(), &mentee, 10_000);

    let goal = String::from_str(&env, "Learn spatial puzzles");
    let mut skills = Vec::new(&env);
    skills.push_back(SkillCategory::Spatial);
    client.register_mentor(&mentor, &skills, &500i128);

    let session = client.create_session(
        &mentee,
        &mentor,
        &SkillCategory::Logic,
        &goal,
        &500i128,
    );

    let cancelled = client.cancel_session(&mentee, &session.session_id);
    assert_eq!(cancelled.status, SessionStatus::Cancelled);
}

#[test]
fn test_dispute_session() {
    let (env, _, reward_token, client) = setup();
    let mentor = Address::generate(&env);
    let mentee = Address::generate(&env);

    client.register_mentor(&mentor, &default_skills(&env), &500i128);
    client.register_mentee(&mentee);
    mint_tokens(&env, &reward_token, &env.current_contract_address(), &mentee, 10_000);

    let goal = String::from_str(&env, "Logic deep dive");
    let session = client.create_session(&mentee, &mentor, &SkillCategory::Logic, &goal, &1000i128);
    client.accept_session(&mentor, &session.session_id);

    let reason = String::from_str(&env, "Mentor did not cover the agreed material");
    let disputed = client.dispute_session(&mentee, &session.session_id, &reason);
    assert_eq!(disputed.status, SessionStatus::Disputed);
}

#[test]
fn test_resolve_dispute_favor_mentor() {
    let (env, admin, reward_token, client) = setup();
    let mentor = Address::generate(&env);
    let mentee = Address::generate(&env);

    client.register_mentor(&mentor, &default_skills(&env), &500i128);
    client.register_mentee(&mentee);
    mint_tokens(&env, &reward_token, &env.current_contract_address(), &mentee, 10_000);

    let goal = String::from_str(&env, "Math challenge");
    let session = client.create_session(&mentee, &mentor, &SkillCategory::Math, &goal, &1000i128);
    client.accept_session(&mentor, &session.session_id);

    let reason = String::from_str(&env, "Dispute reason");
    client.dispute_session(&mentee, &session.session_id, &reason);

    let resolved = client.resolve_dispute(&admin, &session.session_id, &DisputeOutcome::FavorMentor);
    assert_eq!(resolved.status, SessionStatus::Resolved);
    assert_eq!(resolved.dispute_outcome, Some(DisputeOutcome::FavorMentor));
}

#[test]
fn test_resolve_dispute_favor_mentee() {
    let (env, admin, reward_token, client) = setup();
    let mentor = Address::generate(&env);
    let mentee = Address::generate(&env);

    client.register_mentor(&mentor, &default_skills(&env), &500i128);
    client.register_mentee(&mentee);
    mint_tokens(&env, &reward_token, &env.current_contract_address(), &mentee, 10_000);

    let goal = String::from_str(&env, "Math challenge");
    let session = client.create_session(&mentee, &mentor, &SkillCategory::Math, &goal, &1000i128);
    client.accept_session(&mentor, &session.session_id);

    let reason = String::from_str(&env, "Dispute");
    client.dispute_session(&mentor, &session.session_id, &reason);

    let resolved = client.resolve_dispute(&admin, &session.session_id, &DisputeOutcome::FavorMentee);
    assert_eq!(resolved.status, SessionStatus::Resolved);
}

#[test]
fn test_resolve_dispute_split() {
    let (env, admin, reward_token, client) = setup();
    let mentor = Address::generate(&env);
    let mentee = Address::generate(&env);

    client.register_mentor(&mentor, &default_skills(&env), &500i128);
    client.register_mentee(&mentee);
    mint_tokens(&env, &reward_token, &env.current_contract_address(), &mentee, 10_000);

    let goal = String::from_str(&env, "Logic session");
    let session = client.create_session(&mentee, &mentor, &SkillCategory::Logic, &goal, &2000i128);
    client.accept_session(&mentor, &session.session_id);

    let reason = String::from_str(&env, "Split dispute");
    client.dispute_session(&mentee, &session.session_id, &reason);

    let resolved = client.resolve_dispute(&admin, &session.session_id, &DisputeOutcome::Split);
    assert_eq!(resolved.status, SessionStatus::Resolved);
    assert_eq!(resolved.dispute_outcome, Some(DisputeOutcome::Split));
}

#[test]
fn test_leaderboard_ordering() {
    let (env, _, reward_token, client) = setup();
    let mentor1 = Address::generate(&env);
    let mentor2 = Address::generate(&env);
    let mentee = Address::generate(&env);

    client.register_mentor(&mentor1, &default_skills(&env), &500i128);
    client.register_mentor(&mentor2, &default_skills(&env), &500i128);
    client.register_mentee(&mentee);
    mint_tokens(&env, &reward_token, &env.current_contract_address(), &mentee, 100_000);

    let goal = String::from_str(&env, "Session goal");
    let notes = String::from_str(&env, "Done");
    let fb = String::from_str(&env, "Great");

    let s1 = client.create_session(&mentee, &mentor1, &SkillCategory::Logic, &goal, &1000i128);
    client.accept_session(&mentor1, &s1.session_id);
    client.submit_completion(&mentor1, &s1.session_id, &notes);
    client.verify_completion(&mentee, &s1.session_id, &5u32, &fb);

    let s2 = client.create_session(&mentee, &mentor2, &SkillCategory::Math, &goal, &1000i128);
    client.accept_session(&mentor2, &s2.session_id);
    client.submit_completion(&mentor2, &s2.session_id, &notes);
    client.verify_completion(&mentee, &s2.session_id, &3u32, &fb);

    let board = client.get_top_mentors(&10u32);
    assert_eq!(board.len(), 2);
    let first = board.get(0).unwrap();
    let second = board.get(1).unwrap();
    assert!(first.reputation_score >= second.reputation_score);
    assert_eq!(first.rank, 1);
}

#[test]
fn test_platform_stats() {
    let (env, _, reward_token, client) = setup();
    let mentor = Address::generate(&env);
    let mentee = Address::generate(&env);

    client.register_mentor(&mentor, &default_skills(&env), &500i128);
    client.register_mentee(&mentee);
    mint_tokens(&env, &reward_token, &env.current_contract_address(), &mentee, 10_000);

    let stats_before = client.get_platform_stats();
    assert_eq!(stats_before.total_mentors, 1);
    assert_eq!(stats_before.total_mentees, 1);

    let goal = String::from_str(&env, "Learn logic");
    let session = client.create_session(&mentee, &mentor, &SkillCategory::Logic, &goal, &1000i128);
    client.accept_session(&mentor, &session.session_id);
    client.submit_completion(&mentor, &session.session_id, &String::from_str(&env, "done"));
    client.verify_completion(&mentee, &session.session_id, &4u32, &String::from_str(&env, "good"));

    let stats_after = client.get_platform_stats();
    assert_eq!(stats_after.completed_sessions, 1);
    assert!(stats_after.total_rewards_distributed > 0);
    assert!(stats_after.total_fees_collected > 0);
}

#[test]
fn test_transfer_admin() {
    let (env, admin, _, client) = setup();
    let new_admin = Address::generate(&env);

    client.transfer_admin(&admin, &new_admin);
    assert_eq!(client.get_admin(), new_admin);
}

#[test]
fn test_update_platform_fee() {
    let (_, admin, _, client) = setup();
    client.update_platform_fee(&admin, &250u32);
}

#[test]
#[should_panic]
fn test_fee_exceeds_max() {
    let (_, admin, _, client) = setup();
    client.update_platform_fee(&admin, &3001u32);
}

#[test]
#[should_panic]
fn test_self_mentorship() {
    let (env, _, reward_token, client) = setup();
    let player = Address::generate(&env);

    client.register_mentor(&player, &default_skills(&env), &500i128);
    client.register_mentee(&player);
    mint_tokens(&env, &reward_token, &env.current_contract_address(), &player, 10_000);

    let goal = String::from_str(&env, "Self taught");
    client.create_session(&player, &player, &SkillCategory::Logic, &goal, &1000i128);
}

#[test]
#[should_panic]
fn test_skill_not_offered() {
    let (env, _, reward_token, client) = setup();
    let mentor = Address::generate(&env);
    let mentee = Address::generate(&env);

    let mut skills = Vec::new(&env);
    skills.push_back(SkillCategory::Math);
    client.register_mentor(&mentor, &skills, &500i128);
    client.register_mentee(&mentee);
    mint_tokens(&env, &reward_token, &env.current_contract_address(), &mentee, 10_000);

    let goal = String::from_str(&env, "Learn cryptography");
    client.create_session(&mentee, &mentor, &SkillCategory::Cryptography, &goal, &1000i128);
}

#[test]
#[should_panic]
fn test_invalid_rating_zero() {
    let (env, _, reward_token, client) = setup();
    let mentor = Address::generate(&env);
    let mentee = Address::generate(&env);

    client.register_mentor(&mentor, &default_skills(&env), &500i128);
    client.register_mentee(&mentee);
    mint_tokens(&env, &reward_token, &env.current_contract_address(), &mentee, 10_000);

    let goal = String::from_str(&env, "Logic session");
    let session = client.create_session(&mentee, &mentor, &SkillCategory::Logic, &goal, &1000i128);
    client.accept_session(&mentor, &session.session_id);
    client.submit_completion(&mentor, &session.session_id, &String::from_str(&env, "done"));
    client.verify_completion(&mentee, &session.session_id, &0u32, &String::from_str(&env, "bad"));
}

#[test]
#[should_panic]
fn test_unauthorized_dispute_resolution() {
    let (env, _, reward_token, client) = setup();
    let mentor = Address::generate(&env);
    let mentee = Address::generate(&env);
    let random = Address::generate(&env);

    client.register_mentor(&mentor, &default_skills(&env), &500i128);
    client.register_mentee(&mentee);
    mint_tokens(&env, &reward_token, &env.current_contract_address(), &mentee, 10_000);

    let goal = String::from_str(&env, "Logic session");
    let session = client.create_session(&mentee, &mentor, &SkillCategory::Logic, &goal, &1000i128);
    client.accept_session(&mentor, &session.session_id);

    let reason = String::from_str(&env, "Dispute");
    client.dispute_session(&mentee, &session.session_id, &reason);
    client.resolve_dispute(&random, &session.session_id, &DisputeOutcome::Split);
}
