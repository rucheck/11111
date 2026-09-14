# 盐选人生：90 天写作生存战

## 本地启动

需要 Node.js 18 或更新版本。无需安装 npm 依赖。

```powershell
node build.js
node server.js
```

打开 http://127.0.0.1:4173，从独立封面页开始。游戏会在关键选择后自动保存到当前浏览器的 `localStorage`；再次进入时可选择继续游戏或清除旧进度开始新游戏。存档仅包含游戏状态，不包含知乎 CLI 或其他认证信息。

开场动画结束后选择生成方式：知乎模式调用已配置的知乎 CLI，并展示 CLI 返回的当日实际额度；本地模式使用内置剧情，不联网且不限次数。Windows 默认读取当前用户 LocalAppData 下的 ZhihuCLI/current/zhihu-cli.exe；其他位置使用 ZHIHU_CLI_PATH 环境变量指定完整路径。凭据由 CLI 从操作系统凭据库读取，或由部署环境注入 ZHIHU_ACCESS_SECRET，不提交密钥。

本地服务仅监听 127.0.0.1，不是公网部署。GitHub Pages 仅能运行静态版本，无法执行 CLI。直接双击 index.html 使用内置剧情，需要同时保留 assets 目录。

### 后端状态与接口

- `GET /api/health`：统一健康检查。依次确认 Node 服务、CLI 文件、本地认证状态和 `zhida_openai` 额度；不会调用内容生成。认证存在时，额度查询用于轻量验证凭据是否仍可用，结果缓存 30 秒。
- `GET /api/status`：前端兼容状态接口，返回模式、CLI、认证、忙碌状态和剩余额度。
- `POST /api/chapter`：校验状态后创建章节生成任务，成功返回 HTTP 202 和 `jobId`。
- `GET /api/chapter/:jobId`：查询进程内任务，生成中返回 202，完成返回 200，失败返回对应的结构化错误。

健康检查始终返回 HTTP 200；`ok` 表示知乎生成链路是否就绪，`server.ok` 单独表示 Node 服务是否正常。额度字段只采用 CLI 返回的 `TotalQuota`、`TotalUsed` 和 `RemainingQuota`，并标记 `source: "zhihu-cli"`；无法取得官方额度时为 `null`，不会用 mock 或本地估算值代替。下列数值仅为响应结构示例：

```json
{
  "ok": true,
  "server": {"ok": true},
  "cli": {"installed": true, "callable": true},
  "authentication": {"configured": true, "valid": true, "status": "valid", "source": "keychain"},
  "mode": "zhihu",
  "busy": false,
  "usage": {"source": "zhihu-cli", "date": "2026-09-14", "used": 4, "limit": 100, "remaining": 96}
}
```

API 错误统一为 `{"ok":false,"error":"稳定错误码","message":"可展示消息"}`。错误码包括 `CLI_NOT_FOUND`、`ZHIHU_AUTH_REQUIRED`、`ZHIHU_AUTH_INVALID`、`ZHIHU_KEYCHAIN_UNAVAILABLE`、`ZHIHU_AUTH_SOURCE_CONFLICT`、`ZHIHU_TIMEOUT`、`ZHIHU_NETWORK_ERROR`、`ZHIHU_QUOTA_EXHAUSTED`、`ZHIHU_RATE_LIMITED`、`ZHIHU_INVALID_JSON`、`ZHIHU_INVALID_RESPONSE`、`ZHIHU_UPSTREAM_ERROR`、`ZHIHU_CLI_FAILED`、`GENERATION_JOB_NOT_FOUND` 和 `INTERNAL_SERVER_ERROR`。响应不包含 CLI 原始 stderr、堆栈、本机路径或凭据。

生成任务只保存在当前 Node 进程内，完成或失败 10 分钟后清理。服务重启后旧 `jobId` 会明确返回 `GENERATION_JOB_NOT_FOUND`；第一阶段不提供任务持久化或多实例共享。

Windows 凭据库按 Windows 安全身份隔离。`server.js` 与手动执行 `zhihu-cli` 必须由同一 Windows 用户身份启动；在沙箱、Windows 服务、计划任务或其他账户下运行时，即使 `USERPROFILE` 相同也可能无法读取交互式用户保存的凭据，此时应通过部署环境安全注入 `ZHIHU_ACCESS_SECRET`，不要写入项目文件。

## 体验

- 短篇 6 章 × 4 幕，中篇 9 章 × 5 幕，长篇 12 章 × 6 幕，均从 90 天推进到 0 天。
- 开场动画与模式选择 → 抽题与身份设置 → 作者意图 → 准备动作 → 主角自由度 → 进入小说 → 多幕行动与后果 → 审稿发布 → 评论与作者回应。
- 游戏内左上角可随时打开故事地图和当前状态；地图显示章节与决策进度，状态页集中显示资源、路线、关系、线索和当前目标。
- 篇幅同时控制冲突强度；剧本具体度控制每幕的选择空间。
- 知乎模式每章调用一次知乎直答；故事目录使用进程内缓存。剩余次数读取知乎 CLI 的 `zhida_openai` 官方额度，查询本身不消耗业务额度；失败不自动循环重试，可手动重试或切换到不限次的本地模式。
- CLI 输出会经过宽容解析与严格结构校验，可识别代码围栏、前后日志、二次 JSON 编码、尾逗号，以及常见的 `choices[].message.content` 包装；不合格响应会给出错误并保留本地模式兜底。
- 人物关系、核实线索、最近四章行动和编辑约束传入下一章。当前章的后续幕由同一次生成提供，跨幕仅追加实际选择后果；尚非逐幕实时生成。
- 当前读者反馈仍为行动记录结合本地评论模板。刷新或关闭浏览器后可从本地自动存档继续；浏览器禁用或清理 `localStorage` 时安全回到新游戏流程。

## 校验

```powershell
node test.js
node save.test.js
node --test server.test.js
node inspect.js
```

test.js 覆盖全部篇幅、题材、具体度的 54 种完整对局，以及重复点击保护、资源范围、模式切换和生成数据校验。save.test.js 覆盖刷新、关闭后恢复、跨章恢复、新游戏清档及损坏存档降级。server.test.js 使用 mock CLI 覆盖健康检查、CLI 缺失、认证缺失或失效、超时、网络失败、配额耗尽、非法响应、任务丢失和正常状态，不调用真实生成接口。
