"use client";

import { useState, useEffect, useRef } from "react";
import { 
  CheckSquare, Plus, ArrowUpDown, Loader2, Search, Trash2, Edit2, 
  ChevronDown, Calendar, AlertCircle, MessageSquare, Send, X, Clock, User, Check
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast-provider";

interface Task {
  id: string;
  name: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "UPCOMING" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
  projectName: string;
  projectSlug: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
  authorEmail: string;
  authorInitials: string;
}

export default function MyTasksPage() {
  const { success, error } = useToast();
  const toast = {
    show: (type: "success" | "error" | "info", msg: string) => {
      if (type === "success") success(msg);
      else error(msg);
    }
  };
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  
  // Interactive UI state
  const [activeDropdownTaskId, setActiveDropdownTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  
  // Edit Task modal/inline state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string>("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [editDueDate, setEditDueDate] = useState("");

  // Attachments & Screenshot Upload state
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    type: string;
    data: string;
  } | null>(null);

  // Custom Delete Confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskIdToDelete, setTaskIdToDelete] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.show("error", "Attachment exceeds 2MB limit.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachedFile({
            name: file.name,
            type: file.type,
            data: event.target.result as string
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          if (file.size > 2 * 1024 * 1024) {
            toast.show("error", "Pasted image exceeds 2MB limit.");
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setAttachedFile({
                name: file.name || "pasted_image.png",
                type: file.type,
                data: event.target.result as string
              });
            }
          };
          reader.readAsDataURL(file);
          e.preventDefault();
        }
      }
    }
  };

  const parseCommentContent = (content: string) => {
    try {
      if (content.startsWith("{") && content.endsWith("}")) {
        const parsed = JSON.parse(content);
        return {
          text: parsed.text || "",
          file: parsed.file || null
        };
      }
    } catch (e) {}
    return {
      text: content,
      file: null
    };
  };

  // Fetch tasks
  const fetchTasks = () => {
    fetch("/api/dashboard")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => {
        setTasks(data.tasks || []);
      })
      .catch((err) => {
        console.error("Failed to load tasks:", err);
        toast.show("error", "Failed to retrieve your task list.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Handle clicking outside status dropdown to close it
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdownTaskId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Fetch comments for selected task
  const fetchComments = async (taskId: string) => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTask) {
      fetchComments(selectedTask.id);
    }
  }, [selectedTask]);

  // Update task status
  const handleStatusChange = async (taskId: string, newStatus: Task["status"]) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.show("success", `Task status updated successfully.`);
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
        }
        // Refresh comments to track activity logs if necessary
        fetchComments(taskId);
      } else {
        toast.show("error", "Failed to update task status.");
      }
    } catch (err) {
      console.error("Status update error:", err);
      toast.show("error", "An error occurred updating the status.");
    } finally {
      setActiveDropdownTaskId(null);
    }
  };

  // Delete task
  const handleDeleteTask = (taskId: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    setTaskIdToDelete(taskId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskIdToDelete) return;
    try {
      const res = await fetch(`/api/tasks/${taskIdToDelete}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.show("success", "Task deleted successfully.");
        setTasks(prev => prev.filter(t => t.id !== taskIdToDelete));
        if (selectedTask && selectedTask.id === taskIdToDelete) {
          setSelectedTask(null);
        }
      } else {
        toast.show("error", "Failed to delete the task.");
      }
    } catch (err) {
      console.error("Task deletion failure:", err);
      toast.show("error", "An error occurred deleting the task.");
    } finally {
      setShowDeleteConfirm(false);
      setTaskIdToDelete(null);
    }
  };

  // Open Edit Task Modal
  const openEditModal = (task: Task, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditTaskId(task.id);
    setEditName(task.name);
    setEditDescription(task.description || "");
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
    setIsEditModalOpen(true);
  };

  // Submit Task Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.show("error", "Task name cannot be empty.");
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${editTaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
          priority: editPriority,
          dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
        }),
      });

      if (res.ok) {
        toast.show("success", "Task updated successfully.");
        fetchTasks();
        setIsEditModalOpen(false);
        if (selectedTask && selectedTask.id === editTaskId) {
          setSelectedTask(prev => prev ? {
            ...prev,
            name: editName.trim(),
            description: editDescription.trim() || null,
            priority: editPriority,
            dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
          } : null);
        }
      } else {
        toast.show("error", "Failed to update task details.");
      }
    } catch (err) {
      console.error("Task update error:", err);
      toast.show("error", "An error occurred updating the task details.");
    }
  };

// Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() && !attachedFile) return;

    try {
      const payloadContent = JSON.stringify({
        text: newCommentText.trim(),
        file: attachedFile
      });

      const res = await fetch(`/api/tasks/${selectedTask!.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: payloadContent }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments(prev => [...prev, data.comment]);
        setNewCommentText("");
        setAttachedFile(null);
        toast.show("success", "Work submission added.");
      } else {
        toast.show("error", "Failed to add comment.");
      }
    } catch (err) {
      console.error("Comment post error:", err);
      toast.show("error", "An error occurred posting your comment.");
    }
  };

  // Format styles helper
  const getStatusStyles = (status: string) => {
    if (status === "IN_PROGRESS") return "bg-[#e0f4f0] text-[#14b8a6] dark:bg-emerald-950/30 dark:text-[#2dd4bf]";
    if (status === "TODO") return "bg-[#eaf0fa] text-[#2563eb] dark:bg-blue-950/30 dark:text-[#60a5fa]";
    if (status === "UPCOMING") return "bg-[#fef3c7] text-[#d97706] dark:bg-amber-950/30 dark:text-[#fbbf24]";
    return "bg-[#dcfce7] text-[#15803d] dark:bg-green-950/30 dark:text-[#4ade80]"; // COMPLETED
  };

  const getStatusLabel = (status: string) => {
    if (status === "IN_PROGRESS") return "In Progress";
    if (status === "TODO") return "To Do";
    if (status === "UPCOMING") return "Upcoming";
    return "Completed";
  };

  const getPriorityStyles = (priority: string) => {
    if (priority === "HIGH") return "bg-red-50 dark:bg-red-950/20 text-red-500 border border-red-100/50 dark:border-red-900/30";
    if (priority === "MEDIUM") return "bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-100/50 dark:border-amber-900/30";
    return "bg-slate-50 dark:bg-slate-800/40 text-slate-500 border border-slate-100/30 dark:border-slate-800";
  };

  const getDueDateLabel = (dueDateString: string | null, status?: string) => {
    if (!dueDateString) return { label: "No due date", color: "text-slate-400" };
    const date = new Date(dueDateString);
    const today = new Date();
    
    if (status === "COMPLETED") {
      return { 
        label: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), 
        color: "text-slate-400 dark:text-slate-500" 
      };
    }

    const isToday = date.toDateString() === today.toDateString();
    if (isToday) return { label: "Today", color: "text-red-550 font-bold dark:text-rose-400" };
    
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: "Overdue", color: "text-rose-650 font-semibold dark:text-rose-400" };
    if (diffDays === 1) return { label: "Tomorrow", color: "text-amber-500 font-semibold" };
    if (diffDays <= 7) return { label: `${diffDays} days left`, color: "text-slate-500 dark:text-slate-400" };
    
    return { 
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), 
      color: "text-slate-455 dark:text-slate-400" 
    };
  };

  // Filter tasks based on Search, Status selection, and Priority selection
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "ALL" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-wider">Compiling all tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none animate-fade-in text-left">
      {/* 1. Header & Filters Control Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <CheckSquare className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-850 dark:text-slate-100 text-base">My Tasks</h3>
          </div>
          {/* Quick task search */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 dark:focus:ring-indigo-950 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Categories Tab selectors & Priority Selector */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-50 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mr-2">Status:</span>
            {["ALL", "IN_PROGRESS", "TODO", "UPCOMING", "COMPLETED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer uppercase tracking-wider",
                  statusFilter === status
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                {status === "IN_PROGRESS" ? "In Progress" : status === "TODO" ? "To Do" : status.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs font-semibold text-slate-655 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl py-2 px-3 outline-none cursor-pointer focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition-all"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Tasks Table List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-slate-355 italic text-sm">
              No tasks matched your filter criteria.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Task Name</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status (Click to Change)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-xs font-semibold text-slate-655 dark:text-slate-300">
                {filteredTasks.map((task) => {
                  const dateInfo = getDueDateLabel(task.dueDate, task.status);
                  return (
                    <tr 
                      key={task.id} 
                      onClick={() => setSelectedTask(task)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-4 text-left max-w-sm">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-100 truncate">{task.name}</span>
                          {task.description && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-xs mt-0.5 font-normal">
                              {task.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-left">
                        <span className="font-bold text-indigo-500 dark:text-indigo-400">
                          {task.projectName}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-left">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full tracking-wide font-extrabold text-[9px] uppercase border",
                          getPriorityStyles(task.priority)
                        )}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-left relative" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value as Task["status"])}
                            className={cn(
                              "appearance-none pr-7 pl-2.5 py-1 rounded-md font-extrabold uppercase tracking-wide text-[9px] cursor-pointer border border-transparent shadow-xs transition-all outline-none focus:ring-1 focus:ring-indigo-400 dark:focus:ring-indigo-900",
                              getStatusStyles(task.status)
                            )}
                          >
                            <option value="TODO" className="text-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200">To Do</option>
                            <option value="IN_PROGRESS" className="text-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200">In Progress</option>
                            <option value="UPCOMING" className="text-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200">Upcoming</option>
                            <option value="COMPLETED" className="text-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200">Completed</option>
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-80" />
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={(e) => openEditModal(task, e)}
                            className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button 
                            onClick={(e) => handleDeleteTask(task.id, e)}
                            className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 3. ClickUp-style Task Details Sidebar/Modal Overlay */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-end z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 w-full max-w-2xl h-full flex flex-col shadow-2xl animate-slide-in p-6 relative">
            
            {/* Modal header actions */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-800 mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-extrabold uppercase bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-md tracking-wider">
                  {selectedTask.projectName}
                </span>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border",
                  getPriorityStyles(selectedTask.priority)
                )}>
                  {selectedTask.priority}
                </span>
              </div>
              <button 
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-55 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable details & comment body */}
            <div className="flex-1 overflow-y-auto pr-1 min-h-0 space-y-6">
              
              {/* Task Title & Status */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{selectedTask.name}</h2>
                
                {/* Inline attributes list */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-50 dark:border-slate-800 rounded-2xl p-4">
                  <div className="space-y-1.5 text-left">
                    <span className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider block">Status</span>
                    <div className="relative inline-block">
                      <select
                        value={selectedTask.status}
                        onChange={(e) => handleStatusChange(selectedTask.id, e.target.value as Task["status"])}
                        className={cn(
                          "appearance-none pr-7 pl-2.5 py-1 rounded-md font-extrabold uppercase tracking-wide text-[9px] cursor-pointer border border-transparent shadow-xs transition-all outline-none focus:ring-1 focus:ring-indigo-400 dark:focus:ring-indigo-900",
                          getStatusStyles(selectedTask.status)
                        )}
                      >
                        <option value="TODO" className="text-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200">To Do</option>
                        <option value="IN_PROGRESS" className="text-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200">In Progress</option>
                        <option value="UPCOMING" className="text-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200">Upcoming</option>
                        <option value="COMPLETED" className="text-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200">Completed</option>
                      </select>
                      <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-80" />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <span className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider block">Due Date</span>
                    <span className={cn("text-xs font-bold flex items-center gap-1.5", getDueDateLabel(selectedTask.dueDate, selectedTask.status).color)}>
                      <Calendar className="w-3.5 h-3.5" />
                      {getDueDateLabel(selectedTask.dueDate, selectedTask.status).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Task Description */}
              <div className="space-y-2 text-left">
                <h4 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Description</h4>
                <div className="bg-slate-50/20 dark:bg-slate-800/10 border border-slate-50 dark:border-slate-800 rounded-2xl p-4 text-xs font-semibold text-slate-655 dark:text-slate-350 leading-relaxed min-h-[100px] whitespace-pre-wrap">
                  {selectedTask.description || "No description provided for this task."}
                </div>
              </div>

              {/* Activity & Task Comments Section */}
              <div className="border-t border-slate-50 dark:border-slate-800 pt-6 space-y-4">
                <div className="flex items-center gap-2 text-left">
                  <MessageSquare className="w-4.5 h-4.5 text-slate-450" />
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    Task Activity & Comments ({comments.length})
                  </h4>
                </div>

                {/* File preview badge before submission */}
                {attachedFile && (
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl mb-2 animate-fade-in">
                    <div className="flex items-center gap-2">
                      {attachedFile.type.startsWith("image") ? (
                        <img src={attachedFile.data} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <CheckSquare className="w-4 h-4 text-indigo-500" />
                      )}
                      <div className="flex flex-col text-left">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{attachedFile.name}</span>
                        <span className="text-[9px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">Submission Attachment</span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setAttachedFile(null)}
                      className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* New Comment Submission Form */}
                <form onSubmit={handleAddComment} className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      onPaste={handlePaste}
                      placeholder="Add comments or paste screenshots (Ctrl+V)..."
                      className="w-full text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 pl-4 pr-11 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                    />
                    {/* Attachment trigger icon */}
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 cursor-pointer"
                      title="Upload file or screenshot"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept="image/*,application/pdf,application/zip,text/*"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={!newCommentText.trim() && !attachedFile}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-3 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-sm shrink-0"
                  >
                    <Send className="w-4.5 h-4.5" />
                  </button>
                </form>

                {/* Dynamic Comments List */}
                <div className="space-y-3 pt-2">
                  {commentsLoading ? (
                    <div className="flex items-center justify-center py-6 gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                      <span className="text-xs font-bold text-slate-400">Loading comments...</span>
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic py-4 text-center">
                      No activity logs or comments yet. Add a comment to start tracking progress.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                      {comments.map((comment) => {
                        const parsed = parseCommentContent(comment.content);
                        return (
                          <div 
                            key={comment.id} 
                            className="flex items-start gap-3 p-3 bg-slate-50/20 dark:bg-slate-800/10 border border-slate-50 dark:border-slate-800/50 rounded-2xl text-left"
                          >
                            <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                              {comment.authorInitials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{comment.authorName}</span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              
                              {/* Comment Text */}
                              {parsed.text && (
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-semibold leading-relaxed break-words">
                                  {parsed.text}
                                </p>
                              )}

                              {/* Comment Attachment File submission */}
                              {parsed.file && (
                                <div className="mt-2 text-left">
                                  {parsed.file.type.startsWith("image") ? (
                                    <div className="relative group max-w-sm rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                                      <img 
                                        src={parsed.file.data} 
                                        alt={parsed.file.name} 
                                        className="w-full max-h-56 object-cover hover:scale-[1.02] transition-transform duration-300"
                                      />
                                      <div className="p-2 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-xs flex items-center justify-between text-[10px] font-bold text-slate-555 border-t border-slate-100 dark:border-slate-800">
                                        <span className="truncate max-w-[200px]">{parsed.file.name}</span>
                                        <a 
                                          href={parsed.file.data} 
                                          download={parsed.file.name}
                                          className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                        >
                                          Download
                                        </a>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl max-w-sm">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <CheckSquare className="w-4 h-4 text-indigo-500 shrink-0" />
                                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{parsed.file.name}</span>
                                      </div>
                                      <a 
                                        href={parsed.file.data} 
                                        download={parsed.file.name}
                                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline ml-3 shrink-0 cursor-pointer"
                                      >
                                        Download
                                      </a>
                                    </div>
                                  )}
                                </div>
                              )}

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* 4. Edit Task Modal Popup */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={handleEditSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4 animate-fade-in"
          >
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-tight uppercase text-left">Edit Task Details</h3>
            
            {/* Task Name */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block px-1">Task Name</label>
              <input 
                type="text" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Task Name"
                className="w-full text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all"
                required
              />
            </div>

            {/* Task Description */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block px-1">Description</label>
              <textarea 
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe this task..."
                rows={3}
                className="w-full text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all resize-none"
              />
            </div>

            {/* Task Priority & Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block px-1">Priority</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as any)}
                  className="w-full text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block px-1">Due Date</label>
                <input 
                  type="date" 
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition-all cursor-pointer"
                />
              </div>
            </div>

            {/* Form actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-4 py-2 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="bg-indigo-600 text-white text-xs font-extrabold px-4.5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Custom Delete Confirmation Overlay Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4 animate-fade-in text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-sm tracking-tight uppercase">Delete Task</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                Are you sure you want to delete this task? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button 
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setTaskIdToDelete(null);
                }}
                className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-4 py-2 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={confirmDeleteTask}
                className="bg-red-500 hover:bg-red-650 text-white text-xs font-extrabold px-4.5 py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
