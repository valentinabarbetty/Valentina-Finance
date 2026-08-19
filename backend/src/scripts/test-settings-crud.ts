import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../config/prisma.js";

let passed = 0;
let failed = 0;

function ok(name: string, detail?: string) {
  passed++;
  console.log(`  ✅ ${name}${detail ? ': ' + detail : ''}`);
}

function fail(name: string, detail: string) {
  failed++;
  console.log(`  ❌ ${name}: ${detail}`);
}

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) { console.error("No user found"); process.exit(1); }
  const userId = user.id;
  console.log(`Testing CRUD with user: ${userId}\n`);

  // Snapshot existing data for cleanup
  const existingCatIds = (await prisma.category.findMany({ where: { userId }, select: { id: true } })).map(r => r.id);
  const existingTypeIds = (await prisma.transactionType.findMany({ where: { userId }, select: { id: true } })).map(r => r.id);

  let testCatId = "";
  let testTypeId = "";

  try {
    // === CREATE CATEGORY ===
    console.log("=== CREATE CATEGORY ===");
    const cat = await prisma.category.create({
      data: { userId, name: "Test CRUD Cat", kind: "EXPENSE", icon: "🧪", color: "#FF0000", description: "Test category" },
    });
    testCatId = cat.id;
    ok("Create category", `id=${cat.id}, name=${cat.name}, kind=${cat.kind}`);

    // Verify fields
    if (cat.name === "Test CRUD Cat" && cat.kind === "EXPENSE" && cat.icon === "🧪" && cat.color === "#FF0000") {
      ok("Category fields correct");
    } else {
      fail("Category fields", `unexpected: name=${cat.name}, kind=${cat.kind}`);
    }

    // === READ CATEGORY ===
    console.log("\n=== READ CATEGORY ===");
    const foundCat = await prisma.category.findFirst({ where: { id: testCatId, userId, deletedAt: null } });
    if (foundCat && foundCat.name === "Test CRUD Cat") {
      ok("Read category", `name=${foundCat.name}`);
    } else {
      fail("Read category", "not found or wrong name");
    }

    // === EDIT CATEGORY ===
    console.log("\n=== EDIT CATEGORY ===");
    const updatedCat = await prisma.category.update({
      where: { id: testCatId },
      data: { name: "Test CRUD Cat Updated", color: "#00FF00" },
    });
    if (updatedCat.name === "Test CRUD Cat Updated" && updatedCat.color === "#00FF00") {
      ok("Edit category", `name=${updatedCat.name}, color=${updatedCat.color}`);
    } else {
      fail("Edit category", `unexpected: name=${updatedCat.name}`);
    }

    // === CREATE TYPE ===
    console.log("\n=== CREATE TYPE ===");
    const type = await prisma.transactionType.create({
      data: { userId, categoryId: testCatId, name: "Test Type", kind: "EXPENSE", icon: "📌", color: "#0000FF" },
    });
    testTypeId = type.id;
    if (type.categoryId === testCatId && type.kind === "EXPENSE") {
      ok("Create type", `id=${type.id}, name=${type.name}, categoryId=${type.categoryId}`);
    } else {
      fail("Create type", `unexpected: categoryId=${type.categoryId}, kind=${type.kind}`);
    }

    // === READ TYPE ===
    console.log("\n=== READ TYPE ===");
    const typesInCat = await prisma.transactionType.findMany({
      where: { userId, categoryId: testCatId, deletedAt: null },
    });
    if (typesInCat.length === 1 && typesInCat[0]!.id === testTypeId) {
      ok("Read types by category", `found ${typesInCat.length} type(s)`);
    } else {
      fail("Read types by category", `expected 1, got ${typesInCat.length}`);
    }

    // Verify global list (no categoryId filter) includes it
    const allTypes = await prisma.transactionType.findMany({ where: { userId, deletedAt: null } });
    const foundInAll = allTypes.some(t => t.id === testTypeId);
    if (foundInAll) {
      ok("Type appears in global list");
    } else {
      fail("Type in global list", "not found");
    }

    // === EDIT TYPE ===
    console.log("\n=== EDIT TYPE ===");
    const updatedType = await prisma.transactionType.update({
      where: { id: testTypeId },
      data: { name: "Test Type Updated", color: "#FFFF00" },
    });
    if (updatedType.name === "Test Type Updated" && updatedType.categoryId === testCatId) {
      ok("Edit type", `name=${updatedType.name}, categoryId unchanged=${updatedType.categoryId === testCatId}`);
    } else {
      fail("Edit type", `unexpected: name=${updatedType.name}`);
    }

    // === VERIFY HIERARCHY ===
    console.log("\n=== VERIFY HIERARCHY ===");
    const categories = await prisma.category.findMany({ where: { userId, deletedAt: null }, orderBy: { name: "asc" } });
    const types = await prisma.transactionType.findMany({ where: { userId, deletedAt: null } });
    const typeMap = new Map<string, typeof types>();
    for (const t of types) {
      const list = typeMap.get(t.categoryId) ?? [];
      list.push(t);
      typeMap.set(t.categoryId, list);
    }

    let hierarchyOk = true;
    for (const c of categories) {
      const catTypes = typeMap.get(c.id) ?? [];
      for (const t of catTypes) {
        if (c.kind !== "GENERAL" && t.kind !== c.kind) {
          hierarchyOk = false;
          fail("Kind match", `type ${t.name} kind=${t.kind} doesn't match category ${c.name} kind=${c.kind}`);
        }
      }
    }
    if (hierarchyOk) {
      ok("All type kinds match their parent category kinds");
    }

    // === DELETE TYPE ===
    console.log("\n=== DELETE TYPE ===");
    await prisma.transactionType.update({ where: { id: testTypeId }, data: { deletedAt: new Date() } });
    const deletedType = await prisma.transactionType.findFirst({ where: { id: testTypeId, deletedAt: null } });
    if (!deletedType) {
      ok("Soft-delete type", "type no longer in active records");
    } else {
      fail("Soft-delete type", "still found");
    }

    // Verify category still exists
    const catStillExists = await prisma.category.findFirst({ where: { id: testCatId, deletedAt: null } });
    if (catStillExists) {
      ok("Category still exists after type deletion");
    } else {
      fail("Category after type deletion", "category was also deleted");
    }

    // === DELETE CATEGORY ===
    console.log("\n=== DELETE CATEGORY ===");
    await prisma.category.update({ where: { id: testCatId }, data: { deletedAt: new Date(), isActive: false } });
    const deletedCat = await prisma.category.findFirst({ where: { id: testCatId, deletedAt: null } });
    if (!deletedCat) {
      ok("Soft-delete category", "category no longer in active records");
    } else {
      fail("Soft-delete category", "still found");
    }

    // === VERIFY NO SIDE EFFECTS ===
    console.log("\n=== VERIFY NO SIDE EFFECTS ===");
    const afterCatIds = (await prisma.category.findMany({ where: { userId, deletedAt: null }, select: { id: true } })).map(r => r.id);
    const afterTypeIds = (await prisma.transactionType.findMany({ where: { userId, deletedAt: null }, select: { id: true } })).map(r => r.id);

    const unchangedCats = afterCatIds.filter(id => existingCatIds.includes(id));
    const unchangedTypes = afterTypeIds.filter(id => existingTypeIds.includes(id));

    if (unchangedCats.length === existingCatIds.length) {
      ok("Existing categories unchanged", `${unchangedCats.length} categories intact`);
    } else {
      fail("Existing categories", `expected ${existingCatIds.length}, got ${unchangedCats.length}`);
    }

    if (unchangedTypes.length === existingTypeIds.length) {
      ok("Existing types unchanged", `${unchangedTypes.length} types intact`);
    } else {
      fail("Existing types", `expected ${existingTypeIds.length}, got ${unchangedTypes.length}`);
    }

  } catch (e: any) {
    fail("Unexpected error", e.message);
    console.error(e);
  }

  console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) process.exitCode = 1;

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
