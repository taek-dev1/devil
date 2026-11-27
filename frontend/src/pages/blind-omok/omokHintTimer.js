export function scheduleHintCountdown(expiresAt, onTick, onExpire, {
    now = () => performance.now(),
    schedule = setTimeout,
    cancel = clearTimeout,
} = {}) {
    function tick() {
        const currentTime = now();
        const remaining = expiresAt - currentTime;
        if (remaining <= 0) {
            onExpire(currentTime);
            return;
        }
        const seconds = Math.ceil(remaining / 1000);
        onTick(seconds);
        timer = schedule(tick, Math.ceil(remaining - (seconds - 1) * 1000));
    }

    let timer = schedule(tick, 0);
    return () => cancel(timer);
}
