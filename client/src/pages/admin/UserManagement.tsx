/**
 * Arthur D. Little - Global Health Platform
 * User Management - Admin Dashboard
 * Viewport-fit design
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Trash2,
  Edit2,
  Loader2,
  Shield,
  User,
  Mail,
  X,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  type User as UserType,
  type UserCreate,
  type UserUpdate,
} from "../../services/auth";
import { cn } from "../../lib/utils";

// Role colors
const roleColors = {
  admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  user: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  viewer: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export function UserManagement() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Fetch users
  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsCreateModalOpen(false);
    },
  });

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdate }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingUser(null);
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteConfirm(null);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-400">
        <AlertTriangle className="w-6 h-6 mr-2" />
        Failed to load users
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              User Management
            </h1>
            <p className="text-white/40 text-sm">
              Manage platform users and permissions
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-adl-accent text-white rounded-lg font-medium text-sm hover:bg-adl-blue-light transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Users Table - Scrollable */}
      <div className="flex-1 min-h-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden flex flex-col">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                User
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                Role
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                Last Login
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {data?.users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-300" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {user.full_name || "Unnamed"}
                      </p>
                      <p className="text-sm text-slate-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border capitalize",
                      roleColors[user.role]
                    )}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.is_active ? (
                    <span className="flex items-center gap-2 text-emerald-400">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-slate-500">
                      <div className="w-2 h-2 bg-slate-500 rounded-full" />
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-400 text-sm">
                  {user.last_login
                    ? new Date(user.last_login).toLocaleDateString()
                    : "Never"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(user.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data?.users.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            No users found. Add your first user.
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <UserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(data) => createMutation.mutate(data as UserCreate)}
        isLoading={createMutation.isPending}
        title="Add New User"
      />

      {/* Edit User Modal */}
      <UserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSubmit={(data) =>
          editingUser && updateMutation.mutate({ id: editingUser.id, data })
        }
        isLoading={updateMutation.isPending}
        title="Edit User"
        initialData={editingUser || undefined}
        isEdit
      />

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-red-400 mb-4">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-lg font-semibold">Delete User</h3>
              </div>
              <p className="text-slate-300 mb-6">
                Are you sure you want to delete this user? This action cannot be
                undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deleteConfirm)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// User Modal Component
function UserModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  title,
  initialData,
  isEdit = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserCreate | UserUpdate) => void;
  isLoading: boolean;
  title: string;
  initialData?: UserType;
  isEdit?: boolean;
}) {
  const [email, setEmail] = useState(initialData?.email || "");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(initialData?.full_name || "");
  const [role, setRole] = useState<"admin" | "user" | "viewer">(
    initialData?.role || "user"
  );
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: UserCreate | UserUpdate = {
      email,
      full_name: fullName || undefined,
      role,
    };
    if (password) {
      data.password = password;
    }
    if (isEdit) {
      (data as UserUpdate).is_active = isActive;
    }
    onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={!isEdit}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password {isEdit && "(leave blank to keep current)"}
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!isEdit}
                minLength={8}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "user" | "viewer")}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="admin">Admin</option>
              <option value="user">User</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          {/* Active Status (Edit only) */}
          {isEdit && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors",
                  isActive ? "bg-emerald-500" : "bg-slate-600"
                )}
              >
                <span
                  className={cn(
                    "block w-5 h-5 bg-white rounded-full transition-transform",
                    isActive ? "translate-x-6" : "translate-x-0.5"
                  )}
                />
              </button>
              <span className="text-sm text-slate-300">Active</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              {isEdit ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default UserManagement;
