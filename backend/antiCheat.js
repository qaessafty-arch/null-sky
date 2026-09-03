// FILE: backend/antiCheat.js
/**
 * ENHANCED ANTI-CHEAT DETECTION ENGINE
 * Monitors move timing variance, centipawn accuracy, Stockfish correlation,
 * adjusts thresholds based on player ELO, reduces false positives, requires
 * multiple flags before action, and enforces automated suspensions.
 */

import winston from 'winston';
import { query } from './database.js';
import { UserModel } from './models.js';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export class EnhancedAntiCheat {
  constructor(redisClient = null, io = null) {
    this.redis = redisClient;
    this.io = io;
    this.MONITOR_FLAG_THRESHOLD = 3;
    this.BAN_FLAG_THRESHOLD = 5;
    this.BAN_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days suspension
    this.FLAG_REDIS_TTL_SEC = 24 * 60 * 60; // 24 hours
  }

  /**
   * FIX 11: Analyze player behavior with ELO-adjusted thresholds and minimum move requirements
   * @param {string} gameId 
   * @param {string} playerId 
   * @param {Array} moves 
   * @param {object} analysisMetrics 
   */
  async analyzePlayer(gameId, playerId, moves = [], analysisMetrics = {}) {
    // Require minimum 10 moves to reduce false positives
    if (!moves || moves.length < 10) {
      return { flagged: false, reason: 'Insufficient moves for statistical confidence (min 10 required)' };
    }

    // Retrieve player ELO to calibrate sensitivity
    const player = await UserModel.findById(playerId);
    const elo = player ? (player.elo_rating || 1200) : 1200;

    // Adjust thresholds dynamically based on ELO
    // Lower ELO players have higher natural variance and occasional lucky moves
    const thresholds = {
      bestMoveRate: elo > 2000 ? 85 : 92,
      accuracy: elo > 2000 ? 90 : 95,
      moveTimeVariance: 50,
      averageMoveTime: 200
    };

    let flagTriggered = false;
    let flagReason = '';

    // 1. Move Timing Variance (Robotic Interval Detection)
    const moveTimes = moves.map(m => m.elapsedTime || m.elapsedMs || 0).filter(t => t > 0);
    if (moveTimes.length >= 10) {
      const sample = moveTimes.slice(-10);
      const avg = sample.reduce((a, b) => a + b, 0) / sample.length;
      const variance = Math.sqrt(
        sample.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / sample.length
      );

      if (avg < thresholds.averageMoveTime && variance < thresholds.moveTimeVariance) {
        flagTriggered = true;
        flagReason = `Robotic move cadence: avg ${Math.round(avg)}ms, variance ${Math.round(variance)}ms`;
      }
    }

    // 2. Superhuman Engine Correlation
    if (analysisMetrics.accuracy && analysisMetrics.bestMoveRate) {
      if (analysisMetrics.accuracy >= thresholds.accuracy && analysisMetrics.bestMoveRate >= thresholds.bestMoveRate) {
        flagTriggered = true;
        flagReason = `Engine correlation: accuracy ${analysisMetrics.accuracy}%, best moves ${analysisMetrics.bestMoveRate}%`;
      }
    }

    if (!flagTriggered) {
      return { flagged: false, status: 'clean' };
    }

    // Record flag and check threshold
    const flagRecord = await this.flagUser({
      userId: playerId,
      gameId,
      flagType: flagReason,
      metricValue: analysisMetrics.accuracy || 0,
      thresholdValue: thresholds.accuracy,
      details: { elo, movesCount: moves.length, metrics: analysisMetrics }
    });

    const flagCount = flagRecord.totalFlags;
    if (flagCount < this.MONITOR_FLAG_THRESHOLD) {
      return { flagged: true, confidence: 'low', action: 'monitor', flagCount };
    } else if (flagCount < this.BAN_FLAG_THRESHOLD) {
      return { flagged: true, confidence: 'medium', action: 'review_pending', flagCount };
    } else {
      return { flagged: true, confidence: 'high', action: 'ban', flagCount };
    }
  }

  /**
   * Move time analysis: Detect robotic speeds and unnatural low variance
   */
  async analyzeMoveTimings(userId, gameId, moveTimes = []) {
    if (!moveTimes || moveTimes.length < 10) return null;

    const sample = moveTimes.slice(-10);
    const avg = sample.reduce((a, b) => a + b, 0) / sample.length;
    const variance = Math.sqrt(
      sample.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / sample.length
    );

    if (avg < 200 && variance < 50) {
      return await this.flagUser({
        userId,
        gameId,
        flagType: 'ROBOTIC_MOVE_INTERVAL',
        metricValue: Math.round(variance),
        thresholdValue: 50,
        details: { avgTimeMs: Math.round(avg), varianceMs: Math.round(variance), sampleCount: sample.length }
      });
    }

    return null;
  }

  /**
   * Accuracy analysis: Best move rate > 85%, accuracy > 90%
   */
  async analyzeGameAccuracy(userId, gameId, { accuracy, bestMoveRate, engineCentipawnLoss }) {
    const isSuperhuman = accuracy > 90 && bestMoveRate > 85;

    if (isSuperhuman) {
      return await this.flagUser({
        userId,
        gameId,
        flagType: 'SUPERHUMAN_ENGINE_CORRELATION',
        metricValue: accuracy,
        thresholdValue: 90,
        details: { accuracy, bestMoveRate, engineCentipawnLoss }
      });
    }

    return null;
  }

  /**
   * Flag user in database and Redis, check for threshold auto-ban
   */
  async flagUser({ userId, gameId, flagType, metricValue, thresholdValue, details = {} }) {
    const timestamp = new Date();
    const reason = { flagType, metricValue, thresholdValue, details, timestamp };

    // 1. Insert flag into PostgreSQL
    try {
      await query(
        `INSERT INTO cheat_flags (game_id, player_id, reasons, flagged_at, status)
         VALUES ($1, $2, $3, $4, 'pending_review')`,
        [gameId, userId, JSON.stringify(reason), timestamp]
      );
    } catch (err) {
      logger.error('Error inserting cheat flag into database:', { error: err.message });
    }

    // 2. Increment user flags count in Redis (24hr expiry)
    let totalFlags = 1;
    if (this.redis) {
      const redisKey = `anticheat:flags:${userId}`;
      try {
        totalFlags = await this.redis.incr(redisKey);
        if (totalFlags === 1) {
          await this.redis.expire(redisKey, this.FLAG_REDIS_TTL_SEC);
        }
      } catch (err) {
        logger.warn('Redis flag tracking fallback');
      }
    }

    // 3. Notify moderators via WebSocket
    if (this.io) {
      this.io.to('moderators').emit('notification', {
        type: 'CHEAT_FLAG_ALERT',
        message: `User ${userId} flagged for ${flagType} in game ${gameId}`,
        data: { userId, gameId, flagType, totalFlags, details }
      });
    }

    // 4. Auto-ban after 5 flags (7-day suspension)
    if (totalFlags >= this.BAN_FLAG_THRESHOLD) {
      await this.banUser(userId, 'Automated anti-cheat detection threshold reached (7-day suspension)');
      return { banned: true, totalFlags, reason: flagType };
    }

    return { banned: false, totalFlags, reason: flagType };
  }

  /**
   * Decrement flag count on appeal or false positive review
   * @param {string} userId 
   */
  async decrementFlag(userId) {
    if (this.redis) {
      const redisKey = `anticheat:flags:${userId}`;
      try {
        const current = await this.redis.get(redisKey);
        if (current && parseInt(current, 10) > 0) {
          await this.redis.decr(redisKey);
        }
      } catch (err) {
        logger.warn('Redis decrement flag warning:', { error: err.message });
      }
    }
  }

  /**
   * Completely clear user flags (e.g., cleared by administrator)
   * @param {string} userId 
   */
  async clearUserFlags(userId) {
    if (this.redis) {
      await this.redis.del(`anticheat:flags:${userId}`);
    }
    await query(`UPDATE cheat_flags SET status = 'resolved_false_positive' WHERE player_id = $1`, [userId]);
  }

  /**
   * Suspend user account
   * @param {string} userId 
   * @param {string} reason 
   */
  async banUser(userId, reason) {
    const banExpires = new Date(Date.now() + this.BAN_DURATION_MS);
    try {
      await query(
        `UPDATE users
         SET is_banned = TRUE, ban_reason = $1, ban_expires = $2
         WHERE id = $3`,
        [reason, banExpires, userId]
      );

      if (this.io) {
        this.io.to(`user:${userId}`).emit('banned', {
          reason,
          duration: '7 days',
          message: 'Your account has been temporarily suspended due to repeated engine correlation flags.'
        });
      }

      logger.warn(`User ${userId} was banned by anti-cheat: ${reason}`);
    } catch (err) {
      logger.error('Error banning user:', { error: err.message });
    }
  }
}

// Export as both EnhancedAntiCheat and AntiCheatService for compatibility
export const AntiCheatService = EnhancedAntiCheat;
