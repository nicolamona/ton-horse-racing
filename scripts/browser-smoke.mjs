import { chromium } from "playwright";

const baseURL = process.env.DEMO_BASE_URL || "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto(baseURL, { waitUntil: "networkidle" });
  if (!(await page.title()).includes("TON Horse Racing")) throw new Error("Page title missing");
  if (!(await page.locator("body").innerText()).includes("DEMO")) {
    // The app labels its demo mode in the visible page; fail closed if absent.
    throw new Error("Visible demo-mode label not found");
  }

  await page.locator("#depositDemo").click();
  await page.locator("#depositInfo").waitFor({ state: "visible" });
  await page.locator("#closeDepositInfo").click();

  const start = page.locator("#start");
  await start.click();
  await page.getByText(/Carrera terminada|Esta vez no ganaste fichas|Ya largaron/i).waitFor({ timeout: 5000 }).catch(() => {});
  await page.locator("#result").getByText(/Carrera terminada|Esta vez no ganaste fichas/).waitFor({ timeout: 20000 });
  await page.locator("#raceHistory li").first().waitFor({ timeout: 5000 });
  const result = await page.locator("#result").innerText();
  if (!/fichas virtuales|Fichas ficticias sin valor monetario/i.test(result)) {
    throw new Error("Race result did not clearly identify virtual credits");
  }

  console.log("Browser demo smoke checks passed: load, demo deposit info, simulated race, virtual-credit disclosure, and local history.");
} finally {
  await browser.close();
}
