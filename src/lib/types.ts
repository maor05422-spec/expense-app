export type CategoryType = "expense" | "income";

export type Household = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
};

export type HouseholdMember = {
  user_id: string;
  household_id: string;
  display_name: string;
  created_at: string;
};

export type Category = {
  id: string;
  household_id: string;
  name: string;
  icon: string | null;
  monthly_budget: number;
  type: CategoryType;
  created_at: string;
};

export type Transaction = {
  id: string;
  household_id: string;
  category_id: string | null;
  amount: number;
  date: string;
  description: string | null;
  paid_by: string | null;
  source: "manual" | "recurring";
  recurring_id: string | null;
  created_at: string;
};

export type RecurringExpense = {
  id: string;
  household_id: string;
  category_id: string | null;
  amount: number;
  description: string;
  day_of_month: number;
  active: boolean;
  created_at: string;
};

export type SavingsGoal = {
  id: string;
  household_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  icon: string | null;
  created_at: string;
};

export type SavingsContribution = {
  id: string;
  goal_id: string;
  household_id: string;
  amount: number;
  date: string;
  user_id: string | null;
  created_at: string;
};

export type KeywordRule = {
  id: string;
  household_id: string;
  keyword: string;
  category_id: string;
  created_at: string;
};

// טיפוס גנרי מינימלי כדי לספק ל-supabase-js; לא אוכף סכמה מלאה ברמת ה-DB client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
