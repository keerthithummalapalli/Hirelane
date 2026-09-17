"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PersonalInfoCard } from "@/components/profile/PersonalInfoCard";
import { AcademicInfoCard } from "@/components/profile/AcademicInfoCard";
import { CareerPreferencesCard } from "@/components/profile/CareerPreferencesCard";
import { ResumeLibraryCard } from "@/components/profile/ResumeLibraryCard";
import { QuickLinksCard } from "@/components/profile/QuickLinksCard";

import { EditPersonalInfoModal } from "@/components/profile/modals/EditPersonalInfoModal";
import { EditAcademicInfoModal } from "@/components/profile/modals/EditAcademicInfoModal";
import { EditCareerPreferencesModal } from "@/components/profile/modals/EditCareerPreferencesModal";
import { NotificationPreferencesModal } from "@/components/profile/modals/NotificationPreferencesModal";
import { ChangePasswordModal } from "@/components/profile/modals/ChangePasswordModal";
import { DeleteConfirmModal } from "@/components/applications/DeleteConfirmModal";

import { profileService } from "@/services/profileService";
import { resumeService } from "@/services/resumeService";
import { Profile, Resume } from "@/types/database";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isEditPersonalOpen, setIsEditPersonalOpen] = useState(false);
  const [isEditAcademicOpen, setIsEditAcademicOpen] = useState(false);
  const [isEditCareerOpen, setIsEditCareerOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [p, r] = await Promise.all([
      profileService.getProfile("demo-user"),
      resumeService.getResumes("demo-user"),
    ]);
    setProfile(p);
    setResumes(r);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateProfile = async (updates: Partial<Profile>) => {
    const updated = await profileService.updateProfile("demo-user", updates);
    setProfile(updated);
  };

  const handleAvatarUpload = async (file: File) => {
    const url = await profileService.uploadAvatar("demo-user", file);
    if (url && profile) {
      setProfile({ ...profile, avatar_url: url });
    }
  };

  const handleResumeUpload = async (file: File) => {
    const isFirst = resumes.length === 0;
    await resumeService.uploadResume("demo-user", file, isFirst);
    const updatedResumes = await resumeService.getResumes("demo-user");
    setResumes(updatedResumes);
  };

  const handleSetDefaultResume = async (resumeId: string) => {
    await resumeService.setDefault("demo-user", resumeId);
    const updatedResumes = await resumeService.getResumes("demo-user");
    setResumes(updatedResumes);
  };

  const handleDeleteResume = async (resumeId: string) => {
    await resumeService.deleteResume("demo-user", resumeId);
    const updatedResumes = await resumeService.getResumes("demo-user");
    setResumes(updatedResumes);
  };

  const handleDownloadData = async () => {
    await profileService.exportUserData("demo-user");
  };

  const handleDeleteAccountConfirm = async () => {
    await profileService.deleteAccount("demo-user");
    window.location.href = "/login";
  };

  return (
    <AppShell title="Profile">
      <div className="space-y-6">
        {/* Page Subtitle */}
        <div className="-mt-2">
          <p className="text-xs lg:text-sm text-slate-500">
            Manage your personal information and career preferences.
          </p>
        </div>

        {loading ? (
          <div className="py-24 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left Column */}
            <div className="space-y-6">
              <PersonalInfoCard
                profile={profile}
                onEdit={() => setIsEditPersonalOpen(true)}
                onAvatarUpload={handleAvatarUpload}
              />
              <CareerPreferencesCard
                profile={profile}
                onEdit={() => setIsEditCareerOpen(true)}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <AcademicInfoCard
                profile={profile}
                onEdit={() => setIsEditAcademicOpen(true)}
              />
              <ResumeLibraryCard
                resumes={resumes}
                onUpload={handleResumeUpload}
                onSetDefault={handleSetDefaultResume}
                onDelete={handleDeleteResume}
              />
              <QuickLinksCard
                onChangePassword={() => setIsPasswordOpen(true)}
                onNotificationPreferences={() => setIsNotificationOpen(true)}
                onDownloadData={handleDownloadData}
                onDeleteAccount={() => setIsDeleteAccountOpen(true)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Profile Modals */}
      <EditPersonalInfoModal
        isOpen={isEditPersonalOpen}
        onClose={() => setIsEditPersonalOpen(false)}
        profile={profile}
        onSave={handleUpdateProfile}
      />

      <EditAcademicInfoModal
        isOpen={isEditAcademicOpen}
        onClose={() => setIsEditAcademicOpen(false)}
        profile={profile}
        onSave={handleUpdateProfile}
      />

      <EditCareerPreferencesModal
        isOpen={isEditCareerOpen}
        onClose={() => setIsEditCareerOpen(false)}
        profile={profile}
        onSave={handleUpdateProfile}
      />

      <NotificationPreferencesModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        userId="demo-user"
      />

      <ChangePasswordModal
        isOpen={isPasswordOpen}
        onClose={() => setIsPasswordOpen(false)}
      />

      <DeleteConfirmModal
        isOpen={isDeleteAccountOpen}
        title="Delete Account"
        description="Are you sure you want to permanently delete your HireLane account? This will erase all your applications, interviews, resumes, and data. This action cannot be undone."
        onClose={() => setIsDeleteAccountOpen(false)}
        onConfirm={handleDeleteAccountConfirm}
      />
    </AppShell>
  );
}
