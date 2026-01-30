#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "$0")" && pwd)
BASE_URL="http://localhost:3000/api/cache"
REDIS_CLI=(redis-cli)

echo "Resetting stats"
${REDIS_CLI[@]} del cache:hits cache:misses >/dev/null || true

echo "1) GET key 'itest:1' (expect MISS)"
curl -sS "$BASE_URL/itest:1" | jq -C .

echo "2) GET key 'itest:1' again (expect HIT)"
curl -sS "$BASE_URL/itest:1" | jq -C .

echo "3) TTL expiry test: GET ittl with ttl=2s"
curl -sS "$BASE_URL/ittl?ttl=2" | jq -C .
 echo "sleep 3 to allow expiry"
sleep 3
 echo "GET ittl again (should be MISS/new value)"
curl -sS "$BASE_URL/ittl" | jq -C .

echo "4) Warm keys"
echo '{"keys":["warm:1","warm:2"],"ttl":60}' | curl -sS -H 'Content-Type: application/json' -d @- "$BASE_URL/warm" | jq -C .

echo "5) Invalidate key warm:1"
echo '{"key":"warm:1"}' | curl -sS -H 'Content-Type: application/json' -d @- "$BASE_URL/invalidate" | jq -C .

echo "6) Invalidate pattern warm:*"
echo '{"pattern":"warm:*"}' | curl -sS -H 'Content-Type: application/json' -d @- "$BASE_URL/invalidate" | jq -C .

echo "7) Stats"
curl -sS "$BASE_URL/stats" | jq -C .

echo "8) Lock test: acquire, concurrent attempt, release"
LOCK_RESP=$(echo '{"resource":"r1","ttl":5000}' | curl -sS -H 'Content-Type: application/json' -d @- "$BASE_URL/lock/acquire")
# print raw JSON
echo "acquire -> $LOCK_RESP"
# parse
KEY=$(echo "$LOCK_RESP" | jq -r '.lock.key // empty')
TOKEN=$(echo "$LOCK_RESP" | jq -r '.lock.token // empty')
if [ -z "$KEY" ] || [ -z "$TOKEN" ]; then
  echo "Could not acquire initial lock; test failed"; exit 2
fi

# try acquire concurrently (should fail quickly and return acquired=false)
SECOND=$(echo '{"resource":"r1","ttl":5000}' | curl -sS -H 'Content-Type: application/json' -d @- "$BASE_URL/lock/acquire")
echo "concurrent acquire -> $SECOND"

# release
echo "Checking stored token via admin endpoint"
STORED=$(curl -sS "$BASE_URL/admin/key/$KEY" | jq -r '.value // empty')
echo "stored="$STORED
if [ "$STORED" != "$TOKEN" ]; then
  echo "Token mismatch before release: stored=$STORED token=$TOKEN"
fi

echo "Releasing lock"
RELEASE=$(echo "{\"key\": \"$KEY\", \"token\": \"$TOKEN\"}" | curl -sS -H 'Content-Type: application/json' -d @- "$BASE_URL/lock/release")
echo "release -> $RELEASE"

# try acquire again after release
THIRD=$(echo '{"resource":"r1","ttl":5000}' | curl -sS -H 'Content-Type: application/json' -d @- "$BASE_URL/lock/acquire")
echo "acquire after release -> $THIRD"

echo "Integration tests completed"
