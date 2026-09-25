import { generateKeyBetween } from 'fractional-indexing';

type Positioned = { position: string };

/** Key after the last item (plan §11.7). Lists are sorted with plain `<`/`>`, matching `collate "C"`. */
export const appendKey = (list: Positioned[]) => generateKeyBetween(list.at(-1)?.position ?? null, null);

export function keyForMove(list: Positioned[], from: number, to: number) {
  const rest = list.filter((_, i) => i !== from);
  return generateKeyBetween(to > 0 ? rest[to - 1]!.position : null, to < rest.length ? rest[to]!.position : null);
}

export const byPosition = (a: Positioned, b: Positioned) =>
  a.position < b.position ? -1 : a.position > b.position ? 1 : 0;
