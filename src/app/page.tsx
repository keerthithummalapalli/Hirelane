"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { RecentApplicationsCard } from "@/components/dashboard/RecentApplicationsCard";
import { UpcomingInterviewsCard } from "@/components/dashboard/UpcomingInterviewsCard";
import { UpcomingDeadlinesCard } from "@/components/dashboard/UpcomingDeadlinesCard";
import { QuickActionsBar } from "@/components/dashboard/QuickActionsBar";
import { AddApplicationModal } from "@/components/applications/AddApplicationModal";
import { AddInterviewModal } from "@/components/interviews/AddInterviewModal";
import { applicationService } from "@/services/applicationService";
import { interviewService } from "@/services/interviewService";
import { profileService } from "@/services/profileService";
import { Application, Interview, Profile } from "@/types/database";

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({
    totalApplications: 0,
    interviews: 0,
    deadlines: 0,
    activeApplications: 0,
  });
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddAppOpen, setIsAddAppOpen] = useState(false);
  const [isAddInterviewOpen, setIsAddInterviewOpen] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [userProfile, userStats, appsRes, ints] = await Promise.all([
        profileService.getProfile("demo-user"),
        applicationService.getDashboardStats("demo-user"),
        applicationService.getApplications("demo-user", { page: 1, pageSize: 8 }),
        interviewService.getInterviews("demo-user", { type: "Upcoming" }),
      ]);

      setProfile(userProfile);
      setStats(userStats);
      setRecentApplications(appsRes.data);
      setUpcomingInterviews(ints);
    } catch (err) {
      console.error("[Dashboard Load Error]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const isEmpty =
    !loading &&
    stats.totalApplications === 0 &&
    stats.interviews === 0 &&
    recentApplications.length === 0;

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Greeting Banner */}
        <WelcomeBanner
          userName={profile?.full_name?.split(" ")[0]}
          isEmptyState={isEmpty}
        />

        {/* 4 Metric Statistics Cards */}
        <StatsRow
          totalApplications={stats.totalApplications}
          interviews={stats.interviews}
          deadlines={stats.deadlines}
          activeApplications={stats.activeApplications}
          isEmptyState={isEmpty}
        />

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Recent Applications (Left ~65%) */}
          <div className="lg:col-span-8">
            <RecentApplicationsCard
              applications={recentApplications}
              onAddApplication={() => setIsAddAppOpen(true)}
            />
          </div>

          {/* Side Cards: Interviews & Deadlines (Right ~35%) */}
          <div className="lg:col-span-4 space-y-6">
            <UpcomingInterviewsCard
              interviews={upcomingInterviews}
              onScheduleInterview={() => setIsAddInterviewOpen(true)}
            />
            <UpcomingDeadlinesCard
              applications={recentApplications}
              onAddApplication={() => setIsAddAppOpen(true)}
            />
          </div>
        </div>

        {/* Quick Actions Bar */}
        <QuickActionsBar
          onAddApplication={() => setIsAddAppOpen(true)}
          onAddInterview={() => setIsAddInterviewOpen(true)}
          onUploadResume={() => {
            window.location.href = "/profile";
          }}
          onAddNote={() => {
            window.location.href = "/interviews";
          }}
        />
      </div>

      {/* Modals */}
      <AddApplicationModal
        isOpen={isAddAppOpen}
        onClose={() => setIsAddAppOpen(false)}
        onSuccess={() => loadDashboardData()}
      />

      <AddInterviewModal
        isOpen={isAddInterviewOpen}
        onClose={() => setIsAddInterviewOpen(false)}
        onSuccess={() => loadDashboardData()}
      />
    </AppShell>
  );
}
