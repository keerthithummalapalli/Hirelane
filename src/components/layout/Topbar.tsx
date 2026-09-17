"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, Menu, User, LogOut, Check, X } from "lucide-react";
import { profileService } from "@/services/profileService";
import { Profile } from "@/types/database";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

interface TopbarProps {
  title: string;
  onOpenMobileMenu?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ title, onOpenMobileMenu }) => {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    profileService.getProfile("demo-user").then(setProfile);
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/applications?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between bg-[#F8FAFC]/80 backdrop-blur-md px-6 lg:px-8 border-b border-slate-100">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-lg lg:hidden"
          aria-label="Open Navigation"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl lg:text-2xl font-bold text-[#0F172A] tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        {/* Search Bar */}
        <div className="relative hidden sm:block w-64 md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search anything..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200/80 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-800 shadow-sm"
          />
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 rounded-full shadow-sm hover:bg-slate-50 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#0047FF] text-[10px] font-bold text-white shadow">
              3
            </span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white p-4 shadow-xl border border-slate-100 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="divide-y divide-slate-50 py-2">
                <div className="py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-semibold text-slate-800">Amazon Interview Tomorrow</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 pl-4">Technical Round scheduled for 10:00 AM.</p>
                </div>
                <div className="py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-xs font-semibold text-slate-800">Google Deadline in 2 days</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 pl-4">Application deadline for SDE Intern is 22 May.</p>
                </div>
                <div className="py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-slate-800">Resume parsed successfully</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 pl-4">Resume_V1.pdf is active as default.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center focus:outline-none ring-2 ring-transparent hover:ring-blue-200 rounded-full transition-all"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || "User"}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 font-bold text-sm shadow-sm">
                AV
              </div>
            )}
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-white py-2 shadow-xl border border-slate-100 z-50">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {profile?.full_name || "Aditya Verma"}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {profile?.email || "aditya@example.com"}
                </p>
              </div>
              <Link
                href="/profile"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>My Profile</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
