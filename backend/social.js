// FILE: backend/social.js
/**
 * SOCIAL & COMMUNITY SERVICES
 * Friend system, direct challenges with 60s expiration, activity feeds,
 * player notes, achievements, and notifications.
 */

import { query } from './database.js';

export class SocialService {
  constructor(io = null) {
    this.io = io;
    this.pendingChallenges = new Map(); // challengeId -> { fromUserId, toUserId, timeControl, rated, createdAt, timeoutId }
  }

  /**
   * Send friend request
   */
  async sendFriendRequest(fromUserId, toUserId, message = '') {
    if (fromUserId === toUserId) throw new Error('Cannot friend yourself');

    const res = await query(
      `INSERT INTO friend_requests (from_user_id, to_user_id, message, status)
       VALUES ($1, $2, $3, 'pending')
       ON CONFLICT (from_user_id, to_user_id) DO UPDATE SET message = EXCLUDED.message, status = 'pending'
       RETURNING *`,
      [fromUserId, toUserId, message]
    );

    // Notify recipient
    if (this.io) {
      this.io.to(`user:${toUserId}`).emit('friendRequestReceived', {
        from: fromUserId,
        message,
        timestamp: Date.now()
      });
    }

    return res.rows[0];
  }

  /**
   * Accept friend request
   */
  async acceptFriendRequest(requestId, toUserId) {
    const reqRes = await query('SELECT * FROM friend_requests WHERE id = $1 AND to_user_id = $2', [requestId, toUserId]);
    const request = reqRes.rows[0];
    if (!request) throw new Error('Friend request not found');

    // Update request status
    await query("UPDATE friend_requests SET status = 'accepted' WHERE id = $1", [requestId]);

    // Create mutual friendships
    await query(
      `INSERT INTO friendships (user_id, friend_id, status)
       VALUES ($1, $2, 'accepted'), ($2, $1, 'accepted')
       ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted'`,
      [request.from_user_id, request.to_user_id]
    );

    // Update friends_count
    await query('UPDATE users SET friends_count = friends_count + 1 WHERE id IN ($1, $2)', [request.from_user_id, request.to_user_id]);

    // Notify sender
    if (this.io) {
      this.io.to(`user:${request.from_user_id}`).emit('friendRequestAccepted', {
        by: toUserId,
        timestamp: Date.now()
      });
    }

    return { success: true };
  }

  /**
   * Decline friend request
   */
  async declineFriendRequest(requestId, toUserId) {
    await query("UPDATE friend_requests SET status = 'declined' WHERE id = $1 AND to_user_id = $2", [requestId, toUserId]);
    return { success: true };
  }

  /**
   * Remove friend
   */
  async removeFriend(userId, friendId) {
    await query('DELETE FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)', [userId, friendId]);
    await query('UPDATE users SET friends_count = GREATEST(0, friends_count - 1) WHERE id IN ($1, $2)', [userId, friendId]);

    if (this.io) {
      this.io.to(`user:${friendId}`).emit('friendRemoved', { friendId: userId });
    }

    return { success: true };
  }

  /**
   * Get user friends with real-time online status
   */
  async getFriendsList(userId) {
    const res = await query(
      `SELECT u.id, u.username, u.display_name, u.country_code, u.avatar_url,
              u.elo_rating, u.rapid_rating, u.blitz_rating, u.bullet_rating,
              u.is_online, u.current_game_id, u.last_active, f.created_at as friendship_date
       FROM friendships f
       JOIN users u ON f.friend_id = u.id
       WHERE f.user_id = $1 AND f.status = 'accepted'
       ORDER BY u.is_online DESC, u.last_active DESC`,
      [userId]
    );
    return res.rows;
  }

  /**
   * Create direct challenge with 60-second expiration
   */
  createChallenge(fromUser, toUserId, timeControl = '10+0', rated = true) {
    const challengeId = `chal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const timeoutId = setTimeout(() => {
      this.pendingChallenges.delete(challengeId);
      if (this.io) {
        this.io.to(`user:${fromUser.id}`).emit('challengeDeclined', { by: toUserId, reason: 'Challenge expired (60s)' });
      }
    }, 60000); // 60s expiration

    this.pendingChallenges.set(challengeId, {
      challengeId,
      fromUser,
      toUserId,
      timeControl,
      rated,
      createdAt: Date.now(),
      timeoutId
    });

    if (this.io) {
      this.io.to(`user:${toUserId}`).emit('challengeReceived', {
        challengeId,
        from: fromUser.id,
        fromUsername: fromUser.username || fromUser.display_name,
        timeControl,
        rated,
        timestamp: Date.now()
      });
    }

    return challengeId;
  }

  /**
   * Accept challenge & clear timeout
   */
  acceptChallenge(challengeId, toUserId) {
    const challenge = this.pendingChallenges.get(challengeId);
    if (!challenge) throw new Error('Challenge expired or not found');
    if (challenge.toUserId !== toUserId) throw new Error('Unauthorized challenge acceptance');

    clearTimeout(challenge.timeoutId);
    this.pendingChallenges.delete(challengeId);

    return challenge;
  }

  /**
   * Decline challenge
   */
  declineChallenge(challengeId, toUserId) {
    const challenge = this.pendingChallenges.get(challengeId);
    if (challenge) {
      clearTimeout(challenge.timeoutId);
      this.pendingChallenges.delete(challengeId);
      if (this.io) {
        this.io.to(`user:${challenge.fromUser.id}`).emit('challengeDeclined', { by: toUserId });
      }
    }
    return { success: true };
  }

  /**
   * Record activity feed entry
   */
  async addActivity(userId, activityType, data = {}) {
    try {
      await query(
        `INSERT INTO activity_feed (user_id, activity_type, data)
         VALUES ($1, $2, $3)`,
        [userId, activityType, JSON.stringify(data)]
      );
    } catch (e) {
      console.error('[Social] Error adding activity feed:', e.message);
    }
  }

  /**
   * Get activity feed
   */
  async getActivityFeed(limit = 20, offset = 0) {
    const res = await query(
      `SELECT a.*, u.username, u.display_name, u.avatar_url
       FROM activity_feed a
       JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return res.rows;
  }
}
