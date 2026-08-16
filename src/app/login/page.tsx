"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const initialState: AuthState = { error: null };

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInState, signInAction, signInPending] = useActionState(
    signIn,
    initialState
  );
  const [signUpState, signUpAction, signUpPending] = useActionState(
    signUp,
    initialState
  );

  const state = mode === "signin" ? signInState : signUpState;
  const action = mode === "signin" ? signInAction : signUpAction;
  const pending = mode === "signin" ? signInPending : signUpPending;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <h1 className="mb-1 text-xl font-bold">תקציב הבית</h1>
          <p className="mb-6 text-sm text-muted">
            ניהול הוצאות משותף למאור ואנאל
          </p>

          <div className="mb-4 flex rounded-lg bg-slate-100 p-1 text-sm">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
                mode === "signin" ? "bg-white shadow-sm" : "text-muted"
              }`}
            >
              התחברות
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
                mode === "signup" ? "bg-white shadow-sm" : "text-muted"
              }`}
            >
              הרשמה
            </button>
          </div>

          <form action={action} className="space-y-3">
            <div>
              <Label htmlFor="email">אימייל</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div>
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>

            {state.error && (
              <p className="text-sm text-danger">{state.error}</p>
            )}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "רגע..." : mode === "signin" ? "התחברות" : "יצירת חשבון"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
