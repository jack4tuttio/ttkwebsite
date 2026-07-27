import { readFile, writeFile } from "node:fs/promises";

const FLAGGED_FILE = "flagged.txt";
const OUTPUT_FILE = "data.json";

function parseFlaggedFile(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line, index) => {
      const parts = line.split("|").map((value) => value.trim());

      if (parts.length < 3 || parts.length > 5) {
        throw new Error(
          `Invalid flagged.txt entry on line ${index + 1}. Expected: USER_ID|CATEGORIES|SUMMARY|DATE|STATUS`
        );
      }

      const [
        userId,
        categoryText,
        summary,
        added = "Unknown",
        status = "Flagged"
      ] = parts;

      if (!/^\d+$/.test(userId)) {
        throw new Error(
          `Invalid Roblox user ID "${userId}" on line ${index + 1}`
        );
      }

      return {
        userId,
        categories: categoryText
          .split(",")
          .map((category) => category.trim())
          .filter(Boolean),
        summary,
        added,
        status
      };
    });
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "CommunitySafetyDirectory/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchRobloxProfile(userId) {
  const fallback = {
    name: `User ${userId}`,
    displayName: `User ${userId}`,
    created: null,
    description: "",
    avatar: null,
    profileAvailable: false
  };

  try {
    const user = await fetchJson(
      `https://users.roblox.com/v1/users/${encodeURIComponent(userId)}`
    );

    return {
      ...fallback,
      name: user.name || fallback.name,
      displayName:
        user.displayName || user.name || fallback.displayName,
      created: user.created || null,
      description: user.description || "",
      profileAvailable: true
    };
  } catch (error) {
    console.warn(
      `Could not load Roblox user ${userId}: ${error.message}`
    );

    return fallback;
  }
}

async function fetchRobloxAvatar(userId) {
  try {
    const params = new URLSearchParams({
      userIds: userId,
      size: "420x420",
      format: "Png",
      isCircular: "false"
    });

    const payload = await fetchJson(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?${params}`
    );

    return payload.data?.[0]?.imageUrl || null;
  } catch (error) {
    console.warn(
      `Could not load avatar for ${userId}: ${error.message}`
    );

    return null;
  }
}

async function build() {
  const text = await readFile(FLAGGED_FILE, "utf8");
  const reports = parseFlaggedFile(text);
  const completedReports = [];

  for (const report of reports) {
    console.log(`Fetching Roblox user ${report.userId}...`);

    const [profile, avatar] = await Promise.all([
      fetchRobloxProfile(report.userId),
      fetchRobloxAvatar(report.userId)
    ]);

    completedReports.push({
      ...report,
      profile: {
        ...profile,
        avatar
      }
    });
  }

  await writeFile(
    OUTPUT_FILE,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        reports: completedReports
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  console.log(`Generated ${OUTPUT_FILE}.`);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
