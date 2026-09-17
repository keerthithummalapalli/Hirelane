import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { Interview, InterviewQuestion, InterviewFeedback, InterviewTimelineStage } from "@/types/database";
import { reminderService } from "./reminderService";

const LOCAL_STORAGE_INTERVIEWS_KEY = "hirelane_local_interviews";

export const initialMockInterviews: Interview[] = [
  {
    id: "int-1",
    user_id: "demo-user",
    application_id: "app-2",
    round_title: "Technical Round",
    interviewers: ["John Doe"],
    interview_date: "2024-05-22",
    interview_time: "10:00 AM",
    duration_minutes: 60,
    mode: "Virtual (Google Meet)",
    meeting_link: "meet.google.com/abc-defg-hij",
    venue: null,
    description: "In-depth coding round focusing on algorithms and system design.",
    resume_id: "res-1",
    preparation_notes: "Revise DSA concepts\nPractice system design basics\nReview my resume and projects\nSolve 2-3 LeetCode medium problems",
    reminder_offset: "30 minutes before",
    outcome: "Pending",
    status: "Upcoming",
    applications: {
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
  },
  {
    id: "int-2",
    user_id: "demo-user",
    application_id: "app-3",
    round_title: "HR Round",
    interviewers: ["Sarah Jenkins"],
    interview_date: "2024-05-25",
    interview_time: "2:00 PM",
    duration_minutes: 45,
    mode: "Virtual (Google Meet)",
    meeting_link: "meet.google.com/xyz-1234",
    venue: null,
    description: "Culture fit, communication skills, and compensation discussion.",
    resume_id: "res-1",
    preparation_notes: "STAR method stories\nCompany values research",
    reminder_offset: "30 minutes before",
    outcome: "Pending",
    status: "Upcoming",
    applications: {
      id: "app-3",
      user_id: "demo-user",
      company_name: "Microsoft",
      role: "SWE Intern",
      status: "Interviewing",
      location: "Noida, India",
      job_type: "Internship",
      experience_level: "Fresher",
      job_description: "Software engineering intern.",
      applied_date: "2024-05-15",
      deadline: "2024-05-24",
      application_source: "LinkedIn",
      referral: null,
      job_posting_link: "https://careers.microsoft.com",
      resume_id: "res-1",
    },
  },
  {
    id: "int-3",
    user_id: "demo-user",
    application_id: "app-1",
    round_title: "Technical Round 2",
    interviewers: ["Alex Rivera"],
    interview_date: "2024-05-28",
    interview_time: "11:00 AM",
    duration_minutes: 60,
    mode: "Virtual (Google Meet)",
    meeting_link: "meet.google.com/def-4567",
    venue: null,
    description: "Advanced data structures and trees.",
    resume_id: "res-1",
    preparation_notes: "Review graph traversal and DP solutions",
    reminder_offset: "1 hour before",
    outcome: "Pending",
    status: "Upcoming",
    applications: {
      id: "app-1",
      user_id: "demo-user",
      company_name: "Google",
      role: "SDE Intern",
      status: "Interviewing",
      location: "Bangalore, India",
      job_type: "Internship",
      experience_level: "Fresher",
      job_description: "SDE Intern role.",
      applied_date: "2024-05-20",
      deadline: "2024-05-22",
      application_source: "LinkedIn",
      referral: null,
      job_posting_link: "https://careers.google.com",
      resume_id: "res-1",
    },
  },
  {
    id: "int-4",
    user_id: "demo-user",
    application_id: "app-4",
    round_title: "Final Round",
    interviewers: ["Director of Eng"],
    interview_date: "2024-05-30",
    interview_time: "3:00 PM",
    duration_minutes: 45,
    mode: "Virtual (Zoom)",
    meeting_link: "zoom.us/j/987654321",
    venue: null,
    description: "Portfolio walkthrough and systemic architecture questions.",
    resume_id: "res-1",
    preparation_notes: "Have portfolio projects live and ready to screen share",
    reminder_offset: "1 day before",
    outcome: "Pending",
    status: "Scheduled",
    applications: {
      id: "app-4",
      user_id: "demo-user",
      company_name: "Adobe",
      role: "Web Developer Intern",
      status: "Applied",
      location: "Bangalore, India",
      job_type: "Internship",
      experience_level: "Fresher",
      job_description: "Web development intern.",
      applied_date: "2024-05-14",
      deadline: "2024-05-30",
      application_source: "Referral",
      referral: null,
      job_posting_link: "https://adobe.com",
      resume_id: "res-1",
    },
  },
  {
    id: "int-5",
    user_id: "demo-user",
    application_id: "app-6",
    round_title: "Managerial Round",
    interviewers: ["VP of Engineering"],
    interview_date: "2024-06-02",
    interview_time: "4:00 PM",
    duration_minutes: 45,
    mode: "Virtual (Google Meet)",
    meeting_link: "meet.google.com/samsung-rnd",
    venue: null,
    description: "Discussion on past projects and role expectations.",
    resume_id: "res-1",
    preparation_notes: "Highlight research contributions",
    reminder_offset: "30 minutes before",
    outcome: "Pending",
    status: "Upcoming",
    applications: {
      id: "app-6",
      user_id: "demo-user",
      company_name: "Samsung",
      role: "Research Intern",
      status: "Applied",
      location: "Bangalore, India",
      job_type: "Internship",
      experience_level: "Fresher",
      job_description: "Research intern.",
      applied_date: "2024-05-12",
      deadline: "2024-05-28",
      application_source: "Campus Placement",
      referral: null,
      job_posting_link: "https://samsung.com",
      resume_id: "res-1",
    },
  },
];

export const interviewService = {
  getLocalInterviews(): Interview[] {
    if (typeof window === "undefined") return initialMockInterviews;
    const stored = localStorage.getItem(LOCAL_STORAGE_INTERVIEWS_KEY);
    if (!stored) {
      localStorage.setItem(LOCAL_STORAGE_INTERVIEWS_KEY, JSON.stringify(initialMockInterviews));
      return initialMockInterviews;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return initialMockInterviews;
    }
  },

  setLocalInterviews(items: Interview[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCAL_STORAGE_INTERVIEWS_KEY, JSON.stringify(items));
  },

  async getInterviews(userId: string, filter?: { type?: string; search?: string }): Promise<Interview[]> {
    const { type, search } = filter || {};

    if (!isSupabaseConfigured()) {
      let list = this.getLocalInterviews();

      if (type === "Upcoming") {
        list = list.filter((i) => i.status === "Upcoming" || i.status === "Scheduled");
      }

      if (search && search.trim().length > 0) {
        const q = search.toLowerCase();
        list = list.filter(
          (i) =>
            i.round_title.toLowerCase().includes(q) ||
            i.applications?.company_name.toLowerCase().includes(q) ||
            i.applications?.role.toLowerCase().includes(q)
        );
      }

      return list;
    }

    try {
      let query = supabase
        .from("interviews")
        .select("*, applications(*), resumes(*)")
        .eq("user_id", userId)
        .order("interview_date", { ascending: true });

      if (type === "Upcoming") {
        query = query.in("status", ["Upcoming", "Scheduled"]);
      }

      const { data, error } = await query;
      if (error) throw error;

      let result = (data as Interview[]) || [];

      if (search && search.trim().length > 0) {
        const q = search.toLowerCase();
        result = result.filter(
          (i) =>
            i.round_title.toLowerCase().includes(q) ||
            i.applications?.company_name.toLowerCase().includes(q)
        );
      }

      return result;
    } catch (err) {
      console.error("[getInterviews Error]", err);
      return [];
    }
  },

  async getInterviewDetails(interviewId: string) {
    if (!isSupabaseConfigured()) {
      const interview = this.getLocalInterviews().find((i) => i.id === interviewId) || null;
      const questions: InterviewQuestion[] = [
        {
          id: "q-1",
          interview_id: interviewId,
          user_id: "demo-user",
          question: "Explain the difference between SQL and NoSQL.",
          created_at: new Date().toISOString(),
        },
        {
          id: "q-2",
          interview_id: interviewId,
          user_id: "demo-user",
          question: "How would you design a rate limiter?",
          created_at: new Date().toISOString(),
        },
        {
          id: "q-3",
          interview_id: interviewId,
          user_id: "demo-user",
          question: "Implement LRU Cache.",
          created_at: new Date().toISOString(),
        },
      ];

      const feedback: InterviewFeedback[] = [];

      const timeline: InterviewTimelineStage[] = [
        {
          id: "tl-1",
          interview_id: interviewId,
          user_id: "demo-user",
          stage_name: "Applied",
          stage_date: "18 May 2024",
          completed: true,
          is_current: false,
          sort_order: 1,
        },
        {
          id: "tl-2",
          interview_id: interviewId,
          user_id: "demo-user",
          stage_name: "Screening",
          stage_date: "19 May 2024",
          completed: true,
          is_current: false,
          sort_order: 2,
        },
        {
          id: "tl-3",
          interview_id: interviewId,
          user_id: "demo-user",
          stage_name: "Technical Round",
          stage_date: "22 May 2024",
          completed: false,
          is_current: true,
          sort_order: 3,
        },
        {
          id: "tl-4",
          interview_id: interviewId,
          user_id: "demo-user",
          stage_name: "HR Round",
          stage_date: "--",
          completed: false,
          is_current: false,
          sort_order: 4,
        },
      ];

      return { interview, questions, feedback, timeline };
    }

    try {
      const { data: interview } = await supabase
        .from("interviews")
        .select("*, applications(*), resumes(*)")
        .eq("id", interviewId)
        .single();

      const { data: questions } = await supabase
        .from("interview_questions")
        .select("*")
        .eq("interview_id", interviewId);

      const { data: feedback } = await supabase
        .from("interview_feedback")
        .select("*")
        .eq("interview_id", interviewId);

      const { data: timeline } = await supabase
        .from("interview_timeline")
        .select("*")
        .eq("interview_id", interviewId)
        .order("sort_order", { ascending: true });

      return {
        interview: interview as Interview,
        questions: (questions as InterviewQuestion[]) || [],
        feedback: (feedback as InterviewFeedback[]) || [],
        timeline: (timeline as InterviewTimelineStage[]) || [],
      };
    } catch (err) {
      console.error("[getInterviewDetails Error]", err);
      return { interview: null, questions: [], feedback: [], timeline: [] };
    }
  },

  async createInterview(userId: string, data: Partial<Interview>): Promise<Interview | null> {
    if (!isSupabaseConfigured()) {
      const newInt: Interview = {
        id: "int-" + Date.now(),
        user_id: userId,
        application_id: data.application_id || "",
        round_title: data.round_title || "Interview Round",
        interviewers: data.interviewers || [],
        interview_date: data.interview_date || new Date().toISOString().split("T")[0],
        interview_time: data.interview_time || "10:00 AM",
        duration_minutes: data.duration_minutes || 60,
        mode: data.mode || "Virtual (Google Meet)",
        meeting_link: data.meeting_link || null,
        venue: data.venue || null,
        description: data.description || null,
        resume_id: data.resume_id || null,
        preparation_notes: data.preparation_notes || null,
        reminder_offset: data.reminder_offset || "30 minutes before",
        outcome: data.outcome || "Pending",
        status: (data.status as any) || "Upcoming",
        applications: data.applications,
      };

      const current = this.getLocalInterviews();
      this.setLocalInterviews([newInt, ...current]);
      await reminderService.scheduleInterviewReminder(
        userId,
        newInt.id,
        newInt.interview_date,
        newInt.interview_time,
        newInt.reminder_offset
      );
      return newInt;
    }

    try {
      const { data: created, error } = await supabase
        .from("interviews")
        .insert({
          user_id: userId,
          application_id: data.application_id,
          round_title: data.round_title,
          interviewers: data.interviewers,
          interview_date: data.interview_date,
          interview_time: data.interview_time,
          duration_minutes: data.duration_minutes,
          mode: data.mode,
          meeting_link: data.meeting_link,
          venue: data.venue,
          description: data.description,
          resume_id: data.resume_id,
          preparation_notes: data.preparation_notes,
          reminder_offset: data.reminder_offset,
          outcome: data.outcome || "Pending",
          status: data.status || "Upcoming",
        })
        .select("*, applications(*), resumes(*)")
        .single();

      if (error) throw error;
      if (created) {
        await reminderService.scheduleInterviewReminder(
          userId,
          created.id,
          created.interview_date,
          created.interview_time,
          created.reminder_offset
        );
      }
      return created;
    } catch (err) {
      console.error("[createInterview Error]", err);
      return null;
    }
  },

  async updateInterview(id: string, userId: string, data: Partial<Interview>): Promise<Interview | null> {
    if (!isSupabaseConfigured()) {
      const list = this.getLocalInterviews();
      const idx = list.findIndex((i) => i.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...data };
        this.setLocalInterviews([...list]);
        if (data.interview_date || data.interview_time || data.reminder_offset) {
          await reminderService.scheduleInterviewReminder(
            userId,
            id,
            list[idx].interview_date,
            list[idx].interview_time,
            list[idx].reminder_offset
          );
        }
        return list[idx];
      }
      return null;
    }

    try {
      const { data: updated, error } = await supabase
        .from("interviews")
        .update({
          round_title: data.round_title,
          interviewers: data.interviewers,
          interview_date: data.interview_date,
          interview_time: data.interview_time,
          duration_minutes: data.duration_minutes,
          mode: data.mode,
          meeting_link: data.meeting_link,
          venue: data.venue,
          description: data.description,
          resume_id: data.resume_id,
          preparation_notes: data.preparation_notes,
          reminder_offset: data.reminder_offset,
          outcome: data.outcome,
          status: data.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId)
        .select("*, applications(*), resumes(*)")
        .single();

      if (error) throw error;
      if (updated && (data.interview_date || data.interview_time || data.reminder_offset)) {
        await reminderService.scheduleInterviewReminder(
          userId,
          id,
          updated.interview_date,
          updated.interview_time,
          updated.reminder_offset
        );
      }
      return updated;
    } catch (err) {
      console.error("[updateInterview Error]", err);
      return null;
    }
  },

  async deleteInterview(id: string, userId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const list = this.getLocalInterviews();
      this.setLocalInterviews(list.filter((i) => i.id !== id));
      await reminderService.cancelRemindersForInterview(id);
      return true;
    }

    try {
      await reminderService.cancelRemindersForInterview(id);
      const { error } = await supabase
        .from("interviews")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      return !error;
    } catch (err) {
      console.error("[deleteInterview Error]", err);
      return false;
    }
  },

  async addQuestion(interviewId: string, userId: string, question: string) {
    if (!isSupabaseConfigured()) {
      return {
        id: "q-" + Date.now(),
        interview_id: interviewId,
        user_id: userId,
        question,
        created_at: new Date().toISOString(),
      };
    }

    const { data } = await supabase
      .from("interview_questions")
      .insert({ interview_id: interviewId, user_id: userId, question })
      .select()
      .single();

    return data;
  },

  async saveNotes(interviewId: string, userId: string, notes: string) {
    return this.updateInterview(interviewId, userId, { preparation_notes: notes });
  },
};
