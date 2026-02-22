-- Energy System Migration
-- Creates tables for user energy, transactions, gifts, and boosts

-- User Energy table
CREATE TABLE user_energy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_energy INTEGER NOT NULL DEFAULT 100,
    max_energy INTEGER NOT NULL DEFAULT 100,
    last_regeneration TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    regeneration_rate INTEGER NOT NULL DEFAULT 1,
    regeneration_interval_minutes INTEGER NOT NULL DEFAULT 30,
    energy_gifts_sent_today INTEGER NOT NULL DEFAULT 0,
    energy_gifts_received_today INTEGER NOT NULL DEFAULT 0,
    last_gift_reset DATE NOT NULL DEFAULT CURRENT_DATE,
    boost_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    boost_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Energy Transaction Types
CREATE TYPE energy_transaction_type AS ENUM (
    'consumption',
    'regeneration',
    'token_refill',
    'gift_sent',
    'gift_received',
    'boost_applied',
    'admin_adjustment'
);

-- Energy Transactions table
CREATE TABLE energy_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type energy_transaction_type NOT NULL,
    amount INTEGER NOT NULL,
    energy_before INTEGER NOT NULL,
    energy_after INTEGER NOT NULL,
    related_entity_id UUID,
    related_entity_type VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Energy Gift Status
CREATE TYPE energy_gift_status AS ENUM (
    'pending',
    'accepted',
    'expired'
);

-- Energy Gifts table
CREATE TABLE energy_gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    energy_amount INTEGER NOT NULL DEFAULT 10,
    status energy_gift_status NOT NULL DEFAULT 'pending',
    message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (sender_id != recipient_id)
);

-- Energy Boost Types
CREATE TYPE energy_boost_type AS ENUM (
    'regeneration_speed',
    'max_energy_increase',
    'consumption_reduction',
    'instant_refill'
);

-- Energy Boosts table
CREATE TABLE energy_boosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    boost_type energy_boost_type NOT NULL,
    effect_value DECIMAL(5,2) NOT NULL,
    duration_minutes INTEGER,
    token_cost INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    icon_url VARCHAR(255),
    rarity VARCHAR(20) NOT NULL DEFAULT 'common',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_user_energy_user_id ON user_energy(user_id);
CREATE INDEX idx_energy_transactions_user_id_created_at ON energy_transactions(user_id, created_at);
CREATE INDEX idx_energy_transactions_type_created_at ON energy_transactions(transaction_type, created_at);
CREATE INDEX idx_energy_gifts_recipient_status ON energy_gifts(recipient_id, status);
CREATE INDEX idx_energy_gifts_sender_created_at ON energy_gifts(sender_id, created_at);
CREATE INDEX idx_energy_gifts_expires_at ON energy_gifts(expires_at);
CREATE INDEX idx_energy_boosts_active ON energy_boosts(is_active);
CREATE INDEX idx_energy_boosts_type ON energy_boosts(boost_type);

-- Add energy cost to puzzles table
ALTER TABLE puzzles ADD COLUMN energy_cost INTEGER NOT NULL DEFAULT 10;

-- Insert default energy boosts
INSERT INTO energy_boosts (name, description, boost_type, effect_value, duration_minutes, token_cost, rarity) VALUES
('Quick Recharge', 'Double energy regeneration speed for 1 hour', 'regeneration_speed', 2.0, 60, 5, 'common'),
('Energy Surge', 'Instantly restore 25 energy', 'instant_refill', 25, NULL, 3, 'common'),
('Mega Boost', 'Triple energy regeneration speed for 2 hours', 'regeneration_speed', 3.0, 120, 15, 'rare'),
('Energy Saver', 'Reduce energy consumption by 50% for 1 hour', 'consumption_reduction', 0.5, 60, 8, 'rare'),
('Max Power', 'Increase maximum energy by 50 for 24 hours', 'max_energy_increase', 50, 1440, 25, 'epic'),
('Full Restore', 'Instantly restore all energy', 'instant_refill', 100, NULL, 10, 'epic');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_energy_updated_at BEFORE UPDATE ON user_energy FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_energy_gifts_updated_at BEFORE UPDATE ON energy_gifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_energy_boosts_updated_at BEFORE UPDATE ON energy_boosts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();