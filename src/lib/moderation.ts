/**
 * Smart Moderation Utility for Student Voices
 * Filters out gibberish, spam, and flagged keywords.
 */

const FLAGGED_KEYWORDS = [
  "strike", "riot", "protest", "abuse", "drugs", "weed", "marijuana",
  "fight", "combat", "unfair", "stole", "thief", "steal", "weapon",
  "gun", "knife", "kill", "suicide", "hate", "fuck", "shit", "bitch",
  "stupid", "idiot", "dumb", "bullying", "bully"
];

export interface ModerationResult {
  status: "Safe" | "Flagged";
  reason: string | null;
}

export function analyzeVoice(title: string, description: string): ModerationResult {
  const fullText = `${title} ${description}`.toLowerCase();
  
  // 1. Basic Length/Meaningfulness Check
  if (fullText.trim().length < 10) {
    return { status: "Flagged", reason: "Too short / Incomplete" };
  }

  // 2. Spam Detection (Character Repetition)
  // Catch "aaaaaaaaa" or "sdsdsdsdsd"
  const maxRepetition = /(.)\1{5,}/; // Same char 6+ times
  if (maxRepetition.test(fullText)) {
    return { status: "Flagged", reason: "Potential Spam (Character Repetition)" };
  }

  // 3. Meaningful Word Check (Average Word Length)
  const words = fullText.split(/\s+/).filter(w => w.length > 0);
  if (words.length > 0) {
    const avgLen = words.reduce((acc, w) => acc + w.length, 0) / words.length;
    // If average word length is very high (e.g. 15+), it's likely gibberish
    if (avgLen > 15) {
      return { status: "Flagged", reason: "Gibberish / Meaningless strings" };
    }
    // If very few words compared to characters
    if (words.length < 2 && fullText.length > 20) {
      return { status: "Flagged", reason: "Meaningless (Single long string)" };
    }
  }

  // 4. Keyword Check
  const foundKeywords = FLAGGED_KEYWORDS.filter(kb => fullText.includes(kb));
  if (foundKeywords.length > 0) {
    return { 
      status: "Flagged", 
      reason: `Sensitive content (Keywords: ${foundKeywords.join(", ")})` 
    };
  }

  return { status: "Safe", reason: null };
}
