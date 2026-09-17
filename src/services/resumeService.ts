import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { Resume } from "@/types/database";

const LOCAL_STORAGE_RESUMES_KEY = "hirelane_local_resumes";

export const resumeService = {
  async getResumes(userId: string): Promise<Resume[]> {
    if (!isSupabaseConfigured()) {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(LOCAL_STORAGE_RESUMES_KEY);
        if (stored) {
          try { return JSON.parse(stored); } catch {}
        }
      }
      return [
        {
          id: "res-1",
          user_id: userId,
          file_name: "Resume_V1.pdf",
          file_url: "#",
          file_size: 250880,
          mime_type: "application/pdf",
          is_default: true,
          uploaded_at: "10 May 2024",
        },
        {
          id: "res-2",
          user_id: userId,
          file_name: "Resume_V2.pdf",
          file_url: "#",
          file_size: 260096,
          mime_type: "application/pdf",
          is_default: false,
          uploaded_at: "15 May 2024",
        },
        {
          id: "res-3",
          user_id: userId,
          file_name: "Resume_Internship.pdf",
          file_url: "#",
          file_size: 253952,
          mime_type: "application/pdf",
          is_default: false,
          uploaded_at: "20 May 2024",
        },
        {
          id: "res-4",
          user_id: userId,
          file_name: "Resume_FullStack.pdf",
          file_url: "#",
          file_size: 266240,
          mime_type: "application/pdf",
          is_default: false,
          uploaded_at: "25 May 2024",
        },
      ];
    }

    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", userId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("[getResumes Error]", error);
      return [];
    }

    return data || [];
  },

  async uploadResume(
    userId: string,
    file: File,
    isDefault: boolean = false
  ): Promise<Resume | null> {
    if (!isSupabaseConfigured()) {
      const mockResume: Resume = {
        id: "res-" + Date.now(),
        user_id: userId,
        file_name: file.name,
        file_url: URL.createObjectURL(file),
        file_size: file.size,
        mime_type: file.type || "application/pdf",
        is_default: isDefault,
        uploaded_at: new Date().toISOString(),
      };
      if (typeof window !== "undefined") {
        const current = await this.getResumes(userId);
        if (isDefault) {
          current.forEach(r => r.is_default = false);
        }
        const updated = [mockResume, ...current];
        localStorage.setItem(LOCAL_STORAGE_RESUMES_KEY, JSON.stringify(updated));
      }
      return mockResume;
    }

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

      // Upload to private storage
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // If marked default, unset previous default
      if (isDefault) {
        await supabase
          .from("resumes")
          .update({ is_default: false })
          .eq("user_id", userId);
      }

      // Insert DB record
      const { data, error: dbError } = await supabase
        .from("resumes")
        .insert({
          user_id: userId,
          file_name: file.name,
          file_url: filePath,
          file_size: file.size,
          mime_type: file.type || "application/pdf",
          is_default: isDefault,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      return data;
    } catch (err) {
      console.error("[uploadResume Error]", err);
      return null;
    }
  },

  async setDefault(userId: string, resumeId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const current = await this.getResumes(userId);
      current.forEach(r => r.is_default = r.id === resumeId);
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_RESUMES_KEY, JSON.stringify(current));
      }
      return true;
    }

    await supabase
      .from("resumes")
      .update({ is_default: false })
      .eq("user_id", userId);

    const { error } = await supabase
      .from("resumes")
      .update({ is_default: true })
      .eq("id", resumeId)
      .eq("user_id", userId);

    return !error;
  },

  async deleteResume(userId: string, resumeId: string, filePath?: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const current = await this.getResumes(userId);
      const filtered = current.filter(r => r.id !== resumeId);
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_RESUMES_KEY, JSON.stringify(filtered));
      }
      return true;
    }

    if (filePath) {
      await supabase.storage.from("resumes").remove([filePath]);
    }

    const { error } = await supabase
      .from("resumes")
      .delete()
      .eq("id", resumeId)
      .eq("user_id", userId);

    return !error;
  },
};
