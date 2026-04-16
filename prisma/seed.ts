import "dotenv/config";
import { PrismaClient, Reflectivity, Sides, Material } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DIMENSIONS: [number, number][] = [
  [6, 18],
  [12, 18],
  [18, 24],
  [24, 36],
  [30, 42],
  [36, 48],
  [48, 72],
  [6, 6],
  [12, 12],
];

type Combo = {
  thickness: string;
  reflectivity: Reflectivity;
  material: Material;
};

const VALID_COMBOS: Combo[] = [
  { thickness: ".040", reflectivity: "EG", material: "ALUMINUM" },
  { thickness: ".040", reflectivity: "HIP", material: "ALUMINUM" },
  { thickness: ".040", reflectivity: "DG3", material: "ALUMINUM" },
  { thickness: ".040", reflectivity: "NONE", material: "ALUMINUM" },
  { thickness: ".063", reflectivity: "HIP", material: "ALUMINUM" },
  { thickness: ".063", reflectivity: "DG3", material: "ALUMINUM" },
  { thickness: ".080", reflectivity: "DG3", material: "ALUMINUM" },
  { thickness: ".080", reflectivity: "NONE", material: "STEEL" },
  { thickness: ".125", reflectivity: "NONE", material: "ALUMINUM" },
  { thickness: ".125", reflectivity: "HIP", material: "ALUMINUM" },
];

function buildSkuCode(
  w: number,
  h: number,
  thickness: string,
  reflectivity: Reflectivity,
  sides: Sides,
  material: Material
): string {
  const mat = material === "ALUMINUM" ? "AL" : material === "STEEL" ? "ST" : "PL";
  const thick = thickness.replace(".", "");
  const sideSuffix = sides === "SINGLE" ? "SS" : "DS";
  return `${mat}-${w}X${h}-${thick}-${reflectivity}-${sideSuffix}`;
}

function buildDescription(
  w: number,
  h: number,
  thickness: string,
  reflectivity: Reflectivity,
  sides: Sides,
  material: Material
): string {
  const matName =
    material === "ALUMINUM" ? "Aluminum" : material === "STEEL" ? "Steel" : "Plastic";
  const refName =
    reflectivity === "NONE"
      ? "Non-Reflective"
      : reflectivity === "EG"
      ? "Engineer Grade"
      : reflectivity === "HIP"
      ? "High Intensity Prismatic"
      : "Diamond Grade";
  const sidesName = sides === "SINGLE" ? "Single Sided" : "Double Sided";
  return `${w}"×${h}" ${matName} ${thickness} ${refName} ${sidesName}`;
}

async function main() {
  console.log("Seeding SKU catalog...");

  const skus = [];

  for (const [w, h] of DIMENSIONS) {
    for (const combo of VALID_COMBOS) {
      for (const sides of ["SINGLE", "DOUBLE"] as Sides[]) {
        const skuCode = buildSkuCode(w, h, combo.thickness, combo.reflectivity, sides, combo.material);
        skus.push({
          sku_code: skuCode,
          description: buildDescription(w, h, combo.thickness, combo.reflectivity, sides, combo.material),
          width_in: w,
          height_in: h,
          thickness: combo.thickness,
          reflectivity: combo.reflectivity,
          sides,
          material: combo.material,
          active: true,
        });
      }
    }
  }

  let created = 0;
  let skipped = 0;

  for (const sku of skus) {
    const existing = await prisma.sKU.findUnique({ where: { sku_code: sku.sku_code } });
    if (!existing) {
      await prisma.sKU.create({ data: sku });
      created++;
    } else {
      skipped++;
    }
  }

  console.log(`Seed complete: ${created} created, ${skipped} already existed.`);
  console.log(`Total SKUs in catalog: ${await prisma.sKU.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
