interface KVNamespaceBinding {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

interface Env {
  DAILY: KVNamespaceBinding;
}

interface StoredDailyRecord {
  lastClaim: string;
  streak: number;
}

export interface DailyRewardResponse {
  coins: number;
  streak: number;
  alreadyClaimed: boolean;
}

function getWarsawDateYYYYMMDD(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

function getPreviousDateYYYYMMDD(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.split('-').map((n) => parseInt(n, 10));
  const prevUtc = new Date(Date.UTC(y, m - 1, d - 1));
  const py = String(prevUtc.getUTCFullYear());
  const pm = String(prevUtc.getUTCMonth() + 1).padStart(2, '0');
  const pd = String(prevUtc.getUTCDate()).padStart(2, '0');
  return `${py}-${pm}-${pd}`;
}

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  };

  try {
    const body = (await context.request.json()) as { id?: unknown };
    const playerId = typeof body?.id === 'string' ? body.id.trim() : '';

    if (!playerId || playerId.length > 128) {
      return new Response(
        JSON.stringify({ error: 'Invalid player id' }),
        { status: 400, headers }
      );
    }

    if (!context.env?.DAILY) {
      return new Response(
        JSON.stringify({ error: 'KV binding DAILY is not configured' }),
        { status: 503, headers }
      );
    }

    const today = getWarsawDateYYYYMMDD(new Date());
    const yesterday = getPreviousDateYYYYMMDD(today);

    const rawRecord = await context.env.DAILY.get(playerId);
    let existing: StoredDailyRecord | null = null;
    if (rawRecord) {
      try {
        const parsed = JSON.parse(rawRecord) as Partial<StoredDailyRecord>;
        if (
          typeof parsed.lastClaim === 'string' &&
          typeof parsed.streak === 'number' &&
          parsed.streak >= 1
        ) {
          existing = {
            lastClaim: parsed.lastClaim,
            streak: Math.floor(parsed.streak)
          };
        }
      } catch {
        existing = null;
      }
    }

    // Drugi request tego samego dnia zwraca alreadyClaimed i nie dodaje monet drugi raz
    if (existing && existing.lastClaim === today) {
      const payload: DailyRewardResponse = {
        coins: 0,
        streak: existing.streak,
        alreadyClaimed: true
      };
      return new Response(JSON.stringify(payload), { status: 200, headers });
    }

    // Seria: 15 monet pierwszego dnia, +5 za każdy kolejny dzień z rzędu, sufit 40. Przerwa zeruje do 15.
    const nextStreak =
      existing && existing.lastClaim === yesterday ? existing.streak + 1 : 1;
    const rewardCoins = Math.min(40, 15 + (nextStreak - 1) * 5);

    const updatedRecord: StoredDailyRecord = {
      lastClaim: today,
      streak: nextStreak
    };
    await context.env.DAILY.put(playerId, JSON.stringify(updatedRecord));

    const payload: DailyRewardResponse = {
      coins: rewardCoins,
      streak: nextStreak,
      alreadyClaimed: false
    };
    return new Response(JSON.stringify(payload), { status: 200, headers });
  } catch {
    return new Response(
      JSON.stringify({ error: 'Daily reward request failed' }),
      { status: 500, headers }
    );
  }
};
