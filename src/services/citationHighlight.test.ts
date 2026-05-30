import assert from "assert";

interface TextItem {
  str: string;
  transform: number[];
  width: number;
}

/**
 * Pure-function implementation of our PDF text matching and highlight mapping algorithm.
 * Mirroring exactly the logic implemented inside CitationDrawer.tsx.
 */
export function locateAndHighlightSimulated(
  items: TextItem[],
  highlightAnchor: string
) {
  const fullText = items.map((item) => item.str).join(" ");
  const cleanAnchor = highlightAnchor.trim().toLowerCase();

  let matchIndex = -1;
  let matchLen = 0;

  if (cleanAnchor) {
    // Attempt 1: Exact or substring match of the full anchor
    matchIndex = fullText.toLowerCase().indexOf(cleanAnchor);
    if (matchIndex !== -1) {
      matchLen = cleanAnchor.length;
    } else {
      // Attempt 2: Match subset (e.g. first 30 chars of the anchor)
      const partialLen = Math.min(30, cleanAnchor.length);
      if (partialLen > 5) {
        const partialAnchor = cleanAnchor.substring(0, partialLen);
        matchIndex = fullText.toLowerCase().indexOf(partialAnchor);
        if (matchIndex !== -1) {
          matchLen = partialLen;
        }
      }
    }
  }

  // Attempt 3: Word-by-word matching
  if (matchIndex === -1 && cleanAnchor) {
    const words = cleanAnchor.split(/\s+/).filter((w) => w.length > 3);
    for (const word of words) {
      const idx = fullText.toLowerCase().indexOf(word);
      if (idx !== -1) {
        matchIndex = idx;
        matchLen = word.length;
        break;
      }
    }
  }

  const matchedIndices: number[] = [];
  if (matchIndex !== -1) {
    let currentPos = 0;
    items.forEach((item, index) => {
      const itemStrLen = item.str.length;
      const start = currentPos;
      const end = currentPos + itemStrLen;

      const isOverlap =
        (start <= matchIndex && end > matchIndex) ||
        (start < matchIndex + matchLen && end >= matchIndex + matchLen) ||
        (start >= matchIndex && end <= matchIndex + matchLen);

      if (isOverlap) {
        matchedIndices.push(index);
      }
      currentPos += itemStrLen + 1; // account for join space
    });
  }

  return { matchIndex, matchLen, matchedIndices };
}

console.log("🚀 Starting Citation Highlight Matching Unit Tests...\n");

try {
  // Setup sample mock PDF text items for testing
  const mockTextItems: TextItem[] = [
    { str: "mindvaults", transform: [1, 0, 0, 1, 50, 100], width: 50 },
    { str: "core", transform: [1, 0, 0, 1, 110, 100], width: 30 },
    { str: "architecture", transform: [1, 0, 0, 1, 150, 100], width: 80 },
    { str: "uses", transform: [1, 0, 0, 1, 240, 100], width: 30 },
    { str: "local", transform: [1, 0, 0, 1, 280, 100], width: 40 },
    { str: "RAG", transform: [1, 0, 0, 1, 330, 100], width: 30 },
    { str: "pipeline.", transform: [1, 0, 0, 1, 370, 100], width: 50 },
  ];

  // Test 1: Exact/Full Match
  console.log("⏳ Test 1: Verification of full matching...");
  const result1 = locateAndHighlightSimulated(mockTextItems, "core architecture uses");
  assert.notStrictEqual(result1.matchIndex, -1, "Should find the match index");
  assert.strictEqual(result1.matchLen, "core architecture uses".length);
  // Overlapping items: "core" (idx 1), "architecture" (idx 2), "uses" (idx 3)
  assert.deepStrictEqual(result1.matchedIndices, [1, 2, 3]);
  console.log("✅ Test 1 Passed!\n");

  // Test 2: Substring / Partial Match (e.g. first 30 characters)
  console.log("⏳ Test 2: Verification of partial matching fallbacks...");
  // "core architecture uses local RAG pipeline with a lot of extra text that is not in the original items"
  const longAnchor = "core architecture uses local RAG pipeline with extra details";
  const result2 = locateAndHighlightSimulated(mockTextItems, longAnchor);
  assert.notStrictEqual(result2.matchIndex, -1, "Should fall back and find match");
  assert.strictEqual(result2.matchLen, 30); // limit is Math.min(30, length)
  // Should match "core" (idx 1), "architecture" (idx 2), "uses" (idx 3), "local" (idx 4), "RAG" (idx 5)
  assert.deepStrictEqual(result2.matchedIndices, [1, 2, 3, 4, 5]);
  console.log("✅ Test 2 Passed!\n");

  // Test 3: Word-by-word Match fallback
  console.log("⏳ Test 3: Verification of word-by-word fallback...");
  // None of the first parts match, but it contains a distinct long word "pipeline"
  const queryWithWord = "completely unknown pipeline query";
  const result3 = locateAndHighlightSimulated(mockTextItems, queryWithWord);
  assert.notStrictEqual(result3.matchIndex, -1, "Should fall back to single word");
  // "pipeline" is at index 6
  assert.deepStrictEqual(result3.matchedIndices, [6]);
  console.log("✅ Test 3 Passed!\n");

  // Test 4: No Match
  console.log("⏳ Test 4: Verification of non-matching queries...");
  const result4 = locateAndHighlightSimulated(mockTextItems, "xyz abc def");
  assert.strictEqual(result4.matchIndex, -1, "Should return -1 for unmatched text");
  assert.deepStrictEqual(result4.matchedIndices, []);
  console.log("✅ Test 4 Passed!\n");

  console.log("🎉 All Citation Highlight Unit Tests passed successfully!");
} catch (error) {
  console.error("❌ Unit tests failed:");
  console.error(error);
  process.exit(1);
}
