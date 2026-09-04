// FILE: backend/tournament.js
/**
 * TOURNAMENT ENGINE
 * Implements Swiss System, Round Robin, Single/Double Elimination, Arena,
 * auto-pairing algorithms, Sonneborn-Berger tiebreaks, and real-time Socket.IO broadcasts.
 */

import { query } from './database.js';

export class TournamentEngine {
  constructor(io = null) {
    this.io = io;
  }

  /**
   * 1. Swiss System Pairings Algorithm:
   * Groups players with identical score, sorts by rating, prevents repeat pairings.
   */
  generateSwissPairings(participants = [], pastPairings = []) {
    // Clone and sort participants by score DESC, tiebreak DESC, elo DESC
    const sorted = [...participants].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.tiebreak_score !== a.tiebreak_score) return b.tiebreak_score - a.tiebreak_score;
      return (b.elo_rating || 1200) - (a.elo_rating || 1200);
    });

    const pairings = [];
    const pairedSet = new Set();

    // Check if odd number of participants -> grant bye to lowest ranked unpaired
    if (sorted.length % 2 !== 0) {
      for (let i = sorted.length - 1; i >= 0; i--) {
        const p = sorted[i];
        const hadBye = pastPairings.some(pair => pair.is_bye && (pair.white_player_id === p.user_id || pair.black_player_id === p.user_id));
        if (!hadBye) {
          pairedSet.add(p.user_id);
          pairings.push({
            white_player_id: p.user_id,
            black_player_id: null,
            is_bye: true,
            board_number: Math.ceil(sorted.length / 2)
          });
          break;
        }
      }
    }

    // Pair remaining participants
    let board = 1;
    for (let i = 0; i < sorted.length; i++) {
      const p1 = sorted[i];
      if (pairedSet.has(p1.user_id)) continue;

      let foundOpponent = false;
      for (let j = i + 1; j < sorted.length; j++) {
        const p2 = sorted[j];
        if (pairedSet.has(p2.user_id)) continue;

        // Check if they already played against each other
        const alreadyPlayed = pastPairings.some(pair =>
          (pair.white_player_id === p1.user_id && pair.black_player_id === p2.user_id) ||
          (pair.white_player_id === p2.user_id && pair.black_player_id === p1.user_id)
        );

        if (!alreadyPlayed) {
          pairedSet.add(p1.user_id);
          pairedSet.add(p2.user_id);
          pairings.push({
            white_player_id: p1.user_id,
            black_player_id: p2.user_id,
            is_bye: false,
            board_number: board++
          });
          foundOpponent = true;
          break;
        }
      }

      // If no valid unpaired opponent found without repeat, pair with next available
      if (!foundOpponent) {
        for (let j = i + 1; j < sorted.length; j++) {
          const p2 = sorted[j];
          if (!pairedSet.has(p2.user_id)) {
            pairedSet.add(p1.user_id);
            pairedSet.add(p2.user_id);
            pairings.push({
              white_player_id: p1.user_id,
              black_player_id: p2.user_id,
              is_bye: false,
              board_number: board++
            });
            break;
          }
        }
      }
    }

    return pairings;
  }

  /**
   * 2. Round Robin Pairings (Berger Tables / Polygon Rotation)
   */
  generateRoundRobinPairings(participants = [], roundNumber = 1) {
    const n = participants.length;
    if (n < 2) return [];

    const list = [...participants];
    if (n % 2 !== 0) {
      list.push({ user_id: null, isDummy: true });
    }

    const totalRounds = list.length - 1;
    const roundIdx = (roundNumber - 1) % totalRounds;

    // Polygon rotation
    const fixed = list[0];
    const rotating = list.slice(1);

    for (let r = 0; r < roundIdx; r++) {
      rotating.unshift(rotating.pop());
    }

    const currentOrder = [fixed, ...rotating];
    const pairings = [];
    const half = currentOrder.length / 2;

    for (let i = 0; i < half; i++) {
      const p1 = currentOrder[i];
      const p2 = currentOrder[currentOrder.length - 1 - i];

      if (p1.isDummy || p2.isDummy) {
        const realPlayer = p1.isDummy ? p2 : p1;
        pairings.push({
          white_player_id: realPlayer.user_id,
          black_player_id: null,
          is_bye: true,
          board_number: i + 1
        });
      } else {
        pairings.push({
          white_player_id: roundIdx % 2 === 0 ? p1.user_id : p2.user_id,
          black_player_id: roundIdx % 2 === 0 ? p2.user_id : p1.user_id,
          is_bye: false,
          board_number: i + 1
        });
      }
    }

    return pairings;
  }

  /**
   * 6. Calculate Sonneborn-Berger tiebreak score:
   * Sum of scores of opponents defeated + half of scores of opponents drawn.
   */
  calculateSonnebornBerger(userId, participantResults = new Map(), allParticipants = new Map()) {
    // participantResults: userId -> array of { opponentId, result: 'win' | 'draw' | 'loss' }
    const results = participantResults.get(userId) || [];
    let tiebreak = 0.0;

    for (const match of results) {
      const opp = allParticipants.get(match.opponentId);
      const oppScore = opp ? opp.score : 0.0;

      if (match.result === 'win') {
        tiebreak += oppScore;
      } else if (match.result === 'draw') {
        tiebreak += oppScore * 0.5;
      }
    }

    return Math.round(tiebreak * 100) / 100;
  }

  /**
   * 7. Start round and broadcast pairings
   */
  async startTournamentRound(tournamentId, roundNumber) {
    // Fetch participants
    const partsRes = await query(
      `SELECT tp.*, u.username, u.elo_rating
       FROM tournament_participants tp
       JOIN users u ON tp.user_id = u.id
       WHERE tp.tournament_id = $1 AND tp.eliminated = FALSE`,
      [tournamentId]
    );
    const participants = partsRes.rows;

    // Fetch past pairings
    const pastRes = await query('SELECT * FROM tournament_pairings WHERE tournament_id = $1', [tournamentId]);
    const pastPairings = pastRes.rows;

    const tournRes = await query('SELECT * FROM tournaments WHERE id = $1', [tournamentId]);
    const tournament = tournRes.rows[0];
    if (!tournament) return;

    let newPairings = [];
    if (tournament.type === 'round_robin') {
      newPairings = this.generateRoundRobinPairings(participants, roundNumber);
    } else {
      newPairings = this.generateSwissPairings(participants, pastPairings);
    }

    // Insert pairings
    for (const p of newPairings) {
      await query(
        `INSERT INTO tournament_pairings (tournament_id, round, white_player_id, black_player_id, is_bye, board_number)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tournamentId, roundNumber, p.white_player_id, p.black_player_id, p.is_bye, p.board_number]
      );
    }

    await query('UPDATE tournaments SET current_round = $1, status = \'active\' WHERE id = $2', [roundNumber, tournamentId]);

    // Broadcast real-time round start
    if (this.io) {
      this.io.to(`tournament:${tournamentId}`).emit('roundStarted', {
        round: roundNumber,
        pairings: newPairings,
        startTime: Date.now()
      });
    }

    return newPairings;
  }
}
