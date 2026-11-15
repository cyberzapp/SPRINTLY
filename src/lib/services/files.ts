"use client";

import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, setDoc, deleteDoc, serverTimestamp, updateDoc, increment } from "firebase/firestore";
import { getFirebaseStorage } from "@/lib/firebase/client";
import { paths } from "@/lib/firebase/firestore";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import type { ProjectFile } from "@/types";

export interface UploadFileInput {
  workspaceId: string;
  projectId: string;
  taskId?: string | null;
  commentId?: string | null;
  file: File;
  uploaderId: string;
  uploaderName: string;
}

export async function uploadProjectFile(
  input: UploadFileInput,
  onProgress?: (progress: number) => void
): Promise<ProjectFile> {
  const { workspaceId, projectId, file, uploaderId, uploaderName, taskId, commentId } = input;

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`File is too large. Max size is 25MB.`);
  }

  const storage = getFirebaseStorage();
  const fileRef = doc(paths.files(workspaceId, projectId));
  const fileId = fileRef.id;

  const storagePath = `workspaces/${workspaceId}/projects/${projectId}/files/${fileId}/${file.name}`;
  const fileStorageRef = ref(storage, storagePath);

  const uploadTask = uploadBytesResumable(fileStorageRef, file, {
    contentType: file.type,
  });

  await new Promise<void>((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => reject(error),
      () => resolve()
    );
  });

  const record: Record<string, unknown> = {
    workspaceId,
    projectId,
    taskId: taskId || null,
    commentId: commentId || null,
    name: file.name,
    storagePath,
    contentType: file.type || "application/octet-stream",
    size: file.size,
    uploadedBy: uploaderId,
    uploaderName,
    createdAt: serverTimestamp(),
  };

  await setDoc(fileRef, record);

  // Update task attachment count if attached to task
  if (taskId) {
    await updateDoc(paths.task(workspaceId, projectId, taskId), {
      attachmentCount: increment(1),
    });
  }

  return {
    id: fileId,
    ...record,
  } as ProjectFile;
}

export async function getFileDownloadUrl(storagePath: string): Promise<string> {
  const storage = getFirebaseStorage();
  const fileRef = ref(storage, storagePath);
  return getDownloadURL(fileRef);
}

export async function deleteProjectFile(
  workspaceId: string,
  projectId: string,
  fileId: string,
  storagePath: string,
  taskId?: string | null
) {
  const storage = getFirebaseStorage();
  const fileStorageRef = ref(storage, storagePath);

  try {
    await deleteObject(fileStorageRef);
  } catch (err) {
    console.warn("Storage object delete warning:", err);
  }

  await deleteDoc(paths.file(workspaceId, projectId, fileId));

  if (taskId) {
    await updateDoc(paths.task(workspaceId, projectId, taskId), {
      attachmentCount: increment(-1),
    });
  }
}
