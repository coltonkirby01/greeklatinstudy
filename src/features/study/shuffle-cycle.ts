export type ShuffleCycleState = {
  signature: string;
  remaining: string[];
  lastOrder: string[];
};

export function emptyShuffleCycle(): ShuffleCycleState {
  return { signature: "", remaining: [], lastOrder: [] };
}

function sameOrder(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function shuffledCycleOrder(keys: readonly string[], previousOrder: readonly string[] = [], avoidFirst?: string, random: () => number = Math.random) {
  const order = [...keys];
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [order[index], order[swap]] = [order[swap], order[index]];
  }

  if (order.length > 1 && sameOrder(order, previousOrder)) {
    [order[0], order[1]] = [order[1], order[0]];
  }

  if (avoidFirst && order.length > 1 && order[0] === avoidFirst) {
    const replacement = order.findIndex((key, index) => index > 0 && key !== avoidFirst);
    if (replacement > 0) [order[0], order[replacement]] = [order[replacement], order[0]];
  }

  return order;
}

export function nextShuffleKey(
  keys: readonly string[],
  state: ShuffleCycleState,
  options: { avoidKey?: string; random?: () => number } = {},
): { key: string | null; state: ShuffleCycleState } {
  const uniqueKeys = [...new Set(keys)];
  if (!uniqueKeys.length) return { key: null, state: emptyShuffleCycle() };

  const signature = [...uniqueKeys].sort().join("|");
  const keySet = new Set(uniqueKeys);
  let remaining = state.signature === signature ? state.remaining.filter((key) => keySet.has(key)) : [];
  let lastOrder = state.signature === signature ? state.lastOrder.filter((key) => keySet.has(key)) : [];

  if (!remaining.length) {
    const order = shuffledCycleOrder(uniqueKeys, lastOrder, options.avoidKey, options.random ?? Math.random);
    lastOrder = order;
    remaining = [...order];
  }

  if (options.avoidKey && remaining.length > 1 && remaining[0] === options.avoidKey) {
    const replacement = remaining.findIndex((key) => key !== options.avoidKey);
    if (replacement > 0) [remaining[0], remaining[replacement]] = [remaining[replacement], remaining[0]];
  }

  const key = remaining.shift() ?? null;
  return { key, state: { signature, remaining, lastOrder } };
}
