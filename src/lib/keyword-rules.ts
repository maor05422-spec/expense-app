// סיווג אוטומטי של תנועות לפי מילת מפתח בשם בית העסק - מבוסס בדיוק על ההיגיון
// שבו המשפחה כבר עבדה בגיליון האקסל שלהם (גיליון "הגדרות" -> מילת מפתח -> קטגוריה).

import type { KeywordRule } from "@/lib/types";

/**
 * מחפש בין חוקי הסיווג של הבית את החוק המתאים ביותר לתיאור עסקה נתון.
 * ההתאמה היא לפי "מכיל" (case-insensitive), ומעדיפים את מילת המפתח הארוכה ביותר
 * שמתאימה - כדי שמילת מפתח ספציפית (למשל "סופר נווה יהושוע") תנצח מילת מפתח כללית
 * יותר (למשל "סופר").
 */
export function matchCategoryId(description: string, rules: KeywordRule[]): string | null {
  const desc = description.toLowerCase();
  let best: KeywordRule | null = null;

  for (const rule of rules) {
    const kw = rule.keyword.toLowerCase();
    if (!kw) continue;
    if (desc.includes(kw)) {
      if (!best || kw.length > best.keyword.length) {
        best = rule;
      }
    }
  }

  return best ? best.category_id : null;
}

/**
 * רשימת ברירת המחדל של מילות מפתח -> שם קטגוריה, מבוססת על גיליון האקסל שהמשפחה
 * כבר בנתה וצברה לאורך זמן. משמשת רק בטעינה הראשונית ("טען רשימת ברירת מחדל") -
 * כל מילת מפתח מותאמת לקטגוריה לפי שם, ומדולגת אם אין בבית קטגוריה בשם הזה.
 */
export const DEFAULT_KEYWORD_RULES: { keyword: string; categoryName: string }[] = [
  { keyword: "שופרסל", categoryName: "סופר ומזון בבית" },
  { keyword: "SHUFERSAL", categoryName: "סופר ומזון בבית" },
  { keyword: "רמי לוי", categoryName: "סופר ומזון בבית" },
  { keyword: "ויקטורי", categoryName: "סופר ומזון בבית" },
  { keyword: "טיב טעם", categoryName: "סופר ומזון בבית" },
  { keyword: "אושר עד", categoryName: "סופר ומזון בבית" },
  { keyword: "יינות ביתן", categoryName: "סופר ומזון בבית" },
  { keyword: "מגה", categoryName: "סופר ומזון בבית" },
  { keyword: "סופר נווה יהושוע", categoryName: "סופר ומזון בבית" },
  { keyword: "שוק נווה יהושע", categoryName: "סופר ומזון בבית" },
  { keyword: "אי.אם.פי.אם", categoryName: "סופר ומזון בבית" },
  { keyword: "סופר יודה", categoryName: "סופר ומזון בבית" },
  { keyword: "סופר אחים נשיא", categoryName: "סופר ומזון בבית" },
  { keyword: "CARREFOUR", categoryName: "סופר ומזון בבית" },
  { keyword: "טיב בשר", categoryName: "סופר ומזון בבית" },
  { keyword: "פיצוחי ירדן", categoryName: "סופר ומזון בבית" },

  { keyword: "פז", categoryName: "תחבורה ודלק" },
  { keyword: "PAZ", categoryName: "תחבורה ודלק" },
  { keyword: "סונול", categoryName: "תחבורה ודלק" },
  { keyword: "דור אלון", categoryName: "תחבורה ודלק" },
  { keyword: "דלק", categoryName: "תחבורה ודלק" },
  { keyword: "פנגו", categoryName: "תחבורה ודלק" },
  { keyword: "PANGO", categoryName: "תחבורה ודלק" },
  { keyword: "סלופארק", categoryName: "תחבורה ודלק" },
  { keyword: "רב קו", categoryName: "תחבורה ודלק" },
  { keyword: "LIME", categoryName: "תחבורה ודלק" },
  { keyword: "מ. התחבורה", categoryName: "תחבורה ודלק" },
  { keyword: "חניה", categoryName: "תחבורה ודלק" },
  { keyword: "מוסך", categoryName: "תחבורה ודלק" },
  { keyword: "שגריר", categoryName: "תחבורה ודלק" },

  { keyword: "חברת חשמל", categoryName: "חשבונות ותשתיות" },
  { keyword: "מקורות", categoryName: "חשבונות ותשתיות" },
  { keyword: "פרטנר", categoryName: "חשבונות ותשתיות" },
  { keyword: "סלקום", categoryName: "חשבונות ותשתיות" },
  { keyword: "CELLCOM", categoryName: "חשבונות ותשתיות" },
  { keyword: "בזק", categoryName: "חשבונות ותשתיות" },
  { keyword: "HOT", categoryName: "חשבונות ותשתיות" },
  { keyword: "הוט", categoryName: "חשבונות ותשתיות" },
  { keyword: "גולן", categoryName: "חשבונות ותשתיות" },
  { keyword: "YES", categoryName: "חשבונות ותשתיות" },
  { keyword: "נטפליקס", categoryName: "חשבונות ותשתיות" },
  { keyword: "NETFLIX", categoryName: "חשבונות ותשתיות" },
  { keyword: "SPOTIFY", categoryName: "חשבונות ותשתיות" },
  { keyword: "ספוטיפיי", categoryName: "חשבונות ותשתיות" },
  { keyword: "DISNEY", categoryName: "חשבונות ותשתיות" },
  { keyword: "YOUTUBE", categoryName: "חשבונות ותשתיות" },
  { keyword: "סופרגז", categoryName: "חשבונות ותשתיות" },
  { keyword: "APPLE.COM", categoryName: "חשבונות ותשתיות" },
  { keyword: "GOOGLE ONE", categoryName: "חשבונות ותשתיות" },
  { keyword: "ANTHROPIC", categoryName: "חשבונות ותשתיות" },

  { keyword: "וולט", categoryName: "מסעדות ואוכל בחוץ" },
  { keyword: "WOLT", categoryName: "מסעדות ואוכל בחוץ" },
  { keyword: "10BIS", categoryName: "מסעדות ואוכל בחוץ" },
  { keyword: "ארומה", categoryName: "מסעדות ואוכל בחוץ" },
  { keyword: "AROMA", categoryName: "מסעדות ואוכל בחוץ" },
  { keyword: "קופיקס", categoryName: "מסעדות ואוכל בחוץ" },
  { keyword: "מקדונלד", categoryName: "מסעדות ואוכל בחוץ" },
  { keyword: "בורגר", categoryName: "מסעדות ואוכל בחוץ" },
  { keyword: "פיצה", categoryName: "מסעדות ואוכל בחוץ" },
  { keyword: "אצל מלי", categoryName: "מסעדות ואוכל בחוץ" },
  { keyword: "שוארמה נעמה", categoryName: "מסעדות ואוכל בחוץ" },
  { keyword: "שילה", categoryName: "מסעדות ואוכל בחוץ" },
  { keyword: "פאפא ג'ינוס", categoryName: "מסעדות ואוכל בחוץ" },
  { keyword: "איזי קפה", categoryName: "מסעדות ואוכל בחוץ" },
  { keyword: "מאפה התנור", categoryName: "מסעדות ואוכל בחוץ" },
  { keyword: "מאפיית המשפחה", categoryName: "מסעדות ואוכל בחוץ" },
  { keyword: "LOBBY 34", categoryName: "מסעדות ואוכל בחוץ" },
  { keyword: "ארקפה", categoryName: "מסעדות ואוכל בחוץ" },

  { keyword: "אמזון", categoryName: "קניות (ביגוד ובית)" },
  { keyword: "AMAZON", categoryName: "קניות (ביגוד ובית)" },
  { keyword: "ALIEXPRESS", categoryName: "קניות (ביגוד ובית)" },
  { keyword: "ZARA", categoryName: "קניות (ביגוד ובית)" },
  { keyword: "CASTRO", categoryName: "קניות (ביגוד ובית)" },
  { keyword: "קסטרו", categoryName: "קניות (ביגוד ובית)" },
  { keyword: "FOX", categoryName: "קניות (ביגוד ובית)" },
  { keyword: "איקאה", categoryName: "קניות (ביגוד ובית)" },
  { keyword: "IKEA", categoryName: "קניות (ביגוד ובית)" },
  { keyword: "טרמינל", categoryName: "קניות (ביגוד ובית)" },

  { keyword: "מכבי", categoryName: "בריאות" },
  { keyword: "כללית", categoryName: "בריאות" },
  { keyword: "מאוחדת", categoryName: "בריאות" },
  { keyword: "סופר פארם", categoryName: "בריאות" },
  { keyword: "SUPER-PHARM", categoryName: "בריאות" },
  { keyword: "ניו פארם", categoryName: "בריאות" },
  { keyword: "ויטליק", categoryName: "בריאות" },

  { keyword: "עמלת", categoryName: "עמלות ובנקים" },
  { keyword: "עמלה", categoryName: "עמלות ובנקים" },
  { keyword: "ריבית", categoryName: "עמלות ובנקים" },
  { keyword: "דמי כרטיס", categoryName: "עמלות ובנקים" },

  { keyword: "סינמה סיטי", categoryName: "פנאי ובידור" },
  { keyword: "לאן משרד כרטיסים", categoryName: "פנאי ובידור" },

  { keyword: "ביטוח", categoryName: "ביטוחים" },

  { keyword: "מתנה", categoryName: "מתנות ותרומות" },
  { keyword: "פרחי חן", categoryName: "מתנות ותרומות" },
  { keyword: "קידי שיק", categoryName: "מתנות ותרומות" },

  { keyword: "צעצוע", categoryName: "ילדים וחינוך" },

  { keyword: "במבומלה", categoryName: "סיגריות" },

  { keyword: "BIT", categoryName: "העברות בביט" },

  { keyword: "וטרינרי", categoryName: "חיות מחמד" },
  { keyword: "חיותא", categoryName: "חיות מחמד" },

  { keyword: "שכר דירה", categoryName: "דיור" },

  { keyword: "הלוואה", categoryName: "הלוואות" },

  { keyword: "מועצה דתית", categoryName: "שונות" },
];
