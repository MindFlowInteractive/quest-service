use soroban_sdk::{symbol_short, Address, Env};
use crate::types::{DisputeOutcome, SessionStatus, SkillCategory};

pub fn emit_initialized(env: &Env, admin: &Address, token: &Address) {
    env.events().publish(
        (symbol_short!("init"),),
        (admin.clone(), token.clone()),
    );
}

pub fn emit_mentor_registered(env: &Env, mentor: &Address) {
    env.events().publish(
        (symbol_short!("mnt_reg"), mentor.clone()),
        (env.ledger().timestamp(),),
    );
}

pub fn emit_mentee_registered(env: &Env, mentee: &Address) {
    env.events().publish(
        (symbol_short!("mte_reg"), mentee.clone()),
        (env.ledger().timestamp(),),
    );
}

pub fn emit_session_created(env: &Env, session_id: u64, mentor: &Address, mentee: &Address, category: &SkillCategory) {
    env.events().publish(
        (symbol_short!("ses_crt"), session_id),
        (mentor.clone(), mentee.clone(), category.clone()),
    );
}

pub fn emit_session_accepted(env: &Env, session_id: u64, mentor: &Address) {
    env.events().publish(
        (symbol_short!("ses_acc"), session_id),
        (mentor.clone(),),
    );
}

pub fn emit_completion_submitted(env: &Env, session_id: u64, mentor: &Address) {
    env.events().publish(
        (symbol_short!("cmp_sub"), session_id),
        (mentor.clone(),),
    );
}

pub fn emit_session_completed(env: &Env, session_id: u64, mentee: &Address, rating: u32) {
    env.events().publish(
        (symbol_short!("ses_cmp"), session_id),
        (mentee.clone(), rating),
    );
}

pub fn emit_session_disputed(env: &Env, session_id: u64, caller: &Address) {
    env.events().publish(
        (symbol_short!("ses_dsp"), session_id),
        (caller.clone(),),
    );
}

pub fn emit_dispute_resolved(env: &Env, session_id: u64, outcome: &DisputeOutcome) {
    env.events().publish(
        (symbol_short!("dsp_res"), session_id),
        (outcome.clone(),),
    );
}

pub fn emit_session_cancelled(env: &Env, session_id: u64, mentee: &Address) {
    env.events().publish(
        (symbol_short!("ses_can"), session_id),
        (mentee.clone(),),
    );
}

pub fn emit_admin_transferred(env: &Env, old: &Address, new: &Address) {
    env.events().publish(
        (symbol_short!("adm_xfr"),),
        (old.clone(), new.clone()),
    );
}
