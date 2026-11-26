
const fs = require("fs");
const { execFileSync } = require("child_process");

const ALLOWED_TYPES = [
  "fix",
  "init",
  "feat",
  "style",
  "test",
  "build",
  "perf",
  "security",
  "design",
  "config",
  "merge",
  "release",
  "dependency",
  "revert",
  "cleanup",
  "ci",
  "docs",
  "chore"
];

const VALIDATION_MODE = (
  process.env.VALIDATION_MODE || "warn"
).toLowerCase();

const COMMIT_REGEX = new RegExp(
  `^(${ALLOWED_TYPES.join("|")})(?:\\(([^()\\r\\n]+)\\))?(!)?:\\s+AB#\\d+\\s+(.+)$`
);

const VAGUE_DESCRIPTION_REGEX =
  /^(fix|update|change|bug fix|fix bug|minor changes?|various changes?)\.?$/i;

const REQUIRED_PR_HEADINGS = [
  "Summary",
  "Why is this change required?",
  "What has changed?",
  "How to test",
  "Related Azure Boards Work Item"
];

let hasErrors = false;
let issueCount = 0;

function reportIssue(message) {
  issueCount++;

  if (VALIDATION_MODE === "enforce") {
    hasErrors = true;
    console.error(`::error::${message}`);
  } else {
    console.warn(`::warning::${message}`);
  }
}

function getPullRequestEvent() {
  const eventPath = process.env.GITHUB_EVENT_PATH;

  if (!eventPath || !fs.existsSync(eventPath)) {
    throw new Error("GitHub event payload could not be found.");
  }

  const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));

  if (!event.pull_request) {
    throw new Error("This validator expects a pull_request event.");
  }

  return event.pull_request;
}

function getPullRequestCommits(baseSha, headSha) {
  try {
    const output = execFileSync(
      "git",
      [
        "log",
        "--no-merges",
        "--format=%H%x1f%s%x1f%b%x1e",
        `${baseSha}..${headSha}`
      ],
      { encoding: "utf8" }
    );

    return output
      .split("\x1e")
      .map(record => record.trim())
      .filter(Boolean)
      .map(record => {
        const [hash, subject, body = ""] = record.split("\x1f");

        return {
          hash,
          subject: subject || "",
          body: body || ""
        };
      });
  } catch (error) {
    throw new Error(
      `Unable to retrieve pull request commits: ${error.message}`
    );
  }
}

function validateCommit(commit) {
  const shortHash = commit.hash.substring(0, 7);
  const subject = commit.subject.trim();

  const match = subject.match(COMMIT_REGEX);

  if (!match) {
    reportIssue(
      `Commit ${shortHash} has an invalid message: "${subject}". ` +
      "Expected format: type(optional-scope)!: AB#1234 description"
    );
    return;
  }

  const breakingChange = match[3] === "!";
  const description = match[4].trim();

  if (description.length < 10) {
    reportIssue(
      `Commit ${shortHash} has a description that is too short.`
    );
  }

  if (VAGUE_DESCRIPTION_REGEX.test(description)) {
    reportIssue(
      `Commit ${shortHash} has a vague description: "${description}".`
    );
  }

  if (breakingChange && !/^BREAKING CHANGE:\s*.+/im.test(commit.body)) {
    reportIssue(
      `Commit ${shortHash} uses "!" but does not include a ` +
      "BREAKING CHANGE footer in its commit body."
    );
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasHeading(body, heading) {
  const escapedHeading = escapeRegex(heading);

  const pattern = new RegExp(
    `^\\s{0,3}#{1,6}\\s*${escapedHeading}\\s*:?[ \\t]*$`,
    "im"
  );

  return pattern.test(body);
}

function validatePullRequest(pullRequest) {
  const title = (pullRequest.title || "").trim();
  const body = pullRequest.body || "";

  if (!title) {
    reportIssue("Pull request title is required.");
  } else {
    if (title.length > 50) {
      reportIssue(
        `Pull request title is ${title.length} characters. ` +
        "The maximum allowed length is 50 characters."
      );
    }

    if (!/\bAB#\d+\b/.test(title)) {
      reportIssue(
        "Pull request title should include an Azure Boards reference, " +
        "for example AB#1234."
      );
    }
  }

  if (!body.trim()) {
    reportIssue("Pull request description is required.");
    return;
  }

  for (const heading of REQUIRED_PR_HEADINGS) {
    if (!hasHeading(body, heading)) {
      reportIssue(
        `Pull request description is missing the required section: "${heading}".`
      );
    }
  }

  if (!/\bAB#\d+\b/.test(body)) {
    reportIssue(
      "Pull request description must include an Azure Boards work item reference, " +
      "for example AB#1234."
    );
  }
}

function main() {
  if (!["warn", "enforce"].includes(VALIDATION_MODE)) {
    throw new Error(
      `Invalid VALIDATION_MODE "${VALIDATION_MODE}". Use "warn" or "enforce".`
    );
  }

  console.log("Starting BL development standards validation...");

  const pullRequest = getPullRequestEvent();

  const baseSha = pullRequest.base.sha;
  const headSha = pullRequest.head.sha;

  const commits = getPullRequestCommits(baseSha, headSha);

  console.log(`Found ${commits.length} commit(s) to validate.`);

  if (commits.length === 0) {
    console.warn("No non-merge commits were found to validate.");
  }

  for (const commit of commits) {
    validateCommit(commit);
  }

  validatePullRequest(pullRequest);

  console.log("");
  console.log("BL development standards validation completed.");

  if (issueCount === 0) {
    console.log("All checks passed.");
    return;
  }

  console.log(`Found ${issueCount} issue(s).`);

  if (VALIDATION_MODE === "warn") {
    console.log(
      "Warning mode is enabled. These issues will not fail the workflow."
    );
    return;
  }

  if (hasErrors) {
    console.error(
      "Enforcement mode is enabled. The workflow will fail."
    );
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  console.error(`::error::Validation could not complete: ${error.message}`);
  process.exitCode = 1;
}
