-- Sliding window from two buckets: what is left of the previous one counts in proportion.
-- KEYS: current bucket, previous bucket. ARGV: limit, weight of the previous bucket, cost, lifetime in ms.
-- Answers 1 when allowed. A refused request is not counted; cost 0 only looks.
local used = tonumber(redis.call('GET', KEYS[1]) or '0')
        + tonumber(redis.call('GET', KEYS[2]) or '0') * tonumber(ARGV[2])
if used >= tonumber(ARGV[1]) then
    return 0
end
if tonumber(ARGV[3]) > 0 then
    redis.call('INCR', KEYS[1])
    redis.call('PEXPIRE', KEYS[1], ARGV[4])
end
return 1
