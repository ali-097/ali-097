// Renders every SVG the README uses, straight from the GitHub API.
//
// Nothing here depends on a third-party card service, which is the point:
// the previous README's stats and trophy images were returning 503 and 402.
// Run with `node scripts/render.mjs`; set GITHUB_TOKEN for live numbers.

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { themes } from "./theme.mjs";
import { terminal, stats } from "./svg.mjs";

const USER = "ali-097";
const out = join(dirname(fileURLToPath(import.meta.url)), "..", "assets");

// Values used when the API is unreachable or unauthenticated, so a local run
// still produces a complete, correctly laid-out SVG.
const FALLBACK = {
  commit: { sha: "0000000", subject: "chore(profile): rebuild the landing page" },
  counters: { commits: 0, prs: 0, repos: 0, languages: 0 },
  languages: [{ name: "TypeScript", share: 100 }],
};

const QUERY = `
query($login:String!){
  user(login:$login){
    contributionsCollection{
      totalCommitContributions
      totalPullRequestContributions
      restrictedContributionsCount
    }
    # privacy:PUBLIC keeps the counts equal to what a visitor can actually see.
    # Without it an owner PAT also returns private repos, and the card would
    # claim more "public repos" than the profile lists.
    repositories(first:100, ownerAffiliations:OWNER, isFork:false, privacy:PUBLIC, orderBy:{field:PUSHED_AT, direction:DESC}){
      totalCount
      nodes{
        name
        stargazerCount
        primaryLanguage{ name }
        defaultBranchRef{
          target{
            ... on Commit{
              history(first:5){
                nodes{ oid messageHeadline authoredDate author{ user{ login } } }
              }
            }
          }
        }
      }
    }
  }
}`;

async function fetchData(token) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "ali-097-profile",
    },
    body: JSON.stringify({ query: QUERY, variables: { login: USER } }),
  });
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map((e) => e.message).join("; "));
  return json.data.user;
}

function shape(user) {
  const repos = user.repositories.nodes;

  // Newest commit actually authored by the user, across recently pushed repos.
  let newest = null;
  for (const r of repos.slice(0, 12)) {
    for (const c of r.defaultBranchRef?.target?.history?.nodes ?? []) {
      if (c.author?.user?.login !== USER) continue;
      if (!newest || c.authoredDate > newest.authoredDate) {
        newest = { ...c, repo: r.name };
      }
    }
  }

  // Counted by each repo's primary language, not by bytes. Byte-weighting is
  // dominated by a single Jupyter notebook repo and reported 76% Python for
  // an engineer who ships TypeScript — technically true, materially wrong.
  const counts = new Map();
  for (const r of repos) {
    const lang = r.primaryLanguage?.name;
    if (!lang) continue;
    counts.set(lang, (counts.get(lang) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0) || 1;
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked.slice(0, 4).map(([name, n]) => ({
    name,
    share: (n / total) * 100,
  }));
  const rest = ranked.slice(4).reduce((a, [, n]) => a + n, 0);
  if (rest > 0) top.push({ name: "other", share: (rest / total) * 100 });

  const cc = user.contributionsCollection;
  return {
    commit: newest
      ? {
          sha: newest.oid.slice(0, 7),
          subject: `${newest.messageHeadline}`,
          repo: newest.repo,
        }
      : FALLBACK.commit,
    counters: {
      // restrictedContributionsCount covers private work, which is most of it.
      // It only resolves under the profile owner's own PAT (PROFILE_TOKEN) and
      // needs "include private contributions" enabled in profile settings.
      commits:
        (cc?.totalCommitContributions ?? 0) +
        (cc?.restrictedContributionsCount ?? 0),
      prs: cc?.totalPullRequestContributions ?? 0,
      repos: user.repositories.totalCount,
      languages: new Set(
        repos.map((r) => r.primaryLanguage?.name).filter(Boolean)
      ).size,
    },
    languages: top.length ? top : FALLBACK.languages,
  };
}

// The commit line must not overrun the terminal's 87-column interior.
const clamp = (s, n) => (s.length <= n ? s : `${s.slice(0, n - 1)}…`);

function headerLines(data) {
  const subject = clamp(data.commit.subject, 72);
  return [
    { cmd: "whoami" },
    {
      out: [
        ["Muhammad Ali Mehmood", "text", true],
        [" · ", "dim"],
        ["Associate Software Engineer @ Devsinc", "accent"],
      ],
    },
    {
      out: [
        ["Islamabad, PK", "dim"],
        [" · ", "dim"],
        ["full-stack across TypeScript, React Native and Django", "dim"],
      ],
    },
    { gap: true },
    { cmd: "cat now.txt" },
    {
      out: [
        ["Sole engineer on agritech, e-commerce and sports-tech products.", "text"],
      ],
    },
    { gap: true },
    { cmd: "git log -1 --oneline" },
    {
      out: [
        [data.commit.sha, "keyword"],
        ["  ", "dim"],
        [subject, "dim"],
      ],
    },
    { gap: true },
    { cursor: true },
  ];
}

const n = (v) => v.toLocaleString("en-US");

async function main() {
  const token = process.env.GITHUB_TOKEN;
  let data = FALLBACK;

  if (token) {
    try {
      data = shape(await fetchData(token));
    } catch (err) {
      // A rendered card with fallback numbers beats a broken image, which is
      // exactly the failure mode this rewrite exists to remove.
      console.error(`live data unavailable, using fallback: ${err.message}`);
    }
  } else {
    console.error("no GITHUB_TOKEN — rendering with fallback data");
  }

  mkdirSync(out, { recursive: true });

  for (const [name, theme] of Object.entries(themes)) {
    writeFileSync(
      join(out, `terminal-${name}.svg`),
      terminal({
        theme,
        title: "ali@islamabad: ~/profile",
        lines: headerLines(data),
      })
    );

    writeFileSync(
      join(out, `stats-${name}.svg`),
      stats({
        theme,
        title: "ali@islamabad: ~/profile — gh api",
        counters: [
          { value: n(data.counters.commits), label: "commits, last year" },
          { value: n(data.counters.prs), label: "pull requests" },
          { value: n(data.counters.repos), label: "public repos" },
          { value: n(data.counters.languages), label: "languages shipped" },
        ],
        languages: data.languages,
      })
    );
  }

  console.log(
    `rendered 4 svg · ${data.commit.sha} · ${data.counters.commits} commits`
  );
}

main();
