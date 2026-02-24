use soroban_sdk::{Address, Env, String, Vec, panic_with_error, token};
use crate::types::{DataKey, DisputeOutcome, MentorshipSession, SessionStatus, SkillCategory};
use crate::storage::Storage;
use crate::errors::ContractError;
use crate::mentor::MentorManager;
use crate::mentee::MenteeManager;
use crate::stats::StatsManager;

pub struct SessionManager;

impl SessionManager {
    pub fn create(
        env: &Env,
        mentee: &Address,
        mentor: &Address,
        category: SkillCategory,
        goal: String,
        reward_amount: i128,
    ) -> MentorshipSession {
        if mentee == mentor {
            panic_with_error!(env, ContractError::SelfMentorship);
        }
        if reward_amount <= 0 {
            panic_with_error!(env, ContractError::InvalidRewardAmount);
        }
        if goal.len() == 0 {
            panic_with_error!(env, ContractError::InvalidGoal);
        }

        MenteeManager::require_active(env, mentee);
        let mentor_profile = MentorManager::require_active(env, mentor);

        let mut skill_found = false;
        for s in mentor_profile.skills.iter() {
            if s == category {
                skill_found = true;
                break;
            }
        }
        if !skill_found {
            panic_with_error!(env, ContractError::SkillNotOffered);
        }

        let fee_bps = Storage::get_platform_fee_bps(env);
        let platform_fee = (reward_amount * fee_bps as i128) / 10_000;
        let session_id = Storage::next_session_id(env);
        let now = env.ledger().timestamp();

        let reward_token = Storage::get_reward_token(env);
        let token_client = token::Client::new(env, &reward_token);
        let contract_address = env.current_contract_address();
        token_client.transfer(mentee, &contract_address, &reward_amount);

        env.storage()
            .persistent()
            .set(&DataKey::EscrowBalance(session_id), &reward_amount);

        let session = MentorshipSession {
            session_id,
            mentor: mentor.clone(),
            mentee: mentee.clone(),
            category,
            goal,
            reward_amount,
            platform_fee,
            status: SessionStatus::Pending,
            mentor_rating: 0,
            mentee_feedback: String::from_str(env, ""),
            outcome_notes: String::from_str(env, ""),
            dispute_reason: String::from_str(env, ""),
            dispute_outcome: None,
            created_at: now,
            accepted_at: 0,
            completed_at: 0,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Session(session_id), &session);

        Self::add_to_mentor_sessions(env, mentor, session_id);
        Self::add_to_mentee_sessions(env, mentee, session_id);
        MenteeManager::record_session_created(env, mentee);
        StatsManager::increment_total_sessions(env);

        session
    }

    pub fn accept(env: &Env, mentor: &Address, session_id: u64) -> MentorshipSession {
        let mut session = Self::get_or_panic(env, session_id);

        if session.mentor != *mentor {
            panic_with_error!(env, ContractError::Unauthorized);
        }
        if session.status != SessionStatus::Pending {
            panic_with_error!(env, ContractError::InvalidStatus);
        }

        session.status = SessionStatus::Active;
        session.accepted_at = env.ledger().timestamp();

        env.storage()
            .persistent()
            .set(&DataKey::Session(session_id), &session);

        MentorManager::record_session_accepted(env, mentor);

        session
    }

    pub fn submit_completion(
        env: &Env,
        mentor: &Address,
        session_id: u64,
        outcome_notes: String,
    ) -> MentorshipSession {
        let mut session = Self::get_or_panic(env, session_id);

        if session.mentor != *mentor {
            panic_with_error!(env, ContractError::Unauthorized);
        }
        if session.status != SessionStatus::Active {
            panic_with_error!(env, ContractError::InvalidStatus);
        }

        session.outcome_notes = outcome_notes;
        session.status = SessionStatus::PendingVerification;

        env.storage()
            .persistent()
            .set(&DataKey::Session(session_id), &session);

        session
    }

    pub fn verify_completion(
        env: &Env,
        mentee: &Address,
        session_id: u64,
        rating: u32,
        feedback: String,
    ) -> MentorshipSession {
        if rating == 0 || rating > 5 {
            panic_with_error!(env, ContractError::InvalidRating);
        }

        let mut session = Self::get_or_panic(env, session_id);

        if session.mentee != *mentee {
            panic_with_error!(env, ContractError::Unauthorized);
        }
        if session.status != SessionStatus::PendingVerification {
            panic_with_error!(env, ContractError::InvalidStatus);
        }

        let mentor_payout = session.reward_amount - session.platform_fee;
        let reward_token = Storage::get_reward_token(env);
        let token_client = token::Client::new(env, &reward_token);
        let contract_address = env.current_contract_address();
        let admin = Storage::get_admin(env);

        token_client.transfer(&contract_address, &session.mentor, &mentor_payout);
        if session.platform_fee > 0 {
            token_client.transfer(&contract_address, &admin, &session.platform_fee);
        }

        env.storage()
            .persistent()
            .remove(&DataKey::EscrowBalance(session_id));

        session.mentor_rating = rating;
        session.mentee_feedback = feedback;
        session.status = SessionStatus::Completed;
        session.completed_at = env.ledger().timestamp();

        env.storage()
            .persistent()
            .set(&DataKey::Session(session_id), &session);

        MentorManager::record_completion(env, &session.mentor, rating, mentor_payout);
        MenteeManager::record_completion(env, mentee, session.reward_amount);
        StatsManager::record_completion(env, session.reward_amount, session.platform_fee);

        session
    }

    pub fn dispute(
        env: &Env,
        caller: &Address,
        session_id: u64,
        reason: String,
    ) -> MentorshipSession {
        let mut session = Self::get_or_panic(env, session_id);

        if session.mentor != *caller && session.mentee != *caller {
            panic_with_error!(env, ContractError::Unauthorized);
        }
        if session.status == SessionStatus::Disputed {
            panic_with_error!(env, ContractError::SessionAlreadyDisputed);
        }
        if session.status != SessionStatus::Active
            && session.status != SessionStatus::PendingVerification
        {
            panic_with_error!(env, ContractError::InvalidStatus);
        }

        session.status = SessionStatus::Disputed;
        session.dispute_reason = reason;

        env.storage()
            .persistent()
            .set(&DataKey::Session(session_id), &session);

        StatsManager::increment_disputed(env);

        session
    }

    pub fn resolve_dispute(
        env: &Env,
        admin: &Address,
        session_id: u64,
        outcome: DisputeOutcome,
    ) -> MentorshipSession {
        Storage::require_admin(env, admin);

        let mut session = Self::get_or_panic(env, session_id);

        if session.status != SessionStatus::Disputed {
            panic_with_error!(env, ContractError::InvalidStatus);
        }

        let reward_token = Storage::get_reward_token(env);
        let token_client = token::Client::new(env, &reward_token);
        let contract_address = env.current_contract_address();
        let total = session.reward_amount;

        match &outcome {
            DisputeOutcome::FavorMentor => {
                let payout = total - session.platform_fee;
                token_client.transfer(&contract_address, &session.mentor, &payout);
                if session.platform_fee > 0 {
                    token_client.transfer(&contract_address, admin, &session.platform_fee);
                }
                StatsManager::record_completion(env, total, session.platform_fee);
            }
            DisputeOutcome::FavorMentee => {
                token_client.transfer(&contract_address, &session.mentee, &total);
            }
            DisputeOutcome::Split => {
                let half = total / 2;
                let remainder = total - half;
                token_client.transfer(&contract_address, &session.mentor, &half);
                token_client.transfer(&contract_address, &session.mentee, &remainder);
            }
        }

        env.storage()
            .persistent()
            .remove(&DataKey::EscrowBalance(session_id));

        session.status = SessionStatus::Resolved;
        session.dispute_outcome = Some(outcome);
        session.completed_at = env.ledger().timestamp();

        env.storage()
            .persistent()
            .set(&DataKey::Session(session_id), &session);

        session
    }

    pub fn cancel(env: &Env, mentee: &Address, session_id: u64) -> MentorshipSession {
        let mut session = Self::get_or_panic(env, session_id);

        if session.mentee != *mentee {
            panic_with_error!(env, ContractError::Unauthorized);
        }
        if session.status != SessionStatus::Pending {
            panic_with_error!(env, ContractError::InvalidStatus);
        }

        let reward_token = Storage::get_reward_token(env);
        let token_client = token::Client::new(env, &reward_token);
        let contract_address = env.current_contract_address();

        token_client.transfer(&contract_address, mentee, &session.reward_amount);
        env.storage()
            .persistent()
            .remove(&DataKey::EscrowBalance(session_id));

        session.status = SessionStatus::Cancelled;

        env.storage()
            .persistent()
            .set(&DataKey::Session(session_id), &session);

        session
    }

    pub fn get(env: &Env, session_id: u64) -> Option<MentorshipSession> {
        env.storage()
            .persistent()
            .get(&DataKey::Session(session_id))
    }

    pub fn get_mentor_sessions(env: &Env, mentor: &Address) -> Vec<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::MentorSessions(mentor.clone()))
            .unwrap_or_else(|| Vec::new(env))
    }

    pub fn get_mentee_sessions(env: &Env, mentee: &Address) -> Vec<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::MenteeSessions(mentee.clone()))
            .unwrap_or_else(|| Vec::new(env))
    }

    fn get_or_panic(env: &Env, session_id: u64) -> MentorshipSession {
        env.storage()
            .persistent()
            .get(&DataKey::Session(session_id))
            .unwrap_or_else(|| panic_with_error!(env, ContractError::SessionNotFound))
    }

    fn add_to_mentor_sessions(env: &Env, mentor: &Address, session_id: u64) {
        let key = DataKey::MentorSessions(mentor.clone());
        let mut ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(env));
        ids.push_back(session_id);
        env.storage().persistent().set(&key, &ids);
    }

    fn add_to_mentee_sessions(env: &Env, mentee: &Address, session_id: u64) {
        let key = DataKey::MenteeSessions(mentee.clone());
        let mut ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(env));
        ids.push_back(session_id);
        env.storage().persistent().set(&key, &ids);
    }
}
