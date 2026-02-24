use soroban_sdk::{symbol_short, Address, Env};
use crate::types::{Badge, Credential};

pub fn emit_initialized(env: &Env, admin: &Address) {
    env.events().publish(
        (symbol_short!("init"),),
        (admin.clone(),),
    );
}

pub fn emit_badge_awarded(env: &Env, player: &Address, badge: &Badge) {
    env.events().publish(
        (symbol_short!("badge_awrd"), player.clone()),
        (badge.badge_id, badge.category.clone(), badge.level.clone(), badge.xp),
    );
}

pub fn emit_progress_updated(env: &Env, player: &Address, badge: &Badge) {
    env.events().publish(
        (symbol_short!("prog_upd"), player.clone()),
        (badge.badge_id, badge.category.clone(), badge.level.clone(), badge.puzzles_solved),
    );
}

pub fn emit_credential_issued(env: &Env, player: &Address, credential: &Credential) {
    env.events().publish(
        (symbol_short!("cred_iss"), player.clone()),
        (credential.credential_id, credential.badge.category.clone()),
    );
}

pub fn emit_credential_revoked(env: &Env, credential_id: u64) {
    env.events().publish(
        (symbol_short!("cred_rvk"),),
        (credential_id,),
    );
}

pub fn emit_admin_transferred(env: &Env, old_admin: &Address, new_admin: &Address) {
    env.events().publish(
        (symbol_short!("adm_xfer"),),
        (old_admin.clone(), new_admin.clone()),
    );
}
