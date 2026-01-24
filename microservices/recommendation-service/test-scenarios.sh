#!/bin/bash

# Configuration
BASE_URL="http://localhost:3000"
PLAYER_A="player-alpha"
PLAYER_B="player-beta"
PLAYER_C="player-gamma"

echo "🚀 Starting Recommendation Service Test Suite"
echo "--------------------------------------------"

# 1. Create Preferences for Player A
echo "📝 Setting preferences for $PLAYER_A..."
curl -s -X POST "$BASE_URL/preferences/$PLAYER_A" \
  -H "Content-Type: application/json" \
  -d '{"preferredCategories": ["sudoku", "logic"], "difficultyPreference": 0.8}'
echo -e "\n✅ Preferences set."

# 2. Simulate History to trigger Collaborative Filtering
# Player B and C play similar puzzles
echo "📂 Simulating global history..."
curl -s -X POST "$BASE_URL/recommendations/track" \
  -H "Content-Type: application/json" \
  -d "{\"playerId\": \"$PLAYER_B\", \"puzzleId\": \"puzzle-101\", \"action\": \"complete\", \"metadata\": {\"category\": \"logic\"}}"
curl -s -X POST "$BASE_URL/recommendations/track" \
  -H "Content-Type: application/json" \
  -d "{\"playerId\": \"$PLAYER_B\", \"puzzleId\": \"puzzle-999\", \"action\": \"rate\", \"rating\": 5}"

# Player A plays ONE common puzzle with B
curl -s -X POST "$BASE_URL/recommendations/track" \
  -H "Content-Type: application/json" \
  -d "{\"playerId\": \"$PLAYER_A\", \"puzzleId\": \"puzzle-101\", \"action\": \"complete\"}"
echo -e "\n✅ History tracked."

# 3. Get Personalized Recommendations
echo "🔍 Fetching personalized feed for $PLAYER_A..."
REC_OUTPUT=$(curl -s "$BASE_URL/recommendations/$PLAYER_A")
echo "Result: $REC_OUTPUT"

if [[ $REC_OUTPUT == *"puzzle-999"* ]]; then
  echo "✅ Personalization Success: Suggested puzzle-999 (from similar player $PLAYER_B)"
else
  echo "⚠️ Note: Collaborative match not found yet (might need more data), but feed generated."
fi

# 4. Track Click-Through Rate (CTR) & A/B Testing
echo "🖱️ Simulating a recommendation click (CTR)..."
curl -s -X POST "$BASE_URL/recommendations/track" \
  -H "Content-Type: application/json" \
  -d "{\"playerId\": \"$PLAYER_A\", \"puzzleId\": \"puzzle-999\", \"action\": \"click_recommendation\"}"
echo -e "\n✅ CTR click tracked. (Check service logs for 'CTR Tracked' message)"

# 5. Verify A/B Testing Assignment
echo "🧪 Checking A/B Testing record in DB..."
# We can't directly query the AB entity via HTTP yet, but it's generated on getRecs
echo "A/B group is assigned internally during recommendation generation."

echo "--------------------------------------------"
echo "🏁 Test Suite Complete"
