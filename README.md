<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/ali-097/ali-097/main/assets/terminal-dark.svg">
  <img alt="ali@islamabad:~/profile — Muhammad Ali Mehmood, Associate Software Engineer at Devsinc, Islamabad. Full-stack: frontend, backend, mobile and cloud." src="https://raw.githubusercontent.com/ali-097/ali-097/main/assets/terminal-light.svg" width="840">
</picture>

<!-- LinkedIn carries no logo on purpose: shields.io sources icons from
     simple-icons, which removed the LinkedIn mark after a trademark request.
     Every working alternative (xing, indeed, glassdoor) is a different
     company's mark, so substituting one would misrepresent the link. -->
<p>
<a href="https://ali-097.vercel.app/"><img alt="Portfolio" src="https://img.shields.io/badge/portfolio-12131C?style=flat-square&logo=vercel&logoColor=F0A868"></a>
<a href="https://ali-097.vercel.app/Muhammad_Ali_Mehmood_Full_Stack.pdf"><img alt="Résumé" src="https://img.shields.io/badge/r%C3%A9sum%C3%A9-12131C?style=flat-square&logo=readdotcv&logoColor=F0A868"></a>
<a href="https://www.linkedin.com/in/ali097"><img alt="LinkedIn" src="https://img.shields.io/badge/linkedin-12131C?style=flat-square"></a>
<a href="https://leetcode.com/u/ali_097/"><img alt="LeetCode" src="https://img.shields.io/badge/leetcode-12131C?style=flat-square&logo=leetcode&logoColor=5CC9C4"></a>
<a href="mailto:aalimehmoodd@gmail.com"><img alt="Email" src="https://img.shields.io/badge/email-12131C?style=flat-square&logo=gmail&logoColor=A79CF2"></a>
</p>

</div>

I own products end to end — database and API through to deployment — across web, mobile and cloud.
Two things I'm proud of:

- **~55% cut in a client's cloud hosting spend**, from a live AWS → DigitalOcean migration.
- **A production mobile architecture upgrade shipped with no user-visible disruption.**

### Now

- Engineer on client products in **agritech, e-commerce and sports technology** at Devsinc — Django and Node backends, React and React Native clients, Docker, GitHub Actions, cloud deploys.
- Built [**Undo-stack**](https://marketplace.visualstudio.com/items?itemName=ali-097.undostack), a VS Code extension that snapshots your workspace so you can roll it back. I also quicksave before every conversation in Fallout. These facts are related.
- And one more thing I'm not ready to open-source yet.

### Selected work

| Project | What it is | Built with | |
| :-- | :-- | :-- | :-- |
| **[Undo-stack](https://github.com/ali-097/Undo-stack)** | VS Code extension. Records explicit editing sessions, then previews and restores workspace state. | TypeScript · VS Code API | [install](https://marketplace.visualstudio.com/items?itemName=ali-097.undostack) |
| **[PaddleHub](https://github.com/ali-097/Padle-Hub-Frontend)** | Court booking and management for padel facilities running multiple courts — real-time availability, scheduling, instant confirmation. | MERN · Tailwind · Cloudinary | [live](https://paddlehub-fe.vercel.app/) |
| **[Profilely](https://github.com/ali-097/Profilely)** | Generates a clean portfolio site from a developer's GitHub data, or from custom input. | React · GitHub API | |
| **[LuxoraLimos](https://github.com/ali-097/LuxoraLimos)** | Booking site for a car-hire service, running on its own domain. | React · Tailwind | [live](https://luxoralimos.com/) |
| **Zentro** | Expense-sharing app, split across a typed API and an Angular client. | Angular · NestJS | [fe](https://github.com/ali-097/Zentro-FE) · [be](https://github.com/ali-097/Zentro-BE) |

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/ali-097/ali-097/main/assets/undostack-dark.svg">
  <img alt="Undo-stack: a session records edits across files, then restores the workspace to its earlier state." src="https://raw.githubusercontent.com/ali-097/ali-097/main/assets/undostack-light.svg" width="840">
</picture>

</div>

### A few screens

<!-- Captions live in their own rows so they align across the pair regardless of
     how tall each screenshot renders. -->
<table>
<tr valign="bottom">
<td width="50%"><a href="https://paddlehub-fe.vercel.app/"><img src="https://raw.githubusercontent.com/ali-097/ali-097/main/assets/shots/paddlehub.webp" alt="PaddleHub — court management dashboard"></a></td>
<td width="50%"><a href="https://luxoralimos.com/"><img src="https://raw.githubusercontent.com/ali-097/ali-097/main/assets/shots/luxoralimos.webp" alt="LuxoraLimos — car hire booking site"></a></td>
</tr>
<tr valign="top">
<td><sub><b>PaddleHub</b> — booking and scheduling for multi-court padel facilities</sub></td>
<td><sub><b>LuxoraLimos</b> — car-hire service, live on its own domain</sub></td>
</tr>
<tr valign="bottom">
<td><a href="https://smartestate-fe.vercel.app/"><img src="https://raw.githubusercontent.com/ali-097/ali-097/main/assets/shots/smartestate.webp" alt="SmartEstate — real-estate platform with ML price prediction"></a></td>
<td><a href="https://fork-flame-five.vercel.app"><img src="https://raw.githubusercontent.com/ali-097/ali-097/main/assets/shots/forkflame.webp" alt="Fork and Flame — restaurant site"></a></td>
</tr>
<tr valign="top">
<td><sub><b>SmartEstate</b> — ML price prediction and sentiment-sorted reviews</sub></td>
<td><sub><b>Fork &amp; Flame</b> — restaurant site with custom animations</sub></td>
</tr>
</table>

<br>

<details>
<summary><b><code>$ cat stack.json</code></b></summary>

```jsonc
{
  "languages":  { "TypeScript": "^5.7", "JavaScript": "ES2024", "Python": "^3.12" },

  "frontend":   { "React": "^19.1", "React Native": "^0.81", "Expo": "~54.0",
                  "Next.js": "^15.1", "Redux Toolkit": "^2.5",
                  "TanStack Query": "^5.66", "Material UI": "^6.1",
                  "Tailwind CSS": "^4.1" },

  "backend":    { "Node.js": "^22.11", "Express": "^4.21", "Django": "5.1.3" },

  "databases":  { "PostgreSQL": "17.0", "SQL Server": "2022", "MongoDB": "8.0" },

  "testing":    { "Jest": "^29.7", "Playwright": "^1.50" },

  "infra":      { "Docker": "27.4", "GitHub Actions": "*",
                  "AWS": "*", "DigitalOcean": "*", "Git": "2.47" }
}
```

</details>

<details>
<summary><b><code>$ git log --author="Ali Mehmood"</code></b></summary>

```gitcommit
* Sep 2025 — present    feat(career): join Devsinc as Associate Software Engineer
|
|   Engineer on client projects in agritech, e-commerce and sports
|   technology — owning Django and Node.js backends, React and React Native
|   clients, Docker environments, GitHub Actions pipelines and cloud deploys.
|   Client-facing: requirements calls, demos and scoping with the client, PM
|   and designer, then turning outcomes into architecture and sprint delivery.
|
* Mar 2025 — May 2025   feat(career): join SysReforms International as Junior Web Developer
|
|   Delivered three features end to end for a client-facing performance
|   monitoring platform — the REST API layer in Node and Express, new tables
|   and views on an existing SQL Server schema, and the React + Material UI
|   frontend with CKEditor rich data entry.
|
* Jul 2023 — Sep 2023   feat(career): join PropSure as Software Developer Intern
|
|   Built immersive virtual property tours with Pannellum and React, shipped
|   a full-stack blog platform with auth and REST APIs on Node + PostgreSQL,
|   and translated high-fidelity Figma mockups into production React.
```

</details>

<details>
<summary><b><code>$ ls -la ~/projects</code></b></summary>

| | | |
| :-- | :-- | :-- |
| [SmartEstate](https://github.com/ali-097/SmartEstate) | Real-estate platform — ML price-trend prediction, sentiment-sorted reviews, dynamic bidding | MERN · Flask · [live](https://smartestate-fe.vercel.app/) |
| [Fork-Flame](https://github.com/ali-097/Fork-Flame) | Full-stack restaurant site | PERN · [live](https://fork-flame-five.vercel.app) |
| [DailyGoals](https://github.com/ali-097/DailyGoals) | Goal-tracking mobile app | React Native · Supabase |
| [YouTube-Sentiment-Analysis](https://github.com/ali-097/YouTube-Sentiment-Analysis) | Sentiment analyser for YouTube comments | Python · Jupyter |
| [Portfolio-Site](https://github.com/ali-097/Portfolio-Site) | This profile's sibling — a portfolio built as a working IDE | React · [live](https://ali-097.vercel.app/) |

</details>

<details>
<summary><b><code>$ cat contact.md</code></b></summary>

**Muhammad Ali Mehmood** — Associate Software Engineer, [Devsinc](https://devsinc.com) · Islamabad, Pakistan

- Email — [aalimehmoodd@gmail.com](mailto:aalimehmoodd@gmail.com)
- LinkedIn — [in/ali097](https://www.linkedin.com/in/ali097)
- Portfolio — [ali-097.vercel.app](https://ali-097.vercel.app/)
- Résumé — [PDF](https://ali-097.vercel.app/Muhammad_Ali_Mehmood_Full_Stack.pdf)

Open to conversations across the whole stack — frontend, backend, mobile, cloud and infrastructure, and developer tooling.

</details>

<details>
<summary><b><code>$ ali --help</code></b></summary>

```console
USAGE
  ali [options]

OPTIONS
  --hire                at Devsinc, but the inbox is open anyway
  --collaborate         yes, especially anything dev-tooling
  --review-pr           quick, unless the deploy is on a Friday
  --explain <topic>     output may exceed one paragraph
  --quicksave           see: Undo-stack

EXIT STATUS
  0     shipped
  55    percent off a client's cloud bill (AWS to DigitalOcean)
```

<details>
<summary><code>$ ali --quicksave</code></summary>

`Saved to slot 47. The other 46 are also from this afternoon.`

</details>

</details>

<details>
<summary><b><code>$ history | awk '{print $2}' | sort | uniq -c | sort -rn | head -5</code></b></summary>

```console
    412  git status
    288  npm run dev
    163  docker compose up
     97  git reset --hard
     31  git reflog          # a direct consequence of the line above
```

</details>

<br>

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/ali-097/ali-097/main/assets/neofetch-dark.svg">
  <img alt="ali@islamabad — role, uptime, shell, editor, shipped extension, timezone, and language mix across public repositories" src="https://raw.githubusercontent.com/ali-097/ali-097/main/assets/neofetch-light.svg" width="840">
</picture>

</div>
