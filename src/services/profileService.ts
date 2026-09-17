import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { Profile, NotificationPreferences } from "@/types/database";

const LOCAL_STORAGE_PROFILE_KEY = "hirelane_local_profile";
const LOCAL_STORAGE_PREFS_KEY = "hirelane_local_prefs";

export const initialMockProfile: Profile = {
  id: "demo-user",
  full_name: "Aditya Verma",
  email: "aditya@example.com",
  phone: "+91 98765 43210",
  location: "Bangalore, India",
  linkedin_url: "linkedin.com/in/aditya-verma",
  avatar_url: null,
  college: "IIT Bangalore",
  degree: "B.Tech in Computer Science",
  graduation_year: "2025",
  cgpa: "8.74 / 10.0",
  preferred_roles: ["SDE", "Frontend Developer", "Full Stack Developer"],
  preferred_locations: ["Bangalore", "Hyderabad", "Remote"],
  work_authorization: "Indian Citizen",
  experience_level: "Fresher",
  preferred_industries: ["Technology", "Product", "Fintech"],
  preferred_company_size: "50-200",
  notice_period: "Immediate",
  bio: "Passionate about building scalable web applications and solving real-world problems.",
};

export const emptyMockProfile: Profile = {
  id: "demo-user",
  full_name: null,
  email: null,
  phone: null,
  location: null,
  linkedin_url: null,
  avatar_url: null,
  college: null,
  degree: null,
  graduation_year: null,
  cgpa: null,
  preferred_roles: [],
  preferred_locations: [],
  work_authorization: "-",
  experience_level: "-",
  preferred_industries: [],
  preferred_company_size: null,
  notice_period: "-",
  bio: null,
};

export const initialMockPreferences: NotificationPreferences = {
  user_id: "demo-user",
  email_deadline_reminders: true,
  email_interview_reminders: true,
  deadline_7_days: true,
  deadline_3_days: true,
  deadline_1_day: true,
  deadline_on_day: true,
  interview_reminder_offsets: ["30 minutes before"],
};

export const profileService = {
  getLocalProfile(): Profile {
    if (typeof window === "undefined") return initialMockProfile;
    const stored = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
    if (!stored) {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(initialMockProfile));
      return initialMockProfile;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return initialMockProfile;
    }
  },

  setLocalProfile(profile: Profile) {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(profile));
  },

  async getProfile(userId: string): Promise<Profile> {
    if (!isSupabaseConfigured()) {
      return this.getLocalProfile();
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("[getProfile Error]", error);
      }

      if (!data) {
        return this.getLocalProfile();
      }

      return data as Profile;
    } catch (err) {
      console.error("[getProfile Error]", err);
      return this.getLocalProfile();
    }
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    if (!isSupabaseConfigured()) {
      const current = this.getLocalProfile();
      const updated = { ...current, ...updates };
      this.setLocalProfile(updated);
      return updated;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    } catch (err) {
      console.error("[updateProfile Error]", err);
      const current = this.getLocalProfile();
      return { ...current, ...updates };
    }
  },

  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    if (!isSupabaseConfigured()) {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(LOCAL_STORAGE_PREFS_KEY);
        if (stored) {
          try { return JSON.parse(stored); } catch {}
        }
      }
      return initialMockPreferences;
    }

    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("[getNotificationPreferences Error]", error);
      }

      return data || initialMockPreferences;
    } catch {
      return initialMockPreferences;
    }
  },

  async updateNotificationPreferences(
    userId: string,
    prefs: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    if (!isSupabaseConfigured()) {
      const current = await this.getNotificationPreferences(userId);
      const updated = { ...current, ...prefs };
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_PREFS_KEY, JSON.stringify(updated));
      }
      return updated;
    }

    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .upsert({ user_id: userId, ...prefs, updated_at: new Date().toISOString() })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("[updateNotificationPreferences Error]", err);
      return initialMockPreferences;
    }
  },

  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    if (!isSupabaseConfigured()) {
      const url = URL.createObjectURL(file);
      await this.updateProfile(userId, { avatar_url: url });
      return url;
    }

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      await this.updateProfile(userId, { avatar_url: publicUrl });
      return publicUrl;
    } catch (err) {
      console.error("[uploadAvatar Error]", err);
      return null;
    }
  },

  async exportUserData(userId: string) {
    // Gather applications, interviews, profile, resumes into downloadable JSON archive
    const profile = await this.getProfile(userId);
    const prefs = await this.getNotificationPreferences(userId);

    const archive = {
      exported_at: new Date().toISOString(),
      user_id: userId,
      profile,
      notification_preferences: prefs,
      version: "1.0.0",
    };

    const blob = new Blob([JSON.stringify(archive, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hirelane-data-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async deleteAccount(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      if (typeof window !== "undefined") {
        localStorage.clear();
      }
      return true;
    }

    try {
      // In Supabase, deleting the profile or calling rpc/auth delete
      const { error } = await supabase.from("profiles").delete().eq("id", userId);
      await supabase.auth.signOut();
      return !error;
    } catch (err) {
      console.error("[deleteAccount Error]", err);
      return false;
    }
  },
};
