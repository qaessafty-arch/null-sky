// Pure Elo computation. No IO, no side effects.
// Importable by both server and client code paths.

export type EloResult = 'white' | 'black' | 'draw';

export interface EloDeltaResult {
  whiteDelta: number;
  blackDelta: number;
  newWhiteElo: number;
  newBlackElo: number;
}

/** Compute Elo rating changes for a finished game.
 *
 *  K-factor scales with experience (fewer games → more volatile).
 *  Deltas are bounded to ±50 to avoid extreme swings.
 *  Ratings are floored at 100.
 */
export function computeEloDelta(
  whiteElo: number,
  blackElo: number,
  result: EloResult,
  whiteGames = 30,
  blackGames = 30,
): EloDeltaResult {
  const getK = (games: number) => {
    if (games < 30) return 40;
    if (games < 50) return 30;
    return 20;
  };

  const kW = getK(whiteGames);
  const kB = getK(blackGames);

  const expectedW =
    1 / (1 + Math.pow(10, (blackElo - whiteElo) / 400));
  const expectedB =
    1 / (1 + Math.pow(10, (whiteElo - blackElo) / 400));

  let actualW = 0.5;
  let actualB = 0.5;
  if (result === 'white') {
    actualW = 1;
    actualB = 0;
  } else if (result === 'black') {
    actualW = 0;
    actualB = 1;
  }

  const rawW = Math.round(kW * (actualW - expectedW));
  const rawB = Math.round(kB * (actualB - expectedB));

  const maxDelta = 50;
  const deltaW = Math.max(-maxDelta, Math.min(maxDelta, rawW));
  const deltaB = Math.max(-maxDelta, Math.min(maxDelta, rawB));

  return {
    whiteDelta: deltaW,
    blackDelta: deltaB,
    newWhiteElo: Math.max(100, whiteElo + deltaW),
    newBlackElo: Math.max(100, blackElo + deltaB),
  };
}
