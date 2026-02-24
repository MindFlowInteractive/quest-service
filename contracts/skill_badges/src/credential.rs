use soroban_sdk::{Address, Env, String, Vec, panic_with_error};
use crate::types::{Badge, Credential, DataKey};
use crate::storage::Storage;
use crate::errors::ContractError;

pub struct CredentialManager;

impl CredentialManager {
    pub fn issue_credential(
        env: &Env,
        player: &Address,
        badge: Badge,
        metadata: String,
    ) -> Credential {
        let credential_id = Storage::next_credential_id(env);
        let now = env.ledger().timestamp();

        let credential = Credential {
            credential_id,
            player: player.clone(),
            badge,
            metadata,
            issued_at: now,
            is_valid: true,
        };

        let key = DataKey::Credential(credential_id);
        env.storage().persistent().set(&key, &credential);

        Self::add_to_player_credentials(env, player, &credential);

        credential
    }

    pub fn get_credential(env: &Env, credential_id: u64) -> Option<Credential> {
        let key = DataKey::Credential(credential_id);
        env.storage().persistent().get(&key)
    }

    pub fn get_player_credentials(env: &Env, player: &Address) -> Vec<Credential> {
        let key = DataKey::PlayerCredentials(player.clone());
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(env))
    }

    pub fn revoke_credential(env: &Env, credential_id: u64) {
        let key = DataKey::Credential(credential_id);
        let mut credential: Credential = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic_with_error!(env, ContractError::CredentialNotFound));

        if !credential.is_valid {
            panic_with_error!(env, ContractError::CredentialRevoked);
        }

        credential.is_valid = false;
        env.storage().persistent().set(&key, &credential);

        Self::sync_player_credential(env, &credential.player.clone(), &credential);
    }

    fn add_to_player_credentials(env: &Env, player: &Address, credential: &Credential) {
        let key = DataKey::PlayerCredentials(player.clone());
        let mut credentials: Vec<Credential> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(env));
        credentials.push_back(credential.clone());
        env.storage().persistent().set(&key, &credentials);
    }

    fn sync_player_credential(env: &Env, player: &Address, updated: &Credential) {
        let key = DataKey::PlayerCredentials(player.clone());
        let credentials: Vec<Credential> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(env));

        let mut synced = Vec::new(env);
        for cred in credentials.iter() {
            if cred.credential_id == updated.credential_id {
                synced.push_back(updated.clone());
            } else {
                synced.push_back(cred);
            }
        }
        env.storage().persistent().set(&key, &synced);
    }
}
