export type Locale = "en" | "es" | "zh";

export type Messages = Record<string, string | Messages>;

export const DEFAULT_LOCALE: Locale = "en";

export const SUPPORTED_LOCALES: Locale[] = ["en", "es", "zh"];

// A small helper to deeply get a value by dot-path
export function getMessage(messages: Messages, path: string): string | undefined {
  const segments = path.split(".");
  let current: any = messages;
  for (const seg of segments) {
    if (current && typeof current === "object" && seg in current) {
      current = (current as any)[seg];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

export function format(message: string, vars?: Record<string, string | number>): string {
  if (!vars) return message;
  return message.replace(/\{(.*?)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

export const DICTIONARIES: Record<Locale, Messages> = {
  en: {
    language: {
      label: "Language",
      en: "English",
      es: "Spanish",
      zh: "Chinese",
    },
    navbar: {
      home: "Home",
      invoices: "Invoices",
      docs: "Docs",
      get_started: "Get Started",
      beta: "Beta",
    },
    home: {
      hero: {
        title: "Manage expenses smarter",
        subtitle:
          "{appName} helps you track spending, auto-categorize with AI, and make better decisions — fast.",
        primary: "Get Started",
        secondary: "Read the Docs",
        highlights: {
          fast_setup_title: "Fast setup",
          fast_setup_desc: "Next.js 14 + TypeScript",
          ai_title: "AI powered",
          ai_desc: "Smart categorization",
          secure_title: "Secure",
          secure_desc: "Backend health monitored",
        },
      },
      status: {
        title: "System status",
        api_at: "Go API at {apiUrl}",
        ok_message: "Backend is healthy and responding",
        unexpected_status: "Backend returned unexpected status",
        cannot_connect: "Cannot connect to backend",
        ensure_running: "Make sure the backend is running on {apiUrl}",
      },
      quickstart: {
        title: "Quick start",
        subtitle: "Get going in minutes",
        view_invoices: "View Invoices",
        next_docs: "Next.js Documentation",
      },
      features: {
        title: "Features",
        subtitle: "Everything you need to control spending",
        items: {
          expense_tracking_title: "Expense Tracking",
          expense_tracking_desc: "Track and manage all your business expenses in one place.",
          ai_categorization_title: "AI Categorization",
          ai_categorization_desc: "Automatically categorize expenses with AI-powered suggestions.",
          attachments_title: "Attachments",
          attachments_desc: "Upload and manage receipts and supporting documents.",
          smart_search_title: "Smart Search",
          smart_search_desc: "Find expenses quickly with filters and full-text search.",
          analytics_title: "Analytics",
          analytics_desc: "Visualize spending trends and make data-driven decisions.",
          privacy_title: "Privacy-first",
          privacy_desc: "Your data is secure and never shared without your consent.",
        },
      },
      cta: {
        heading: "Ready to simplify your expenses?",
        subtitle: "Start by viewing your invoices and adding your first expense.",
        open_invoices: "Open Invoices",
      },
    },
    invoices: {
      title: "Invoices",
      subtitle: "View and manage all your expenses and invoices",
      error_title: "Unable to Load Expenses",
      error_hint:
        "The expense API endpoints may not be implemented yet on the backend. This page is ready to display expenses once the backend endpoints are available.",
      amount: "Amount:",
      category: "Category:",
      empty_title: "No Expenses Found",
      empty_desc: "You haven't created any expenses yet. Start by adding your first expense!",
    },
  },
  es: {
    language: {
      label: "Idioma",
      en: "Inglés",
      es: "Español",
      zh: "Chino",
    },
    navbar: {
      home: "Inicio",
      invoices: "Facturas",
      docs: "Docs",
      get_started: "Comenzar",
      beta: "Beta",
    },
    home: {
      hero: {
        title: "Gestiona tus gastos de forma más inteligente",
        subtitle:
          "{appName} te ayuda a controlar el gasto, a autoclasificar con IA y a tomar mejores decisiones — rápido.",
        primary: "Comenzar",
        secondary: "Leer la documentación",
        highlights: {
          fast_setup_title: "Configuración rápida",
          fast_setup_desc: "Next.js 14 + TypeScript",
          ai_title: "Con IA",
          ai_desc: "Clasificación inteligente",
          secure_title: "Seguro",
          secure_desc: "Estado del backend monitorizado",
        },
      },
      status: {
        title: "Estado del sistema",
        api_at: "API Go en {apiUrl}",
        ok_message: "El backend está saludable y responde",
        unexpected_status: "El backend devolvió un estado inesperado",
        cannot_connect: "No se puede conectar con el backend",
        ensure_running: "Asegúrate de que el backend se esté ejecutando en {apiUrl}",
      },
      quickstart: {
        title: "Inicio rápido",
        subtitle: "Ponte en marcha en minutos",
        view_invoices: "Ver facturas",
        next_docs: "Documentación de Next.js",
      },
      features: {
        title: "Funciones",
        subtitle: "Todo lo que necesitas para controlar el gasto",
        items: {
          expense_tracking_title: "Seguimiento de gastos",
          expense_tracking_desc: "Controla y gestiona todos tus gastos en un solo lugar.",
          ai_categorization_title: "Categorización con IA",
          ai_categorization_desc: "Clasifica gastos automáticamente con sugerencias impulsadas por IA.",
          attachments_title: "Adjuntos",
          attachments_desc: "Sube y gestiona recibos y documentos de soporte.",
          smart_search_title: "Búsqueda inteligente",
          smart_search_desc: "Encuentra gastos rápidamente con filtros y búsqueda de texto completo.",
          analytics_title: "Analítica",
          analytics_desc: "Visualiza tendencias de gasto y toma decisiones basadas en datos.",
          privacy_title: "Privacidad primero",
          privacy_desc: "Tus datos están seguros y nunca se comparten sin tu consentimiento.",
        },
      },
      cta: {
        heading: "¿Listo para simplificar tus gastos?",
        subtitle: "Empieza viendo tus facturas y añadiendo tu primer gasto.",
        open_invoices: "Abrir facturas",
      },
    },
    invoices: {
      title: "Facturas",
      subtitle: "Consulta y gestiona todos tus gastos y facturas",
      error_title: "No se pudieron cargar los gastos",
      error_hint:
        "Es posible que las API de gastos aún no estén implementadas en el backend. Esta página está lista para mostrar gastos cuando estén disponibles.",
      amount: "Importe:",
      category: "Categoría:",
      empty_title: "No se encontraron gastos",
      empty_desc: "Aún no has creado ningún gasto. ¡Empieza añadiendo tu primer gasto!",
    },
  },
  zh: {
    language: {
      label: "语言",
      en: "英语",
      es: "西班牙语",
      zh: "中文",
    },
    navbar: {
      home: "首页",
      invoices: "发票",
      docs: "文档",
      get_started: "开始使用",
      beta: "测试版",
    },
    home: {
      hero: {
        title: "更智能地管理开支",
        subtitle:
          "{appName} 帮助你跟踪支出，使用人工智能自动分类，并更快做出更好的决策。",
        primary: "开始使用",
        secondary: "阅读文档",
        highlights: {
          fast_setup_title: "快速上手",
          fast_setup_desc: "Next.js 14 + TypeScript",
          ai_title: "AI 驱动",
          ai_desc: "智能分类",
          secure_title: "安全",
          secure_desc: "后端健康状况监控",
        },
      },
      status: {
        title: "系统状态",
        api_at: "Go API 地址 {apiUrl}",
        ok_message: "后端运行正常并有响应",
        unexpected_status: "后端返回了意外的状态",
        cannot_connect: "无法连接到后端",
        ensure_running: "请确保后端在 {apiUrl} 上运行",
      },
      quickstart: {
        title: "快速开始",
        subtitle: "几分钟即可上手",
        view_invoices: "查看发票",
        next_docs: "Next.js 文档",
      },
      features: {
        title: "功能",
        subtitle: "掌控支出所需的一切",
        items: {
          expense_tracking_title: "开支跟踪",
          expense_tracking_desc: "在一个地方跟踪和管理所有业务支出。",
          ai_categorization_title: "AI 分类",
          ai_categorization_desc: "使用 AI 建议自动对支出进行分类。",
          attachments_title: "附件",
          attachments_desc: "上传和管理收据及支持性文件。",
          smart_search_title: "智能搜索",
          smart_search_desc: "通过筛选和全文搜索快速找到支出。",
          analytics_title: "分析",
          analytics_desc: "可视化支出趋势并做出数据驱动的决策。",
          privacy_title: "隐私优先",
          privacy_desc: "你的数据是安全的，未经允许绝不共享。",
        },
      },
      cta: {
        heading: "准备好简化你的开支了吗？",
        subtitle: "从查看发票并添加你的第一笔支出开始。",
        open_invoices: "打开发票",
      },
    },
    invoices: {
      title: "发票",
      subtitle: "查看并管理你的所有支出和发票",
      error_title: "无法加载支出",
      error_hint:
        "后端可能尚未实现支出相关接口。一旦可用，此页面将显示支出记录。",
      amount: "金额：",
      category: "类别：",
      empty_title: "未找到支出",
      empty_desc: "你还没有创建任何支出。现在就添加第一笔支出吧！",
    },
  },
};
