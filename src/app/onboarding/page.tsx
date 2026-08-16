"use client";

import { useActionState, useState } from "react";
import { createHouseholdAction, joinHouseholdAction, type OnboardingState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const initialState: OnboardingState = { error: null };

export default function OnboardingPage() {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [createState, createAction, createPending] = useActionState(
    createHouseholdAction,
    initialState
  );
  const [joinState, joinAction, joinPending] = useActionState(
    joinHouseholdAction,
    initialState
  );

  const state = mode === "create" ? createState : joinState;
  const action = mode === "create" ? createAction : joinAction;
  const pending = mode === "create" ? createPending : joinPending;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <h1 className="mb-1 text-xl font-bold">כמעט מוכנים</h1>
          <p className="mb-6 text-sm text-muted">
            צרו בית משותף חדש, או הצטרפו לבית שבן/בת הזוג כבר יצרו
          </p>

          <div className="mb-4 flex rounded-lg bg-slate-100 p-1 text-sm">
            <button
              type="button"
              onClick={() => setMode("create")}
              className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
                mode === "create" ? "bg-white shadow-sm" : "text-muted"
              }`}
            >
              יצירת בית
            </button>
            <button
              type="button"
              onClick={() => setMode("join")}
              className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
                mode === "join" ? "bg-white shadow-sm" : "text-muted"
              }`}
            >
              הצטרפות לבית
            </button>
          </div>

          <form action={action} className="space-y-3">
            <div>
              <Label htmlFor="displayName">השם שלך</Label>
              <Input id="displayName" name="displayName" required placeholder="לדוגמה: מאור" />
            </div>

            {mode === "create" ? (
              <div>
                <Label htmlFor="householdName">שם הבית</Label>
                <Input
                  id="householdName"
                  name="householdName"
                  required
                  placeholder="לדוגמה: הבית של מאור ואנאל"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="code">קוד הזמנה</Label>
                <Input
                  id="code"
                  name="code"
                  required
                  placeholder="הקוד שקיבלת מבן/בת הזוג"
                  className="uppercase"
                />
              </div>
            )}

            {state.error && <p className="text-sm text-danger">{state.error}</p>}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "רגע..." : mode === "create" ? "יצירת בית משותף" : "הצטרפות"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
