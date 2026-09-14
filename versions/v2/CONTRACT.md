# 走向库 / 选项库 扩充契约

## 目标
- 走向库（TWISTS）：每题材新增 34 条「天马行空」走向，6 题材共约 204 条。
- 选项库（OPTIONS）：新增约 200 个行动选项，分 4 类。

## 走向（twist）规则
- 一条 = 一句完整、自洽、出人意料的剧情发展（反转 / 超现实 / 因果倒置 / 身份错位 / 记忆偏差等）。
- 中文，结尾用「。」，**不使用任何占位符**（不要 {npc} 之类）。
- 贴合题材气质、画面感强、原创、互不重复。

## 选项（option）规则
每条是一个 JSON 对象，字段：
```
{
  "kind": "独特标签（2~6字动词短语，本批内互不重复）",
  "type": "investigate|bond|confront|wild|calm|trade",
  "lead": "走向引子（6~10字，如「你顺藤摸瓜」「对方终于松口」）",
  "hint": "影响提示（6~14字）",
  "text": "行动描述（可用 {npc} {npc2} {object}）",
  "effect": {"heat":0,"quality":0,"energy":0,"style":0,"sign":0},
  "trust": -1或0或1,
  "evidence": 0或1,
  "result": "后果描述（1~2句，可用 {npc} {npc2} {object}）"
}
```
- effect 里 heat/quality/energy/sign ∈ [-3,3]，style ∈ [-5,5]（正=坚持自我，负=迎合漂移）。
- 占位符含义：{npc}=关键NPC名、{npc2}=第二NPC名、{object}=本题材关键物件。
- type 含义：investigate=调查取证；bond=关系；confront=冲突；wild=天马行空；calm=隐忍观察；trade=交易周旋。

## 输出路径
- 走向：`game_v3/v3/_gen/twists_<题材>.json`（题材用中文原字，如 `twists_悬疑反转.json`）
- 选项：`game_v3/v3/_gen/options_<n>.json`（n=1..4）

## 交付自检
每个 agent 完成后回复：`文件路径 | 条数 | 一句自检`。
