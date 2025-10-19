# i18n Strings Reference

This reference lists every translation key used by the web app alongside its translations in English (en), Spanish (es), and Chinese (zh). Where a string contains placeholders, they are documented in the Placeholders column.

Conventions

- Keys are organized by feature area and use dot-separated paths (e.g., home.hero.title).
- Placeholders are enclosed in braces: {example}. Do not translate placeholders.
- If a translation is intentionally the same as English, it is shown as-is.

Legend

- en: English
- es: Spanish
- zh: Chinese (Mandarin)

Language selector labels

| Key               | en       | es      | zh   | Placeholders |
|-------------------|----------|---------|------|--------------|
| language.label    | Language | Idioma  | 语言 |              |
| language.en       | English  | Inglés  | 英语 |              |
| language.es       | Spanish  | Español | 西班牙语 |           |
| language.zh       | Chinese  | Chino   | 中文 |              |

Navbar

| Key                 | en          | es         | zh     | Placeholders |
|---------------------|-------------|------------|--------|--------------|
| navbar.home         | Home        | Inicio     | 首页   |              |
| navbar.invoices     | Invoices    | Facturas   | 发票   |              |
| navbar.docs         | Docs        | Docs       | 文档   |              |
| navbar.get_started  | Get Started | Comenzar   | 开始使用 |             |
| navbar.beta         | Beta        | Beta       | 测试版 |              |

Home: Hero

| Key                                  | en                            | es                                                                                  | zh                                  | Placeholders |
|--------------------------------------|-------------------------------|--------------------------------------------------------------------------------------|--------------------------------------|--------------|
| home.hero.title                      | Manage expenses smarter       | Gestiona tus gastos de forma más inteligente                                        | 更智能地管理开支                       |              |
| home.hero.subtitle                   | {appName} helps you track spending, auto-categorize with AI, and make better decisions — fast. | {appName} te ayuda a controlar el gasto, a autoclasificar con IA y a tomar mejores decisiones — rápido. | {appName} 帮助你跟踪支出，使用人工智能自动分类，并更快做出更好的决策。 | appName      |
| home.hero.primary                    | Get Started                   | Comenzar                                                                             | 开始使用                              |              |
| home.hero.secondary                  | Read the Docs                 | Leer la documentación                                                                | 阅读文档                              |              |
| home.hero.highlights.fast_setup_title| Fast setup                    | Configuración rápida                                                                 | 快速上手                              |              |
| home.hero.highlights.fast_setup_desc | Next.js 14 + TypeScript       | Next.js 14 + TypeScript                                                              | Next.js 14 + TypeScript              |              |
| home.hero.highlights.ai_title        | AI powered                    | Con IA                                                                               | AI 驱动                               |              |
| home.hero.highlights.ai_desc         | Smart categorization          | Clasificación inteligente                                                             | 智能分类                               |              |
| home.hero.highlights.secure_title    | Secure                        | Seguro                                                                               | 安全                                  |              |
| home.hero.highlights.secure_desc     | Backend health monitored      | Estado del backend monitorizado                                                      | 后端健康状况监控                       |              |

Home: Status and Quick start

| Key                          | en                      | es                                        | zh                         | Placeholders |
|------------------------------|-------------------------|-------------------------------------------|----------------------------|--------------|
| home.status.title            | System status           | Estado del sistema                        | 系统状态                    |              |
| home.status.api_at           | Go API at {apiUrl}      | API Go en {apiUrl}                        | Go API 地址 {apiUrl}        | apiUrl       |
| home.status.ok_message       | Backend is healthy and responding | El backend está saludable y responde | 后端运行正常并有响应          |              |
| home.status.unexpected_status| Backend returned unexpected status | El backend devolvió un estado inesperado | 后端返回了意外的状态      |              |
| home.status.cannot_connect   | Cannot connect to backend| No se puede conectar con el backend       | 无法连接到后端              |              |
| home.status.ensure_running   | Make sure the backend is running on {apiUrl} | Asegúrate de que el backend se esté ejecutando en {apiUrl} | 请确保后端在 {apiUrl} 上运行 | apiUrl |
| home.quickstart.title        | Quick start             | Inicio rápido                             | 快速开始                    |              |
| home.quickstart.subtitle     | Get going in minutes    | Ponte en marcha en minutos                | 几分钟即可上手               |              |
| home.quickstart.view_invoices| View Invoices           | Ver facturas                              | 查看发票                    |              |
| home.quickstart.next_docs    | Next.js Documentation   | Documentación de Next.js                  | Next.js 文档                 |              |

Home: Features

| Key                                       | en                            | es                                               | zh                               | Placeholders |
|-------------------------------------------|-------------------------------|--------------------------------------------------|----------------------------------|--------------|
| home.features.title                        | Features                      | Funciones                                        | 功能                              |              |
| home.features.subtitle                     | Everything you need to control spending | Todo lo que necesitas para controlar el gasto | 掌控支出所需的一切                |              |
| home.features.items.expense_tracking_title | Expense Tracking              | Seguimiento de gastos                            | 开支跟踪                           |              |
| home.features.items.expense_tracking_desc  | Track and manage all your business expenses in one place. | Controla y gestiona todos tus gastos en un solo lugar. | 在一个地方跟踪和管理所有业务支出。 |              |
| home.features.items.ai_categorization_title| AI Categorization             | Categorización con IA                            | AI 分类                           |              |
| home.features.items.ai_categorization_desc | Automatically categorize expenses with AI-powered suggestions. | Clasifica gastos automáticamente con sugerencias impulsadas por IA. | 使用 AI 建议自动对支出进行分类。 |              |
| home.features.items.attachments_title      | Attachments                   | Adjuntos                                         | 附件                              |              |
| home.features.items.attachments_desc       | Upload and manage receipts and supporting documents. | Sube y gestiona recibos y documentos de soporte. | 上传和管理收据及支持性文件。      |              |
| home.features.items.smart_search_title     | Smart Search                  | Búsqueda inteligente                             | 智能搜索                           |              |
| home.features.items.smart_search_desc      | Find expenses quickly with filters and full-text search. | Encuentra gastos rápidamente con filtros y búsqueda de texto completo. | 通过筛选和全文搜索快速找到支出。 |              |
| home.features.items.analytics_title        | Analytics                     | Analítica                                        | 分析                              |              |
| home.features.items.analytics_desc         | Visualize spending trends and make data-driven decisions. | Visualiza tendencias de gasto y toma decisiones basadas en datos. | 可视化支出趋势并做出数据驱动的决策。 |              |
| home.features.items.privacy_title          | Privacy-first                 | Privacidad primero                               | 隐私优先                           |              |
| home.features.items.privacy_desc           | Your data is secure and never shared without your consent. | Tus datos están seguros y nunca se comparten sin tu consentimiento. | 你的数据是安全的，未经允许绝不共享。 |              |

Home: Call to action

| Key                 | en                                   | es                                           | zh                                 | Placeholders |
|---------------------|--------------------------------------|----------------------------------------------|------------------------------------|--------------|
| home.cta.heading    | Ready to simplify your expenses?     | ¿Listo para simplificar tus gastos?         | 准备好简化你的开支了吗？             |              |
| home.cta.subtitle   | Start by viewing your invoices and adding your first expense. | Empieza viendo tus facturas y añadiendo tu primer gasto. | 从查看发票并添加你的第一笔支出开始。 |              |
| home.cta.open_invoices | Open Invoices                     | Abrir facturas                               | 打开发票                             |              |

Invoices

| Key                | en                                          | es                                                   | zh                                      | Placeholders |
|--------------------|---------------------------------------------|------------------------------------------------------|-----------------------------------------|--------------|
| invoices.title     | Invoices                                    | Facturas                                            | 发票                                    |              |
| invoices.subtitle  | View and manage all your expenses and invoices | Consulta y gestiona todos tus gastos y facturas   | 查看并管理你的所有支出和发票             |              |
| invoices.error_title | Unable to Load Expenses                   | No se pudieron cargar los gastos                    | 无法加载支出                             |              |
| invoices.error_hint| The expense API endpoints may not be implemented yet on the backend. This page is ready to display expenses once the backend endpoints are available. | Es posible que las API de gastos aún no estén implementadas en el backend. Esta página está lista para mostrar gastos cuando estén disponibles. | 后端可能尚未实现支出相关接口。一旦可用，此页面将显示支出记录。 |              |
| invoices.amount    | Amount:                                     | Importe:                                           | 金额：                                   |              |
| invoices.category  | Category:                                   | Categoría:                                         | 类别：                                   |              |
| invoices.empty_title | No Expenses Found                         | No se encontraron gastos                           | 未找到支出                               |              |
| invoices.empty_desc| You haven't created any expenses yet. Start by adding your first expense! | Aún no has creado ningún gasto. ¡Empieza añadiendo tu primer gasto! | 你还没有创建任何支出。现在就添加第一笔支出吧！ |              |

Notes

- For keys with placeholders (e.g., home.status.api_at), the variable names must be preserved and provided at runtime via the translator function: t(key, { apiUrl: "..." }).
- If you introduce a new key in code, ensure all languages are updated in apps/web/src/i18n/dictionaries.ts and remember to add it to this reference.
