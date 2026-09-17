import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { Application, ApplicationStatus } from "@/types/database";
import { reminderService } from "./reminderService";

const LOCAL_STORAGE_APPS_KEY = "hirelane_local_applications";

export interface ApplicationsFilter {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export const initialMockApplications: Application[] = [
  {
    id: "app-1",
    user_id: "demo-user",
    company_name: "Google",
    role: "SDE Intern",
    status: "Interviewing",
    location: "Bangalore, India",
    job_type: "Internship",
    experience_level: "Fresher",
    job_description: "Software development intern role working with Google Cloud.",
    applied_date: "2024-05-20",
    deadline: "2024-05-22",
    application_source: "LinkedIn",
    referral: null,
    job_posting_link: "https://careers.google.com",
    resume_id: "res-1",
  },
  {
    id: "app-2",
    user_id: "demo-user",
    company_name: "Amazon",
    role: "Frontend Intern",
    status: "Assessment",
    location: "Hyderabad, India",
    job_type: "Internship",
    experience_level: "Fresher",
    job_description: "Frontend role specializing in React, TypeScript, and AWS.",
    applied_date: "2024-05-18",
    deadline: "2024-05-26",
    application_source: "Careers Portal",
    referral: null,
    job_posting_link: "https://amazon.jobs",
    resume_id: "res-1",
  },
  {
    id: "app-3",
    user_id: "demo-user",
    company_name: "Microsoft",
    role: "SWE Intern",
    status: "Interviewing",
    location: "Noida, India",
    job_type: "Internship",
    experience_level: "Fresher",
    job_description: "Software engineering intern working on developer tools.",
    applied_date: "2024-05-15",
    deadline: "2024-05-24",
    application_source: "LinkedIn",
    referral: null,
    job_posting_link: "https://careers.microsoft.com",
    resume_id: "res-1",
  },
  {
    id: "app-4",
    user_id: "demo-user",
    company_name: "Adobe",
    role: "Web Developer Intern",
    status: "Applied",
    location: "Bangalore, India",
    job_type: "Internship",
    experience_level: "Fresher",
    job_description: "Web development intern for Adobe Creative Cloud web experiences.",
    applied_date: "2024-05-14",
    deadline: "2024-05-30",
    application_source: "Referral",
    referral: "Jane Smith",
    job_posting_link: "https://adobe.wd5.myworkdayjobs.com",
    resume_id: "res-1",
  },
  {
    id: "app-5",
    user_id: "demo-user",
    company_name: "Netflix",
    role: "Software Engineer Intern",
    status: "Applied",
    location: "Mumbai, India",
    job_type: "Internship",
    experience_level: "Fresher",
    job_description: "Core streaming infrastructure engineering internship.",
    applied_date: "2024-05-10",
    deadline: "2024-05-31",
    application_source: "Company Portal",
    referral: null,
    job_posting_link: "https://jobs.netflix.com",
    resume_id: "res-1",
  },
  {
    id: "app-6",
    user_id: "demo-user",
    company_name: "Samsung",
    role: "Research Intern",
    status: "Applied",
    location: "Bangalore, India",
    job_type: "Internship",
    experience_level: "Fresher",
    job_description: "Research intern at Samsung R&D Institute.",
    applied_date: "2024-05-12",
    deadline: "2024-05-28",
    application_source: "Campus Placement",
    referral: null,
    job_posting_link: "https://samsung.com/careers",
    resume_id: "res-1",
  },
  {
    id: "app-7",
    user_id: "demo-user",
    company_name: "Flipkart",
    role: "SDE Intern",
    status: "Rejected",
    location: "Bangalore, India",
    job_type: "Internship",
    experience_level: "Fresher",
    job_description: "E-commerce platform scaling internship.",
    applied_date: "2024-05-05",
    deadline: "2024-05-15",
    application_source: "LinkedIn",
    referral: null,
    job_posting_link: "https://flipkartcareers.com",
    resume_id: "res-1",
  },
  {
    id: "app-8",
    user_id: "demo-user",
    company_name: "JP Morgan",
    role: "Software Engineer Intern",
    status: "Offer",
    location: "Mumbai, India",
    job_type: "Internship",
    experience_level: "Fresher",
    job_description: "Fintech engineering internship.",
    applied_date: "2024-05-02",
    deadline: null,
    application_source: "Careers Portal",
    referral: null,
    job_posting_link: "https://jpmorgan.com/careers",
    resume_id: "res-1",
  },
];

export const applicationService = {
  getLocalApplications(): Application[] {
    if (typeof window === "undefined") return initialMockApplications;
    const stored = localStorage.getItem(LOCAL_STORAGE_APPS_KEY);
    if (!stored) {
      localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(initialMockApplications));
      return initialMockApplications;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return initialMockApplications;
    }
  },

  setLocalApplications(apps: Application[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(apps));
  },

  async getApplications(userId: string, filter?: ApplicationsFilter) {
    const { status, search, page = 1, pageSize = 8 } = filter || {};

    if (!isSupabaseConfigured()) {
      let list = this.getLocalApplications();

      if (status && status !== "All") {
        list = list.filter((a) => a.status.toLowerCase() === status.toLowerCase());
      }

      if (search && search.trim().length > 0) {
        const q = search.toLowerCase();
        list = list.filter(
          (a) =>
            a.company_name.toLowerCase().includes(q) ||
            a.role.toLowerCase().includes(q) ||
            (a.location && a.location.toLowerCase().includes(q))
        );
      }

      const total = list.length;
      const from = (page - 1) * pageSize;
      const paged = list.slice(from, from + pageSize);

      return { data: paged, total, page, pageSize };
    }

    try {
      let query = supabase
        .from("applications")
        .select("*, resumes(*)", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (status && status !== "All") {
        query = query.eq("status", status);
      }

      if (search && search.trim().length > 0) {
        const q = `%${search.trim()}%`;
        query = query.or(`company_name.ilike.${q},role.ilike.${q},location.ilike.${q}`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;

      return {
        data: (data as Application[]) || [],
        total: count || 0,
        page,
        pageSize,
      };
    } catch (err) {
      console.error("[getApplications Error]", err);
      return { data: [], total: 0, page, pageSize };
    }
  },

  async createApplication(userId: string, appData: Partial<Application>): Promise<Application | null> {
    if (!isSupabaseConfigured()) {
      const newApp: Application = {
        id: "app-" + Date.now(),
        user_id: userId,
        company_name: appData.company_name || "",
        role: appData.role || "",
        status: (appData.status as ApplicationStatus) || "Applied",
        location: appData.location || null,
        job_type: appData.job_type || null,
        experience_level: appData.experience_level || null,
        job_description: appData.job_description || null,
        applied_date: appData.applied_date || new Date().toISOString().split("T")[0],
        deadline: appData.deadline || null,
        application_source: appData.application_source || null,
        referral: appData.referral || null,
        job_posting_link: appData.job_posting_link || null,
        resume_id: appData.resume_id || null,
      };

      const current = this.getLocalApplications();
      this.setLocalApplications([newApp, ...current]);
      await reminderService.scheduleDeadlineReminders(userId, newApp.id, newApp.deadline);
      return newApp;
    }

    try {
      const { data, error } = await supabase
        .from("applications")
        .insert({
          user_id: userId,
          company_name: appData.company_name,
          role: appData.role,
          status: appData.status || "Applied",
          location: appData.location,
          job_type: appData.job_type,
          experience_level: appData.experience_level,
          job_description: appData.job_description,
          applied_date: appData.applied_date || new Date().toISOString().split("T")[0],
          deadline: appData.deadline,
          application_source: appData.application_source,
          referral: appData.referral,
          job_posting_link: appData.job_posting_link,
          resume_id: appData.resume_id,
        })
        .select("*, resumes(*)")
        .single();

      if (error) throw error;
      if (data) {
        await reminderService.scheduleDeadlineReminders(userId, data.id, data.deadline);
      }
      return data;
    } catch (err) {
      console.error("[createApplication Error]", err);
      return null;
    }
  },

  async updateApplication(id: string, userId: string, appData: Partial<Application>): Promise<Application | null> {
    if (!isSupabaseConfigured()) {
      const list = this.getLocalApplications();
      const idx = list.findIndex((a) => a.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...appData };
        this.setLocalApplications([...list]);
        if (appData.deadline !== undefined) {
          await reminderService.scheduleDeadlineReminders(userId, id, appData.deadline);
        }
        return list[idx];
      }
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("applications")
        .update({
          company_name: appData.company_name,
          role: appData.role,
          status: appData.status,
          location: appData.location,
          job_type: appData.job_type,
          experience_level: appData.experience_level,
          job_description: appData.job_description,
          applied_date: appData.applied_date,
          deadline: appData.deadline,
          application_source: appData.application_source,
          referral: appData.referral,
          job_posting_link: appData.job_posting_link,
          resume_id: appData.resume_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId)
        .select("*, resumes(*)")
        .single();

      if (error) throw error;
      if (data && appData.deadline !== undefined) {
        await reminderService.scheduleDeadlineReminders(userId, id, data.deadline);
      }
      return data;
    } catch (err) {
      console.error("[updateApplication Error]", err);
      return null;
    }
  },

  async deleteApplication(id: string, userId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const list = this.getLocalApplications();
      this.setLocalApplications(list.filter((a) => a.id !== id));
      await reminderService.cancelRemindersForApplication(id);
      return true;
    }

    try {
      await reminderService.cancelRemindersForApplication(id);
      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      return !error;
    } catch (err) {
      console.error("[deleteApplication Error]", err);
      return false;
    }
  },

  async getDashboardStats(userId: string) {
    if (!isSupabaseConfigured()) {
      const apps = this.getLocalApplications();
      const totalApplications = apps.length;
      const activeApplications = apps.filter((a) => a.status !== "Rejected" && a.status !== "Offer").length;
      
      const now = new Date();
      const next7Days = new Date();
      next7Days.setDate(now.getDate() + 7);
      
      const upcomingDeadlines = apps.filter((a) => {
        if (!a.deadline) return false;
        const d = new Date(a.deadline);
        return d >= now && d <= next7Days;
      }).length;

      return {
        totalApplications,
        interviews: 8,
        deadlines: upcomingDeadlines || 5,
        activeApplications,
      };
    }

    try {
      const { count: totalApplications } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      const { count: activeApplications } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .not("status", "in", '("Offer","Rejected")');

      const { count: interviewCount } = await supabase
        .from("interviews")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      const today = new Date().toISOString().split("T")[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const { count: deadlineCount } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("deadline", today)
        .lte("deadline", nextWeek);

      return {
        totalApplications: totalApplications || 0,
        interviews: interviewCount || 0,
        deadlines: deadlineCount || 0,
        activeApplications: activeApplications || 0,
      };
    } catch (err) {
      console.error("[getDashboardStats Error]", err);
      return {
        totalApplications: 0,
        interviews: 0,
        deadlines: 0,
        activeApplications: 0,
      };
    }
  },
};
