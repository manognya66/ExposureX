"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Shield,
  Plus,
  Search,
  KeyRound,
  Trash2,
  Edit3,
  Lock,
  UserX,
  User,
  CheckCircle2,
  X,
  RefreshCw,
  Sparkles,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { User as UserType } from "@/lib/types";
import { InviteUserModal } from "@/components/common/InviteUserModal";
import { cn } from "@/lib/utils";

const ROLES: { name: UserType["role"]; desc: string; badgeColor: string }[] = [
  {
    name: "Administrator",
    desc: "Full administrative privilege, scope approvals, and user governance.",
    badgeColor: "bg-red-950/60 text-red-400 border-red-500/40",
  },
  {
    name: "Security Analyst",
    desc: "Investigates findings, manages incidents, and triages exposure events.",
    badgeColor: "bg-amber-950/60 text-amber-400 border-amber-500/40",
  },
  {
    name: "Risk Manager",
    desc: "Evaluates internal/third-party posture and customizes risk weights.",
    badgeColor: "bg-cyan-950/60 text-cyan-400 border-cyan-800",
  },
  {
    name: "Auditor",
    desc: "Read-only oversight plus full access to compliance audit trails.",
    badgeColor: "bg-purple-950/60 text-purple-400 border-purple-800",
  },
  {
    name: "Viewer",
    desc: "Executive read-only visibility into dashboards and high-level trends.",
    badgeColor: "bg-slate-800 text-slate-300 border-slate-700",
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserType["role"]>("Security Analyst");
  const [showPassword, setShowPassword] = useState(false);

  // Edit / Role Reassignment Modal State
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editRole, setEditRole] = useState<UserType["role"]>("Security Analyst");
  const [editIsActive, setEditIsActive] = useState(true);

  // Reset Password Modal State
  const [resettingUser, setResettingUser] = useState<UserType | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState("");

  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error(err);
      setNotification({
        type: "error",
        message: err.message || "Failed to load team users directory."
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("exposurex_user") || localStorage.getItem("exposurex_user");
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch {}
      }
    }
    loadUsers();
  }, []);

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
    let pwd = "";
    for (let i = 0; i < 14; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
  };

  const handleCreateUser = async () => {
    if (!newEmail.trim() || !newFullName.trim() || !newPassword.trim()) {
      setNotification({ type: "error", message: "Please enter full name, email, and password." });
      return;
    }
    try {
      await api.createUser({
        email: newEmail.trim().toLowerCase(),
        full_name: newFullName.trim(),
        password: newPassword,
        role: newRole,
      });
      setIsAddModalOpen(false);
      setNewEmail("");
      setNewFullName("");
      setNewPassword("ExposureX@2026!");
      setNewRole("Security Analyst");
      setNotification({ type: "success", message: `User account created successfully.` });
      await loadUsers();
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to create user." });
    }
  };

  const handleRoleQuickChange = async (userId: string, targetRole: UserType["role"]) => {
    try {
      await api.updateUser(userId, { role: targetRole });
      setNotification({ type: "success", message: `Role updated to ${targetRole}.` });
      await loadUsers();
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to update role." });
    }
  };

  const handleToggleStatus = async (user: UserType) => {
    const nextStatus = !user.is_active;
    try {
      await api.updateUser(user.id, { is_active: nextStatus });
      setNotification({ type: "success", message: `Account status updated for ${user.email}.` });
      await loadUsers();
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to update account status." });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      await api.updateUser(editingUser.id, {
        full_name: editFullName.trim(),
        role: editRole,
        is_active: editIsActive,
      });
      setEditingUser(null);
      setNotification({ type: "success", message: "User profile updated successfully." });
      await loadUsers();
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to update user." });
    }
  };

  const handleResetPassword = async () => {
    if (!resettingUser || !resetNewPassword.trim()) {
      setNotification({ type: "error", message: "Please enter a new password." });
      return;
    }
    try {
      await api.resetUserPassword(resettingUser.id, resetNewPassword.trim());
      setNotification({ type: "success", message: `Password updated successfully for ${resettingUser.email}` });
      setResettingUser(null);
      setResetNewPassword("");
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to reset password." });
    }
  };

  const handleDeleteUser = async (user: UserType) => {
    try {
      await api.deleteUser(user.id);
      setNotification({ type: "success", message: `User account deleted.` });
      await loadUsers();
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to delete user." });
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3 font-sans">
            <UserCheck className="w-6 h-6 text-[#ff6600]" />
            <span>User Management & Role-Based Access Control</span>
            <span className="font-sans font-bold text-sm sm:text-base px-3.5 py-1 rounded-full bg-orange-500/10 border border-[#ff6600]/40 text-[#ff6600]">
              {users.length} Provisioned Accounts
            </span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1 font-sans">
            Add users, assign enterprise security roles, configure credentials, and manage active status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadUsers()}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Refresh user list"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>
          <button
            onClick={() => {
              if (currentUser && currentUser.role !== "Administrator") {
                setNotification({
                  type: "error",
                  message: `Administrator privilege required to generate company invites. Your active role is '${currentUser.role}'.`,
                });
                return;
              }
              setIsInviteModalOpen(true);
            }}
            className="text-xs px-3.5 py-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-[#ff6600] font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Colleague URL</span>
          </button>
          <button
            onClick={() => {
              if (currentUser && currentUser.role !== "Administrator") {
                setNotification({
                  type: "error",
                  message: `Administrator privilege required to provision new accounts. Your active role is '${currentUser.role}'.`,
                });
                return;
              }
              setIsAddModalOpen(true);
            }}
            className="text-xs px-4 py-2.5 rounded-xl bg-[#ff6600] hover:bg-[#e65c00] text-white font-bold transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/25 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* Non-Admin Directory Information Notice */}
      {currentUser && currentUser.role !== "Administrator" && (
        <div className="p-3.5 rounded-xl border border-amber-800/40 bg-amber-950/20 text-xs text-amber-300 flex items-center justify-between gap-3 font-sans">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Team Directory View:</strong> You are signed in as <strong>{currentUser.email}</strong> (<span className="font-mono text-amber-200">{currentUser.role}</span>). Modifying roles, password resets, and user provisioning are restricted to Administrators.
            </span>
          </div>
        </div>
      )}

      {/* Smooth Non-Intrusive Notification Banner */}
      {notification && (
        <div
          className={cn(
            "p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 animate-in fade-in",
            notification.type === "success"
              ? "bg-emerald-950/70 border-emerald-800 text-emerald-300"
              : "bg-red-950/70 border-red-800 text-red-300"
          )}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs underline opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Role Guide Cards with Enhanced Typography and Legibility */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {ROLES.map((r) => {
          const count = users.filter((u) => u.role === r.name).length;
          return (
            <div
              key={r.name}
              className="p-5 rounded-2xl bg-[#09090b] border border-zinc-800 hover:border-[#ff6600]/50 transition-all flex flex-col justify-between shadow-lg font-sans group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-sans font-bold text-base sm:text-lg text-white group-hover:text-[#ff6600] transition-colors leading-snug">
                    {r.name}
                  </h3>
                  <span className="font-sans font-black text-2xl sm:text-3xl text-[#ff6600] leading-none shrink-0">
                    {count}
                  </span>
                </div>

                <div className="mt-2 mb-3">
                  <span className={cn("text-xs font-sans font-semibold px-2.5 py-0.5 rounded-md border inline-flex items-center", r.badgeColor)}>
                    {r.name}
                  </span>
                </div>

                <p className="font-sans text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
                  {r.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#09090b] p-3 rounded-xl border border-zinc-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by analyst name or email..."
            className="w-full pl-9 pr-3 py-2 bg-black border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#ff6600] font-mono transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-mono text-zinc-400">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3.5 py-2 bg-black border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-[#ff6600] font-sans"
          >
            <option value="">All Roles ({users.length})</option>
            {ROLES.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card-cyber p-0 overflow-x-auto bg-[#09090b] border border-zinc-800 rounded-2xl shadow-xl">
        <table className="w-full text-left text-xs min-w-[1000px]">
          <thead className="bg-[#070b14] border-b border-[#1a2333] text-slate-400 font-mono uppercase text-[10px]">
            <tr>
              <th className="py-3.5 px-4 sm:px-5 font-bold">User</th>
              <th className="py-3.5 px-4 sm:px-5 font-bold">Email</th>
              <th className="py-3.5 px-4 sm:px-5 font-bold">Assigned Role</th>
              <th className="py-3.5 px-4 sm:px-5 font-bold">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a2333]/60">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <UserCheck className="w-8 h-8 text-slate-600" />
                    <p className="text-sm font-medium text-slate-400">No users found</p>
                    <p className="text-xs text-slate-600 max-w-sm">
                      {users.length === 0
                        ? "Click \"Add User\" to invite analysts or administrators with custom role-based access."
                        : "No users matched your filter criteria."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
              const roleMeta = ROLES.find((r) => r.name === u.role) || ROLES[1];

              return (
                <tr key={u.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3.5 px-4 sm:px-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-cyan-400 font-mono">
                        {u.full_name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100">{u.full_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{u.id.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 sm:px-5 font-mono text-cyan-300">{u.email}</td>

                  {/* Assign Role Dropdown */}
                  <td className="py-3.5 px-4 sm:px-5">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleQuickChange(u.id, e.target.value as UserType["role"])}
                        className={cn(
                          "text-[10px] font-mono px-2 py-1 rounded font-bold uppercase border bg-[#070b14] cursor-pointer focus:outline-none",
                          roleMeta.badgeColor
                        )}
                        title="Click to reassign role"
                      >
                        {ROLES.map((r) => (
                          <option key={r.name} value={r.name} className="bg-slate-900 text-slate-200">
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>

                  {/* Status Toggle */}
                  <td className="py-3.5 px-4 sm:px-5">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={cn(
                        "text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 transition-colors border",
                        u.is_active
                          ? "bg-emerald-950/60 text-emerald-400 border-emerald-800 hover:bg-emerald-900/80"
                          : "bg-red-950/60 text-red-400 border-red-800 hover:bg-red-900/80"
                      )}
                      title="Click to toggle account status"
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full", u.is_active ? "bg-emerald-400" : "bg-red-400")}></span>
                      <span>{u.is_active ? "Active" : "Suspended"}</span>
                    </button>
                  </td>

                  {/* Row Actions */}
                  <td className="py-3.5 px-4 sm:px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Edit Details */}
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setEditFullName(u.full_name);
                          setEditRole(u.role);
                          setEditIsActive(u.is_active);
                        }}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Edit profile & role"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Reset Password */}
                      <button
                        onClick={() => {
                          setResettingUser(u);
                          setResetNewPassword("");
                        }}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors"
                        title="Reset password"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete User */}
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-red-900/60 text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">Provision & Assign Role</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Full Name</label>
              <input
                type="text"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                placeholder="Marcus Vance"
                className="w-full px-3 py-2 bg-[#070b14] border border-[#1e293b] rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Email Address (Login)</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="marcus.vance@company.com"
                className="w-full px-3 py-2 bg-[#070b14] border border-[#1e293b] rounded text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-mono text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Generate Strong</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Set account password"
                  className="w-full px-3 py-2 bg-[#070b14] border border-[#1e293b] rounded text-xs text-slate-200 font-mono pr-14 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2 text-[10px] text-slate-400 hover:text-slate-200 font-mono px-1 py-0.5"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Assign Enterprise Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserType["role"])}
                className="w-full px-3 py-2 bg-[#070b14] border border-[#1e293b] rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {ROLES.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name} - {r.desc.substring(0, 45)}...
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1e293b]">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-all shadow-md shadow-orange-500/25 active:scale-95"
              >
                Create & Assign Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User & Role Reassignment Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">Modify User & Role</h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Email (Immutable)</label>
              <div className="px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-400 font-mono">
                {editingUser.email}
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Full Name</label>
              <input
                type="text"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                className="w-full px-3 py-2 bg-[#070b14] border border-[#1e293b] rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Reassign Role</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as UserType["role"])}
                className="w-full px-3 py-2 bg-[#070b14] border border-[#1e293b] rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {ROLES.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Account Status</label>
              <select
                value={editIsActive ? "true" : "false"}
                onChange={(e) => setEditIsActive(e.target.value === "true")}
                className="w-full px-3 py-2 bg-[#070b14] border border-[#1e293b] rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="true">Active (Can log in)</option>
                <option value="false">Suspended / Deactivated (Access revoked)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1e293b]">
              <button
                onClick={() => setEditingUser(null)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-all shadow-md shadow-orange-500/25 active:scale-95"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100">Reset Password</h3>
              </div>
              <button onClick={() => setResettingUser(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Set a new password for <span className="text-cyan-300 font-mono">{resettingUser.email}</span>.
            </p>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">New Password</label>
              <input
                type="text"
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                placeholder="Enter at least 6 characters"
                className="w-full px-3 py-2 bg-[#070b14] border border-[#1e293b] rounded text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1e293b]">
              <button
                onClick={() => setResettingUser(null)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs transition-colors"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Team Member URL Modal */}
      <InviteUserModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />
    </div>
  );
}
