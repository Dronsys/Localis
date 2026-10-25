const { ipcRenderer } = require('electron');
const JSZip = require('jszip');

let currentModsData = { partial: [], not_translated: [], ignored: [] };
let activeModIndex = 0;
let currentEditorModList = [];
let currentEditorMod = null; 
let activeSelectedModId = null; 
let currentEditorData = null; // { enData, targetData }
let terminologyRules = {};
let currentLang = 'ru';
let currentAIConfig = null;

const translations = {
  ru: {
    subtitle: "Modpack Localization Suite",
    term: "Терминология",
    settings: "Настройки ИИ",
    eyebrow: "MODPACK LOCALIZATION SUITE",
    hero: "Пакетный Редактор Модов",
    browse: "Выбрать папку",
    analyze: "Анализировать",
    batch: "Перевести все",
    export: "Экспорт HTML",
    wait: "Ожидание выбора папки с модами...",
    totalProg: "Общий прогресс: 0.0%",
    col1: "⚠️ Требуется доработка",
    col2: "❌ Совсем не переведено",
    openBtn: "Открыть",
    termTitle: "Правила терминологии",
    termDesc: "Задайте правила перевода для конкретных терминов (например: Ingot -> Слиток).",
    termAdd: "Добавить",
    termSave: "Сохранить",
    aiTitle: "Настройки ИИ Провайдера",
    save: "Сохранить",
    filterAll: "Показывать все",
    filterUntranslated: "Только непереведенные",
    filterErrors: "Только с ошибками плейсхолдеров",
    targetLangTitle: "Перевод (RU)",
    jsonTargetTitle: "Русский (ru_ru.json)",
    editorModTitle: "Редактор мода",
    tableBtn: "Таблица",
    jsonBtn: "JSON",
    aiTransModBtn: "ИИ Перевод мода",
    backupMgrBtn: "Бэкапы",
    saveJarBtn: "Сохранить в JAR",
    backupTitle: "Резервные копии",
    backupDesc: "Список сохраненных бэкапов:",
    restoreBtn: "Восстановить",
    closeBtn: "Закрыть",
    reasonNoLang: "Нет локализации",
    reasonNoTarget: "Нет файла перевода",
    reasonTargetEmpty: "Файл перевода пустой",
    reasonCopiedEn: "Скопирован EN (без перевода)",
    reasonError: "Ошибка чтения JAR",
    placeholderPath: "Путь к папке с модами (.jar)...",
    placeholderTermKey: "EN Термин (напр. Netherite)",
    placeholderTermVal: "Перевод (напр. Незерит)",
    placeholderSearch: "Поиск по ключам и переводу...",
    placeholderApiKey: "sk-...",
    notifNav: "Уведомления",
    notifTitle: "Центр уведомлений",
    notifDesc: "История системных событий и операций ИИ:",
    clearNotif: "Очистить",
    close: "Закрыть",
    ollamaModels: "Локальные модели Ollama",
    fetchModels: "Получить модели",
    aiProgressTitle: "Перевод ИИ",
    progressRows: "Строк",
    progressParts: "Часть",
    progressMods: "Мод",
    minimize: "Свернуть",
    aiDone: "Перевод ИИ завершён",
    aiFailed: "Ошибка перевода ИИ",
    aiRunning: "ИИ переводит",
    progressTask: "Переводится",
    progressSummary: "Всего строк: {rows} · частей: {parts} · модов: {mods}",
    noActiveProgress: "Нет активного перевода",
    htmlReportTitle: "Localis - Отчет Локализации Модпака",
    htmlTotalMods: "Всего обработано модов",
    htmlOverallProgress: "Общий прогресс локализации",
    htmlPartialMods: "Моды, требующие доработки",
    htmlUntranslatedMods: "Не переведенные моды",
    htmlModName: "Название Мода",
    htmlStatus: "Статус / Причина",
    htmlProgress: "Прогресс",
    htmlErrors: "Ошибки плейсхолдеров",
    htmlSkippedMods: "Без локализации (пропущено)",
    modsFound: "Модов для перевода",
    translatedLabel: "Переведено",
    placeholderErrorsLabel: "Ошибки плейсхолдеров",
    reasonLabel: "Причина",
    htmlStatusOk: "Переведено", htmlStatusPartial: "Частично переведено", dlgAnalysisError: "Ошибка анализа модов: {detail}",
    dialogTitle: "Localis", dialogOk: "Понятно",
    dlgEmptyList: "В этом списке пока нет модов.", dlgJsonInvalid: "В JSON есть синтаксическая ошибка. Проверьте данные и попробуйте снова.",
    dlgModSaved: "Мод сохранён. Резервная копия создана в .backups/.", dlgSaveError: "Не удалось сохранить мод: {detail}",
    dlgBackupRestored: "Резервная копия восстановлена. Повторный анализ папки запущен.", dlgRestoreError: "Не удалось восстановить резервную копию: {detail}",
    dlgModelsLoaded: "Загружено моделей: {count}", dlgModelsError: "Не удалось получить список моделей: {detail}",
    dlgSettingsSaved: "Настройки ИИ сохранены.", dlgSettingsError: "Не удалось сохранить настройки ИИ.",
    dlgOpenModFirst: "Сначала откройте мод в редакторе.", dlgNoRows: "Нет строк для перевода.",
    dlgAiError: "Ошибка ИИ-перевода: {detail}",
    dlgChooseAnalyze: "Сначала выберите папку и выполните анализ модов.",
    dlgNotificationsError: "Не удалось очистить уведомления: {detail}", dlgTermsSaved: "Правила терминологии сохранены."
  },
  en: {
    subtitle: "Modpack Localization Suite",
    term: "Terminology",
    settings: "AI Settings",
    eyebrow: "MODPACK LOCALIZATION SUITE",
    hero: "Modpack Batch Editor",
    browse: "Select Folder",
    analyze: "Analyze",
    batch: "Translate All",
    export: "Export HTML",
    wait: "Waiting for mods folder...",
    totalProg: "Total Progress: 0.0%",
    col1: "⚠️ Needs Work",
    col2: "❌ Not Translated",
    openBtn: "Open",
    termTitle: "Terminology Rules",
    termDesc: "Define custom translation rules for specific terms (e.g., Ingot -> Ingot).",
    termAdd: "Add",
    termSave: "Save",
    aiTitle: "AI Provider Settings",
    save: "Save",
    filterAll: "Show All",
    filterUntranslated: "Untranslated Only",
    filterErrors: "Placeholder Errors Only",
    targetLangTitle: "Translation (EN)",
    jsonTargetTitle: "English (en_us.json)",
    editorModTitle: "Mod Editor",
    tableBtn: "Table",
    jsonBtn: "JSON",
    aiTransModBtn: "AI Translate Mod",
    backupMgrBtn: "Backups",
    saveJarBtn: "Save to JAR",
    backupTitle: "Backups",
    backupDesc: "Saved backup list:",
    restoreBtn: "Restore",
    closeBtn: "Close",
    reasonNoLang: "No localization",
    reasonNoTarget: "No target lang file",
    reasonTargetEmpty: "Target file is empty",
    reasonCopiedEn: "Copied EN (untranslated)",
    reasonError: "JAR read error",
    placeholderPath: "Path to mods folder (.jar)...",
    placeholderTermKey: "EN Term (e.g. Netherite)",
    placeholderTermVal: "Translation (e.g. Netherite)",
    placeholderSearch: "Search by keys and translation...",
    placeholderApiKey: "sk-...",
    notifNav: "Notifications",
    notifTitle: "Notification Center",
    notifDesc: "History of system events and AI operations:",
    clearNotif: "Clear",
    close: "Close",
    ollamaModels: "Local Ollama models",
    fetchModels: "Get models",
    aiProgressTitle: "AI Translation",
    progressRows: "Rows",
    progressParts: "Part",
    progressMods: "Mods",
    minimize: "Minimize",
    aiDone: "AI translation completed",
    aiFailed: "AI translation failed",
    aiRunning: "AI translation in progress",
    progressTask: "Translating",
    progressSummary: "Total rows: {rows} · parts: {parts} · mods: {mods}",
    noActiveProgress: "No active translation",
    htmlReportTitle: "Localis - Modpack Localization Report",
    htmlTotalMods: "Total Mods Processed",
    htmlOverallProgress: "Overall Progress",
    htmlPartialMods: "Mods Needing Work",
    htmlUntranslatedMods: "Untranslated Mods",
    htmlModName: "Mod Name",
    htmlStatus: "Status / Reason",
    htmlProgress: "Progress",
    htmlErrors: "Placeholder Errors",
    htmlSkippedMods: "No localization (skipped)",
    modsFound: "Mods to translate",
    translatedLabel: "Translated",
    placeholderErrorsLabel: "Placeholder errors",
    reasonLabel: "Reason",
    htmlStatusOk: "Translated", htmlStatusPartial: "Partially translated", dlgAnalysisError: "Mod analysis error: {detail}",
    dialogTitle: "Localis", dialogOk: "OK",
    dlgEmptyList: "There are no mods in this list yet.", dlgJsonInvalid: "The JSON contains a syntax error. Check the data and try again.",
    dlgModSaved: "The mod was saved. A backup was created in .backups/.", dlgSaveError: "Could not save the mod: {detail}",
    dlgBackupRestored: "The backup was restored. Folder analysis has started again.", dlgRestoreError: "Could not restore the backup: {detail}",
    dlgModelsLoaded: "Models loaded: {count}", dlgModelsError: "Could not fetch models: {detail}",
    dlgSettingsSaved: "AI settings saved.", dlgSettingsError: "Could not save AI settings.",
    dlgOpenModFirst: "Open a mod in the editor first.", dlgNoRows: "There are no rows to translate.",
    dlgAiError: "AI translation error: {detail}",
    dlgChooseAnalyze: "Select a folder and analyze the mods first.",
    dlgNotificationsError: "Could not clear notifications: {detail}", dlgTermsSaved: "Terminology rules saved."
  },
  de: {
    subtitle: "Modpack Localization Suite",
    term: "Terminologie",
    settings: "KI-Einstellungen",
    eyebrow: "MODPACK LOCALIZATION SUITE",
    hero: "Modpack Batch-Editor",
    browse: "Ordner wählen",
    analyze: "Analysieren",
    batch: "Alle übersetzen",
    export: "HTML Export",
    wait: "Warte auf Mods-Ordner...",
    totalProg: "Gesamtfortschritt: 0.0%",
    col1: "⚠️ Überarbeitung nötig",
    col2: "❌ Nicht übersetzt",
    openBtn: "Öffnen",
    termTitle: "Terminologieregeln",
    termDesc: "Definieren Sie Übersetzungsregeln für bestimmte Begriffe.",
    termAdd: "Hinzufügen",
    termSave: "Speichern",
    aiTitle: "KI-Anbieter-Einstellungen",
    save: "Speichern",
    filterAll: "Alle anzeigen",
    filterUntranslated: "Nur unübersetzte",
    filterErrors: "Nur Platzhalterfehler",
    targetLangTitle: "Übersetzung (DE)",
    jsonTargetTitle: "Deutsch (de_de.json)",
    editorModTitle: "Mod-Editor",
    tableBtn: "Tabelle",
    jsonBtn: "JSON",
    aiTransModBtn: "KI-Übersetzung",
    backupMgrBtn: "Sicherungen",
    saveJarBtn: "In JAR speichern",
    backupTitle: "Sicherungen",
    backupDesc: "Gespeicherte Sicherungsdateien:",
    restoreBtn: "Wiederherstellen",
    closeBtn: "Schließen",
    reasonNoLang: "Keine Lokalisierung",
    reasonNoTarget: "Keine Ziel-Sprachdatei",
    reasonTargetEmpty: "Ziel-Sprachdatei ist leer",
    reasonCopiedEn: "Kopiertes EN (unübersetzt)",
    reasonError: "JAR-Lesefehler",
    placeholderPath: "Pfad zum Mods-Ordner (.jar)...",
    placeholderTermKey: "EN Begriff (z.B. Netherite)",
    placeholderTermVal: "Übersetzung (z.B. Netherit)",
    placeholderSearch: "Suche nach Schlüsseln...",
    placeholderApiKey: "sk-...",
    notifNav: "Benachrichtigungen",
    notifTitle: "Benachrichtigungszentrale",
    notifDesc: "Verlauf von Systemereignissen und KI-Vorgängen:",
    clearNotif: "Leeren",
    close: "Schließen",
    ollamaModels: "Lokale Ollama-Modelle",
    fetchModels: "Modelle laden",
    aiProgressTitle: "KI-Übersetzung",
    progressRows: "Zeilen",
    progressParts: "Teil",
    progressMods: "Mods",
    minimize: "Minimieren",
    aiDone: "KI-Übersetzung abgeschlossen",
    aiFailed: "KI-Übersetzung fehlgeschlagen",
    aiRunning: "KI-Übersetzung läuft",
    progressTask: "Übersetzt",
    progressSummary: "Zeilen gesamt: {rows} · Teile: {parts} · Mods: {mods}",
    noActiveProgress: "Keine aktive Übersetzung",
    htmlReportTitle: "Localis - Modpack Lokalisierungsbericht",
    htmlTotalMods: "Verarbeitete Mods insgesamt",
    htmlOverallProgress: "Gesamtfortschritt",
    htmlPartialMods: "Überarbeitungsbedürftige Mods",
    htmlUntranslatedMods: "Unübersetzte Mods",
    htmlModName: "Mod-Name",
    htmlStatus: "Status / Grund",
    htmlProgress: "Fortschritt",
    htmlErrors: "Platzhalterfehler",
    htmlSkippedMods: "Ohne Lokalisierung (übersprungen)",
    modsFound: "Mods zum Übersetzen",
    translatedLabel: "Übersetzt",
    placeholderErrorsLabel: "Platzhalterfehler",
    reasonLabel: "Grund",
    htmlStatusOk: "Übersetzt", htmlStatusPartial: "Teilweise übersetzt", dlgAnalysisError: "Fehler bei der Mod-Analyse: {detail}",
    dialogTitle: "Localis", dialogOk: "OK",
    dlgEmptyList: "Diese Liste enthält noch keine Mods.", dlgJsonInvalid: "Das JSON enthält einen Syntaxfehler. Prüfen Sie die Daten und versuchen Sie es erneut.",
    dlgModSaved: "Der Mod wurde gespeichert. Ein Backup wurde in .backups/ erstellt.", dlgSaveError: "Der Mod konnte nicht gespeichert werden: {detail}",
    dlgBackupRestored: "Das Backup wurde wiederhergestellt. Die Ordneranalyse wurde erneut gestartet.", dlgRestoreError: "Das Backup konnte nicht wiederhergestellt werden: {detail}",
    dlgModelsLoaded: "Geladene Modelle: {count}", dlgModelsError: "Modelle konnten nicht geladen werden: {detail}",
    dlgSettingsSaved: "KI-Einstellungen gespeichert.", dlgSettingsError: "KI-Einstellungen konnten nicht gespeichert werden.",
    dlgOpenModFirst: "Öffnen Sie zuerst einen Mod im Editor.", dlgNoRows: "Es gibt keine Zeilen zum Übersetzen.",
    dlgAiError: "Fehler bei der KI-Übersetzung: {detail}",
    dlgChooseAnalyze: "Wählen Sie zuerst einen Ordner aus und analysieren Sie die Mods.",
    dlgNotificationsError: "Benachrichtigungen konnten nicht gelöscht werden: {detail}", dlgTermsSaved: "Terminologieregeln gespeichert."
  },
  zh: {
    subtitle: "Modpack Localization Suite",
    term: "术语表",
    settings: "AI 设置",
    eyebrow: "MODPACK LOCALIZATION SUITE",
    hero: "模组批量编辑器",
    browse: "选择文件夹",
    analyze: "开始分析",
    batch: "一键翻译全部",
    export: "导出 HTML",
    wait: "等待选择模组文件夹...",
    totalProg: "总进度: 0.0%",
    col1: "⚠️ 需要完善",
    col2: "❌ 未翻译",
    openBtn: "打开",
    termTitle: "术语规则",
    termDesc: "为特定词条设定强制翻译规则。",
    termAdd: "添加",
    termSave: "保存",
    aiTitle: "AI 提供商设置",
    save: "保存",
    filterAll: "显示全部",
    filterUntranslated: "仅未翻译",
    filterErrors: "仅占位符错误",
    targetLangTitle: "翻译 (ZH)",
    jsonTargetTitle: "中文 (zh_cn.json)",
    editorModTitle: "模组编辑器",
    tableBtn: "表格",
    jsonBtn: "JSON",
    aiTransModBtn: "AI 翻译模组",
    backupMgrBtn: "备份管理",
    saveJarBtn: "保存至 JAR",
    backupTitle: "备份管理",
    backupDesc: "已保存的备份列表:",
    restoreBtn: "还原",
    closeBtn: "关闭",
    reasonNoLang: "无语言文件",
    reasonNoTarget: "缺少目标语言文件",
    reasonTargetEmpty: "目标文件为空",
    reasonCopiedEn: "直接复制英文 (未翻译)",
    reasonError: "JAR 读取错误",
    placeholderPath: "模组文件夹路径 (.jar)...",
    placeholderTermKey: "英文术语 (如 Netherite)",
    placeholderTermVal: "翻译 (如 下界合金)",
    placeholderSearch: "按键名或翻译搜索...",
    placeholderApiKey: "sk-...",
    notifNav: "通知",
    notifTitle: "通知中心",
    notifDesc: "系统事件和 AI 操作历史：",
    clearNotif: "清除",
    close: "关闭",
    ollamaModels: "Ollama 本地模型",
    fetchModels: "获取模型",
    aiProgressTitle: "AI 翻译",
    progressRows: "行",
    progressParts: "部分",
    progressMods: "模组",
    minimize: "最小化",
    aiDone: "AI 翻译已完成",
    aiFailed: "AI 翻译失败",
    aiRunning: "AI 正在翻译",
    progressTask: "正在翻译",
    progressSummary: "总行数：{rows} · 部分：{parts} · 模组：{mods}",
    noActiveProgress: "没有正在进行的翻译",
    htmlReportTitle: "Localis - 整合包本地化报告",
    htmlTotalMods: "总模组数量",
    htmlOverallProgress: "总进度",
    htmlPartialMods: "需要完善的模组",
    htmlUntranslatedMods: "未翻译的模组",
    htmlModName: "模组名称",
    htmlStatus: "状态 / 原因",
    htmlProgress: "进度",
    htmlErrors: "占位符错误",
    htmlSkippedMods: "无本地化内容（已跳过）",
    modsFound: "待翻译模组",
    translatedLabel: "已翻译",
    placeholderErrorsLabel: "占位符错误",
    reasonLabel: "原因",
    htmlStatusOk: "已翻译", htmlStatusPartial: "部分翻译", dlgAnalysisError: "模组分析错误：{detail}",
    dialogTitle: "Localis", dialogOk: "知道了",
    dlgEmptyList: "此列表中暂无模组。", dlgJsonInvalid: "JSON 语法有误，请检查数据后重试。",
    dlgModSaved: "模组已保存，并已在 .backups/ 中创建备份。", dlgSaveError: "无法保存模组：{detail}",
    dlgBackupRestored: "备份已恢复，已重新开始扫描文件夹。", dlgRestoreError: "无法恢复备份：{detail}",
    dlgModelsLoaded: "已加载模型：{count}", dlgModelsError: "无法获取模型列表：{detail}",
    dlgSettingsSaved: "AI 设置已保存。", dlgSettingsError: "无法保存 AI 设置。",
    dlgOpenModFirst: "请先在编辑器中打开一个模组。", dlgNoRows: "没有需要翻译的行。",
    dlgAiError: "AI 翻译错误：{detail}",
    dlgChooseAnalyze: "请先选择文件夹并分析模组。",
    dlgNotificationsError: "无法清除通知：{detail}", dlgTermsSaved: "术语规则已保存。"
  }
};

function changeLanguage(lang) {
  const previousLang = currentLang;
  logUserAction('UI_INTERACTION', 'Пользователь сменил язык интерфейса', { previousLang, targetLang: lang });
  currentLang = lang;
  document.documentElement.lang = lang;
  const t = translations[lang] || translations.ru;
  document.getElementById('lbl-subtitle').innerText = t.subtitle;
  document.getElementById('nav-term').innerText = t.term;
  document.getElementById('nav-notif').innerText = t.notifNav || t.notifTitle;
  document.getElementById('notif-modal-title').innerText = t.notifTitle;
  document.getElementById('notif-modal-desc').innerText = t.notifDesc;
  document.getElementById('btn-clear-notif').innerText = t.clearNotif;
  document.getElementById('btn-close-notif').innerText = t.close;
  document.getElementById('lbl-ollama-models').innerText = t.ollamaModels;
  document.getElementById('btn-fetch-models').innerText = t.fetchModels;
  document.getElementById('btn-fetch-ollama').innerText = t.fetchModels;
  document.getElementById('ai-progress-title').innerHTML = '<i class="fa-solid fa-robot"></i> ' + t.aiProgressTitle;
  document.getElementById('btn-ai-progress-minimize').innerText = t.minimize;
  document.getElementById('lang-select').value = lang;
  try { localStorage.setItem('localis-language', lang); } catch (_) {}
  renderNotifications();
  document.getElementById('nav-settings').innerText = t.settings;
  document.getElementById('eyebrow-title').innerText = t.eyebrow;
  document.getElementById('hero-title').innerText = t.hero;
  document.getElementById('btn-browse').innerText = t.browse;
  document.getElementById('btn-analyze').innerText = t.analyze;
  document.getElementById('btn-batch').innerText = t.batch;
  document.getElementById('btn-export').innerText = t.export;
  document.getElementById('btn-edit-part').innerText = t.openBtn;
  document.getElementById('btn-edit-not').innerText = t.openBtn;
  document.getElementById('term-modal-title').innerText = t.termTitle;
  document.getElementById('term-desc').innerText = t.termDesc;
  document.getElementById('term-add-btn').innerText = t.termAdd;
  document.getElementById('term-save-btn').innerText = t.termSave;
  document.getElementById('ai-modal-title').innerText = t.aiTitle;
  document.getElementById('ai-save-btn').innerText = t.save;
  
  // Placeholders translation (Task 1)
  if (document.getElementById('mod-path-input')) document.getElementById('mod-path-input').placeholder = t.placeholderPath;
  if (document.getElementById('term-key')) document.getElementById('term-key').placeholder = t.placeholderTermKey;
  if (document.getElementById('term-val')) document.getElementById('term-val').placeholder = t.placeholderTermVal;
  if (document.getElementById('table-search')) document.getElementById('table-search').placeholder = t.placeholderSearch;
  if (document.getElementById('ai-cloud-key')) document.getElementById('ai-cloud-key').placeholder = t.placeholderApiKey;

  // Mod Editor Translations
  document.getElementById('opt-filter-all').innerText = t.filterAll;
  document.getElementById('opt-filter-untranslated').innerText = t.filterUntranslated;
  document.getElementById('opt-filter-errors').innerText = t.filterErrors;
  document.getElementById('th-target-lang').innerText = t.targetLangTitle;
  document.getElementById('lbl-json-target-title').innerText = t.jsonTargetTitle;
  document.getElementById('editor-mod-title').innerText = t.editorModTitle;
  document.getElementById('lbl-btn-table').innerText = t.tableBtn;
  document.getElementById('lbl-btn-json').innerText = t.jsonBtn;
  document.getElementById('btn-ai-trans-mod').innerText = t.aiTransModBtn;
  document.getElementById('btn-backup-mgr').innerText = t.backupMgrBtn;
  document.getElementById('btn-save-jar').innerText = t.saveJarBtn;

  // Backup modal
  document.getElementById('backup-modal-title').innerText = t.backupTitle;
  document.getElementById('backup-modal-desc').innerText = t.backupDesc;
  document.getElementById('btn-close-backup').innerText = t.closeBtn;

  if (document.getElementById('mod-path-input').value) {
    startAnalysis();
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  logUserAction('APP', 'Интерфейс Localis загружен');
  terminologyRules = await ipcRenderer.invoke('term:load');
  await loadNotifications();
  currentAIConfig = await ipcRenderer.invoke('config:load');
  applyLoadedAIConfig();
  let savedLanguage = 'ru';
  try { savedLanguage = localStorage.getItem('localis-language') || 'ru'; } catch (_) {}
  changeLanguage(translations[savedLanguage] ? savedLanguage : 'ru');
  ['json-en-area','json-ru-area','table-search','editor-filter-mode'].forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('change', () => logUserAction('EDITOR', 'Изменено поле редактора', { field: id, mod: currentEditorMod ? currentEditorMod.name : null })); });
});

async function selectFolder() {
  logUserAction('UI_INTERACTION', 'Нажата кнопка выбора папки');
  const dir = await ipcRenderer.invoke('dialog:select-directory');
  if (dir) {
    document.getElementById('mod-path-input').value = dir;
    startAnalysis();
  }
}

async function startAnalysis() {
  const dir = document.getElementById('mod-path-input').value;
  if (!dir) { logUserAction('UI_INTERACTION', 'Анализ отменён: папка не выбрана'); return; }
  logUserAction('SYSTEM', 'Запущен анализ папки модов', { folderPath: dir, targetLang: currentLang });

  const t = translations[currentLang] || translations.ru;
  document.getElementById('status-text').innerText = t.wait;
  document.getElementById('progress-fill').style.width = "20%";

  const res = await ipcRenderer.invoke('mod:scan-folder', { folderPath: dir, targetLang: currentLang });
  if (res.error) {
    showAppDialog('dlgAnalysisError', { detail: res.error });
    return;
  }

  const mods = res.mods;
  logUserAction('SYSTEM', 'Получены результаты анализа модов', { totalMods: mods.length, targetLang: currentLang });
  let partial = [];
  let not_translated = [];
  let ignored = [];
  let totalKeysAll = 0;
  let translatedKeysAll = 0;

  mods.forEach(m => {
    if (m.reason === 'no_lang') {
      ignored.push(m);
      return;
    }
    totalKeysAll += m.totalKeys;
    translatedKeysAll += m.translatedKeys;

    if (m.reason) {
      not_translated.push(m);
    } else if (m.translatedKeys < m.totalKeys || m.placeholderErrors > 0) {
      partial.push(m);
    }
  });

  currentModsData = { partial, not_translated, ignored };

  const percent = totalKeysAll > 0 ? ((translatedKeysAll / totalKeysAll) * 100).toFixed(2) : 0.0;
  document.getElementById('total-percent').innerText = `${t.totalProg.split(':')[0]}: ${percent}%`;
  document.getElementById('status-text').innerText = `${t.modsFound}: ${partial.length + not_translated.length}`;
  document.getElementById('progress-fill').style.width = "100%";

  renderLists();
}

function getLocalizedReason(reasonKey) {
  const t = translations[currentLang] || translations.ru;
  switch (reasonKey) {
    case 'no_lang': return t.reasonNoLang;
    case 'no_target_file': return t.reasonNoTarget;
    case 'target_empty': return t.reasonTargetEmpty;
    case 'copied_en': return t.reasonCopiedEn;
    case 'read_error': return t.reasonError;
    default: return reasonKey;
  }
}

function renderLists() {
  const t = translations[currentLang] || translations.ru;
  const listP = document.getElementById('list-partial');
  const listN = document.getElementById('list-not-translated');

  listP.innerHTML = '';
  listN.innerHTML = '';

  document.getElementById('col1-title').innerText = `${t.col1} (${currentModsData.partial.length})`;
  document.getElementById('col2-title').innerText = `${t.col2} (${currentModsData.not_translated.length})`;

  currentModsData.partial.forEach((m, idx) => {
    const div = document.createElement('div');
    div.className = 'mod-item-card';
    const errBadge = m.placeholderErrors > 0 ? ` | ⚠️ ${t.placeholderErrorsLabel}: ${m.placeholderErrors}` : '';
    div.innerHTML = `<div class="mod-item-title">📦 ${m.name}</div><div class="mod-item-desc">${t.translatedLabel}: ${m.translatedKeys} / ${m.totalKeys}${errBadge}</div>`;
    div.onclick = () => openEditorWithMods(currentModsData.partial, idx);
    listP.appendChild(div);
  });

  currentModsData.not_translated.forEach((m, idx) => {
    const div = document.createElement('div');
    div.className = 'mod-item-card';
    div.innerHTML = `<div class="mod-item-title">📦 ${m.name}</div><div class="mod-item-desc">${t.reasonLabel}: ${getLocalizedReason(m.reason)}</div>`;
    div.onclick = () => openEditorWithMods(currentModsData.not_translated, idx);
    listN.appendChild(div);
  });
}

function openEditorTab(category) {
  const list = currentModsData[category];
  if (!list || list.length === 0) {
    showAppDialog('dlgEmptyList');
    return;
  }
  openEditorWithMods(list, 0);
}

function openEditorWithMods(modList, index) {
  logUserAction('EDITOR', 'Открытие редактора модов', { count: modList ? modList.length : 0, index, mod: modList && modList[index] ? modList[index].name : null });
  currentEditorModList = modList;
  activeModIndex = index;
  const modSelect = document.getElementById('editor-mod-select');
  modSelect.innerHTML = '';
  currentEditorModList.forEach((mod, modIndex) => {
    const option = document.createElement('option');
    option.value = String(modIndex);
    option.textContent = mod.name;
    modSelect.appendChild(option);
  });
  modSelect.value = String(index);
  loadModDataIntoEditor(modList[index]);
  document.getElementById('modal-editor').style.display = 'flex';
}

function switchMod(indexValue) {
  const index = Number.parseInt(indexValue, 10);
  if (!Number.isInteger(index) || index < 0 || index >= currentEditorModList.length) return;
  activeModIndex = index;
  loadModDataIntoEditor(currentEditorModList[index]);
}

function loadModDataIntoEditor(mod) {
  logUserAction('EDITOR', 'Загрузка данных мода в редактор', { mod: mod ? mod.name : null, modIds: mod && mod.modMap ? Object.keys(mod.modMap).length : 0 });
  currentEditorMod = mod;
  const selectModId = document.getElementById('mod-id-select');
  selectModId.innerHTML = '';

  const modMap = mod.modMap || {};
  const modIds = Object.keys(modMap);

  if (modIds.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.innerText = 'N/A';
    selectModId.appendChild(opt);
    activeSelectedModId = null;
    currentEditorData = { enData: {}, targetData: {}, targetPath: '' };
  } else {
    modIds.forEach((mId, i) => {
      const opt = document.createElement('option');
      opt.value = mId;
      opt.innerText = mId;
      if (i === 0) opt.selected = true;
      selectModId.appendChild(opt);
    });
    activeSelectedModId = modIds[0];
    const activeModInfo = modMap[activeSelectedModId];
    const en = activeModInfo.en || {};
    const target = activeModInfo.target || {};
    const mergedTarget = Object.assign({}, en, target);

    currentEditorData = {
      enData: en,
      targetData: mergedTarget,
      targetPath: activeModInfo.targetPath
    };
  }

  document.getElementById('json-en-area').value = JSON.stringify(currentEditorData.enData, null, 2);
  document.getElementById('json-ru-area').value = JSON.stringify(currentEditorData.targetData, null, 2);

  renderDataGrid();
}

function switchModId(modId) {
  logUserAction('EDITOR', 'Переключение namespace мода', { modId });
  if (!currentEditorMod || !currentEditorMod.modMap[modId]) return;
  activeSelectedModId = modId;
  const activeModInfo = currentEditorMod.modMap[modId];
  const en = activeModInfo.en || {};
  const target = activeModInfo.target || {};
  const mergedTarget = Object.assign({}, en, target);

  currentEditorData = {
    enData: en,
    targetData: mergedTarget,
    targetPath: activeModInfo.targetPath
  };

  document.getElementById('json-en-area').value = JSON.stringify(currentEditorData.enData, null, 2);
  document.getElementById('json-ru-area').value = JSON.stringify(currentEditorData.targetData, null, 2);

  renderDataGrid();
}

function setEditorView(view) {
  logUserAction('EDITOR', 'Изменение представления редактора', { view, mod: currentEditorMod ? currentEditorMod.name : null });
  if (view === 'table') {
    document.getElementById('view-table-container').style.display = 'flex';
    document.getElementById('view-json-container').style.display = 'none';
    document.getElementById('btn-view-table').classList.add('active');
    document.getElementById('btn-view-json').classList.remove('active');
    
    try {
      const parsed = JSON.parse(document.getElementById('json-ru-area').value);
      currentEditorData.targetData = parsed;
      renderDataGrid();
    } catch (e) {}
  } else {
    document.getElementById('view-table-container').style.display = 'none';
    document.getElementById('view-json-container').style.display = 'flex';
    document.getElementById('btn-view-json').classList.add('active');
    document.getElementById('btn-view-table').classList.remove('active');

    document.getElementById('json-ru-area').value = JSON.stringify(currentEditorData.targetData, null, 2);
  }
}

function renderDataGrid() {
  const searchQuery = document.getElementById('table-search').value.toLowerCase();
  const filterMode = document.getElementById('editor-filter-mode').value;

  const tbody = document.getElementById('datagrid-tbody');
  tbody.innerHTML = '';

  const en = currentEditorData.enData;
  const target = currentEditorData.targetData;
  for (const [key, val] of Object.entries(en)) {
    const targetVal = target[key] || '';

    if (filterMode === 'untranslated' && !needsAITranslation(val, targetVal)) {
      continue;
    }

    if (filterMode === 'errors') {
      const enMatches = getPlaceholderSignature(val);
      const trMatches = getPlaceholderSignature(targetVal);
      if (enMatches === trMatches) continue;
    }

    if (searchQuery && !key.toLowerCase().includes(searchQuery) && !val.toLowerCase().includes(searchQuery) && !targetVal.toLowerCase().includes(searchQuery)) {
      continue;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><code style="word-break: break-all;">${key}</code></td>
      <td>${val}</td>
      <td><input type="text" class="grid-input" value="${targetVal.replace(/"/g, '&quot;')}" onchange="updateTargetKey('${key}', this.value)"></td>
    `;
    tbody.appendChild(tr);
  }
}

function filterTableData() {
  renderDataGrid();
}

function updateTargetKey(key, val) {
  if (currentEditorData && currentEditorData.targetData) {
    currentEditorData.targetData[key] = val;
  }
}

async function saveCurrentModChanges() {
  logUserAction('EDITOR', 'Сохранение изменений мода', { mod: currentEditorMod ? currentEditorMod.name : null, modId: activeSelectedModId, targetLang: currentLang });
  if (!currentEditorMod || !activeSelectedModId) return;

  if (document.getElementById('view-json-container').style.display !== 'none') {
    try {
      currentEditorData.targetData = JSON.parse(document.getElementById('json-ru-area').value);
    } catch (e) {
      showAppDialog('dlgJsonInvalid');
      return;
    }
  }

  const res = await ipcRenderer.invoke('mod:save-jar', {
    jarPath: currentEditorMod.path,
    targetPath: currentEditorData.targetPath,
    targetData: currentEditorData.targetData,
    modId: activeSelectedModId,
    targetLang: currentLang
  });

  if (res.success) {
    showAppDialog('dlgModSaved');
  } else {
    showAppDialog('dlgSaveError', { detail: res.error });
  }
}

async function openBackupManager() {
  if (!currentEditorMod) return;
  const backups = await ipcRenderer.invoke('mod:list-backups', currentEditorMod.path);

  const container = document.getElementById('backup-list');
  container.innerHTML = '';

  const t = translations[currentLang] || translations.ru;

  if (backups.length === 0) {
    container.innerHTML = `<div style="padding: 10px; color: var(--color-fog-veil);">No backups found.</div>`;
  } else {
    backups.forEach(b => {
      const row = document.createElement('div');
      row.className = 'term-row';
      row.innerHTML = `
        <span><i class="fa-solid fa-file-zipper"></i> ${b.dateStr}</span>
        <button class="pill-btn sm primary" onclick="restoreBackup('${b.fullBackupPath.replace(/\\/g, '/')}')"><i class="fa-solid fa-rotate-left"></i> ${t.restoreBtn}</button>
      `;
      container.appendChild(row);
    });
  }

  document.getElementById('modal-backups').style.display = 'flex';
}

async function restoreBackup(backupPath) {
  if (!currentEditorMod) return;
  const res = await ipcRenderer.invoke('mod:restore-backup', { jarPath: currentEditorMod.path, backupPath });
  if (res.success) {
    showAppDialog('dlgBackupRestored');
    closeModal('modal-backups');
    closeModal('modal-editor');
    startAnalysis();
  } else {
    showAppDialog('dlgRestoreError', { detail: res.error });
  }
}

function applyLoadedAIConfig() {
  if (!currentAIConfig) return;
  const mode = currentAIConfig.mode || 'cloud';
  switchAIMode(mode);

  document.getElementById('ai-cloud-name').value = currentAIConfig.cloud_name || 'OpenAI';
  document.getElementById('ai-cloud-base-url').value = currentAIConfig.cloud_base_url || 'https://api.openai.com/v1';
  document.getElementById('ai-cloud-models-url').value = currentAIConfig.cloud_models_url || 'https://api.openai.com/v1/models';
  document.getElementById('ai-cloud-key').value = currentAIConfig.cloud_api_key || '';

  document.getElementById('ai-ollama-name').value = currentAIConfig.ollama_name || 'Ollama';
  document.getElementById('ai-ollama-base-url').value = currentAIConfig.ollama_base_url || 'http://127.0.0.1:11434/v1';
  document.getElementById('ai-ollama-models-url').value = currentAIConfig.ollama_models_url || 'http://127.0.0.1:11434/v1/models';
}

function switchAIMode(mode) {
  if (mode === 'cloud') {
    document.getElementById('ai-panel-cloud').style.display = 'block';
    document.getElementById('ai-panel-ollama').style.display = 'none';
    document.getElementById('btn-ai-mode-cloud').classList.add('active');
    document.getElementById('btn-ai-mode-ollama').classList.remove('active');
  } else {
    document.getElementById('ai-panel-cloud').style.display = 'none';
    document.getElementById('ai-panel-ollama').style.display = 'block';
    document.getElementById('btn-ai-mode-ollama').classList.add('active');
    document.getElementById('btn-ai-mode-cloud').classList.remove('active');
  }
}

async function fetchCloudModels() {
  const url = document.getElementById('ai-cloud-models-url').value;
  const apiKey = document.getElementById('ai-cloud-key').value;
  const select = document.getElementById('ai-cloud-model-select');
  select.innerHTML = '';

  try {
    const headers = {};
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    const resp = await fetch(url, { headers });
    const data = await resp.json();
    const models = data.data || data.models || [];
    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id || m.name;
      opt.innerText = m.id || m.name;
      select.appendChild(opt);
    });
    showAppDialog('dlgModelsLoaded', { count: models.length });
  } catch (e) {
    showAppDialog('dlgModelsError', { detail: e.message });
  }
}

async function fetchOllamaModels() {
  const url = document.getElementById('ai-ollama-models-url').value;
  const select = document.getElementById('ai-ollama-model-select');
  select.innerHTML = '';

  try {
    const resp = await fetch(url);
    const data = await resp.json();
    const models = data.data || data.models || [];
    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id || m.name;
      opt.innerText = m.id || m.name;
      select.appendChild(opt);
    });
    showAppDialog('dlgModelsLoaded', { count: models.length });
  } catch (e) {
    showAppDialog('dlgModelsError', { detail: e.message });
  }
}

async function saveAISettings() {
  const isCloud = document.getElementById('btn-ai-mode-cloud').classList.contains('active');
  const cfg = {
    mode: isCloud ? 'cloud' : 'ollama',
    cloud_name: document.getElementById('ai-cloud-name').value,
    cloud_base_url: document.getElementById('ai-cloud-base-url').value,
    cloud_models_url: document.getElementById('ai-cloud-models-url').value,
    cloud_api_key: document.getElementById('ai-cloud-key').value,
    cloud_active_model: document.getElementById('ai-cloud-model-select').value || 'gpt-4o-mini',
    ollama_name: document.getElementById('ai-ollama-name').value,
    ollama_base_url: document.getElementById('ai-ollama-base-url').value,
    ollama_models_url: document.getElementById('ai-ollama-models-url').value,
    ollama_active_model: document.getElementById('ai-ollama-model-select').value || 'llama3'
  };

  const success = await ipcRenderer.invoke('config:save', cfg);
  if (success) {
    currentAIConfig = cfg;
    showAppDialog('dlgSettingsSaved');
    closeModal('modal-ai');
  } else {
    showAppDialog('dlgSettingsError');
  }
}

function getPlaceholderSignature(value) {
  return (String(value || '').match(/%(?:\d+\$)?[sdif]|\$\{[^}]*\}/g) || []).sort().join('|');
}

function needsAITranslation(source, target) {
  if (typeof source !== 'string') return false;
  if (typeof target !== 'string' || !target.trim() || target === source) return true;
  return getPlaceholderSignature(source) !== getPlaceholderSignature(target);
}

async function callTranslationAPI(mod, sourceData, targetData) {
  if (!currentAIConfig) currentAIConfig = await ipcRenderer.invoke('config:load');
  const isCloud = currentAIConfig.mode === 'cloud';
  const baseUrl = (isCloud ? currentAIConfig.cloud_base_url : currentAIConfig.ollama_base_url || '').replace(/\/+$/, '');
  const model = isCloud ? currentAIConfig.cloud_active_model : currentAIConfig.ollama_active_model;
  const apiKey = isCloud ? currentAIConfig.cloud_api_key : '';
  if (!baseUrl || !model) throw new Error('Не настроен URL или модель ИИ. Проверьте настройки ИИ.');
  const endpoint = `${baseUrl}/chat/completions`;
  const entries = Object.entries(sourceData || {}).filter(([key, value]) => needsAITranslation(value, targetData && targetData[key]));
  if (!entries.length) return { ...targetData };
  const rules = Object.entries(terminologyRules || {}).map(([a,b]) => `${a} -> ${b}`).join('\n');
  const systemPrompt = `You are a Minecraft mod localization translator. Translate English strings into ${({ru:'Russian',en:'English',de:'German',zh:'Simplified Chinese'}[currentLang] || currentLang)}. Return ONLY a valid JSON object mapping the exact original keys to translated string values. Preserve formatting codes, placeholders (%s, %d, ${'${...}'}), newlines, and Minecraft terminology. Do not translate keys. ${rules ? 'Terminology rules:\n' + rules : ''}`;
  const userPayload = { mod: mod ? mod.name : 'unknown', targetLanguage: currentLang, strings: Object.fromEntries(entries) };
  const requestBody = { model, temperature: 0.2, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: JSON.stringify(userPayload) }] };
  logUserAction('AI_API', 'Отправка запроса на перевод в API модели', { provider: isCloud ? currentAIConfig.cloud_name : currentAIConfig.ollama_name, endpoint, model, request: requestBody, stringsCount: entries.length });
  try {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) }, body: JSON.stringify(requestBody) });
    const rawResponse = await response.text();
    logUserAction(response.ok ? 'AI_API' : 'AI_API_ERROR', 'Получен ответ API модели', { status: response.status, statusText: response.statusText, response: rawResponse });
    if (!response.ok) throw new Error(`API ${response.status}: ${rawResponse.slice(0, 1000)}`);
    const data = JSON.parse(rawResponse);
    const content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
    if (!content) throw new Error('API вернул пустой ответ модели');
    let translated;
    try { translated = JSON.parse(content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')); }
    catch (_) { throw new Error('Модель вернула ответ не в формате JSON: ' + content.slice(0, 500)); }
    return { ...(targetData || {}), ...translated };
  } catch (error) {
    logError('AI_API_ERROR', 'Ошибка запроса к API модели', { endpoint, model, error: error.message });
    throw error;
  }
}

async function translateInChunks(mod, sourceData, targetData, progress, taskLabel) {
  const entries = Object.entries(sourceData || {}).filter(([key, value]) => needsAITranslation(value, targetData && targetData[key]));
  const chunks = [];
  for (let i = 0; i < entries.length; i += 50) chunks.push(Object.fromEntries(entries.slice(i, i + 50)));
  let result = { ...(targetData || {}) };
  for (let i = 0; i < chunks.length; i++) {
    progress.currentLabel = `${taskLabel} (${i + 1}/${chunks.length})`;
    setAIProgress(progress);
    result = await callTranslationAPI(mod, chunks[i], result);
    progress.doneRows += Object.keys(chunks[i]).length;
    progress.doneParts++;
    setAIProgress(progress);
  }
  return result;
}

async function finishAIProgress(message) {
  activeAIProgress = null;
  document.getElementById('ai-progress-panel').style.display = 'none';
  document.getElementById('modal-ai-progress').style.display = 'none';
  notifications.unshift({ time: new Date().toLocaleTimeString(), message });
  await ipcRenderer.invoke('notif:save', notifications);
  renderNotifications();
}

async function runAiTranslateCurrentMod() {
  logUserAction('AI', 'Запуск ИИ-перевода текущего мода', { mod: currentEditorMod ? currentEditorMod.name : null, modId: activeSelectedModId, targetLang: currentLang });
  if (!currentEditorMod || !currentEditorData) { showAppDialog('dlgOpenModFirst'); return; }
  const source = currentEditorData.enData || {};
  const rows = Object.entries(source).filter(([key, value]) => needsAITranslation(value, currentEditorData.targetData && currentEditorData.targetData[key])).length;
  if (!rows) { showAppDialog('dlgNoRows'); return; }
  const progress = { totalRows: rows, totalParts: Math.ceil(rows / 50), totalMods: 1, doneRows: 0, doneParts: 0, doneMods: 0, currentLabel: currentEditorMod.name };
  startAIProgress(progress);
  try {
    const translated = await translateInChunks(currentEditorMod, source, currentEditorData.targetData, progress, currentEditorMod.name);
    currentEditorData.targetData = translated;
    document.getElementById('json-ru-area').value = JSON.stringify(translated, null, 2);
    renderDataGrid(); progress.doneMods = 1; setAIProgress(progress);
    logUserAction('AI', 'Перевод текущего мода завершён', { mod: currentEditorMod.name, translatedKeys: Object.keys(translated).length });
    await finishAIProgress(`${(translations[currentLang] || translations.ru).aiDone}: ${currentEditorMod.name}`);
  } catch (error) {
    await finishAIProgress(`${(translations[currentLang] || translations.ru).aiFailed}: ${currentEditorMod.name} — ${error.message}`);
    showAppDialog('dlgAiError', { detail: error.message });
  }
}

async function batchTranslateAll() {
  const mods = [...currentModsData.partial, ...currentModsData.not_translated];
  logUserAction('AI', 'Запуск пакетного ИИ-перевода', { totalMods: mods.length, targetLang: currentLang });
  if (!mods.length) { showAppDialog('dlgChooseAnalyze'); return; }
  const tasks = [];
  for (const mod of mods) for (const [modId, info] of Object.entries(mod.modMap || {})) {
    const en = info.en || {};
    const target = { ...en, ...(info.target || {}) };
    const rows = Object.entries(en).filter(([key, value]) => needsAITranslation(value, target[key])).length;
    if (rows) tasks.push({ mod, modId, info, en, target, rows });
  }
  const totalRows = tasks.reduce((sum, task) => sum + task.rows, 0);
  const totalParts = tasks.reduce((sum, task) => sum + Math.ceil(task.rows / 50), 0);
  if (!totalRows) { showAppDialog('dlgNoRows'); return; }
  const progress = { totalRows, totalParts, totalMods: mods.length, doneRows: 0, doneParts: 0, doneMods: 0, currentLabel: '' };
  startAIProgress(progress);
  let completed = 0, failed = 0;
  const failedMods = new Set();
  for (const task of tasks) {
    try {
      task.info.target = await translateInChunks(task.mod, task.en, task.target, progress, `${task.mod.name} / ${task.modId}`);
    } catch (error) {
      failedMods.add(task.mod);
      logError('AI', 'Ошибка пакетного перевода части мода', { mod: task.mod.name, modId: task.modId, error: error.message });
    }
  }
  for (const mod of mods) {
    try {
      if (failedMods.has(mod)) throw new Error('Не удалось перевести одну или несколько частей мода');
      const zip = await (async () => {
        const fs = require('fs');
        const data = fs.readFileSync(mod.path);
        return await JSZip.loadAsync(data);
      })();
      const targetFileNames = { ru: 'ru_ru.json', en: 'en_us.json', de: 'de_de.json', zh: 'zh_cn.json' };
      for (const [modId, info] of Object.entries(mod.modMap || {})) {
        const targetPath = info.targetPath || `assets/${modId}/lang/${targetFileNames[currentLang] || 'ru_ru.json'}`;
        zip.file(targetPath, JSON.stringify(info.target || {}, null, 2));
      }
      const output = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
      const fs = require('fs');
      const path = require('path');
      const backupDir = path.join(path.dirname(mod.path), '.backups');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      fs.copyFileSync(mod.path, path.join(backupDir, `${path.basename(mod.path)}.${Date.now()}.bak`));
      fs.writeFileSync(mod.path, output);
      completed++;
      logUserAction('AI', 'Пакетный перевод мода сохранён', { mod: mod.name });
    } catch (error) {
      failed++;
      logError('AI', 'Ошибка пакетного перевода мода', { mod: mod.name, error: error.message });
    }
    progress.doneMods++;
    progress.currentLabel = mod.name;
    setAIProgress(progress);
  }
  logUserAction('AI', 'Пакетный ИИ-перевод завершён', { total: mods.length, completed, failed });
  await finishAIProgress(`${(translations[currentLang] || translations.ru).aiDone}. ${completed}/${mods.length}`);
  await startAnalysis();
}

let notifications = [];
let activeAIProgress = null;
function minimizeAIProgress() { document.getElementById('modal-ai-progress').style.display = 'none'; }
function setAIProgress(state) {
  activeAIProgress = state;
  const t = translations[currentLang] || translations.ru;
  const pct = state.totalParts ? Math.min(100, Math.floor(state.doneParts / state.totalParts * 100)) : 0;
  document.getElementById('ai-progress-modal-heading').innerText = t.aiProgressTitle;
  document.getElementById('ai-progress-summary').innerText = t.progressSummary.replace('{rows}', state.totalRows).replace('{parts}', state.totalParts).replace('{mods}', state.totalMods);
  document.getElementById('ai-progress-current').innerText = state.currentLabel ? `${t.progressTask}: ${state.currentLabel}` : t.aiRunning;
  document.getElementById('ai-progress-counts').innerText = `${t.progressRows}: ${state.doneRows} / ${state.totalRows} · ${t.progressParts}: ${state.doneParts} / ${state.totalParts} · ${t.progressMods}: ${state.doneMods} / ${state.totalMods}`;
  document.getElementById('ai-progress-modal-fill').style.width = `${pct}%`;
  document.getElementById('ai-progress-percent').innerText = `${pct}%`;
  document.getElementById('ai-progress-fill').style.width = `${pct}%`;
  document.getElementById('ai-progress-detail').innerText = document.getElementById('ai-progress-counts').innerText;
  document.getElementById('ai-progress-panel').style.display = 'block';
  renderNotifications();
}
function startAIProgress(state) { document.getElementById('modal-ai-progress').style.display = 'flex'; setAIProgress(state); }
async function loadNotifications() {
  try {
    notifications = await ipcRenderer.invoke('notif:load') || [];
    renderNotifications();
  } catch (error) { logError('NOTIFICATIONS', 'Ошибка загрузки уведомлений', { error: error.message }); }
}
function renderNotifications() {
  const list = document.getElementById('notif-list');
  const badge = document.getElementById('notif-badge');
  if (!list || !badge) return;
  list.innerHTML = '';
  if (activeAIProgress) {
    const t = translations[currentLang] || translations.ru;
    const row = document.createElement('div'); row.className = 'term-row';
    const message = document.createElement('span');
    const pct = activeAIProgress.totalParts ? Math.floor(activeAIProgress.doneParts / activeAIProgress.totalParts * 100) : 0;
    message.textContent = `${t.aiRunning}: ${activeAIProgress.currentLabel || ''} · ${pct}% (${activeAIProgress.doneMods}/${activeAIProgress.totalMods} ${t.progressMods.toLowerCase()})`;
    row.appendChild(message); list.appendChild(row);
  }
  notifications.forEach(item => {
    const row = document.createElement('div'); row.className = 'term-row';
    const message = document.createElement('span'); message.textContent = `[${item.time || ''}] ${item.message || ''}`;
    row.appendChild(message); list.appendChild(row);
  });
  badge.textContent = String(notifications.length + (activeAIProgress ? 1 : 0));
  badge.style.display = notifications.length || activeAIProgress ? 'inline-block' : 'none';
}
async function openNotificationsModal() {
  logUserAction('NOTIFICATIONS', 'Открытие центра уведомлений');
  await loadNotifications();
  document.getElementById('modal-notif').style.display = 'flex';
}
async function clearNotifications() {
  logUserAction('NOTIFICATIONS', 'Очистка центра уведомлений', { count: notifications.length });
  notifications = [];
  try {
    const ok = await ipcRenderer.invoke('notif:save', notifications);
    if (!ok) throw new Error('Не удалось сохранить уведомления');
    renderNotifications();
  } catch (error) { logError('NOTIFICATIONS', 'Ошибка очистки уведомлений', { error: error.message }); showAppDialog('dlgNotificationsError', { detail: error.message }); }
}

async function exportHtmlReport() {
  const t = translations[currentLang] || translations.ru;
  const reportMods = [...currentModsData.partial, ...currentModsData.not_translated, ...(currentModsData.ignored || [])];
  const eligibleModsCount = currentModsData.partial.length + currentModsData.not_translated.length;
  const fs = require('fs');
  const path = require('path');
  const logoBase64 = fs.readFileSync(path.join(__dirname, 'assets', 'LogoHTML.jpg')).toString('base64');
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const percentMatch = document.getElementById('total-percent').innerText.match(/[\d.]+%/);
  const overallProgress = percentMatch ? parseFloat(percentMatch[0]) : 0;

  const htmlContent = `<!DOCTYPE html>
<html lang="${currentLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(t.htmlReportTitle)}</title>
<style>
  :root { color-scheme: dark; --canvas:#05060f; --text:#d1e4fa; --muted:#9da7ba; --edge:rgba(186,215,247,.12); --glass:rgba(186,214,247,.035); }
  * { box-sizing:border-box; }
  body { min-height:100vh; margin:0; padding:48px 24px 72px; overflow-x:hidden; color:var(--text); font:400 15px/1.55 Inter,ui-sans-serif,system-ui,"Segoe UI",sans-serif; background-color:var(--canvas); background-image:linear-gradient(to right,rgba(186,215,247,.035) 1px,transparent 1px),linear-gradient(to bottom,rgba(186,215,247,.035) 1px,transparent 1px),radial-gradient(ellipse at 50% 0%,rgba(124,145,182,.22),transparent 52%); background-size:72px 72px,72px 72px,auto; }
  .report { width:min(1120px,100%); margin:0 auto; }
  .hero { position:relative; isolation:isolate; overflow:hidden; text-align:center; padding:44px 24px 38px; margin-bottom:28px; border-radius:16px; background:linear-gradient(145deg,rgba(186,214,247,.065),rgba(5,6,15,.45)); box-shadow:inset 0 1px 1px rgba(216,236,248,.16),inset 0 24px 48px rgba(168,216,245,.035),0 24px 32px rgba(6,6,14,.45); }
  .hero:before { content:""; position:absolute; z-index:-1; width:560px; height:300px; left:50%; top:-220px; transform:translateX(-50%); background:radial-gradient(ellipse,rgba(124,145,182,.33),transparent 68%); }
  .logo { display:block; width:min(360px,72vw); max-height:105px; object-fit:contain; margin:0 auto 28px; filter:drop-shadow(0 0 18px rgba(186,207,247,.18)); }
  .eyebrow { display:flex; align-items:center; justify-content:center; gap:14px; margin:0 auto 12px; color:#c7d3ea; font:400 12px/1.3 'JetBrains Mono',ui-monospace,monospace; letter-spacing:.14em; text-transform:uppercase; }
  .eyebrow:before,.eyebrow:after { content:""; width:min(120px,16vw); height:1px; background:linear-gradient(90deg,transparent,rgba(186,215,247,.2)); }
  .eyebrow:after { transform:scaleX(-1); }
  h1 { margin:0; color:#d8ecf8; font-size:clamp(28px,5vw,46px); line-height:1.15; font-weight:500; letter-spacing:-.025em; }
  .subtitle { margin:12px auto 0; max-width:620px; color:#9da7ba; }
  .glass-card { padding:24px; border-radius:16px; margin:20px 0; background:var(--glass); box-shadow:inset 0 1px 1px rgba(199,211,234,.12),inset 0 24px 48px rgba(199,211,234,.025),0 24px 32px rgba(6,6,14,.55); }
  .summary-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin:0 0 20px; }
  .metric { padding:16px 18px; border-radius:12px; background:rgba(186,214,247,.035); box-shadow:inset 0 0 0 1px var(--edge); }
  .metric-label { display:block; color:var(--muted); font-size:13px; }
  .metric-value { display:block; margin-top:4px; color:#d8ecf8; font-size:24px; font-weight:600; }
  .section-title { margin:0 0 16px; color:#d8ecf8; font-size:20px; font-weight:500; }
  .progress-track { height:10px; overflow:hidden; border-radius:999px; background:rgba(199,211,234,.1); box-shadow:inset 0 1px 3px rgba(0,0,0,.35); }
  .progress-fill { height:100%; border-radius:inherit; background:linear-gradient(90deg,#98c0ef,#d8ecf8); box-shadow:0 0 12px rgba(186,207,247,.26); }
  .progress-caption { display:flex; justify-content:space-between; gap:12px; margin:9px 0 0; color:#c7d3ea; font-size:13px; }
  .table-wrap { overflow-x:auto; border-radius:10px; box-shadow:inset 0 0 0 1px var(--edge); }
  table { width:100%; min-width:680px; border-collapse:collapse; }
  th,td { padding:13px 16px; text-align:left; vertical-align:middle; border-bottom:1px solid rgba(186,215,247,.08); }
  th { color:#c7d3ea; background:rgba(186,214,247,.055); font-size:12px; font-weight:500; letter-spacing:.04em; text-transform:uppercase; }
  tbody tr:last-child td { border-bottom:0; } tbody tr:hover { background:rgba(186,214,247,.035); }
  .mod-name { color:#d8ecf8; font-weight:600; overflow-wrap:anywhere; }
  .status { display:inline-block; padding:4px 9px; border-radius:6px; background:rgba(199,211,234,.1); color:#d1e4fa; font-size:12px; }
  .row-progress { white-space:nowrap; } .row-progress small { display:block; color:var(--muted); }
  .empty { padding:24px; color:var(--muted); text-align:center; }
  .footer { padding:18px 0; color:#9da7ba; text-align:center; font-size:12px; }
  @media (max-width:640px) { body { padding:20px 12px 40px; } .hero { padding:32px 16px; } .glass-card { padding:16px; } .summary-grid { grid-template-columns:1fr; } }
  @media print { body { padding:0; background:#05060f; print-color-adjust:exact; -webkit-print-color-adjust:exact; } .glass-card,.hero { break-inside:avoid; } }
</style>
</head>
<body>
  <main class="report">
    <header class="hero">
      <img class="logo" src="data:image/jpeg;base64,${logoBase64}" alt="Localis">
      <p class="eyebrow">${escapeHtml(t.eyebrow)}</p>
      <h1>${escapeHtml(t.htmlReportTitle)}</h1>
      <p class="subtitle">${escapeHtml(t.hero)}</p>
    </header>
    <section class="glass-card">
      <h2 class="section-title">${escapeHtml(t.htmlOverallProgress)}</h2>
      <div class="progress-track"><div class="progress-fill" style="width:${overallProgress}%;"></div></div>
      <div class="progress-caption"><span>${escapeHtml(t.htmlOverallProgress)}</span><strong>${overallProgress}%</strong></div>
      <div class="summary-grid" style="margin-top:22px;">
        <div class="metric"><span class="metric-label">${escapeHtml(t.htmlTotalMods)}</span><strong class="metric-value">${eligibleModsCount}</strong></div>
        <div class="metric"><span class="metric-label">${escapeHtml(t.htmlPartialMods)}</span><strong class="metric-value">${currentModsData.partial.length}</strong></div>
        <div class="metric"><span class="metric-label">${escapeHtml(t.htmlUntranslatedMods)}</span><strong class="metric-value">${currentModsData.not_translated.length}</strong></div>
        <div class="metric"><span class="metric-label">${escapeHtml(t.htmlSkippedMods)}</span><strong class="metric-value">${(currentModsData.ignored || []).length}</strong></div>
      </div>
    </section>
    <section class="glass-card">
      <h2 class="section-title">${escapeHtml(t.htmlModName)}</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>${escapeHtml(t.htmlModName)}</th><th>${escapeHtml(t.htmlStatus)}</th><th>${escapeHtml(t.htmlProgress)}</th><th>${escapeHtml(t.htmlErrors)}</th></tr></thead>
        <tbody>${reportMods.length ? reportMods.map(m => {
          const prog = m.totalKeys > 0 ? Math.min(100, ((m.translatedKeys / m.totalKeys) * 100)) : 0;
          const status = m.reason ? getLocalizedReason(m.reason) : (prog >= 100 ? t.htmlStatusOk : t.htmlStatusPartial);
          return `<tr><td class="mod-name">${escapeHtml(m.name)}</td><td><span class="status">${escapeHtml(status)}</span></td><td class="row-progress">${prog.toFixed(1)}%<small>${m.translatedKeys}/${m.totalKeys}</small></td><td>${Number(m.placeholderErrors) || 0}</td></tr>`;
        }).join('') : `<tr><td colspan="4" class="empty">${escapeHtml(t.wait)}</td></tr>`}</tbody>
      </table></div>
    </section>
    <footer class="footer">Localis · ${new Date().toLocaleDateString(currentLang)}</footer>
  </main>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Localis_Report_${currentLang}.html`;
  a.click();
}

function openTerminologyModal() {
  renderTermList();
  document.getElementById('modal-term').style.display = 'flex';
}

function showAppDialog(messageKey, values = {}) {
  const t = translations[currentLang] || translations.ru;
  let message = t[messageKey] || messageKey;
  for (const [key, value] of Object.entries(values)) message = message.replaceAll(`{${key}}`, String(value));
  document.getElementById('app-dialog-title').innerText = t.dialogTitle;
  document.getElementById('app-dialog-message').innerText = message;
  document.getElementById('app-dialog-ok').innerText = t.dialogOk;
  document.getElementById('modal-app-dialog').style.display = 'flex';
}

function closeAppDialog() { document.getElementById('modal-app-dialog').style.display = 'none'; }

function openAISettingsModal() {
  applyLoadedAIConfig();
  document.getElementById('modal-ai').style.display = 'flex';
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

function renderTermList() {
  const container = document.getElementById('term-list');
  container.innerHTML = '';
  for (const [k, v] of Object.entries(terminologyRules)) {
    const row = document.createElement('div');
    row.className = 'term-row';
    row.innerHTML = `<span><b>${k}</b> -> ${v}</span> <button class="term-del" onclick="removeTermRule('${k}')"><i class="fa-solid fa-trash"></i></button>`;
    container.appendChild(row);
  }
}

function addTermRule() {
  const k = document.getElementById('term-key').value.trim();
  const v = document.getElementById('term-val').value.trim();
  if (k && v) {
    terminologyRules[k] = v;
    document.getElementById('term-key').value = '';
    document.getElementById('term-val').value = '';
    renderTermList();
  }
}

function removeTermRule(k) {
  delete terminologyRules[k];
  renderTermList();
}

// Автоматическое журналирование действий интерфейса и необработанных ошибок.
window.addEventListener('click', (event) => {
  const target = event.target && event.target.closest ? event.target.closest('button, a, [role=button]') : null;
  if (!target) return;
  const label = (target.innerText || target.getAttribute('aria-label') || target.id || target.className || 'control').trim().slice(0, 160);
  logUserAction('UI_EVENT', 'Нажат элемент интерфейса', { element: target.tagName, id: target.id || null, label });
}, true);
window.addEventListener('error', (event) => {
  logError('RENDERER', 'Необработанная ошибка интерфейса', { message: event.message, source: event.filename, line: event.lineno, column: event.colno });
});
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  logError('RENDERER', 'Необработанное отклонение Promise', { error: reason && reason.message ? reason.message : String(reason) });
});

// Функция отправки логов из интерфейса в main-процесс
function logUserAction(type, message, details = null) {
  ipcRenderer.invoke('log:action', { level: 'info', type, message, details });
}

function logError(type, message, details = null) {
  ipcRenderer.invoke('log:action', { level: 'error', type, message, details });
}

async function saveTerminology() {
  await ipcRenderer.invoke('term:save', terminologyRules);
  showAppDialog('dlgTermsSaved');
  closeModal('modal-term');
}
