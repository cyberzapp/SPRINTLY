"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getStoredGeminiKey, setStoredGeminiKey } from "@/lib/gemini/ai-service";
import KeyIcon from "@mui/icons-material/VpnKey";
import SparklesIcon from "@mui/icons-material/AutoAwesome";
import { toast } from "sonner";

interface AiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AiKeyModal({ open, onOpenChange, onSuccess }: AiKeyModalProps) {
  const [key, setKey] = useState(getStoredGeminiKey());

  const handleSave = () => {
    if (!key.trim()) {
      toast.error("Please enter a valid Vertex AI / Agent Platform API key");
      return;
    }
    setStoredGeminiKey(key.trim());
    toast.success("Vertex AI key saved for this session");
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1 text-primary">
            <SparklesIcon fontSize="small" />
            <DialogTitle>Vertex AI Configuration</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Sprintly is configured to exclusively use <strong>Google Cloud Vertex AI</strong> (Project: <code className="bg-muted px-1 py-0.5 rounded text-[11px] font-mono">sprintly-si</code>, Region: <code className="bg-muted px-1 py-0.5 rounded text-[11px] font-mono">us-central1</code>). Enter your Vertex AI / Gemini Platform API key below or set <code className="bg-muted px-1 py-0.5 rounded text-[11px] font-mono">VERTEX_AI_API_KEY</code> in <code className="bg-muted px-1 py-0.5 rounded text-[11px] font-mono">.env.local</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <KeyIcon sx={{ fontSize: 16 }} className="text-muted-foreground" />
              Vertex AI API Key
            </label>
            <Input
              type="password"
              placeholder="AIzaSy..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="text-xs font-mono"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Obtain your API key from Google Cloud Console &gt; Vertex AI / Gemini platform APIs.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="gap-1.5">
            <SparklesIcon sx={{ fontSize: 16 }} />
            Save & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
