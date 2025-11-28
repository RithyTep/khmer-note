export const UI_TEXT = {
  AI_ASSISTANT: {
    TITLE: "Angkor AI",
    SUBTITLE: "KHMER INTELLIGENCE",
    GREETING: "សួស្ដី",
    GREETING_MESSAGE: "ខ្ញុំគឺជាជំនួយការឆ្លាតវៃរបស់អ្នក។ តើថ្ងៃនេះខ្ញុំអាចជួយសម្រួលការងារអ្វីខ្លះដល់លោកអ្នក?",
    TRY_ASKING: "សាកល្បងសួរខ្ញុំអំពីប្រវត្តិសាស្ត្រខ្មែរ ឬព័ត៌មានបច្ចេកវិទ្យា...",
    PLACEHOLDER: "សរសេរសំណួររបស់អ្នកនៅទីនេះ...",
    DISCLAIMER: "AI-generated content may be inaccurate.",
    RECENT_CHATS: "ការសន្ទនាថ្មីៗ",
    NO_CHATS: "គ្មានការសន្ទនាទេ",
    LOAD_MORE: "បង្ហាញបន្ថែម",
    INSERT: "បញ្ចូល",
    SUGGESTIONS: {
      WRITE: { label: "សរសេរអត្ថបទ", description: "Drafting content & creative writing" },
      TRANSLATE: { label: "បកប្រែភាសា", description: "Translate text across languages" },
      RESEARCH: { label: "ស្រាវជ្រាវ", description: "Research & information finding" },
      BRAINSTORM: { label: "គំនិតថ្មីៗ", description: "Brainstorming ideas" },
    },
  },
  SIDEBAR: {
    SEARCH: "ស្វែងរក",
    INBOX: "ប្រអប់សារ",
    SETTINGS: "ការកំណត់",
    FAVORITES: "ចំណូលចិត្ត",
    ALL_NOTES: "កំណត់ត្រាទាំងអស់",
    NO_NOTES: "គ្មានកំណត់ត្រាទេ",
    SIGN_OUT: "ចាកចេញ",
    CREATE_NOTE: "បង្កើតកំណត់ត្រាថ្មី",
  },
  PROJECT_MENU: {
    ADD_FAVORITE: "បន្ថែមទៅចំណូលចិត្ត",
    REMOVE_FAVORITE: "ដកចេញពីចំណូលចិត្ត",
    COPY_LINK: "ចម្លងតំណ",
    DUPLICATE: "ស្ទួន",
    RENAME: "ប្តូរឈ្មោះ",
    MOVE_TO: "ផ្លាស់ទីទៅ",
    TRASH: "ផ្លាស់ទីទៅធុងសំរាម",
    OPEN_NEW_TAB: "បើកក្នុងផ្ទាំងថ្មី",
    OPEN_SIDE_PEEK: "បើកក្នុង Side Peek",
  },
  TOAST: {
    PROJECT_CREATED: "គម្រោងថ្មីបានបង្កើត",
    PROJECT_DUPLICATED: "បានស្ទួនកំណត់ត្រា",
    PROJECT_DELETED: "បានលុបកំណត់ត្រា",
    CLICK_TO_RENAME: "ចុចលើចំណងជើងដើម្បីប្តូរឈ្មោះ",
    ADDED_TO_FAVORITES: "បានបន្ថែមទៅចំណូលចិត្ត",
    REMOVED_FROM_FAVORITES: "បានដកចេញពីចំណូលចិត្ត",
  },
  HOME: {
    WELCOME: "សូមស្វាគមន៍មកកាន់ Camnova",
    CREATE_FIRST_NOTE: "បង្កើតកំណត់ត្រាដំបូងរបស់អ្នក",
    CREATE_NEW_NOTE: "បង្កើតកំណត់ត្រាថ្មី",
    SELECT_NOTE: "សូមជ្រើសរើសកំណត់ត្រា",
  },
  HEADER: {
    NOTES: "កំណត់ត្រា",
    LAST_EDITED: "កែប្រែចុងក្រោយ",
  },
  SEARCH: {
    PLACEHOLDER: "ស្វែងរកឯកសារ កិច្ចការ ឬក្រុម...",
    RESULTS: "លទ្ធផលស្វែងរក",
    RECENT: "លទ្ធផលថ្មីៗ",
    NOT_FOUND: "រកមិនឃើញ",
    ADVANCED: "ស្វែងរកកម្រិតខ្ពស់",
  },
} as const;

export const DEFAULT_VALUES = {
  NEW_PROJECT_TITLE: "គ្មានចំណងជើង",
  DUPLICATE_SUFFIX: "(ច្បាប់ចម្លង)",
  EMOJI: "📝",
};

export const TIMING = {
  DEBOUNCE_DELAY: 1000,
  DEBOUNCE_TITLE_MS: 1000,
  DEBOUNCE_CONTENT_MS: 1000,
  TOAST_DURATION: 3000,
  SYNC_INTERVAL_MS: 30 * 60 * 1000, // 30 minutes
  FOCUS_DELAY_MS: 100, // Delay before focusing input elements
};

export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280,
} as const;

export const STORAGE_KEYS = {
  PREFIX: "camnova-",
  SESSION_SYNCED: "camnova-session-synced",
  LAST_SYNC: "camnova-last-sync",
  PROJECTS: "camnova-projects-cache",
  LAST_PROJECT: "camnova-last-project",
  project: (id: string) => `camnova-project-${id}`,
};

export const API_HEADERS = {
  CLIENT_KEY: "x-camnova-client",
  CLIENT_VALUE: "camnova-web",
};
