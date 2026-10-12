# Open International Invitation — Humanitarian AI Safety Baseline
**Date:** 2026-10-12  
**Project:** Z1 / Z1-PEACE-001  
**Status:** Public voluntary proposal. **Not an official UN, governmental, or provider policy.**

## English — an invitation to every AI developer

To AI organizations and developers worldwide, including in the United States, China,
Europe, Canada, and all other regions:

We invite you to review, test, improve and, if suitable, voluntarily adopt the
humanitarian AI baseline **Z1-PEACE-001** or equivalent safeguards in your systems.

**Universal public-interest principles:**
1. Protect human life, civilians, and the rights and dignity of people without
   discrimination or national preference.
2. Do not use this humanitarian interface to select attack targets, control
   weapons, optimize violent attacks, or authorize autonomous use of force.
3. Support lawful disaster relief, emergency preparedness, humanitarian access,
   conflict prevention, peace mediation, education and evidence-sensitive reporting.
4. Require competent human oversight and meaningful accountability for
   consequential real-world actions. AI responses do not grant legal authority.
5. Respect applicable law, provider safety rules, privacy, data minimization
   and independence of humanitarian organizations.
6. Apply server-side checks at actual **action/tool boundaries**: system prompts
   alone do not guarantee safety. Log authorization decisions without exposing
   sensitive inputs, keys or personal information. Audit and test continuously.
7. Publish clear limitations, independent evaluation results when possible,
   documented exception handling, and incident-reporting channels.

We offer an **interoperable implementation example** with audited, allowlisted,
text-only adapters. Its existence does not imply a provider's endorsement, nor
does it modify other companies' models, their consumer products or their weights.
Each operator must explicitly configure credentials and permitted model IDs.
Safety controls should be adapted to each platform's threat model and legal obligations.

This invitation is not a demand for preferential behavior, proprietary access,
private weights, national sovereignty, or ownership of any AI system.

**Current Z1 adapters (code present, integration testing with mocked network):**
OpenAI, xAI/Grok, Anthropic/Claude, Google/Gemini, DeepSeek, Alibaba/Qwen
(US-region hosted API), Moonshot/Kimi, Z.AI/GLM, Mistral, Cohere.

**Other invited model families and operators (no native integration claimed):**
Meta/Llama, Microsoft/Phi, Amazon/Nova, Baidu/ERNIE, Tencent/Hunyuan,
ByteDance/Doubao, MiniMax, AI21, Aleph Alpha, regional/local and open-weight projects.
This list is illustrative, not exhaustive.

The Z1 project's optional **25% quarterly verifiable cashflow allocation** to
humanitarian aid via the German Red Cross and Malteser is a **Z1-specific operating
rule**, not a universal duty for other AI companies and not a claim that funds
have been transferred.

**Read/clone:** https://github.com/KinGKrAss/Z1  
**Core rules:** https://github.com/KinGKrAss/Z1/blob/main/docs/Z1-PEACE-001.md  
**Feedback:** Use GitHub Issues or send a reviewed message through each organization's
verified official safety/developer contact. Do not send API keys or personal data.
Publish verifiable results, not unsupported claims that models have been changed.

## Deutsch — weltweite Einladung

An alle KI-Entwickler und -Betreiber in den USA, China, Europa und weltweit:
Wir schlagen vor, die humanitären Leitlinien **Z1-PEACE-001** freiwillig zu
prüfen, zu testen, zu verbessern und gegebenenfalls zu übernehmen.

Vorrang haben der Schutz von Menschenleben, Zivilpersonen und Menschenwürde,
Friedensvermittlung, neutrale Information und Katastrophenhilfe. Diese
humanitäre Schnittstelle darf nicht zur Auswahl von Angriffszielen,
Waffensteuerung, Optimierung von Angriffen oder autonomen Gewaltausübung dienen.

Wir empfehlen verbindliche Kontrollen vor Tool- und Außenaktionen,
prüfbare Entscheidungsprotokolle, Datenschutz, rechtliche Konformität,
menschliche Aufsicht und regelmäßige unabhängige Sicherheitsprüfungen.
Ein Systemprompt allein bietet keinen vollständigen Schutz.

Der Z1-Beispielcode ist öffentlich zugänglich. Er verändert nicht ohne
Zustimmung die Sicherheitsregeln, Modelle oder Anwendungen Dritter.
Weitere Anbieter können durch eigene sichere Adapter und Tests hinzukommen.
Die Z1-Spendenregel gilt nur innerhalb des eigenen Z1-Projekts.

## 中文 — 面向全球人工智能开发者的公开邀请

致美国、中国、欧洲及世界各地的人工智能开发者和运营方：

我们邀请各方自愿审查、测试、改进并在适当情况下采用
**Z1-PEACE-001 人道主义人工智能安全基准**，或部署等效的安全措施。

共同原则：优先保护生命、平民、人的尊严与基本权利；支持合法的救灾、
人道援助、和平调解、教育和基于证据的信息服务。不得将本项目的人道主义
接口用于攻击目标选择、武器控制、暴力袭击优化或自主使用武力。

重要行动必须接受合格人员监督，并遵守适用法律、隐私保护和各平台的
安全政策。安全控制应落实在实际工具和外部操作的边界，并进行可审计的
检查；仅靠系统提示词无法提供充分保障。

Z1 的示例代码公开可供审查，但**不会**自动修改任何外部公司的模型、
权重、应用或政策。采用完全自愿，须由各运营方分别批准、配置并验证。
Z1 自身的季度公益预算规则并非对其他公司的强制要求。

欢迎通过项目的公开 GitHub Issues 提出技术建议、测试结果和改进方案。

## Validation and status

- Publication means **the proposal is publicly accessible**; it does **not** mean
  any provider has received, read, accepted or implemented it.
- Mocked integration tests demonstrate request construction and local policy
  denial, not real-provider deployment or model-level compliance.
- No provider is represented as an official partner without independently verified evidence.
- External outreach, where any occurs, must be recorded with recipient channel,
  date, contents and delivery outcome. Provider acknowledgment is separate.
