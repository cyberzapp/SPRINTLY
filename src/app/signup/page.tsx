"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUpWithEmail, signInWithGoogle } from "@/lib/services/auth";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Full name is required.");
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(name.trim(), email.trim(), password);
      toast.success("Account created successfully!");
      router.push("/onboarding");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
      toast.success("Signed in with Google!");
      router.push("/onboarding");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Logo href="/" size="lg" className="justify-center" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Create your Sprintly account
          </h1>
          <p className="text-xs text-muted-foreground">
            Get started in under two minutes. Free forever tier included.
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs">
              Full Name
            </Label>
            <Input
              id="name"
              placeholder="e.g. Alex Rivera"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs h-9"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">
              Work Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="alex@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-xs h-9"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pass" className="text-xs">
              Password
            </Label>
            <Input
              id="pass"
              type="password"
              placeholder="•••••••• (min. 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-xs h-9"
              minLength={8}
              required
            />
          </div>

          <Button type="submit" size="sm" className="w-full font-semibold" disabled={loading}>
            {loading ? "Creating account..." : "Start Free Trial"}
          </Button>
        </form>

        <div className="relative flex items-center justify-center text-xs">
          <span className="w-full border-t border-border" />
          <span className="px-2 bg-background text-muted-foreground uppercase text-[10px]">
            Or continue with
          </span>
          <span className="w-full border-t border-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGoogleSignUp}
          className="w-full text-xs"
        >
          Continue with Google
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
