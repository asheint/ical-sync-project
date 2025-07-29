// src/user/user.service.ts
import { Injectable, Logger } from '@nestjs/common';

// Define a separate interface for a tracked event
export interface TrackedEvent {
  googleEventId: string;
  icsContent?: string; // Will store the generated ICS string for this event
}

export interface User {
  userId: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiry?: Date;
  googleWatchChannelId?: string;
  googleWatchResourceId?: string;
  googleWatchExpiry?: Date;
  trackedEvents?: TrackedEvent[]; // Use an array of TrackedEvent
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
      user.googleWatchChannelId = tokens.watchChannelId;
    if (tokens.watchResourceId !== undefined)
      user.googleWatchResourceId = tokens.watchResourceId;
    if (tokens.watchExpiry !== undefined)
      user.googleWatchExpiry = new Date(parseInt(tokens.watchExpiry));

    if (Object.keys(tokens).length > 0) {
      this.logger.debug(`User ${userId} Google tokens/watch info updated.`);
    }
    return user;
  }

  // MODIFIED: To also accept icsContent for the tracked event
  async addTrackedGoogleEvent(
    userId: string,
    googleEventId: string,
    icsContent: string,
  ): Promise<User> {
    let user = users.get(userId);
    if (!user) {
      user = { userId };
      users.set(userId, user);
    }

    if (!user.trackedEvents) {
      user.trackedEvents = [];
    }

    let existingEvent = user.trackedEvents.find(
      (e) => e.googleEventId === googleEventId,
    );
    if (existingEvent) {
      existingEvent.icsContent = icsContent; // Update existing
      this.logger.debug(
        `Updated ICS content for existing event ID ${googleEventId} for user ${userId}.`,
      );
    } else {
      user.trackedEvents.push({ googleEventId, icsContent }); // Add new
      this.logger.debug(
        `Added event ID ${googleEventId} to user ${userId}'s tracked events with ICS content.`,
      );
    }
    return user;
  }

  // NEW: Method to retrieve ICS content for a specific event
  async getIcsContentForEvent(
    userId: string,
    googleEventId: string,
  ): Promise<string | undefined> {
    const user = users.get(userId);
    if (!user || !user.trackedEvents) {
      return undefined;
    }
    const event = user.trackedEvents.find(
      (e) => e.googleEventId === googleEventId,
    );
    return event?.icsContent;
  }

  // Simplified: Only necessary method for webhook cleanup
  async removeGoogleWatchChannel(channelId: string): Promise<void> {
    const user = await this.findByGoogleWatchChannelId(channelId);
    if (user) {
      user.googleWatchChannelId = undefined;
      user.googleWatchResourceId = undefined;
      user.googleWatchExpiry = undefined;
      this.logger.debug(`Removed watch channel info for user ${user.userId}.`);
    }
  }

  // MODIFIED: Update trackedGoogleEventIds to use trackedEvents
  async filterTrackedEvents(
    userId: string,
    eventIds: string[],
  ): Promise<string[]> {
    const user = users.get(userId);
    if (!user || !user.trackedEvents) {
      return [];
    }
    const trackedEventIds = user.trackedEvents.map((e) => e.googleEventId);
    return eventIds.filter((id) => trackedEventIds.includes(id));
  }
}
