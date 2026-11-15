"use client";

import { useState } from "react";
import { useWorkspace } from "@/providers/workspace-provider";
import { useAuth } from "@/providers/auth-provider";
import { useCollection } from "@/hooks/use-firestore";
import { paths } from "@/lib/firebase/firestore";
import { uploadProjectFile, deleteProjectFile, getFileDownloadUrl } from "@/lib/services/files";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  FileCode,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  File as FileIcon,
  Upload,
  Download,
  Trash2,
  Search,
  ExternalLink,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
import type { ProjectFile } from "@/types";
import { toast } from "sonner";

interface ProjectFilesTabProps {
  projectId: string;
}

export function ProjectFilesTab({ projectId }: ProjectFilesTabProps) {
  const { user } = useAuth();
  const { workspaceId, role } = useWorkspace();
  const [search, setSearch] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const filesState = useCollection<ProjectFile>(
    workspaceId ? paths.files(workspaceId, projectId) : null,
    `files:${workspaceId}:${projectId}`
  );

  const files = filesState.data
    .filter((f) => !f.taskId && !f.commentId) // project-level uploads
    .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workspaceId || !user) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      await uploadProjectFile(
        {
          workspaceId,
          projectId,
          file,
          uploaderId: user.uid,
          uploaderName: user.displayName || user.email || "Team Member",
        },
        (prog) => setUploadProgress(Math.round(prog))
      );
      toast.success(`${file.name} uploaded successfully.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file.");
    } finally {
      setUploading(false);
      setUploadProgress(null);
      e.target.value = "";
    }
  };

  const handleDownload = async (file: ProjectFile) => {
    try {
      const url = await getFileDownloadUrl(file.storagePath);
      window.open(url, "_blank");
    } catch {
      toast.error("Failed to generate download URL.");
    }
  };

  const handleDelete = async (file: ProjectFile) => {
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) return;
    if (!workspaceId) return;

    try {
      await deleteProjectFile(workspaceId, projectId, file.id, file.storagePath);
      toast.success("File deleted.");
    } catch {
      toast.error("Failed to delete file.");
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <FileImage className="size-4 text-purple-500" />;
    if (type.includes("pdf") || type.includes("text")) return <FileText className="size-4 text-blue-500" />;
    if (type.includes("sheet") || type.includes("excel") || type.includes("csv"))
      return <FileSpreadsheet className="size-4 text-emerald-500" />;
    if (type.includes("zip") || type.includes("tar") || type.includes("compressed"))
      return <FileArchive className="size-4 text-amber-500" />;
    return <FileIcon className="size-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      {/* Search and Upload Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-8"
          />
        </div>

        <div>
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Button
              type="button"
              size="sm"
              disabled={uploading}
              className="gap-1.5 text-xs pointer-events-none"
            >
              <Upload className="size-3.5" />
              <span>{uploading ? `Uploading (${uploadProgress}%)` : "Upload File"}</span>
            </Button>
          </label>
        </div>
      </div>

      {uploadProgress !== null && (
        <div className="space-y-1 p-3 rounded-lg border border-border bg-surface">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Uploading file to Firebase Storage...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-1.5" />
        </div>
      )}

      {/* Files Table */}
      <div className="border border-border rounded-xl bg-surface overflow-hidden shadow-soft">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
            <tr>
              <th className="p-3">File Name</th>
              <th className="p-3">Size</th>
              <th className="p-3">Uploaded By</th>
              <th className="p-3">Uploaded Date</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredFiles.map((file) => (
              <tr key={file.id} className="hover:bg-muted/20 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-2 font-medium">
                    {getFileIcon(file.contentType)}
                    <span className="truncate max-w-xs">{file.name}</span>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground font-mono">
                  {formatBytes(file.size)}
                </td>
                <td className="p-3 text-muted-foreground">
                  {file.uploaderName || "Team Member"}
                </td>
                <td className="p-3 text-muted-foreground">
                  {file.createdAt
                    ? new Date(file.createdAt.toMillis()).toLocaleDateString()
                    : "—"}
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(file)}
                      className="size-7 text-muted-foreground hover:text-foreground"
                      title="Download"
                    >
                      <Download className="size-3.5" />
                    </Button>
                    {(role === "owner" || role === "admin" || file.uploadedBy === user?.uid) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(file)}
                        className="size-7 text-muted-foreground hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredFiles.length === 0 && (
          <div className="py-12 text-center text-xs text-muted-foreground space-y-1">
            <FileIcon className="size-8 mx-auto text-muted-foreground/40 mb-2" />
            <p>No project files uploaded yet.</p>
            <p className="text-[11px]">Upload design assets, specs, spreadsheets, or docs.</p>
          </div>
        )}
      </div>
    </div>
  );
}
