import assert from "assert";
import { matchIntent, intentRoutes } from "./intentRouter";

console.log("🚀 Starting Intent Router Unit Tests...\n");

try {
  // Test 1: Basic Matching
  console.log("⏳ Test 1: Verification of basic keyword mapping...");
  
  const hrResult = matchIntent("请假年假该怎么请？");
  assert.ok(hrResult, "Should match an intent for holiday/leave query");
  assert.strictEqual(hrResult?.intent, "hr_policy");
  
  const archResult = matchIntent("我想了解本地数据库和向量架构设计");
  assert.ok(archResult, "Should match an intent for database and architecture query");
  assert.strictEqual(archResult?.intent, "architecture");
  
  const devResult = matchIntent("接口命名和git分支有什么规范吗？");
  assert.ok(devResult, "Should match an intent for api and git specs");
  assert.strictEqual(devResult?.intent, "dev_specs");
  
  const growthResult = matchIntent("卡片读书笔记和原子习惯");
  assert.ok(growthResult, "Should match an intent for reading notes and growth");
  assert.strictEqual(growthResult?.intent, "personal_growth");
  
  console.log("✅ Test 1 Passed!\n");

  // Test 2: Priority Configuration and Matching
  console.log("⏳ Test 2: Verification of priority-based intent routing...");
  
  // "工作" (hr_policy, priority: 10) vs "架构" (architecture, priority: 20)
  // Since architecture has higher priority, "工作架构" query should resolve to "architecture"
  const priorityResult1 = matchIntent("工作中的系统设计架构安全");
  assert.ok(priorityResult1, "Should match an intent");
  assert.strictEqual(priorityResult1?.intent, "architecture", "Should resolve to architecture due to higher priority (20 > 10)");
  
  // "读书" (personal_growth, priority: 40) vs "研发" (dev_specs, priority: 30)
  // Since personal_growth has higher priority, "研发读书笔记" should resolve to "personal_growth"
  const priorityResult2 = matchIntent("研发团队的读书笔记");
  assert.ok(priorityResult2, "Should match an intent");
  assert.strictEqual(priorityResult2?.intent, "personal_growth", "Should resolve to personal_growth due to higher priority (40 > 30)");
  
  console.log("✅ Test 2 Passed!\n");

  // Test 3: Priority Config Change Dynamically
  console.log("⏳ Test 3: Verification of dynamic priority configuration...");
  
  // Let's find dev_specs and change its priority to 50 (higher than personal_growth's 40)
  const devSpecsRoute = intentRoutes.find(r => r.intent === "dev_specs");
  if (devSpecsRoute) {
    const originalPriority = devSpecsRoute.priority;
    devSpecsRoute.priority = 50; // Temporarily make dev_specs highest priority
    
    // Now "研发团队的读书笔记" should resolve to "dev_specs" because 50 > 40
    const dynamicResult = matchIntent("研发团队的读书笔记");
    assert.strictEqual(dynamicResult?.intent, "dev_specs", "Should resolve to dev_specs now that priority is 50");
    
    // Restore original priority
    devSpecsRoute.priority = originalPriority;
  } else {
    assert.fail("dev_specs route not found in configuration");
  }
  
  console.log("✅ Test 3 Passed!\n");

  // Test 4: Default Fallback
  console.log("⏳ Test 4: Verification of default fallback (no match)...");
  
  const fallbackResult = matchIntent("今天天气真好啊");
  assert.strictEqual(fallbackResult, null, "Should return null for unknown queries");
  
  console.log("✅ Test 4 Passed!\n");

  console.log("🎉 All unit tests passed successfully!");
} catch (error) {
  console.error("❌ Unit tests failed:");
  console.error(error);
  process.exit(1);
}
