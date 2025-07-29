// src/user/user.service.ts
import { Injectable, Logger } from '@nestjs/common';

export interface User {
  userId: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiry?: Date;
  googleWatchChannelId?: string;
  googleWatchResourceId?: string;
  googleWatchExpiry?: Date;
  trackedGoogleEventIds?: string[];
}

// In-memory store for demo purposes
const users = new Map<string, User>();

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  async findByUserId(userId: string): Promise<User | undefined> {
    return users.get(userId);
  }

  async findByGoogleWatchChannelId(
    channelId: string,
  ): Promise<User | undefined> {
    for (const user of users.values()) {
      if (user.googleWatchChannelId === channelId) {
        return user;
      }
    }
    return undefined;
  }

  async updateGoogleTokensAndWatchInfo(
    userId: string,
    tokens: {
      accessToken?: string;
      refreshToken?: string;
      expiryDate?: number;
      watchChannelId?: string;
      watchResourceId?: string;
      watchExpiry?: string;
    },
  ): Promise<User> {
    let user = users.get(userId);
    if (!user) {
      user = { userId };
      users.set(userId, user);
    }

    if (tokens.accessToken) user.googleAccessToken = tokens.accessToken;
    if (tokens.refreshToken) user.googleRefreshToken = tokens.refreshToken;
    if (tokens.expiryDate) user.googleTokenExpiry = new Date(tokens.expiryDate);
    if (tokens.watchChannelId !== undefined)
      user.googleWatchChannelId = tokens.watchChannelId; // Check for undefined
    if (tokens.watchResourceId !== undefined)
      user.googleWatchResourceId = tokens.watchResourceId; // Check for undefined
    if (tokens.watchExpiry !== undefined)
      user.googleWatchExpiry = new Date(parseInt(tokens.watchExpiry)); // Check for undefined

    // Only log if something meaningful was updated
    if (Object.keys(tokens).length > 0) {
      this.logger.debug(`User ${userId} Google tokens/watch info updated.`);
    }
    return user;
  }

  async addTrackedGoogleEventId(
    userId: string,
    eventId: string,
  ): Promise<User> {
    let user = users.get(userId);
    if (!user) {
      user = { userId };
      users.set(userId, user);
    }

    if (!user.trackedGoogleEventIds) {
      user.trackedGoogleEventIds = [];
    }
    if (!user.trackedGoogleEventIds.includes(eventId)) {
      user.trackedGoogleEventIds.push(eventId);
      this.logger.debug(
        `Added event ID ${eventId} to user ${userId}'s tracked events.`,
      );
    }
    return user;
  }

  // Simplified: Only necessary method for webhook cleanup
  async removeGoogleWatchChannel(channelId: string): Promise<void> {
    const user = await this.findByGoogleWatchChannelId(channelId);
    if (user) {
      user.googleWatchChannelId = undefined;
      user.googleWatchResourceId = undefined;
      user.googleWatchExpiry = undefined;
      // Optionally, clear tracked events associated with this channel if it's the only one
      // For this demo, we'll keep tracked events until a full logout.
      this.logger.debug(`Removed watch channel info for user ${user.userId}.`);
    }
  }
}
