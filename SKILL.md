---
name: x-topic-blogger-pack
description: Generate topic-based Chinese X/Twitter blogger recommendation packs. Use when the user gives a topic such as AI相关, AI知识付费, 一人公司, Web3, crypto, or 跨境电商 and asks for X博主/大号/KOL recommendations, X post copy, subscription/follow lists, or an infographic with real profile avatars and positioning.
---

# X Topic Blogger Pack

Use this skill to turn one topic into:

- 8-10 relevant Chinese X/Twitter bloggers
- a ready-to-post X copy block
- a 16:9 infographic with real profile avatars, handles, positioning, and subscription reasons

## Workflow

1. Parse the user's topic and infer the target audience.
   - Examples: `ai相关`, `ai知识付费`, `一人公司`, `web3`, `crypto`, `跨境电商`.
   - Convert the topic into a user benefit: faster information source, fewer wrong follows, better learning path, stronger comment opportunities, or practical monetization insight.

2. Research current accounts.
   - Browse/search because account activity, handles, and topic fit change over time.
   - Prefer Chinese-language accounts or bilingual accounts with strong Chinese audience fit.
   - Use exact X profile URLs where possible.
   - Cross-check ambiguous handles before including them.

3. Score candidates.
   - Relevance to the topic.
   - Recent posting frequency.
   - Chance of viral/engaged posts.
   - Comment-section opportunity for the user's positioning.
   - Clear niche positioning that can be explained in one short line.
   - Avoid inactive, locked, obvious spam, pure repost, or unclear identity accounts.

4. Select 8-10 accounts.
   - Keep the list diverse across sub-niches.
   - Do not pad the list. If fewer than 8 high-confidence accounts exist, say so and use the best verified set.
   - If a handle is uncertain, omit it or mark it as needs verification instead of guessing.

5. Write X post copy.
   - Start with a topic benefit hook.
   - Include account lines in this format:
     `@handle：定位 / 订阅理由`
   - End with a lightweight action:
     `建议关注后建一个 List，每天刷 15 分钟，再去评论区补充实测、避坑和落地步骤。`
   - Keep tone useful, specific, and non-hype.

6. Generate the infographic.
   - Create an input JSON file with:
     - `topic`
     - `title`
     - `subtitle`
     - `footer`
     - `accounts`: array of 8-10 objects with `handle`, `title`, `desc`, `tag`, and optional `tone`
   - Run:
     `node C:/Users/Administrator/.codex/skills/x-topic-blogger-pack/scripts/render-poster.mjs <input.json> <output-dir>`
   - The script fetches public X avatars through `https://unavatar.io/x/<handle>` and renders a 1600x900 PNG.
   - If an avatar fails, retry once. If it still fails, keep the account only if the handle is high-confidence and mention that the avatar fell back.

7. Final response.
   - Show the generated PNG with a Markdown image tag.
   - Provide the X post copy.
   - Provide local file paths for the PNG, HTML, JSON input, and avatar folder.
   - Mention sources used for account selection when browsing was used.

## Copy Template

```text
想快速建立「{topic}」信息源，先订阅这 {count} 个博主。

他们分别覆盖：{subtopics}。

@handle1：定位 / 订阅理由
@handle2：定位 / 订阅理由
...

建议关注后建一个 List，每天刷 15 分钟。
别只收藏，去评论区补充实测、避坑和落地步骤，这样学习和涨粉都会更快。
```

## Account Object Template

```json
{
  "handle": "@oran_ge",
  "title": "AI Agent 与产品落地",
  "desc": "订阅他，看 Agent 怎么从 demo 变成可用产品。",
  "tag": "AI Agent",
  "tone": "lime"
}
```

Allowed tones: `lime`, `violet`, `blue`, `pink`, `cyan`, `amber`, `green`, `orange`, `red`, `teal`.

## Safety And Attribution

- Use public avatars only as part of an account recommendation graphic.
- Do not imply these bloggers endorsed the user.
- Avoid investment advice, guaranteed income claims, or "稳赚" language for Web3/crypto topics.
- Do not fabricate follower counts or performance metrics unless verified from a current source.
