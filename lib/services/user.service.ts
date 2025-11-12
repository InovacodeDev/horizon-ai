import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID, User, UserPreferences, UserProfile, UserSettings } from '@/lib/appwrite/schema';
import { ID, Query } from 'node-appwrite';

/**
 * User Service
 * Handles user CRUD operations and related data (profile, preferences, settings)
 */

export class UserService {
  private dbAdapter: any;

  constructor() {
    this.dbAdapter = getAppwriteDatabases();
  }

  // ============================================
  // Helper Methods for JSON Parsing
  // ============================================

  private parseJSON(value: string | undefined, defaultValue: any): any {
    if (!value) return defaultValue;
    try {
      return JSON.parse(value) as any;
    } catch {
      return defaultValue;
    }
  }

  private stringifyJSON(value: any): string {
    return JSON.stringify(value);
  }

  // ============================================
  // User Operations
  // ============================================

  async createUser(data: {
    email: string;
    password_hash: string;
    is_email_verified?: boolean;
    is_active?: boolean;
  }): Promise<User> {
    const id = ID.unique();
    const now = new Date().toISOString();

    const payload = {
      auth_user_id: id,
      email: data.email,
      password_hash: data.password_hash,
      name: data.email.split('@')[0],
      is_email_verified: data.is_email_verified ?? false,
      is_active: data.is_active ?? true,
      created_at: now,
      updated_at: now,
    };

    const document = await this.dbAdapter.createDocument(DATABASE_ID, COLLECTIONS.USERS, id, payload);

    return document as unknown as User;
  }

  async findUserById(userId: string): Promise<User | undefined> {
    try {
      const document = await this.dbAdapter.getDocument(DATABASE_ID, COLLECTIONS.USERS, userId);
      return document as unknown as User;
    } catch (error: any) {
      if (error.code === 404) {
        return undefined;
      }
      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<User | undefined> {
    try {
      const response = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.USERS, [
        Query.equal('email', email),
        Query.limit(1),
      ]);

      if (!response.documents || response.documents.length === 0) {
        return undefined;
      }

      return response.documents[0] as unknown as User;
    } catch (error) {
      return undefined;
    }
  }

  async updateUser(userId: string, data: Partial<Omit<User, '$id' | '$createdAt' | '$updatedAt'>>): Promise<User> {
    try {
      const document = await this.dbAdapter.updateDocument(DATABASE_ID, COLLECTIONS.USERS, userId, data);
      return document as unknown as User;
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(`User with id ${userId} not found`);
      }
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete related documents first
    await Promise.all([
      this.deleteProfile(userId).catch(() => {}),
      this.deletePreferences(userId).catch(() => {}),
      this.deleteSettings(userId).catch(() => {}),
    ]);

    // Delete user
    await this.dbAdapter.deleteDocument(DATABASE_ID, COLLECTIONS.USERS, userId);
  }

  // ============================================
  // User Profile Operations
  // ============================================

  async createProfile(data: {
    user_id: string;
    first_name?: string;
    last_name?: string;
    display_name?: string;
    avatar_url?: string;
    phone_number?: string;
    date_of_birth?: Date | string;
    address?: any;
    bio?: string;
    occupation?: string;
    company?: string;
    website?: string;
    social_links?: any;
  }): Promise<UserProfile> {
    const now = new Date().toISOString();

    const payload = {
      user_id: data.user_id,
      bio: data.bio,
      avatar_url: data.avatar_url,
      phone: data.phone_number,
      address: data.address ? this.stringifyJSON(data.address) : undefined,
      birthdate: data.date_of_birth ? new Date(data.date_of_birth).toISOString() : undefined,
      created_at: now,
      updated_at: now,
    };

    const document = await this.dbAdapter.createDocument(DATABASE_ID, COLLECTIONS.USER_PROFILES, ID.unique(), payload);

    return document as unknown as UserProfile;
  }

  async getProfile(userId: string): Promise<UserProfile | undefined> {
    try {
      const response = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.USER_PROFILES, [
        Query.equal('user_id', userId),
        Query.limit(1),
      ]);

      if (!response.documents || response.documents.length === 0) {
        return undefined;
      }

      return response.documents[0] as unknown as UserProfile;
    } catch (error) {
      return undefined;
    }
  }

  async updateProfile(userId: string, data: any): Promise<UserProfile> {
    const profile = await this.getProfile(userId);
    if (!profile) {
      throw new Error(`Profile for user ${userId} not found`);
    }

    const updateData: any = { ...data };

    // Handle JSON fields
    const existingAddress = this.parseJSON(profile.address, {});
    if (data.address) {
      const merged = { ...existingAddress, ...data.address };
      updateData.address = this.stringifyJSON(merged);
    }
    if (data.social_links) {
      existingAddress.social_links = data.social_links;
      updateData.address = this.stringifyJSON(existingAddress);
    }

    const document = await this.dbAdapter.updateDocument(
      DATABASE_ID,
      COLLECTIONS.USER_PROFILES,
      profile.$id,
      updateData,
    );

    return document as unknown as UserProfile;
  }

  async deleteProfile(userId: string): Promise<void> {
    const profile = await this.getProfile(userId);
    if (profile) {
      await this.dbAdapter.deleteDocument(DATABASE_ID, COLLECTIONS.USER_PROFILES, profile.$id);
    }
  }

  // ============================================
  // User Preferences Operations
  // ============================================

  async createPreferences(data: {
    user_id: string;
    theme?: 'light' | 'dark' | 'system';
    language?: 'pt-BR' | 'en-US' | 'es-ES';
    currency?: 'BRL' | 'USD' | 'EUR';
    [key: string]: any;
  }): Promise<UserPreferences> {
    const now = new Date().toISOString();

    const notifications = {
      email_notifications: data.email_notifications ?? true,
      push_notifications: data.push_notifications ?? true,
      sms_notifications: data.sms_notifications ?? false,
      notification_frequency: data.notification_frequency || 'realtime',
    };

    const payload: any = {
      user_id: data.user_id,
      theme: data.theme || 'system',
      language: data.language || 'pt-BR',
      currency: data.currency || 'BRL',
      timezone: data.timezone || 'UTC',
      email_notifications: data.email_notifications ?? true,
      push_notifications: data.push_notifications ?? true,
      sms_notifications: data.sms_notifications ?? false,
      notification_frequency: data.notification_frequency || 'realtime',
      show_balances: data.show_balances ?? true,
      auto_categorization_enabled: data.auto_categorization_enabled ?? true,
      budget_alerts: data.budget_alerts ?? true,
      profile_visibility: data.profile_visibility ?? 'private',
      share_data_for_insights: data.share_data_for_insights ?? false,
      notifications: this.stringifyJSON(notifications),
      created_at: now,
      updated_at: now,
    };

    const document = await this.dbAdapter.createDocument(
      DATABASE_ID,
      COLLECTIONS.USER_PREFERENCES,
      ID.unique(),
      payload,
    );

    return document as unknown as UserPreferences;
  }

  async getPreferences(userId: string): Promise<UserPreferences | undefined> {
    try {
      const response = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.USER_PREFERENCES, [
        Query.equal('user_id', userId),
        Query.limit(1),
      ]);

      if (!response.documents || response.documents.length === 0) {
        return undefined;
      }

      return response.documents[0] as unknown as UserPreferences;
    } catch (error) {
      return undefined;
    }
  }

  async updatePreferences(userId: string, data: any): Promise<UserPreferences> {
    const preferences = await this.getPreferences(userId);
    if (!preferences) {
      throw new Error(`Preferences for user ${userId} not found`);
    }

    const updateData: any = { ...data };

    // Handle JSON fields
    const existingNotifications = this.parseJSON(preferences.notifications, {});

    if (data.dashboard_widgets) {
      existingNotifications.dashboard_widgets = data.dashboard_widgets;
      updateData.notifications = this.stringifyJSON(existingNotifications);
    }

    // Handle sharing preferences
    if (data.sharing_preferences) {
      existingNotifications.sharing = data.sharing_preferences;
      updateData.notifications = this.stringifyJSON(existingNotifications);
    }

    // Map individual preference fields
    const maybeMap = (field: string, target?: string) => {
      const key = target || field;
      if (data[field] !== undefined) updateData[key] = data[field];
    };

    maybeMap('email_notifications');
    maybeMap('push_notifications');
    maybeMap('sms_notifications');
    maybeMap('notification_frequency');
    maybeMap('show_balances');
    maybeMap('auto_categorization_enabled');
    maybeMap('budget_alerts');
    maybeMap('profile_visibility');
    maybeMap('share_data_for_insights');

    const document = await this.dbAdapter.updateDocument(
      DATABASE_ID,
      COLLECTIONS.USER_PREFERENCES,
      preferences.$id,
      updateData,
    );

    return document as unknown as UserPreferences;
  }

  async deletePreferences(userId: string): Promise<void> {
    const preferences = await this.getPreferences(userId);
    if (preferences) {
      await this.dbAdapter.deleteDocument(DATABASE_ID, COLLECTIONS.USER_PREFERENCES, preferences.$id);
    }
  }

  /**
   * Get sharing preferences for a user
   * Returns default values if not set
   */
  async getSharingPreferences(userId: string): Promise<{
    show_shared_data: boolean;
    include_shared_in_calculations: boolean;
    show_ownership_indicators: boolean;
  }> {
    const preferences = await this.getPreferences(userId);

    if (!preferences) {
      // Return defaults if preferences don't exist
      return {
        show_shared_data: true,
        include_shared_in_calculations: true,
        show_ownership_indicators: true,
      };
    }

    const notificationsData = this.parseJSON(preferences.notifications, {});
    const sharingPrefs = notificationsData.sharing || {};

    return {
      show_shared_data: sharingPrefs.show_shared_data ?? true,
      include_shared_in_calculations: sharingPrefs.include_shared_in_calculations ?? true,
      show_ownership_indicators: sharingPrefs.show_ownership_indicators ?? true,
    };
  }

  /**
   * Update sharing preferences for a user
   */
  async updateSharingPreferences(
    userId: string,
    sharingPreferences: {
      show_shared_data?: boolean;
      include_shared_in_calculations?: boolean;
      show_ownership_indicators?: boolean;
    },
  ): Promise<void> {
    await this.updatePreferences(userId, {
      sharing_preferences: sharingPreferences,
    });
  }

  // ============================================
  // User Settings Operations
  // ============================================

  async createSettings(data: { user_id: string; [key: string]: any }): Promise<UserSettings> {
    const now = new Date().toISOString();

    const privacy = {
      session_timeout: data.session_timeout,
      auto_sync_enabled: data.auto_sync_enabled,
      sync_frequency: data.sync_frequency,
      cloud_backup_enabled: data.cloud_backup_enabled,
      connected_banks: data.connected_banks,
      connected_apps: data.connected_apps,
      beta_features: data.beta_features,
      analytics_opt_in: data.analytics_opt_in,
      custom_settings: data.custom_settings,
    };

    const payload: any = {
      user_id: data.user_id,
      two_factor_enabled: data.two_factor_enabled ?? false,
      email_verified: data.email_verified ?? false,
      phone_verified: data.phone_verified ?? false,
      marketing_emails: data.marketing_emails ?? false,
      privacy_settings: this.stringifyJSON(privacy),
      session_timeout: data.session_timeout ?? 30,
      auto_sync_enabled: data.auto_sync_enabled ?? true,
      sync_frequency: data.sync_frequency ?? 60,
      cloud_backup_enabled: data.cloud_backup_enabled ?? false,
      beta_features: data.beta_features ?? false,
      analytics_opt_in: data.analytics_opt_in ?? false,
      created_at: now,
      updated_at: now,
    };

    const document = await this.dbAdapter.createDocument(DATABASE_ID, COLLECTIONS.USER_SETTINGS, ID.unique(), payload);

    return document as unknown as UserSettings;
  }

  async getSettings(userId: string): Promise<UserSettings | undefined> {
    try {
      const response = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.USER_SETTINGS, [
        Query.equal('user_id', userId),
        Query.limit(1),
      ]);

      if (!response.documents || response.documents.length === 0) {
        return undefined;
      }

      return response.documents[0] as unknown as UserSettings;
    } catch (error) {
      return undefined;
    }
  }

  async updateSettings(userId: string, data: any): Promise<UserSettings> {
    const settings = await this.getSettings(userId);
    if (!settings) {
      throw new Error(`Settings for user ${userId} not found`);
    }

    const updateData: any = { ...data };

    // Handle JSON fields
    const existingPrivacy = this.parseJSON(settings.privacy_settings, {});
    let privacyUpdated = false;
    if (data.connected_banks) {
      existingPrivacy.connected_banks = data.connected_banks;
      privacyUpdated = true;
    }
    if (data.connected_apps) {
      existingPrivacy.connected_apps = data.connected_apps;
      privacyUpdated = true;
    }
    if (data.custom_settings) {
      existingPrivacy.custom_settings = data.custom_settings;
      privacyUpdated = true;
    }
    if (privacyUpdated) {
      updateData.privacy_settings = this.stringifyJSON(existingPrivacy);
    }

    const document = await this.dbAdapter.updateDocument(
      DATABASE_ID,
      COLLECTIONS.USER_SETTINGS,
      settings.$id,
      updateData,
    );

    return document as unknown as UserSettings;
  }

  async deleteSettings(userId: string): Promise<void> {
    const settings = await this.getSettings(userId);
    if (settings) {
      await this.dbAdapter.deleteDocument(DATABASE_ID, COLLECTIONS.USER_SETTINGS, settings.$id);
    }
  }

  // ============================================
  // Complete User Data Operations
  // ============================================

  async getCompleteUserData(userId: string) {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    const [profile, preferences, settings] = await Promise.all([
      this.getProfile(userId),
      this.getPreferences(userId),
      this.getSettings(userId),
    ]);

    return {
      user,
      profile: profile
        ? {
            ...profile,
            address: this.parseJSON(profile.address, {}),
            social_links: this.parseJSON(profile.address, {}).social_links || {},
          }
        : null,
      preferences: preferences
        ? {
            ...preferences,
            dashboard_widgets: this.parseJSON(preferences.notifications, { enabled: [], order: [] })
              .dashboard_widgets || {
              enabled: [],
              order: [],
            },
          }
        : null,
      settings: settings
        ? {
            ...settings,
            connected_banks: this.parseJSON(settings.privacy_settings, {}).connected_banks || [],
            connected_apps: this.parseJSON(settings.privacy_settings, {}).connected_apps || [],
            custom_settings: this.parseJSON(settings.privacy_settings, {}).custom_settings || {},
          }
        : null,
    };
  }

  async initializeUserData(
    userData: {
      email: string;
      password_hash: string;
      is_email_verified?: boolean;
      is_active?: boolean;
    },
    profileData?: {
      first_name?: string;
      last_name?: string;
      display_name?: string;
      [key: string]: any;
    },
  ) {
    // Create user
    const user = await this.createUser(userData);

    // Create profile with default values
    const profile = await this.createProfile({
      user_id: user.$id,
      ...profileData,
    });

    // Create default preferences
    const preferences = await this.createPreferences({
      user_id: user.$id,
    });

    // Create default settings
    const settings = await this.createSettings({
      user_id: user.$id,
    });

    return {
      user,
      profile,
      preferences,
      settings,
    };
  }

  /**
   * Initialize user data with existing user ID (e.g., from Appwrite Auth)
   */
  async initializeUserDataWithId(
    userId: string,
    userData: {
      email: string;
      password_hash: string;
      is_email_verified?: boolean;
      is_active?: boolean;
    },
    profileData?: {
      first_name?: string;
      last_name?: string;
      display_name?: string;
      [key: string]: any;
    },
  ) {
    // Create user document with specific ID
    const now = new Date().toISOString();
    const payload = {
      auth_user_id: userId,
      email: userData.email,
      password_hash: userData.password_hash,
      name: userData.email.split('@')[0],
      is_email_verified: userData.is_email_verified ?? false,
      is_active: userData.is_active ?? true,
      created_at: now,
      updated_at: now,
    };

    const document = await this.dbAdapter.createDocument(DATABASE_ID, COLLECTIONS.USERS, userId, payload);
    const user = document as unknown as User;

    // Create profile with default values
    const profile = await this.createProfile({
      user_id: userId,
      ...profileData,
    });

    // Create default preferences
    const preferences = await this.createPreferences({
      user_id: userId,
    });

    // Create default settings
    const settings = await this.createSettings({
      user_id: userId,
    });

    return {
      user,
      profile,
      preferences,
      settings,
    };
  }
}
