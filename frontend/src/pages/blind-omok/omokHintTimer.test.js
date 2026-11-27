import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HINT_DURATION } from './omokGame.js';
import { scheduleHintCountdown } from './omokHintTimer.js';

function countdown() {
    const startedAt = 100;
    let now = startedAt;
    let pending;
    const seconds = [];
    const expired = [];
    const cancel = scheduleHintCountdown(startedAt + HINT_DURATION, (value) => seconds.push(value), (value) => expired.push(value), {
        now: () => now,
        schedule(callback, delay) {
            assert.equal(pending, undefined);
            pending = { callback, due: now + delay };
            return pending;
        },
        cancel(timer) {
            if (pending === timer) pending = undefined;
        },
    });
    return {
        seconds,
        expired,
        cancel,
        advanceTo(ms) {
            now = startedAt + ms;
            if (pending && pending.due <= now) {
                const { callback } = pending;
                pending = undefined;
                callback();
            }
        },
    };
}

test('counts 5 to 1, then expires at the same five-second deadline without displaying zero', () => {
    const timer = countdown();
    for (const ms of [0, 1_000, 2_000, 3_000, 4_000, 4_999]) timer.advanceTo(ms);
    assert.deepEqual(timer.seconds, [5, 4, 3, 2, 1]);
    assert.deepEqual(timer.expired, []);
    timer.advanceTo(5_000);
    timer.advanceTo(10_000);
    assert.deepEqual(timer.seconds, [5, 4, 3, 2, 1]);
    assert.deepEqual(timer.expired, [5_100]);
});

test('a delayed callback uses the remaining time and does not extend the reveal', () => {
    const timer = countdown();
    for (const ms of [0, 2_700, 3_000, 4_100, 5_000]) timer.advanceTo(ms);
    assert.deepEqual(timer.seconds, [5, 3, 2, 1]);
    assert.deepEqual(timer.expired, [5_100]);
});

test('cleanup before the first tick or during a countdown stops further callbacks', () => {
    for (const ticks of [[], [0, 1000]]) {
        const timer = countdown();
        for (const ms of ticks) timer.advanceTo(ms);
        timer.cancel();
        for (const ms of [2000, 3000, 4000, 5000]) timer.advanceTo(ms);
        assert.equal(timer.seconds.length, ticks.length);
        assert.deepEqual(timer.expired, []);
    }
});
