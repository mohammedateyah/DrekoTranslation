import * as firebaseCloud from "./firebase-client.js";

const translations = {
  ar: {
    guest: "زائر",
    discordGateTitle: "عالم الألعاب… بلغتك العربية",
    discordGateDescription: "اجعل عالم الألعاب أقرب إليك، واستمتع بتجربة لعب بلغتك العربية.",
    discordGatePreparing: "جارٍ الاتصال بخدمة التحقق...",
    discordGateSetupNeeded: "خادم التحقق متصل لكن الإعداد ناقص: أضف Discord Client ID وBot Token ورابط دعوة السيرفر، وأتح بيانات اعتماد Firebase Admin للخادم في auth-server/.env.",
    discordSetupClientIdMismatch: "Discord Client ID لا يطابق التطبيق المرتبط بالبوت. استخدم Client ID من تطبيق البوت نفسه.",
    discordSetupBotGuildAccess: "البوت صالح لكنه لا يستطيع رؤية السيرفر المحدد. أضف البوت إلى السيرفر وتأكد أن معرّف السيرفر صحيح.",
    discordSetupBotToken: "Discord Bot Token غير صالح. راجع الرمز في إعدادات البوت على Discord.",
    discordSetupFirebaseAdmin: "أضف ملف Firebase service-account إلى الخادم، واضبط GOOGLE_APPLICATION_CREDENTIALS على مساره ثم أعد تشغيل خدمة التحقق.",
    discordSetupNeedClientId: "أضف Discord Client ID إلى auth-server/.env.",
    discordSetupNeedClientSecret: "أضف Discord Client Secret إلى auth-server/.env.",
    discordSetupNeedBotToken: "أضف Discord Bot Token إلى auth-server/.env.",
    discordSetupNeedGuildId: "أدخل معرّف السيرفر الصحيح في DISCORD_GUILD_ID.",
    discordSetupNeedInvite: "أضف رابط دعوة صالحًا للسيرفر في DISCORD_INVITE_URL أو فعّل الضم التلقائي.",
    discordSetupNeedRedirect: "تحقق من PUBLIC_ORIGIN وDISCORD_REDIRECT_URI في إعداد الخادم.",
    discordGatePrompt: "سجّل الدخول عبر Discord للتحقق من عضويتك في مجتمعنا والوصول إلى مكتبة التعريبات.",
    discordGateConnecting: "جارٍ فتح نافذة تسجيل الدخول الآمنة...",
    discordGateChecking: "نتحقق من عضويتك في سيرفر Dreko...",
    discordGateNotMember: "لم نجدك في سيرفر Dreko بعد. انضم إليه ثم أعد المحاولة.",
    discordGateCancelled: "أُلغيت عملية تسجيل الدخول. يمكنك المحاولة مجدداً.",
    discordGateExpired: "انتهت مهلة تسجيل الدخول. ابدأ من جديد.",
    discordGateUnavailable: "خدمة التحقق غير متاحة الآن. تحقق من الاتصال وحاول لاحقاً.",
    discordAccountStorageUnavailable: "تعذر حفظ حسابك في قاعدة البيانات. تحقق من قواعد Firestore ثم أعد المحاولة.",
    discordGateRejected: "تعذر التحقق من عضويتك. سجّل الدخول مجدداً.",
    discordGateJoinRequired: "انضم إلى السيرفر ثم اضغط متابعة للتحقق من عضويتك.",
    discordLogin: "المتابعة باستخدام Discord",
    discordJoinServer: "الانضمام إلى سيرفر Dreko",
    discordGateSecurity: "لا نطلب كلمة مرور Discord داخل التطبيق.",
    discordLogoutLabel: "تسجيل الخروج من Discord",
    language: "English",
    navLibrary: "المكتبة",
    navCommunity: "المجتمع",
    navOurSite: "موقعنا",
    navPremium: "دريكو بريميوم",
    navUpdates: "التحديثات",
    navSupport: "الدعم",
    navReport: "إبلاغ",
    reportGameButton: "إبلاغ عن مشكلة",
    reportTitle: "الإبلاغ عن مشكلة",
    reportIntro: "أخبرنا بالمشكلة التي واجهتك في هذا التعريب.",
    reportStep: "الخطوة {step} من 3",
    reportChooseGame: "اختر اللعبة",
    reportSearchGame: "ابحث في المكتبة...",
    reportNoGames: "لا توجد ألعاب مطابقة.",
    reportLatestUpdate: "هل لعبتك على آخر تحديث؟",
    reportLatestUpdateHint: "تساعدنا معرفة ذلك على تحديد سبب المشكلة.",
    reportUpdateYes: "نعم، آخر تحديث",
    reportUpdateNo: "لا",
    reportUpdateUnsure: "لا أدري",
    reportIssueQuestion: "ما المشكلة التي واجهتها؟",
    reportIssueTranslation: "خطأ في الترجمة",
    reportIssueMissing: "نصوص غير معرّبة",
    reportIssueDisplay: "مشكلة في عرض النص",
    reportIssueFont: "الخط أو حجمه",
    reportIssueLanguage: "ظهور لغة غير العربية",
    reportIssueCrash: "اللعبة لا تعمل أو تتعطل",
    reportIssueInstall: "مشكلة في تثبيت التعريب",
    reportIssueOther: "شيء آخر",
    reportDetailsLabel: "تفاصيل إضافية (اختياري)",
    reportDetailsPlaceholder: "صف المشكلة أو اذكر الخطوات التي أدت إليها...",
    reportCharacters: "{count}/500",
    reportBack: "رجوع",
    reportNext: "التالي",
    reportSubmit: "إرسال البلاغ",
    reportSubmitting: "جارٍ إرسال البلاغ...",
    reportSuccessTitle: "شكرًا لبلاغك، وصل للفريق.",
    reportSuccessDescription: "سنراجع المشكلة ونتابعها مع فريق التعريب.",
    reportClose: "إغلاق",
    reportSubmitError: "تعذر إرسال البلاغ الآن. تحقق من اتصالك وحاول مجددًا.",
    reportAlreadySubmitted: "سبق أن أرسلت بلاغًا عن هذه اللعبة. يمكنك إرسال بلاغ واحد فقط لكل لعبة.",
    reportsOpen: "بلاغات",
    reportsBackToLibrary: "العودة للتعريبات",
    reportsEyebrow: "مراجعة ملاحظات اللاعبين",
    reportsTitle: "بلاغات <span>التعريبات</span>",
    reportsDescription: "راجع المشكلات التي أبلغ عنها اللاعبون وتابع حالتها.",
    reportsCount: "بلاغ",
    reportsStatusLabel: "تصفية البلاغات",
    reportsPending: "قيد المراجعة",
    reportsResolved: "تمت المراجعة",
    reportsSearchPlaceholder: "ابحث باسم اللعبة أو الحساب أو البلاغ...",
    reportsRefresh: "تحديث البلاغات",
    reportsEmptyTitle: "لا توجد بلاغات مطابقة",
    reportsEmptyDescription: "ستظهر بلاغات اللاعبين الجديدة هنا.",
    reportStatusSaved: "تم تحديث حالة البلاغ.",
    reportDeleteAction: "حذف",
    reportDeleted: "تم حذف البلاغ.",
    reportDeleteConfirm: "هل تريد حذف بلاغ «{game}»؟ لا يمكن التراجع عن هذا الإجراء.",
    reportStatusPendingAction: "إعادة للمراجعة",
    reportStatusResolvedAction: "تمت المراجعة",
    reportSubmittedDate: "تاريخ البلاغ",
    reportSubmittedBy: "مقدم البلاغ",
    reportLatestLabel: "حالة تحديث اللعبة",
    reportIssueLabel: "نوع المشكلة",
    reportDetailsAdminLabel: "تفاصيل اللاعب",
    reportUpdateValueYes: "آخر تحديث",
    reportUpdateValueNo: "ليست على آخر تحديث",
    reportUpdateValueUnsure: "غير متأكد",
    updateChecking: "جارٍ التحقق من وجود تحديث...",
    updateCurrent: "أنت تستخدم أحدث إصدار ({version}).",
    updateAvailable: "يتوفر الإصدار {version}. جارٍ تنزيله...",
    updateDownloading: "جارٍ تنزيل التحديث... {percent}٪",
    updateDownloaded: "اكتمل تنزيل الإصدار {version}. ثبّته وأعد تشغيل التطبيق لإكمال التحديث.",
    updateInstalling: "جارٍ إغلاق التطبيق وبدء التثبيت...",
    updateInstall: "تثبيت وإعادة التشغيل",
    updateLater: "لاحقاً",
    mandatoryUpdateTitle: "تحديث مطلوب",
    mandatoryUpdateDescription: "يتوفر إصدار جديد مطلوب لمواصلة استخدام التطبيق.",
    mandatoryUpdateChecking: "جارٍ التحقق من التحديث...",
    mandatoryUpdateDownloading: "جارٍ تنزيل الإصدار {version}... {percent}٪",
    mandatoryUpdateReady: "اكتمل تنزيل الإصدار {version}. أعد تشغيل التطبيق لتثبيته.",
    mandatoryUpdateFailed: "تعذر تنزيل التحديث. تحقق من الاتصال ثم أعد المحاولة.",
    mandatoryUpdateRetry: "إعادة المحاولة",
    mandatoryUpdateRestart: "أعد التشغيل وثبّت الآن",
    mandatoryUpdateInstalling: "جارٍ إغلاق التطبيق وبدء التثبيت...",
    mandatoryUpdateInstallFailed: "تعذر بدء التثبيت. أعد المحاولة لتشغيل المثبّت.",
    whatsNewTitle: "ما الجديد",
    whatsNewVersion: "الإصدار {version}",
    whatsNewAutoUpdate: "يبدأ التحقق من التحديثات وتنزيلها تلقائيًا بعد تسجيل الدخول.",
    whatsNewRequiredUpdate: "يمكنك الأن طلب تعريب - قسم طلبات التعريب يستخدم لطلب لعبة غير متوفّر لها تعريب منشور. يعتمد تنفيذ الطلب على المراجعة وعدم توفر التعريب.",
    whatsNewDone: "تمام، فهمت",
    updateUnavailable: "تعذر التحقق من التحديث الآن. تحقق من اتصالك وحاول مجدداً.",
    updateFeedNotConfigured: "خدمة تحديثات التطبيق غير مهيأة حالياً.",
    updateRequiresInstalledApp: "فحص التحديثات متاح في النسخة المثبتة من التطبيق فقط.",
    updateInstallFailed: "تعذر بدء التثبيت. أعد تشغيل التطبيق وحاول مجدداً.",
    profileEntryLabel: "الملف الشخصي",
    profileEyebrow: "حسابك في Dreko",
    profileTitle: "الملف الشخصي",
    profileDescription: "معلومات حساب Discord المرتبط بتطبيق Dreko Translation.",
    profileNameLabel: "اسم الحساب",
    profileCreatedLabel: "تاريخ إنشاء حساب Discord",
    profileGuildJoinedLabel: "عضو في مجتمع Dreko",
    profileDetailsLabel: "بيانات وإحصاءات الملف الشخصي",
    profileStatsLabel: "إحصاءات الملف الشخصي",
    profileDateUnavailable: "غير متاح",
    profileTypeLabel: "نوع الحساب",
    accountTypeStandard: "عادي",
    accountTypePremium: "بريميوم",
    premiumExpiresLabel: "ينتهي في",
    usedTranslationsCount: "التعريبات المستخدمة",
    adminDashboardTitle: "لوحة الإدارة",
    accountsOpen: "الحسابات",
    accountsBackToLibrary: "العودة للتعريبات",
    requestsOpen: "طلبات التعريب",
    requestsBackToLibrary: "العودة للتعريبات",
    accountsEyebrow: "إدارة المستخدمين",
    accountsTitle: "حسابات <span>المستخدمين</span>",
    accountsDescription: "استعرض الحسابات وغيّر نوع الاشتراك ومدته.",
    accountsCount: "حساب",
    accountsSearchPlaceholder: "ابحث بالاسم أو معرّف Discord...",
    accountsRefresh: "تحديث الحسابات",
    accountsEmptyTitle: "لا توجد حسابات مطابقة",
    accountsEmptyDescription: "جرّب البحث باسم مختلف أو أعد تحميل الحسابات.",
    accountIdLabel: "معرّف Discord",
    accountPlanLabel: "نوع الحساب",
    accountPlanStandard: "عادي",
    accountPlanPremium: "بريميوم",
    accountExpiryPermanent: "دائم",
    accountExpiryNone: "بدون انتهاء",
    accountExpiryExpired: "انتهى بريميوم؛ الحساب عادي الآن",
    accountExpiryDate: "ينتهي",
    premiumDurationLabel: "مدة بريميوم",
    premiumDuration30: "شهر واحد",
    premiumDuration90: "3 أشهر",
    premiumDuration180: "6 أشهر",
    premiumDuration365: "سنة",
    premiumDurationPermanent: "دائم",
    accountActivatePremium: "تفعيل بريميوم",
    accountRenewPremium: "تجديد بريميوم",
    accountMakeStandard: "إرجاع للعادي",
    accountPlanSaved: "تم تحديث نوع الحساب.",
    requestsEyebrow: "إدارة طلبات التعريب",
    requestsTitle: "طلبات <span>التعريب</span>",
    requestsDescription: "راجع طلبات اللاعبين، وانقل المكتمل إلى الأرشيف.",
    requestsCount: "طلب",
    requestsPending: "قيد الانتظار",
    requestsArchive: "الأرشيف",
    requestsSearchPlaceholder: "ابحث باسم اللعبة أو الحساب...",
    requestsRefresh: "تحديث الطلبات",
    requestsEmptyTitle: "لا توجد طلبات مطابقة",
    requestsEmptyDescription: "ستظهر طلبات التعريب الجديدة هنا.",
    requestAccountLabel: "مقدم الطلب",
    requestDiscordIdLabel: "معرّف Discord",
    requestGameLabel: "اللعبة المطلوبة",
    requestSteamIdLabel: "معرّف Steam",
    requestDateLabel: "تاريخ الطلب",
    requestArchiveAction: "تمت إضافة التعريب",
    requestRestoreAction: "إرجاع للانتظار",
    requestDeleteAction: "حذف الطلب",
    requestDeleteConfirm: "هل تريد حذف طلب تعريب «{title}»؟ لا يمكن التراجع عن هذا الإجراء.",
    requestStatusSaved: "تم تحديث حالة طلب التعريب.",
    requestDeleted: "تم حذف الطلب.",
    requestStateConflict: "تغيرت حالة الطلب منذ آخر تحديث. حدّث القائمة ثم حاول مرة أخرى.",
    requestRestoreBlocked: "لدى هذا الحساب طلب آخر قيد الانتظار. أرشفه أو احذفه قبل إرجاع هذا الطلب.",
    themeLabel: "تغيير المظهر",
    featuredEyebrow: "أُضيف حديثاً",
    featuredTitle: "أحدث <span>التعريبات</span>",
    featureOneKicker: "كل قصة، بلغتك",
    featureOneTitle: "افتح باباً<br />إلى عالمٍ جديد.",
    featureOneCaption: "التعريب يجعل الحكاية أقرب",
    featureTwoKicker: "تحديثات من مجتمعنا",
    featureTwoTitle: "حكاياتٌ<br />تستحق أن تُروى.",
    featureTwoCaption: "اكتشف جديد المترجمين",
    featureThreeKicker: "من اللاعبين للجميع",
    featureThreeTitle: "عالمك<br />بكل تفاصيله.",
    featureThreeCaption: "كلمةٌ تصنع الفرق",
    libraryEyebrow: "استكشف المكتبة",
    libraryTitle: "مجموعة <span>الألعاب</span>",
    translationCount: "ترجمة",
    paginationLabel: "التنقل بين صفحات المكتبة",
    paginationPrevious: "الصفحة السابقة",
    paginationNext: "الصفحة التالية",
    paginationPage: "صفحة",
    filterLatest: "الأحدث",
    filterPopular: "الأكثر رواجاً",
    weekButton: "تعريبات Dreko",
    premiumTranslationBadge: "تعريب دريكو",
    premiumExclusiveLabel: "تعريب حصري من دريكو",
    premiumAccessRequired: "هذا التعريب حصري لمشتركين فقط",
    premiumOnlyEmpty: "لا توجد تعريبات بريميوم مطابقة لبحثك.",
    premiumTranslationLabel: "تعريب بريميوم",
    premiumTranslationDescription: "ميّز هذا التعريب ضمن قائمة تعريبات Dreko المخصصة لبريميوم.",
    categoryAll: "كل الأنواع",
    categoryFull: "تعريب كامل",
    categoryInterface: "واجهة وقوائم",
    searchPlaceholder: "ابحث عن لعبة...",
    searchLabel: "ابحث عن لعبة أو ترجمة",
    platformAll: "ألعابك",
    platformBackToTranslations: "التعريبات",
    installedGamesCount: "لعبة مثبّتة",
    aiLocalizationOpen: "ترجمة ملفات اللعبة",
    aiLocalizationEyebrow: "ترجمة ملفات الألعاب",
    aiLocalizationTitle: "ترجمة ملفات اللعبة",
    aiLocalizationIntro: "اختر ملف JSON أو CSV متوافقًا من ملفات اللعبة. لا نعدّل ملفات اللعبة الأصلية.",
    aiModelLabel: "نموذج الترجمة",
    aiSourceLanguageLabel: "لغة المصدر",
    aiTargetArabic: "العربية",
    aiCategoryLabel: "نطاق الترجمة",
    aiCategoryGeneral: "كل النصوص",
    aiGlossaryLabel: "مسرد اختياري خاص باللعبة",
    aiGlossaryPlaceholder: "مثال: Firekeeper = حارسة النار",
    aiChooseFile: "اختيار ملف JSON أو CSV",
    aiStart: "بدء الترجمة",
    aiInitialStatus: "اختر مجلد اللعبة ليُفحص بحثًا عن ملف نصوص متوافق.",
    aiCancel: "إلغاء",
    aiResume: "استئناف",
    aiExport: "تصدير الملف المترجم",
    aiRecentJobs: "الترجمات المحفوظة",
    aiLimitNote: "تُرسل النصوص ووصف اللعبة إلى خدمة ترجمة عبر الإنترنت. يدعم موارد JSON المسطحة وCSV سواء كانت مباشرة أو داخل ZIP؛ لا يقرأ أرشيفات Unreal PAK أو IoStore (UTOC/UCAS) أو RPF ولا يغيّر ملفات اللعبة الأصلية.",
    aiFileSelected: "تم فحص {file} — {count} نصًا جاهزًا للترجمة.",
    aiFolderScanning: "جارٍ فحص مجلد اللعبة بحثًا عن ملفات نصوص مدعومة...",
    aiFolderStarting: "عُثر على {file} — جارٍ بدء التعريب...",
    aiFolderSelected: "عُثر على {file} ويحتوي {count} نصًا (من بين {files} ملفات متوافقة).",
    aiNoFolderSource: "لم يُعثر على ملف توطين JSON أو CSV متوافق. لا يدعم هذا الإصدار ملفات اللعبة الثنائية.",
    aiFolderScanLimit: "المجلد كبير جدًا لفحص آمن. اختر مجلد اللعبة الصحيح أو مجلد موارد النصوص إن كان معروفًا.",
    aiFolderGameMismatch: "يبدو أن هذا مجلد لعبة مختلفة. اختر مجلد ملفات اللعبة المطابق للعبة المحددة.",
    aiProtectedGame: "هذه اللعبة غير مدعومة للتعريب الآلي حفاظًا على سلامة ملفاتها واللعب عبر الإنترنت.",
    aiArabicAlreadyAvailable: "عُثر على مؤشرات لوجود ملفات أو إعدادات عربية لهذه اللعبة. لن نبدأ ترجمة مكررة.",
    aiSottrArabicAlreadyAvailable: "عُثر على ملفات نصوص عربية أصلية للعبة Shadow of the Tomb Raider داخل أرشيفات TIGER. لذلك أوقفنا الترجمة المكررة. التطبيق يتعرف على هذه الأرشيفات لكنه لا يفكها أو يعدّلها حاليًا.",
    aiUnsupportedGameFiles: "لم نعتبر اللعبة غير قابلة للتعريب أو نحظرها. لم نجد ملف JSON أو CSV مدعومًا، وعثرنا على ملفات لعبة خاصة مثل PAK أو TIGER أو RPF. لم نغيّر أي ملف؛ يلزم محوّل آمن ومختبر للصيغة.",
    aiUnsupportedUnrealFiles: "عثرنا على ملفات Unreal Engine من نوع PAK أو IoStore (UTOC/UCAS)، ولا يوجد مورد نصوص JSON/CSV مكشوف ومدعوم. قد تكون بعض الحاويات مشفرة؛ لم نحاول فكها أو تجاوز أي حماية. يلزم مسار استخراج/تعديل رسمي أو محوّل موثوق ومختبر للعبة، لذلك لم تتغير ملفاتها.",
    aiJobRunning: "جارٍ ترجمة {completed} من {total} نصًا. يمكنك الإلغاء والاستئناف لاحقًا.",
    aiJobCompleted: "اكتملت ترجمة {completed} نصًا. صدّر الملف لمراجعته.",
    aiJobInterrupted: "توقفت العملية. استأنفها لمتابعة النصوص غير المكتملة.",
    aiJobCancelled: "أُلغيت العملية. يمكنك استئنافها لاحقًا.",
    aiJobFailed: "تعذرت ترجمة بعض النصوص ({code}). النصوص المكتملة محفوظة ويمكن استئناف العملية.",
    aiJobHistoryEmpty: "ستظهر الترجمات المحفوظة هنا.",
    aiResumeJob: "استئناف",
    aiExportJob: "تصدير",
    aiJobLabel: "{file} — {completed} — {status}",
    aiPreviewTitle: "معاينة النصوص",
    aiAuthRequired: "سجّل الدخول مجددًا، وتأكد من الانضمام إلى مجتمع Dreko لاستخدام الترجمة.",
    aiServiceNotConfigured: "خدمة الترجمة غير مهيأة حاليًا. يرجى إبلاغ فريق Dreko.",
    gameAiHeading: "ترجمة نصوص هذه اللعبة",
    gameAiIntro: "اختر مجلد اللعبة فقط. سيفحص التطبيق ملفات JSON وCSV النصية، حتى داخل ZIP، ويبدأ ترجمة المورد الأنسب إلى العربية.",
    gameAiOpen: "فتح ترجمة اللعبة",
    gameAiFileLabel: "ملف نصوص اللعبة",
    gameAiFilePlaceholder: "اختر ملف JSON أو CSV",
    aiQuotaExhausted: "وصلت خدمة الترجمة إلى حد الاستخدام الحالي. انتظر قليلًا ثم استأنف العملية.",
    aiRateLimited: "الخدمة مشغولة مؤقتًا. انتظر قليلًا ثم استأنف العملية.",
    aiModelUnavailable: "نموذج الترجمة غير متاح حاليًا.",
    aiNetworkError: "تعذر الاتصال بخدمة الترجمة. تحقق من الإنترنت ثم استأنف.",
    aiResponseInvalid: "تعذرت معالجة بعض النتائج. النصوص المكتملة محفوظة؛ أعد المحاولة.",
    aiTokensChanged: "اكتشفنا تغييرًا في عناصر التنسيق أو الرموز المحمية؛ لم نحفظ هذه الدفعة.",
    aiSourceFormatUnsupported: "الصيغة أو بنية الملف غير مدعومة. استخدم JSON مسطحًا أو CSV بأعمدة معرّف ونص.",
    aiFailedEntryIds: "العناصر التي تحتاج مراجعة: {ids}",
    aiSourceTooLarge: "الملف فارغ أو يتجاوز حد 5 ميغابايت.",
    aiEntryTooLarge: "يوجد نص طويل جدًا لطلب واحد. قسّم الملف يدويًا ثم أعد المحاولة.",
    aiStorageFailed: "تعذر حفظ تقدم الترجمة على هذا الجهاز. تحقّق من مساحة القرص والأذونات.",
    aiExportSuccess: "تم تصدير ملف الترجمة. راجعه وثبّته يدويًا فقط إذا كانت اللعبة تدعم هذه الصيغة.",
    aiSourceOverwrite: "تم منع التصدير فوق الملف الأصلي. اختر مسارًا آخر.",
    aiArchiveChanged: "تغير الأرشيف الأصلي بعد فحصه. أعد فحص المجلد وابدأ مهمة جديدة.",
    aiArchiveExportFailed: "تعذر إنشاء نسخة الأرشيف المترجمة بأمان. بقي الأرشيف الأصلي دون تغيير.",
    aiUnknownError: "تعذرت العملية. راجع الإعدادات والملف ثم حاول مجددًا.",
    closeDialog: "إغلاق",
    gameFolderNotFound: "مسار مجلد اللعبة غير صالح أو غير موجود.",
    gameFolderPickerFailed: "تعذر فتح نافذة اختيار المجلد.",
    gameInstallPath: "مسار تثبيت اللعبة",
    gameFolderPlaceholder: "C:\\Program Files (x86)\\Steam\\steamapps\\common\\",
    gameFolderHelp: "ملاحظة: أدخل المجلد الجذر الذي يحتوي ملف تشغيل اللعبة.",
    gameFolderAutoDetect: "اكتشف مجلد اللعبة تلقائيًا",
    gameFolderDetecting: "جارٍ البحث عن اللعبة في متاجر الألعاب والمجلدات المحلية...",
    gameFolderDetected: "تم العثور على {game} واختيار مجلدها تلقائيًا.",
    gameFolderNotDetected: "لم نجد مجلدًا مطابقًا. اختره يدويًا أو تأكد من ظهور اللعبة في سجل المشغّل.",
    gameFolderDetectionAmbiguous: "وجدنا أكثر من لعبة محتملة بهذا الاسم. اختر مجلد اللعبة يدويًا.",
    gameFolderSearchLimited: "البحث المحلي محدود لتجنب إبطاء الجهاز. اختر مجلد اللعبة يدويًا.",
    gameFolderContinue: "فحص المجلد وبدء التعريب",
    translatedByLabel: "تم التعريب من قبل:",
    translationOptionsHeading: "اختر التعريب الذي تريد تثبيته",
    installTranslationAction: "تثبيت التعريب",
    installReadyPackage: "تنزيل وتثبيت التعريب الجاهز",
    installReadyInstaller: "تنزيل وفتح المثبّت",
    registerExistingExternalTranslation: "هل ثبّت التعريب من قبل؟ سجّل حالته",
    confirmRegisterExistingExternalTranslation: "إذا كان تعريب هذا المثبّت مثبتًا بالفعل في مجلد اللعبة المحدد، سجّل حالته لمنع إعادة التثبيت. هل تريد المتابعة؟",
    externalTranslationStatusRecorded: "تم تسجيل التعريب كمثبّت.",
    readyPackageVersion: "إصدار الحزمة: {version}",
    backToGameFolder: "رجوع",
    packageDescriptionUnavailable: "تفاصيل التعريب غير متوفرة.",
    myGamesEyebrow: "مكتبة جهازك",
    myGamesTitle: "ألعابك المثبّتة",
    myGamesDescription: "الألعاب المثبّتة في مكتبات Steam على هذا الجهاز.",
    myGamesSearch: "ابحث في ألعابك...",
    gamesLoading: "جارٍ البحث عن ألعاب Steam المثبّتة...",
    gamesLoadError: "تعذر فحص مكتبات الألعاب. اضغط تحديث لإعادة المحاولة.",
    steamUnavailable: "لم نعثر على تثبيت Steam في هذا الجهاز.",
    noInstalledGames: "لم نعثر على ألعاب Steam مثبّتة. تأكد من اكتمال تثبيت اللعبة ثم أعد الفحص.",
    noMatchingGames: "لا توجد ألعاب تطابق بحثك.",
    steamSource: "مثبّتة على Steam",
    requestTranslation: "طلب تعريب",
    requestTranslationConfirmTitle: "تأكيد طلب التعريب",
    requestTranslationConfirmDescription: "هل تريد طلب تعريب هذه اللعبة؟",
    requestSubmit: "تأكيد الطلب",
    requestCancel: "رجوع إلى ألعابك",
    requestSubmitting: "جارٍ إرسال الطلب...",
    requestFailed: "تعذر إرسال الطلب. تحقق من اتصالك ثم حاول مرة أخرى.",
    requestTranslationSuccessTitle: "تم استلام طلبك!",
    requestTranslationSuccessDescription: "أُضيف طلبك إلى قائمة الانتظار، وسنراجع إمكانية تعريب اللعبة.",
    requestDone: "العودة إلى ألعابك",
    requestLoginRequired: "سجّل الدخول عبر Discord لإرسال طلب تعريب.",
    requestGameAvailable: "تعريب هذه اللعبة متوفر بالفعل أو أُضيف إلى الأرشيف.",
    requestAlreadyPending: "لديك طلب تعريب قيد الانتظار بالفعل. انتظر مراجعته قبل إرسال طلب آخر.",
    listViewLabel: "عرض القائمة",
    gridViewLabel: "عرض الشبكة",
    refreshLabel: "تحديث المكتبة",
    emptyTitle: "لا توجد نتائج",
    emptyDescription: "جرّب تغيير كلمات البحث أو نوع الترجمة.",
    communityEyebrow: "",
    communityTitle: "اللعب أجمل <span>بلغة العربية</span>",
    communityDescription: "مساحة تمكن الاعبين العرب من لعب ألعابهم بلغة العربية بكل سهولة",
    communityCta: "اكتشف المجتمع",
    footerNote: "جميع التعريبات المتوفرة في هذا التطبيق حقوقها محفوظة لأصحابها الأصليين. لا يدّعي «دريكو» ملكية أي تعريب، ولا يَنسب أي عمل لنفسه، جُمعت هذه التعريبات من مصادر عامة متاحة على الإنترنت وأُعيد تنظيمها هنا لتسهيل الوصول إليها فقط. تبقى كامل الحقوق لأصحابها، ونحترم جهودهم كل الاحترام. إذا كنت صاحب أي تعريب وترغب بإزالته أو تصحيح نسبته، تواصل معنا عبر سيرفر Discord ويُنفَّذ طلبك فورًا",
    footerStatus: "الحالة: متصل",
    footerCopyright: "© 2026 DREKO TRANSLATION — حقوق التعريبات لأصحابها.",
    genreAdventure: "مغامرة",
    genreAction: "أكشن",
    genreRpg: "أدوار",
    genreHorror: "رعب",
    genreSimulator: "محاكاة",
    genrePuzzle: "ألغاز",
    genreStrategy: "استراتيجية",
    genreOther: "أخرى",
    fullTranslation: "تعريب كامل",
    interfaceTranslation: "واجهة وقوائم",
    readyStatus: "جاهزة",
    inProgressStatus: "قيد العمل",
    currentTranslationStatus: "تحديث قريب",
    newTranslationStatus: "ترجمة جديدة",
    inProgressBadge: "جاري التعريب",
    detailAction: "اكتشف الترجمة",
    detailDescription: "تفاصيل هذا المشروع وحالته وتحديثاته.",
    gameTitleLabel: "اسم اللعبة",
    translationTeamLabel: "فريق التعريب",
    gameYearLabel: "الإصدار",
    yearSuffix: "",
    gameArtworkLabel: "رسوميات من فريق Dreko",
    authEyebrow: "منطقة الإدارة المحمية",
    authLoginTitle: "مرحباً بعودتك",
    authLoginDescription: "تُتاح لوحة الإدارة لحسابات Discord التي فعّلها مالك المشروع فقط.",
    passwordLabel: "كلمة المرور",
    passwordPlaceholderLogin: "أدخل كلمة المرور",
    confirmPasswordPlaceholder: "أعد إدخال كلمة المرور",
    signInAdmin: "تسجيل دخول المسؤول",
    signingIn: "جارٍ التحقق...",
    backToLibrary: "العودة إلى المكتبة",
    authSecurityNote: "تُدار الحسابات والترجمات عبر Firebase Authentication وCloud Firestore.",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "name@example.com",
    invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    authenticationUnavailable: "تعذر إكمال عملية التحقق. أعد المحاولة.",
    titleRequired: "أدخل اسم اللعبة بالعربية.",
    englishTitleRequired: "أدخل اسم اللعبة بالإنجليزية.",
    developerRequired: "أدخل اسم المطور أو فريق التعريب.",
    genreRequired: "اختر تصنيف اللعبة.",
    descriptionTooLong: "النبذة طويلة جداً.",
    invalidCategory: "اختر نطاقاً صالحاً للتعريب.",
    invalidStatus: "اختر حالة صالحة للترجمة.",
    invalidVisibility: "تعذر حفظ حالة ظهور الترجمة.",
    invalidCover: "اختر غلافاً صالحاً للعبة.",
    coverNotFound: "تعذر العثور على صورة الغلاف. اختر الصورة مجدداً.",
    invalidYear: "أدخل سنة إصدار صحيحة.",
    invalidPopularity: "أدخل عدد المهتمين بصورة صحيحة.",
    invalidTranslationUrl: "أدخل رابطاً صالحاً يبدأ بـ https://.",
    externalLinkUnavailable: "تعذر فتح رابط التعريب في المتصفح.",
    translationNotFound: "تعذر العثور على اللعبة؛ حدّث الصفحة وحاول مجدداً.",
    saveFailed: "تعذر حفظ الترجمة. تحقق من المعلومات وأعد المحاولة.",
    deleteConfirm: "هل تريد حذف ترجمة {title}؟ لا يمكن التراجع عن هذا الإجراء.",
    deleteFailed: "تعذر حذف الترجمة. حدّث الصفحة وحاول مجدداً.",
    coverSizeLimit: "اختر صورة لا يتجاوز حجمها 8 ميغابايت.",
    coverCompressFailed: "تعذر ضغط الصورة لحفظها في Firestore. اختر صورة أصغر.",
    unsupportedCover: "صيغة الصورة غير مدعومة. اختر PNG أو JPG أو WEBP.",
    accessDenied: "هذا الحساب غير مخوّل لإدارة المكتبة. اطلب من مالك المشروع تفعيل صلاحية المسؤول.",
    firebaseRateLimited: "محاولات تسجيل كثيرة. انتظر قليلاً قبل المحاولة مجدداً.",
    firebaseProviderDisabled: "فعّل مزوّد البريد الإلكتروني وكلمة المرور في إعدادات Firebase Authentication.",
    firebasePermissionDenied: "رفض Firebase هذا الإجراء. تحقق من قواعد Firestore وStorage وصلاحية المسؤول.",
    cloudConnectionFailed: "تعذّر الاتصال بخدمات Firebase. تحقق من اتصال الإنترنت وإعدادات المشروع.",
    cloudImageFailed: "تعذّر تحميل صورة الغلاف من قاعدة بيانات Firebase.",
    coverSelectionCancelled: "لم يتم اختيار صورة.",
    coverSelected: "تم اختيار الغلاف وضغطه للحفظ في Firestore. احفظ الترجمة لإضافته للمكتبة.",
    catalogRefreshed: "تم تحديث مكتبة الألعاب.",
    translationSaved: "تم حفظ الترجمة بنجاح.",
    translationAdded: "تمت إضافة الترجمة إلى مكتبتك.",
    translationDeleted: "تم حذف الترجمة.",
    translationHidden: "تم إخفاء التعريب وحفظه كمسودة.",
    translationPublished: "تم نشر التعريب.",
    translationOrderUpdated: "تم تحديث ترتيب التعريبات.",
    detailSoon: "سيتم ربط ملفات الترجمة قريباً.",
    needFirstAdmin: "أنشئ حساب المسؤول الأول قبل فتح لوحة الإدارة.",
    adminRequired: "انتهت جلسة الإدارة. سجّل الدخول مرة أخرى.",
    adminBreadcrumb: "مساحة الإدارة",
    secureSession: "جلسة مسؤول آمنة",
    adminEyebrow: "تحكّم كامل بالمكتبة",
    adminHeading: "إدارة <span>التعريبات</span>",
    adminDescription: "أضف الألعاب، عدّل الترجمات، وتحكم في ما يظهر للاعبين.",
    addTranslation: "أضف ترجمة جديدة",
    totalTranslations: "مجموع الترجمات",
    publishedTranslations: "منشورة للاعبين",
    draftTranslations: "مسودات خاصة",
    readyTranslations: "ترجمات جاهزة",
    adminListHeading: "مكتبة الألعاب",
    adminListDescription: "أدر معلومات الألعاب والترجمات المرتبطة بها.",
    libraryItems: "عنصر",
    adminSearchPlaceholder: "ابحث في الألعاب...",
    statusFilterLabel: "حالة الترجمة",
    statusAll: "كل الحالات",
    statusPublished: "منشورة",
    statusDraft: "مسودة",
    gameColumn: "اللعبة",
    genreColumn: "التصنيف",
    translationColumn: "التعريب",
    visibilityColumn: "الظهور",
    updatedColumn: "الإضافة",
    actionsColumn: "الإجراءات",
    adminEmptyTitle: "لا توجد ترجمات هنا بعد",
    adminEmptyDescription: "ابدأ بإضافة أول لعبة إلى مكتبتك.",
    editorEyebrow: "إدارة المكتبة",
    addEditorTitle: "إضافة ترجمة جديدة",
    editEditorTitle: "تعديل بيانات الترجمة",
    arabicTitleLabel: "اسم اللعبة بالعربية",
    englishTitleLabel: "اسم اللعبة بالإنجليزية",
    developerLabel: "فريق التعريب",
    genreLabel: "تصنيف اللعبة",
    categoryLabel: "نطاق التعريب",
    progressLabel: "حالة الترجمة",
    yearLabel: "سنة الإصدار",
    translationUrlLabel: "رابط مباشر لحزمة التعريب (ZIP)",
    translationUrlHelp: "ضع رابط HTTPS مباشرًا لتنزيل حزمة ZIP موثوقة. لن يعمل رابط صفحة ويب أو ملف تنفيذي.",
    packageVersionLabel: "إصدار حزمة التعريب",
    packageVersionPlaceholder: "V1.0.0",
    installerProgramUrlLabel: "رابط مباشر لبرنامج التثبيت (EXE، اختياري)",
    installerProgramUrlHelp: "إذا احتاج التعريب إلى مُثبّت، أضف رابطه هنا. يمكن استخدامه وحده أو مع حزمة ZIP، وسيُطلب من اللاعب تأكيد فتحه.",
    installDownloading: "جارٍ تحميل التعريب",
    installDownloadingProgram: "جارٍ تحميل برنامج التثبيت",
    installExtracting: "جارٍ فك ملفات التعريب",
    installCancelling: "جارٍ إلغاء التثبيت...",
    installExtractProgress: "تم فك {files} ملف",
    installCopyingFiles: "جارٍ تثبيت الملفات في مجلد اللعبة",
    installRunningProgram: "برنامج التثبيت قيد التشغيل",
    installAwaitingProgramTitle: "هذا التعريب يستخدم برنامج تثبيت",
    installAwaitingProgramDescription: "نزّل التطبيق برنامج التثبيت. افتحه لإكمال خطوات التعريب، أو ألغِ العملية؛ ستُستعاد ملفات الحزمة إن وُجدت.",
    installTrustWarning: "لا تفتح البرنامج إلا إذا كنت تثق بمصدر هذا التعريب.",
    installProgramRun: "فتح المثبّت",
    installProgramCancel: "إلغاء التعريب",
    installCancel: "إلغاء",
    installFailedTitle: "فشل التثبيت",
    installFailedDescription: "تعذر تثبيت التعريب. تحقق من مسار اللعبة والاتصال ثم حاول مرة أخرى.",
    installTryAgain: "حاول مرة أخرى",
    installCompletedTitle: "تم تثبيت التعريب",
    installCompletedDescription: "أصبحت ملفات التعريب جاهزة في مجلد اللعبة.",
    installLaunchGame: "تشغيل اللعبة",
    installOpenGameFolder: "فتح مجلد اللعبة",
    installRemoveTranslation: "إزالة التعريب",
    installRemoveConfirm: "هل تريد إزالة ملفات التعريب وإرجاع الملفات الأصلية؟",
    installExternalRemoveConfirm: "لا يستطيع Dreko حذف الملفات التي ثبّتها المثبّت الخارجي بأمان. استخدم أداة إزالة التعريب الخاصة به أولًا. إذا أزلت التعريب بالفعل، اضغط موافق لمسح حالة التثبيت من Dreko.",
    installRemoveSuccess: "تمت إزالة التعريب وإرجاع الملفات الأصلية.",
    installExternalStatusCleared: "تم مسح حالة التثبيت من Dreko. أزل الملفات من أداة المثبّت الخارجي إذا لم تفعل ذلك بعد.",
    installFilesChanged: "تغيّرت بعض ملفات اللعبة بعد التثبيت؛ لم نزلها حفاظاً على تعديلاتك.",
    installStatusUnavailable: "تعذر التحقق من حالة التعريب. حاول مرة أخرى.",
    installCancelDuringInstall: "إلغاء التثبيت",
    installDownloadProgress: "تم تنزيل {downloaded} من {total}",
    installDownloadUnknown: "تم تنزيل {downloaded}",
    installFilesProgress: "تم تثبيت {completed} من {total} ملف",
    installFailureInvalidUrl: "رابط الحزمة غير صالح أو غير آمن.",
    installFailureDownload: "تعذر تنزيل الحزمة. تحقق من رابط تنزيل مباشر ثم حاول مجدداً.",
    installFailureArchive: "ملف التعريب تالف أو ليس ملف ZIP صالحاً.",
    installFailureUnsupportedExe: "رابط التعريب يجب أن يكون ملف ZIP؛ ضع برنامج التثبيت الاختياري في الحقل المخصص له.",
    installFailureRollback: "فشل التثبيت ولم يتمكن التطبيق من استعادة كل الملفات الأصلية. احتفظ بنسخة من مجلد اللعبة واطلب المساعدة.",
    installFailureCancelled: "أُلغي تثبيت التعريب قبل اكتماله.",
    installFailureNoFiles: "ملف التعريب لا يحتوي على ملفات للتثبيت.",
    installFailureFolder: "مسار مجلد اللعبة غير صالح أو لا يمكن الوصول إليه.",
    installFailurePermission: "لا توجد صلاحية للكتابة داخل مجلد اللعبة. شغّل التطبيق بصلاحيات مناسبة.",
    installFailureExe: "البرنامج الذي وفره المسؤول غير صالح ولم يتم تشغيله.",
    installFailureProgram: "أغلق برنامج التثبيت مع الإبلاغ عن فشل؛ لم يكتمل تثبيت التعريب.",
    installFailureGeneric: "حدث خطأ أثناء التثبيت. لم يتمكن التطبيق من إكمال العملية.",
    translationUrlPlaceholder: "https://...",
    installerProgramUrlPlaceholder: "https://example.com/translation-installer.exe",
    coverPreviewTitle: "غلاف اللعبة",
    coverPreviewDescription: "الغلاف الذي سيظهر للاعبين في المكتبة.",
    coverSearchPlaceholder: "اكتب اسم اللعبة للبحث عن صورها...",
    coverSearchRegionLabel: "البحث عن صور اللعبة",
    coverSearchButton: "بحث عن صور",
    imageSearchConfigured: "مصادر الصور:",
    imageSearchNotConfigured: "تعذر تحميل إعداد مصادر الصور من ملف البيئة.",
    imageSearchProviderIgdb: "IGDB",
    imageSearchProviderGamesDb: "TheGamesDB",
    imageSearchProviderSteamGridDb: "SteamGridDB",
    imageSearchLoading: "جارٍ البحث عن صور اللعبة...",
    imageSearchFound: "عُثر على {count} صورة من {provider}. اختر الغلاف المناسب.",
    imageSearchNotFound: "لم يُعثر على صور لهذه اللعبة في المصادر المتاحة.",
    imageSearchNoProviders: "أضف مفتاح API واحدًا على الأقل من إعدادات مصادر البحث.",
    imageSearchUnavailable: "تعذر الاتصال بمصادر الصور. تحقق من المفاتيح والاتصال بالإنترنت.",
    imageSearchQueryRequired: "اكتب اسم اللعبة أولاً.",
    imageSearchSelected: "تم اختيار الصورة. احفظ الترجمة لإضافتها إلى المكتبة.",
    imageSearchProviderWarning: "تعذر استخدام أحد المصادر؛ جُرّبت المصادر التالية.",
    imageSearchSelect: "اختيار هذه الصورة",
    imageSearchArtworkDownloadFailed: "تعذر تنزيل الصورة المختارة. جرّب صورة أخرى.",
    imageSearchCoverSizeLimit: "حجم الصورة أكبر من الحد المسموح (8 ميغابايت).",
    imageSearchUnsupportedCover: "صيغة الصورة غير مدعومة. اختر صورة JPG أو PNG أو WEBP.",
    coverUrlLabel: "أو أضف رابط صورة مباشر",
    coverUrlPlaceholder: "https://example.com/game-cover.jpg",
    coverUrlUse: "استخدام الرابط",
    coverUrlHelp: "استخدم رابط HTTPS مباشرًا لصورة JPG أو PNG أو WebP.",
    coverUrlInvalid: "الرابط غير صالح أو لا يشير إلى صورة عامة آمنة.",
    chooseCover: "اختيار صورة",
    gameDescriptionLabel: "وصف اللعبة وسياق الترجمة",
    gameDescriptionHelp: "اكتب ملخصًا واضحًا عن عالم اللعبة وشخصياتها ومصطلحاتها. يُستخدم الاسم والوصف لفهم النصوص عند ترجمتها.",
    duplicateGame: "هذه اللعبة موجودة بالفعل في المكتبة. افتح سجلها الحالي لتعديل الاسم والوصف.",
    publishTitle: "إظهار الترجمة في المكتبة العامة",
    publishDescription: "إذا ألغيت الاختيار، تحفظ الترجمة كمسودة خاصة لا يراها الزوار.",
    cancel: "إلغاء",
    saveTranslation: "حفظ الترجمة",
    editTranslation: "تعديل",
    deleteTranslation: "حذف",
    hideTranslation: "إخفاء التعريب وحفظه كمسودة",
    publishTranslation: "نشر التعريب",
    moveTranslationUp: "رفع التعريب",
    moveTranslationDown: "خفض التعريب",
    publicVisibility: "منشورة",
    privateVisibility: "مسودة",
    allGenreSummary: "كل الأنواع",
    genreAdventureShort: "مغامرة",
    genreActionShort: "أكشن",
    genreRpgShort: "أدوار",
    genreHorrorShort: "رعب",
    genreSimulatorShort: "محاكاة",
    genrePuzzleShort: "ألغاز",
    genreStrategyShort: "استراتيجية",
    genreOtherShort: "أخرى",
    allTranslations: "كل الترجمات",
    appRunningOffline: "مكتبتك المفضلة، دون اتصال.",
    categoryFullTitle: "ترجمة كاملة",
    categoryInterfaceTitle: "واجهة وقوائم"
  },
  en: {
    guest: "Guest",
    discordGateTitle: "The world of games… in Arabic",
    discordGateDescription: "Bring the world of games closer and enjoy playing in Arabic.",
    discordGatePreparing: "Connecting to the membership service...",
    discordGateSetupNeeded: "The verification service is online, but setup is incomplete. Add the Discord Client ID, bot token, server invite URL, and make Firebase Admin credentials available to the auth server.",
    discordSetupClientIdMismatch: "The Discord Client ID does not match the bot's application. Use the Client ID from the same Discord app as the bot.",
    discordSetupBotGuildAccess: "The bot token is valid, but the bot cannot see the configured server. Add the bot to that server and verify its ID.",
    discordSetupBotToken: "The Discord bot token is invalid. Check the token in Discord Developer Portal.",
    discordSetupFirebaseAdmin: "Add a Firebase service-account file on the server, set GOOGLE_APPLICATION_CREDENTIALS to its path, and restart the auth service.",
    discordSetupNeedClientId: "Add the Discord Client ID to auth-server/.env.",
    discordSetupNeedClientSecret: "Add the Discord Client Secret to auth-server/.env.",
    discordSetupNeedBotToken: "Add the Discord Bot Token to auth-server/.env.",
    discordSetupNeedGuildId: "Set the correct server ID in DISCORD_GUILD_ID.",
    discordSetupNeedInvite: "Set a valid server invitation in DISCORD_INVITE_URL, or enable automatic joining.",
    discordSetupNeedRedirect: "Check PUBLIC_ORIGIN and DISCORD_REDIRECT_URI in the server configuration.",
    discordGatePrompt: "Sign in with Discord to verify your membership in our community and access the translation library.",
    discordGateConnecting: "Opening secure Discord sign-in...",
    discordGateChecking: "Checking your Dreko server membership...",
    discordGateNotMember: "You are not in the Dreko server yet. Join it, then try again.",
    discordGateCancelled: "Sign-in was cancelled. You can try again.",
    discordGateExpired: "This sign-in expired. Please start again.",
    discordGateUnavailable: "The membership service is unavailable. Check your connection and try again.",
    discordAccountStorageUnavailable: "Your account could not be saved. Check the Firestore rules and try again.",
    discordGateRejected: "We could not verify your membership. Please sign in again.",
    discordGateJoinRequired: "Join the server, then return here to verify your membership.",
    discordLogin: "Continue with Discord",
    discordJoinServer: "Join the Dreko server",
    discordGateSecurity: "Dreko never asks for your Discord password.",
    discordLogoutLabel: "Sign out of Discord",
    language: "العربية",
    navLibrary: "Library",
    navCommunity: "Community",
    navOurSite: "Our Site",
    navPremium: "Dreko Premium",
    navUpdates: "Updates",
    navSupport: "Support",
    navReport: "Report",
    reportGameButton: "Report an issue",
    reportTitle: "Report a problem",
    reportIntro: "Tell us about the problem you encountered with this translation.",
    reportStep: "Step {step} of 3",
    reportChooseGame: "Choose a game",
    reportSearchGame: "Search the library...",
    reportNoGames: "No matching games.",
    reportLatestUpdate: "Is your game up to date?",
    reportLatestUpdateHint: "This helps us identify what may be causing the problem.",
    reportUpdateYes: "Yes, up to date",
    reportUpdateNo: "No",
    reportUpdateUnsure: "Not sure",
    reportIssueQuestion: "What problem did you encounter?",
    reportIssueTranslation: "Translation mistake",
    reportIssueMissing: "Untranslated text",
    reportIssueDisplay: "Text display issue",
    reportIssueFont: "Font or font size",
    reportIssueLanguage: "Text is not in Arabic",
    reportIssueCrash: "Game won't launch or crashes",
    reportIssueInstall: "Translation installation issue",
    reportIssueOther: "Other",
    reportDetailsLabel: "Additional details (optional)",
    reportDetailsPlaceholder: "Describe the issue or steps that caused it...",
    reportCharacters: "{count}/500",
    reportBack: "Back",
    reportNext: "Next",
    reportSubmit: "Submit report",
    reportSubmitting: "Submitting report...",
    reportSuccessTitle: "Thank you. Your report has reached our team.",
    reportSuccessDescription: "We’ll review the issue with the translation team.",
    reportClose: "Close",
    reportSubmitError: "Unable to send your report right now. Check your connection and try again.",
    reportAlreadySubmitted: "You have already reported this game. Only one report is allowed per game.",
    reportsOpen: "Reports",
    reportsBackToLibrary: "Back to translations",
    reportsEyebrow: "PLAYER FEEDBACK",
    reportsTitle: "Translation <span>reports</span>",
    reportsDescription: "Review issues reported by players and track their status.",
    reportsCount: "reports",
    reportsStatusLabel: "Filter reports",
    reportsPending: "Needs review",
    reportsResolved: "Reviewed",
    reportsSearchPlaceholder: "Search game, account, or report...",
    reportsRefresh: "Refresh reports",
    reportsEmptyTitle: "No matching reports",
    reportsEmptyDescription: "New player reports will appear here.",
    reportStatusSaved: "Report status updated.",
    reportDeleteAction: "Delete",
    reportDeleted: "Report deleted.",
    reportDeleteConfirm: "Delete the report for “{game}”? This cannot be undone.",
    reportStatusPendingAction: "Reopen",
    reportStatusResolvedAction: "Mark reviewed",
    reportSubmittedDate: "Reported",
    reportSubmittedBy: "Reported by",
    reportLatestLabel: "Game update status",
    reportIssueLabel: "Issue type",
    reportDetailsAdminLabel: "Player details",
    reportUpdateValueYes: "Up to date",
    reportUpdateValueNo: "Not up to date",
    reportUpdateValueUnsure: "Not sure",
    updateChecking: "Checking for updates...",
    updateCurrent: "You are using the latest version ({version}).",
    updateAvailable: "Version {version} is available. Downloading...",
    updateDownloading: "Downloading update... {percent}%",
    updateDownloaded: "Version {version} is downloaded. Install and restart the app to finish updating.",
    updateInstalling: "Closing the app and starting the installer...",
    updateInstall: "Install and restart",
    updateLater: "Later",
    mandatoryUpdateTitle: "Update required",
    mandatoryUpdateDescription: "A new version is required to continue using the app.",
    mandatoryUpdateChecking: "Checking for the required update...",
    mandatoryUpdateDownloading: "Downloading version {version}... {percent}%",
    mandatoryUpdateReady: "Version {version} is downloaded. Restart the app to install it.",
    mandatoryUpdateFailed: "The update could not be downloaded. Check your connection and retry.",
    mandatoryUpdateRetry: "Retry",
    mandatoryUpdateRestart: "Restart and install now",
    mandatoryUpdateInstalling: "Closing the app and starting the installer...",
    mandatoryUpdateInstallFailed: "The installer could not start. Retry to launch it.",
    whatsNewTitle: "What's new",
    whatsNewVersion: "Version {version}",
    whatsNewAutoUpdate: "The app now checks for and downloads updates automatically after sign-in.",
    whatsNewRequiredUpdate: "You can now request a game translation! The Translation Requests section lets you request a game that doesn't have a published translation available. Requests are reviewed before being processed.",
    whatsNewDone: "Got it",
    updateUnavailable: "Unable to check for updates right now. Check your connection and try again.",
    updateFeedNotConfigured: "The app update service is not configured yet.",
    updateRequiresInstalledApp: "Update checks are available only in the installed app.",
    updateInstallFailed: "Unable to start the installer. Restart the app and try again.",
    profileEntryLabel: "Profile",
    profileEyebrow: "YOUR DREKO ACCOUNT",
    profileTitle: "Your profile",
    profileDescription: "Details for the Discord account linked to Dreko Translation.",
    profileNameLabel: "Account name",
    profileCreatedLabel: "Discord account created",
    profileGuildJoinedLabel: "Member of the Dreko community",
    profileDetailsLabel: "Profile details and statistics",
    profileStatsLabel: "Profile statistics",
    profileDateUnavailable: "Unavailable",
    profileTypeLabel: "Account type",
    accountTypeStandard: "Standard",
    accountTypePremium: "Premium",
    premiumExpiresLabel: "Expires",
    usedTranslationsCount: "Used translations",
    adminDashboardTitle: "Admin dashboard",
    accountsOpen: "Accounts",
    accountsBackToLibrary: "Back to translations",
    requestsOpen: "Translation requests",
    requestsBackToLibrary: "Back to translations",
    accountsEyebrow: "USER MANAGEMENT",
    accountsTitle: "User <span>accounts</span>",
    accountsDescription: "Browse accounts and manage their plan and duration.",
    accountsCount: "accounts",
    accountsSearchPlaceholder: "Search by name or Discord ID...",
    accountsRefresh: "Refresh accounts",
    accountsEmptyTitle: "No matching accounts",
    accountsEmptyDescription: "Try another search or refresh the account list.",
    accountIdLabel: "Discord ID",
    accountPlanLabel: "Account type",
    accountPlanStandard: "Standard",
    accountPlanPremium: "Premium",
    accountExpiryPermanent: "Permanent",
    accountExpiryNone: "No expiry",
    accountExpiryExpired: "Premium expired; account is standard",
    accountExpiryDate: "Expires",
    premiumDurationLabel: "Premium duration",
    premiumDuration30: "1 month",
    premiumDuration90: "3 months",
    premiumDuration180: "6 months",
    premiumDuration365: "1 year",
    premiumDurationPermanent: "Permanent",
    accountActivatePremium: "Activate premium",
    accountRenewPremium: "Renew premium",
    accountMakeStandard: "Set to standard",
    accountPlanSaved: "Account type updated.",
    requestsEyebrow: "TRANSLATION REQUESTS",
    requestsTitle: "<span>Translation</span> requests",
    requestsDescription: "Review player requests and move completed games to the archive.",
    requestsCount: "requests",
    requestsPending: "Pending",
    requestsArchive: "Archive",
    requestsSearchPlaceholder: "Search by game or account...",
    requestsRefresh: "Refresh requests",
    requestsEmptyTitle: "No matching requests",
    requestsEmptyDescription: "New translation requests will appear here.",
    requestAccountLabel: "Requested by",
    requestDiscordIdLabel: "Discord ID",
    requestGameLabel: "Requested game",
    requestSteamIdLabel: "Steam ID",
    requestDateLabel: "Requested",
    requestArchiveAction: "Translation added",
    requestRestoreAction: "Return to pending",
    requestDeleteAction: "Delete request",
    requestDeleteConfirm: "Delete the translation request for “{title}”? This cannot be undone.",
    requestStatusSaved: "Translation request status updated.",
    requestDeleted: "Request deleted.",
    requestStateConflict: "The request changed since it was loaded. Refresh the list and try again.",
    requestRestoreBlocked: "This account already has another pending request. Archive or delete it before restoring this one.",
    themeLabel: "Change appearance",
    featuredEyebrow: "JUST ADDED",
    featuredTitle: "Latest <span>localizations</span>",
    featureOneKicker: "EVERY STORY, YOURS TO EXPLORE",
    featureOneTitle: "Step into<br />another world.",
    featureOneCaption: "Language brings every story closer",
    featureTwoKicker: "FRESH FROM THE COMMUNITY",
    featureTwoTitle: "Stories that<br />stay with you.",
    featureTwoCaption: "See what our translators are creating",
    featureThreeKicker: "MADE BY PLAYERS, FOR PLAYERS",
    featureThreeTitle: "Your world,<br />every detail.",
    featureThreeCaption: "One word makes all the difference",
    libraryEyebrow: "EXPLORE THE LIBRARY",
    libraryTitle: "Game <span>collection</span>",
    translationCount: "translations",
    paginationLabel: "Library pages",
    paginationPrevious: "Previous page",
    paginationNext: "Next page",
    paginationPage: "Page",
    filterLatest: "Latest",
    filterPopular: "Most popular",
    weekButton: "Dreko translations",
    premiumTranslationBadge: "DREKO TRANSLATION",
    premiumExclusiveLabel: "EXCLUSIVE DREKO TRANSLATION",
    premiumAccessRequired: "This translation is exclusive to Premium subscribers. Upgrade to open it.",
    premiumOnlyEmpty: "No premium translations match your search.",
    premiumTranslationLabel: "Premium translation",
    premiumTranslationDescription: "Include this translation in the Dreko premium collection.",
    categoryAll: "All types",
    categoryFull: "Full localization",
    categoryInterface: "UI & menus",
    searchPlaceholder: "Search for a game...",
    searchLabel: "Search for a game or translation",
    platformAll: "My games",
    platformBackToTranslations: "Translations",
    installedGamesCount: "installed games",
    aiLocalizationOpen: "Game file translation",
    aiLocalizationEyebrow: "GAME FILE TRANSLATION",
    aiLocalizationTitle: "Translate a game file",
    aiLocalizationIntro: "Choose a compatible JSON or CSV file from the game's files. Original game files are never modified.",
    aiModelLabel: "Translation model",
    aiSourceLanguageLabel: "Source language",
    aiTargetArabic: "Arabic",
    aiCategoryLabel: "Translation scope",
    aiCategoryGeneral: "All text",
    aiGlossaryLabel: "Optional game glossary",
    aiGlossaryPlaceholder: "Example: Firekeeper = approved Arabic spelling",
    aiChooseFile: "Choose JSON or CSV file",
    aiStart: "Start translation",
    aiInitialStatus: "Choose the game folder to scan for a compatible text file.",
    aiCancel: "Cancel",
    aiResume: "Resume",
    aiExport: "Export translated file",
    aiRecentJobs: "Saved translations",
    aiLimitNote: "Text and the game description are sent to an online translation service. Flat JSON and CSV resources are supported directly or inside ZIP archives; Unreal PAK/IoStore (UTOC/UCAS) and RPF archives are not read, and original game files are never modified.",
    aiFileSelected: "Inspected {file} — {count} strings ready to translate.",
    aiFolderScanning: "Scanning the game folder for supported text files...",
    aiFolderStarting: "Found {file} — starting localization...",
    aiFolderSelected: "Found {file} with {count} strings ({files} compatible files found).",
    aiNoFolderSource: "No compatible JSON or CSV localization file was found. Binary game files are not supported.",
    aiFolderScanLimit: "This folder is too large to scan safely. Choose the correct game folder or a known text-resource folder.",
    aiFolderGameMismatch: "This appears to be a different game's folder. Choose the folder matching the selected game.",
    aiProtectedGame: "This game is not enabled for automatic localization, to protect its files and online play.",
    aiArabicAlreadyAvailable: "Arabic localization files or language settings were detected. A duplicate translation was not started.",
    aiSottrArabicAlreadyAvailable: "Native Arabic text archives for Shadow of the Tomb Raider were found (TIGER format). Duplicate translation was stopped. The app recognizes these archives but cannot unpack or modify them yet.",
    aiUnsupportedGameFiles: "The game has not been marked impossible to localize or blocked. No supported JSON or CSV source was found; the folder contains game-specific files such as PAK, TIGER, or RPF. No files were changed; a safe, tested adapter for that format is required.",
    aiUnsupportedUnrealFiles: "Unreal Engine PAK or IoStore (UTOC/UCAS) files were found, but no supported loose JSON/CSV text resource is available. Some containers may be encrypted; the app did not try to decrypt them or bypass protections. Use an official extraction/modding route or a trusted, tested game-specific adapter. No game files were changed.",
    aiJobRunning: "Translating {completed} of {total} strings. You can cancel and resume later.",
    aiJobCompleted: "Translated {completed} strings. Export the file to review it.",
    aiJobInterrupted: "The job stopped. Resume it to continue unfinished entries.",
    aiJobCancelled: "The job was cancelled. You can resume it later.",
    aiJobFailed: "Some strings could not be translated ({code}). Completed strings are saved; resume to retry.",
    aiJobHistoryEmpty: "Saved translations will appear here.",
    aiResumeJob: "Resume",
    aiExportJob: "Export",
    aiJobLabel: "{file} — {completed} — {status}",
    aiPreviewTitle: "Text preview",
    aiAuthRequired: "Sign in again and make sure you have joined the Dreko community to translate game files.",
    aiServiceNotConfigured: "The translation service is not configured yet. Please contact the Dreko team.",
    gameAiHeading: "Translate this game's text",
    gameAiIntro: "Choose only the game folder. The app scans JSON and CSV text files, including inside ZIP archives, then translates the best match into Arabic.",
    gameAiOpen: "Translate game files",
    gameAiFileLabel: "Game text file",
    gameAiFilePlaceholder: "Choose a JSON or CSV file",
    aiQuotaExhausted: "The translation service has reached its current usage limit. Wait, then resume.",
    aiRateLimited: "The service is temporarily busy. Wait, then resume.",
    aiModelUnavailable: "The translation model is currently unavailable.",
    aiNetworkError: "Could not reach the translation service. Check your connection and resume.",
    aiResponseInvalid: "Some results could not be processed. Completed strings are saved; retry the job.",
    aiTokensChanged: "Protected formatting tokens changed; this batch was not saved.",
    aiSourceFormatUnsupported: "This file format or schema is unsupported. Use a flat JSON map or CSV with identifier and text columns.",
    aiFailedEntryIds: "Entries needing review: {ids}",
    aiSourceTooLarge: "The file is empty or exceeds the 5 MB limit.",
    aiEntryTooLarge: "A single text entry is too large for a safe request. Split the file and try again.",
    aiStorageFailed: "Translation progress could not be saved on this device. Check disk space and permissions.",
    aiExportSuccess: "Localization exported. Review it and install manually only if the game supports this format.",
    aiSourceOverwrite: "Export over the original file was prevented. Choose another destination.",
    aiArchiveChanged: "The original archive changed after it was scanned. Scan the folder again and start a new job.",
    aiArchiveExportFailed: "The translated archive could not be safely created. The original archive is unchanged.",
    aiUnknownError: "The operation failed. Check settings and the file, then try again.",
    closeDialog: "Close",
    gameFolderNotFound: "The game folder path is invalid or does not exist.",
    gameFolderPickerFailed: "Unable to open the folder picker.",
    gameInstallPath: "GAME INSTALLATION PATH",
    gameFolderPlaceholder: "C:\\Program Files (x86)\\Steam\\steamapps\\common\\",
    gameFolderHelp: "Note: Select the root folder containing the game's executable.",
    gameFolderAutoDetect: "Find game folder automatically",
    gameFolderDetecting: "Searching game launchers and local folders...",
    gameFolderDetected: "Found {game} and selected its folder.",
    gameFolderNotDetected: "No matching folder was found. Select it manually or check that the launcher has registered the game.",
    gameFolderDetectionAmbiguous: "More than one game may match this name. Select the game folder manually.",
    gameFolderSearchLimited: "The local search is limited to avoid slowing down your PC. Select the game folder manually.",
    gameFolderContinue: "Scan folder and start localization",
    translatedByLabel: "Translated by:",
    translationOptionsHeading: "Choose the translation to install",
    installTranslationAction: "Install translation",
    installReadyPackage: "Download and install ready translation",
    installReadyInstaller: "Download and open installer",
    registerExistingExternalTranslation: "Already installed this translation? Register it",
    confirmRegisterExistingExternalTranslation: "If this installer's translation is already installed in the selected game folder, register its status to prevent reinstalling. Continue?",
    externalTranslationStatusRecorded: "Translation marked as installed.",
    readyPackageVersion: "Package version: {version}",
    backToGameFolder: "Back",
    packageDescriptionUnavailable: "Translation details are unavailable.",
    myGamesEyebrow: "YOUR PC LIBRARY",
    myGamesTitle: "Your installed games",
    myGamesDescription: "Games installed in the Steam libraries on this PC.",
    myGamesSearch: "Search your games...",
    gamesLoading: "Looking for installed Steam games...",
    gamesLoadError: "Unable to scan game libraries. Click refresh to try again.",
    steamUnavailable: "No Steam installation was found on this PC.",
    noInstalledGames: "No installed Steam games were found. Finish installing a game and scan again.",
    noMatchingGames: "No games match your search.",
    steamSource: "Installed on Steam",
    requestTranslation: "Request translation",
    requestTranslationConfirmTitle: "Confirm translation request",
    requestTranslationConfirmDescription: "Would you like to request a translation for this game?",
    requestSubmit: "Confirm request",
    requestCancel: "Back to your games",
    requestSubmitting: "Sending request...",
    requestFailed: "Unable to send the request. Check your connection and try again.",
    requestTranslationSuccessTitle: "Request received!",
    requestTranslationSuccessDescription: "Your game was added to the request queue for review.",
    requestDone: "Back to your games",
    requestLoginRequired: "Sign in with Discord to request a translation.",
    requestGameAvailable: "A translation for this game is already available or has been archived as complete.",
    requestAlreadyPending: "You already have a translation request waiting for review. Wait for it to be reviewed before sending another.",
    listViewLabel: "List view",
    gridViewLabel: "Grid view",
    refreshLabel: "Refresh library",
    emptyTitle: "No results found",
    emptyDescription: "Try a different search or translation type.",
    communityEyebrow: "",
    communityTitle: "Better games, <span>in Arabic.</span>",
    communityDescription: "A space where Arab players can easily enjoy their games in Arabic.",
    communityCta: "Explore the community",
    footerNote: "All localizations (translations) available in this application remain the property of their original creators. «Dreko» does not claim ownership of any of these translations, nor does it attribute any of the work to itself. These translations have been gathered from publicly available sources on the internet and reorganized here solely to make them easier to access. All rights remain with the original creators, and we hold their efforts in the highest regard. If you are the creator of any of these translations and would like to have it removed or its attribution corrected, please contact us via our Discord server, and your request will be addressed immediately.",
    footerStatus: "Status: Online",
    footerCopyright: "© 2026 DREKO TRANSLATION — All rights reserved by their respective owners.",
    genreAdventure: "Adventure",
    genreAction: "Action",
    genreRpg: "Role-playing",
    genreHorror: "Horror",
    genreSimulator: "Simulator",
    genrePuzzle: "Puzzle",
    genreStrategy: "Strategy",
    genreOther: "Other",
    fullTranslation: "Full translation",
    interfaceTranslation: "UI & menus",
    readyStatus: "Ready",
    inProgressStatus: "In progress",
    currentTranslationStatus: "Updated recently",
    newTranslationStatus: "New translation",
    inProgressBadge: "LOCALIZATION IN PROGRESS",
    detailAction: "Explore translation",
    detailDescription: "Learn about the translation, its progress, and recent updates.",
    gameTitleLabel: "GAME TITLE",
    translationTeamLabel: "LOCALIZATION TEAM",
    gameYearLabel: "RELEASE",
    yearSuffix: "",
    gameArtworkLabel: "ORIGINAL ARTWORK BY DREKO",
    authEyebrow: "SECURE ADMIN AREA",
    authLoginTitle: "Welcome back",
    authLoginDescription: "The management dashboard is available only to Discord accounts enabled by the project owner.",
    emailLabel: "Administrator email",
    emailPlaceholder: "name@example.com",
    passwordLabel: "Password",
    passwordPlaceholderLogin: "Enter your password",
    confirmPasswordPlaceholder: "Enter your password again",
    signInAdmin: "Sign in as administrator",
    signingIn: "Verifying...",
    backToLibrary: "Back to the library",
    authSecurityNote: "Accounts and translations use Firebase Authentication and Cloud Firestore.",
    accessDenied: "This account cannot manage the library. Ask the project owner to grant administrator access.",
    firebaseRateLimited: "Too many attempts. Wait a little before trying to sign in again.",
    firebaseProviderDisabled: "Enable the email/password provider in Firebase Authentication settings.",
    firebasePermissionDenied: "Firebase denied this action. Check your Firestore and Storage rules and administrator access.",
    cloudConnectionFailed: "Unable to reach Firebase. Check your internet connection and project configuration.",
    cloudImageFailed: "Unable to load this cover image from the Firebase database.",
    invalidCredentials: "Your email or password is incorrect.",
    authenticationUnavailable: "Unable to complete sign-in. Please try again.",
    titleRequired: "Enter the Arabic game title.",
    englishTitleRequired: "Enter the English game title.",
    developerRequired: "Enter a developer or localization team.",
    genreRequired: "Choose a game genre.",
    descriptionTooLong: "Your description is too long.",
    invalidCategory: "Choose a valid localization type.",
    invalidStatus: "Choose a valid translation status.",
    invalidVisibility: "Unable to save the translation visibility.",
    invalidCover: "Choose a valid game cover.",
    coverNotFound: "The selected artwork is unavailable. Please select it again.",
    invalidYear: "Enter a valid release year.",
    invalidPopularity: "Enter a valid follower count.",
    invalidTranslationUrl: "Enter a valid URL starting with https://.",
    externalLinkUnavailable: "Unable to open the translation link in your browser.",
    translationNotFound: "That translation no longer exists. Refresh and try again.",
    saveFailed: "Unable to save this translation. Check the details and try again.",
    deleteConfirm: "Delete {title}? This action cannot be undone.",
    deleteFailed: "Unable to remove this translation. Refresh and try again.",
    coverSizeLimit: "Choose an image smaller than 8 MB.",
    coverCompressFailed: "This image could not be compressed for Firestore. Choose a smaller image.",
    unsupportedCover: "Unsupported image format. Choose PNG, JPG, or WEBP.",
    coverSelectionCancelled: "No image was selected.",
    coverSelected: "Artwork selected and compressed for Firestore. Save the translation to add it to the library.",
    catalogRefreshed: "Game library refreshed.",
    translationSaved: "Your changes have been saved.",
    translationAdded: "The translation has been added to your library.",
    translationDeleted: "The translation has been removed.",
    translationHidden: "The translation is now hidden and saved as a draft.",
    translationPublished: "The translation is now published.",
    translationOrderUpdated: "The translation order has been updated.",
    detailSoon: "Translation files are coming in a future update.",
    needFirstAdmin: "Set up your administrator account to open the management panel.",
    adminRequired: "Your admin session has expired. Please sign in again.",
    adminBreadcrumb: "ADMIN SPACE",
    secureSession: "Secure administrator session",
    adminEyebrow: "FULL LIBRARY CONTROL",
    adminHeading: "Manage <span>translations</span>",
    adminDescription: "Add games, edit localizations, and choose what players can see.",
    addTranslation: "Add a translation",
    totalTranslations: "All translations",
    publishedTranslations: "Published to players",
    draftTranslations: "Private drafts",
    readyTranslations: "Ready translations",
    adminListHeading: "Game library",
    adminListDescription: "Manage your game listings and their translations.",
    libraryItems: "items",
    adminSearchPlaceholder: "Search games...",
    statusFilterLabel: "Translation visibility",
    statusAll: "All visibility",
    statusPublished: "Published",
    statusDraft: "Draft",
    gameColumn: "GAME",
    genreColumn: "GENRE",
    translationColumn: "LOCALIZATION",
    visibilityColumn: "VISIBILITY",
    updatedColumn: "ADDED",
    actionsColumn: "ACTIONS",
    adminEmptyTitle: "No translations here yet",
    adminEmptyDescription: "Add your first game to the library.",
    editorEyebrow: "LIBRARY MANAGEMENT",
    addEditorTitle: "Add a new translation",
    editEditorTitle: "Edit translation details",
    arabicTitleLabel: "Game title in Arabic",
    englishTitleLabel: "Game title in English",
    developerLabel: "Translation team",
    genreLabel: "Game genre",
    categoryLabel: "Translation coverage",
    progressLabel: "Translation status",
    yearLabel: "Release year",
    translationUrlLabel: "Direct translation package link (ZIP)",
    translationUrlHelp: "Enter a direct HTTPS download link to a trusted ZIP package. Web pages and executable files are not accepted.",
    packageVersionLabel: "Translation package version",
    packageVersionPlaceholder: "V1.0.0",
    installerProgramUrlLabel: "Direct installer program link (EXE, optional)",
    installerProgramUrlHelp: "If this translation requires an installer, add its link here. It can be used by itself or with a ZIP package; players must confirm before opening it.",
    installDownloading: "Downloading translation",
    installDownloadingProgram: "Downloading installer program",
    installExtracting: "Extracting translation files",
    installCancelling: "Cancelling installation...",
    installExtractProgress: "Extracted {files} files",
    installCopyingFiles: "Installing files into the game folder",
    installRunningProgram: "Installer program is running",
    installAwaitingProgramTitle: "This translation uses an installer",
    installAwaitingProgramDescription: "The installer has been downloaded. Open it to complete the translation, or cancel; any package files will be restored if applicable.",
    installTrustWarning: "Open this program only if you trust the translation source.",
    installProgramRun: "Open installer",
    installProgramCancel: "Cancel translation",
    installCancel: "Cancel",
    installFailedTitle: "Installation failed",
    installFailedDescription: "The translation could not be installed. Check the game folder and connection, then try again.",
    installTryAgain: "Try again",
    installCompletedTitle: "Translation installed",
    installCompletedDescription: "The translation files are ready in the game folder.",
    installLaunchGame: "Launch game",
    installOpenGameFolder: "Open game folder",
    installRemoveTranslation: "Remove translation",
    installRemoveConfirm: "Remove the translation files and restore the original files?",
    installExternalRemoveConfirm: "Dreko cannot safely delete files installed by the external installer. First use its uninstaller. If you have already removed the translation, choose OK to clear its installed status in Dreko.",
    installRemoveSuccess: "The translation was removed and original files restored.",
    installExternalStatusCleared: "The installed status was cleared in Dreko. Remove files using the external installer if you have not already done so.",
    installFilesChanged: "Some game files have changed since installation; they were left untouched to preserve your changes.",
    installStatusUnavailable: "Could not check the translation status. Try again.",
    installCancelDuringInstall: "Cancel installation",
    installDownloadProgress: "Downloaded {downloaded} of {total}",
    installDownloadUnknown: "Downloaded {downloaded}",
    installFilesProgress: "Installed {completed} of {total} files",
    installFailureInvalidUrl: "The package URL is invalid or unsafe.",
    installFailureDownload: "Unable to download the package. Check that the URL is a direct download link and try again.",
    installFailureArchive: "The translation package is corrupted or is not a valid ZIP file.",
    installFailureUnsupportedExe: "The translation link must be a ZIP file; put an optional installer program in its dedicated field.",
    installFailureRollback: "Installation failed and the app could not restore every original file. Keep a backup of the game folder and seek help.",
    installFailureCancelled: "Translation installation was cancelled before it completed.",
    installFailureNoFiles: "The translation package contains no files to install.",
    installFailureFolder: "The game folder is invalid or inaccessible.",
    installFailurePermission: "Unable to write to the game folder. Run the app with appropriate permissions.",
    installFailureExe: "The administrator-provided program is invalid and was not run.",
    installFailureProgram: "The installer program reported failure; translation installation did not complete.",
    installFailureGeneric: "An error occurred during installation. The app could not complete the operation.",
    translationUrlPlaceholder: "https://...",
    installerProgramUrlPlaceholder: "https://example.com/translation-installer.exe",
    coverPreviewTitle: "Game artwork",
    coverPreviewDescription: "The cover players will see in the library.",
    coverSearchPlaceholder: "Search for game artwork...",
    coverSearchRegionLabel: "Search for game artwork",
    coverSearchButton: "Search images",
    imageSearchConfigured: "Image sources:",
    imageSearchNotConfigured: "Unable to load image source settings from the environment file.",
    imageSearchProviderIgdb: "IGDB",
    imageSearchProviderGamesDb: "TheGamesDB",
    imageSearchProviderSteamGridDb: "SteamGridDB",
    imageSearchLoading: "Searching for game artwork...",
    imageSearchFound: "Found {count} images from {provider}. Choose the artwork you want.",
    imageSearchNotFound: "No artwork was found for this game in the available sources.",
    imageSearchNoProviders: "Add at least one API key in the image-source settings.",
    imageSearchUnavailable: "Unable to reach image sources. Check the API keys and internet connection.",
    imageSearchQueryRequired: "Enter a game title first.",
    imageSearchSelected: "Artwork selected. Save the translation to add it to the library.",
    imageSearchProviderWarning: "A source was unavailable; fallback sources were tried.",
    imageSearchSelect: "Select this artwork",
    imageSearchArtworkDownloadFailed: "Unable to download the selected image. Try another image.",
    imageSearchCoverSizeLimit: "The image exceeds the 8 MB size limit.",
    imageSearchUnsupportedCover: "Unsupported image format. Choose JPG, PNG, or WEBP.",
    coverUrlLabel: "Or add a direct image link",
    coverUrlPlaceholder: "https://example.com/game-cover.jpg",
    coverUrlUse: "Use link",
    coverUrlHelp: "Use a direct HTTPS link to a JPG, PNG, or WebP image.",
    coverUrlInvalid: "The link is invalid or does not point to a safe public image.",
    chooseCover: "Choose artwork",
    gameDescriptionLabel: "Game description and translation context",
    gameDescriptionHelp: "Describe the game's setting, characters, and terminology. The title and description help interpret its text.",
    duplicateGame: "This game is already in the library. Edit its existing entry instead.",
    publishTitle: "Publish to the public library",
    publishDescription: "Turn this off to save a private draft that visitors can't see.",
    cancel: "Cancel",
    saveTranslation: "Save translation",
    editTranslation: "Edit",
    deleteTranslation: "Delete",
    hideTranslation: "Hide translation and save as draft",
    publishTranslation: "Publish translation",
    moveTranslationUp: "Move translation up",
    moveTranslationDown: "Move translation down",
    publicVisibility: "Published",
    privateVisibility: "Draft",
    allGenreSummary: "All genres",
    genreAdventureShort: "Adventure",
    genreActionShort: "Action",
    genreRpgShort: "RPG",
    genreHorrorShort: "Horror",
    genreSimulatorShort: "Simulator",
    genrePuzzleShort: "Puzzle",
    genreStrategyShort: "Strategy",
    genreOtherShort: "Other",
    allTranslations: "All translations",
    appRunningOffline: "Your library. Always at hand.",
    categoryFullTitle: "Full localization",
    categoryInterfaceTitle: "UI & menus"
  }
};

const COVER_LABELS = {
  "astral-observer": "ASTRAL ARCHIVE",
  "paper-moon": "PAPER MOON",
  "last-orchard": "LAST ORCHARD",
  "velvet-noir": "VELVET CITY",
  "nocturne": "NOCTURNE",
  "lantern-keep": "LANTERN KEEP",
  "city-of-glass": "CITY OF GLASS",
  "forgotten-passage": "FORGOTTEN",
  "clockwork-cafe": "CLOCKWORK CAFÉ",
  "midnight-repairs": "NIGHT SHIFT",
  wilds: "THE WILDS",
  "quiet-thunder": "QUIET THUNDER"
};

const state = {
  locale: localStorage.getItem("dreko-locale") === "en" ? "en" : "ar",
  filter: "latest",
  category: "all",
  premiumOnly: false,
  adminVisibility: "all",
  query: "",
  libraryPage: 1,
  adminQuery: "",
  view: "grid",
  screen: "public",
  activeDestination: "#library",
  authenticated: false,
  isAdministrator: false,
  firebaseUser: null,
  discordProfile: null,
  discordAccount: null,
  adminSubpage: "translations",
  adminAccounts: [],
  adminAccountsQuery: "",
  adminTranslationRequests: [],
  adminRequestsQuery: "",
  adminRequestsStatus: "pending",
  adminReports: [],
  adminReportsQuery: "",
  adminReportsStatus: "pending",
  reportDraft: null,
  discordAccessGranted: false,
  discordAuthInitialized: false,
  discordVerifyingUserUid: "",
  catalog: [],
  installedGames: [],
  steamDetected: false,
  installedGamesStatus: "idle",
  installedGamesMode: false,
  adminTranslations: [],
  version: "",
  editingId: null,
  selectedCover: null,
  originalCover: null,
  selectedCoverSrc: "",
  pendingArtwork: null,
  coverSearchResults: [],
  coverSearchBusy: false,
  coverSearchRequestId: 0
};

const api = window.drekoDesktop;
let activeGameAiId = "";
let activeGameAiRefresh = null;
let discordServerReady = false;
let discordLoginEnabled = false;
let publicCatalogUnsubscribe = null;
let discordMembershipTimer = null;
let discordLoginInProgress = false;
let accountPlanExpiryTimer = null;
let updateToast = null;
let updateToastTimer = null;
let updateCheckPending = false;
let mandatoryUpdateMode = false;
let installedAppVersion = "";
let isPackagedApp = false;
let postLoginExperienceStarted = false;
let requiredUpdateVersion = "";
const cloudCoverUrls = new Map();
const cloudCoverRequests = new Set();
const cloudCoverPromises = new Map();
const cloudCoverQueue = [];
const CLOUD_COVER_CONCURRENCY = 4;
let activeCloudCoverRequests = 0;
let cloudCoverGeneration = 0;
const CLOUD_COVER_URLS_STORAGE_KEY = "dreko-cloud-cover-urls";
function isCacheableCloudCoverUrl(value) {
  if (typeof value !== "string" || value.length > 4096) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname === "firebasestorage.googleapis.com" &&
      url.pathname.startsWith("/v0/b/");
  } catch {
    return false;
  }
}

const cachedCloudCoverUrls = (() => {
  try {
    const stored = JSON.parse(localStorage.getItem(CLOUD_COVER_URLS_STORAGE_KEY) || "{}");
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return [];
    return Object.entries(stored).filter(([cover, url]) =>
      typeof cover === "string" &&
      cover.startsWith("storage:covers/") &&
      isCacheableCloudCoverUrl(url)
    );
  } catch (error) {
    console.warn("Unable to read cached cloud cover URLs:", error?.name || "UNKNOWN");
    return [];
  }
})();
for (const [cover, url] of cachedCloudCoverUrls) cloudCoverUrls.set(cover, url);
const grid = document.querySelector("#translation-grid");
const searchInput = document.querySelector("#search-input");
const resultCount = document.querySelector("#result-count");
const emptyState = document.querySelector("#empty-state");
const libraryPagination = document.querySelector("#library-pagination");
const reportDialog = document.querySelector("#report-dialog");
const reportContent = document.querySelector("#report-content");
const categoryMenu = document.querySelector("#category-menu");
const installedGamesDialog = document.querySelector("#installed-games-dialog");
const installedGamesContent = document.querySelector("#installed-games-content");
const dialog = document.querySelector("#translation-dialog");
const dialogContent = document.querySelector("#dialog-content");
const toastRegion = document.querySelector("#toast-region");
const authMessage = document.querySelector("#auth-message");
const editorDialog = document.querySelector("#editor-dialog");
const mandatoryUpdateDialog = document.querySelector("#mandatory-update-dialog");
const whatsNewDialog = document.querySelector("#whats-new-dialog");
const editorForm = document.querySelector("#editor-form");
const coverSearchInput = document.querySelector("#cover-search-input");
const coverSearchResults = document.querySelector("#cover-search-results");
const coverSearchMessage = document.querySelector("#cover-search-message");
const editorMessage = document.querySelector("#editor-message");
let selectedRequestGame = null;
let translationRequestSubmitting = false;
let activeTranslationInstall = null;
let featuredTrackFrame = 0;
let featuredLastFrameTime = 0;
let featuredOffset = 0;
let featuredLoopDistance = 0;
let featuredItemCount = 0;
let featuredPositionInitialized = false;

function updateFeaturedLoopDistance() {
  const track = document.querySelector("#featured-track");
  const measuredDistance = featuredItemCount > 0 && track.children[featuredItemCount]
    ? track.children[featuredItemCount].getBoundingClientRect().left -
      track.children[0].getBoundingClientRect().left
    : 0;
  if (measuredDistance > 0) {
    featuredLoopDistance = measuredDistance;
  } else if (!track.children.length) {
    featuredLoopDistance = 0;
  } else if (featuredLoopDistance <= 0 && track.scrollWidth > 0) {
    featuredLoopDistance = track.scrollWidth / Math.max(2, Math.floor(track.children.length / featuredItemCount));
  }
  const viewportWidth = track.parentElement.clientWidth;
  if (!featuredPositionInitialized && featuredLoopDistance > 0 && viewportWidth > 0) {
    const newestCardWidth = track.children[0].getBoundingClientRect().width;
    const newestCardPosition = Math.max(0, viewportWidth - newestCardWidth);
    featuredOffset = (
      featuredLoopDistance - (newestCardPosition % featuredLoopDistance) + featuredLoopDistance
    ) % featuredLoopDistance;
    featuredPositionInitialized = true;
  }
  featuredOffset %= featuredLoopDistance || 1;
}

function text(key) {
  return translations[state.locale][key] || key;
}

function interpolateText(key, values = {}) {
  return Object.entries(values).reduce(
    (message, [name, value]) => message.replaceAll(`{${name}}`, String(value)),
    text(key)
  );
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);
}

function isRemoteCoverUrl(value) {
  if (typeof value !== "string" || value.length < 10 || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function localCoverPath(cover) {
  if (typeof cover !== "string") return "./assets/covers/astral-observer.svg";
  if (isRemoteCoverUrl(cover)) return cover;
  if (cover.startsWith("storage:") || cover.startsWith("firestore:covers/")) {
    return cloudCoverUrls.get(cover) || "./assets/covers/astral-observer.svg";
  }
  return COVER_LABELS[cover] ? `./assets/covers/${cover}.svg` : "./assets/covers/astral-observer.svg";
}

function persistCloudCoverUrls() {
  try {
    localStorage.setItem(CLOUD_COVER_URLS_STORAGE_KEY, JSON.stringify(
      Object.fromEntries([...cloudCoverUrls].filter(([, url]) =>
        isCacheableCloudCoverUrl(url)
      ))
    ));
  } catch (error) {
    console.warn("Unable to cache cloud cover URLs:", error?.name || "UNKNOWN");
  }
}

function updateVisibleCloudCover(cover, url) {
  document.querySelectorAll("[data-cover-key]").forEach((image) => {
    if (image.dataset.coverKey === cover) image.src = url;
  });
}

function processCloudCoverQueue() {
  while (activeCloudCoverRequests < CLOUD_COVER_CONCURRENCY && cloudCoverQueue.length) {
    const request = cloudCoverQueue.shift();
    activeCloudCoverRequests += 1;
    void firebaseCloud.downloadCover(request.cover)
      .then((url) => {
        if (url && request.generation === cloudCoverGeneration) {
          cloudCoverUrls.set(request.cover, url);
          persistCloudCoverUrls();
          updateVisibleCloudCover(request.cover, url);
        }
        request.resolve(url);
      })
      .catch(request.reject)
      .finally(() => {
        activeCloudCoverRequests -= 1;
        if (cloudCoverPromises.get(request.cover) === request.pending) {
          cloudCoverRequests.delete(request.cover);
          cloudCoverPromises.delete(request.cover);
        }
        processCloudCoverQueue();
      });
  }
}

function queueCloudCoverDownload(cover) {
  if (cloudCoverUrls.has(cover)) return Promise.resolve(cloudCoverUrls.get(cover));
  const existing = cloudCoverPromises.get(cover);
  if (existing?.generation === cloudCoverGeneration) return existing.promise;

  const pending = { generation: cloudCoverGeneration, promise: null };
  cloudCoverRequests.add(cover);
  pending.promise = new Promise((resolve, reject) => {
    cloudCoverQueue.push({
      cover,
      generation: pending.generation,
      pending,
      resolve,
      reject
    });
    processCloudCoverQueue();
  });
  cloudCoverPromises.set(cover, pending);
  return pending.promise;
}

function genreName(genre, short = false) {
  const suffix = short ? "Short" : "";
  const genreNames = {
    adventure: `genreAdventure${suffix}`,
    action: `genreAction${suffix}`,
    rpg: `genreRpg${suffix}`,
    horror: `genreHorror${suffix}`,
    simulator: `genreSimulator${suffix}`,
    puzzle: `genrePuzzle${suffix}`,
    strategy: `genreStrategy${suffix}`,
    other: `genreOther${suffix}`
  };
  return text(genreNames[genre] || genreNames.other);
}

function translationName(item) {
  return state.locale === "ar" ? item.title : (item.titleEn || item.title);
}

function canAccessPremiumTranslations() {
  return effectiveAccountType(state.discordAccount) === "premium";
}

function isPremiumTranslationLocked(item) {
  return item?.premium === true && !canAccessPremiumTranslations();
}

function normalizedGameIdentity(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function syncPremiumSubscriptionState() {
  document.body.classList.toggle("premium-subscriber", canAccessPremiumTranslations());
}

function categoryName(category) {
  return category === "full" ? text("categoryFull") : text("categoryInterface");
}

function dateLabel(timestamp) {
  if (!timestamp) return text("allTranslations");
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return text("allTranslations");
  return new Intl.DateTimeFormat(state.locale === "ar" ? "ar" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function statusErrorMessage(code) {
  const errors = {
    INVALID_CREDENTIALS: "invalidCredentials",
    LOGIN_THROTTLED: "firebaseRateLimited",
    ADMIN_REQUIRED: "accessDenied",
    TITLE_REQUIRED: "titleRequired",
    TITLE_EN_REQUIRED: "englishTitleRequired",
    DEVELOPER_REQUIRED: "developerRequired",
    GENRE_REQUIRED: "genreRequired",
    DESCRIPTION_TOO_LONG: "descriptionTooLong",
    INVALID_CATEGORY: "invalidCategory",
    INVALID_STATUS: "invalidStatus",
    INVALID_VISIBILITY: "invalidVisibility",
    INVALID_COVER: "invalidCover",
    INVALID_YEAR: "invalidYear",
    INVALID_POPULARITY: "invalidPopularity",
    INVALID_TRANSLATION_URL: "invalidTranslationUrl",
    EXTERNAL_LINK_UNAVAILABLE: "externalLinkUnavailable",
    TRANSLATION_NOT_FOUND: "translationNotFound",
    COVER_NOT_FOUND: "coverNotFound",
    COVER_SIZE_LIMIT: "coverSizeLimit",
    UNSUPPORTED_COVER: "unsupportedCover",
    INVALID_TRANSLATION: "saveFailed",
    FIREBASE_PROVIDER_DISABLED: "firebaseProviderDisabled",
    FIREBASE_PERMISSION_DENIED: "firebasePermissionDenied",
    FIREBASE_UNAVAILABLE: "cloudConnectionFailed",
    FIREBASE_STORAGE_ERROR: "cloudImageFailed",
    FIREBASE_CONFIGURATION: "cloudConfigurationRequired"
  };
  return text(errors[code] || "authenticationUnavailable");
}

function firebaseErrorCode(error) {
  const code = error?.code || "";
  if (code === "auth/invalid-credential" ||
      code === "auth/user-not-found" ||
      code === "auth/wrong-password" ||
      code === "auth/invalid-email" ||
      code === "auth/user-disabled") return "INVALID_CREDENTIALS";
  if (code === "auth/too-many-requests") return "LOGIN_THROTTLED";
  if (code === "auth/operation-not-allowed") return "FIREBASE_PROVIDER_DISABLED";
  if (code === "auth/invalid-api-key" ||
      code === "auth/api-key-not-valid.-please-pass-a-valid-api-key." ||
      code === "auth/auth-domain-config-required" ||
      code === "auth/unauthorized-domain" ||
      code === "auth/missing-api-key") return "FIREBASE_CONFIGURATION";
  if (code === "auth/network-request-failed" ||
      code === "unavailable" ||
      code === "deadline-exceeded" ||
      code === "auth/network-error") return "FIREBASE_UNAVAILABLE";
  if (code === "permission-denied" ||
      code === "storage/unauthorized" ||
      code === "storage/unauthenticated") return "FIREBASE_PERMISSION_DENIED";
  if (code.startsWith("storage/")) return "FIREBASE_STORAGE_ERROR";
  if (code === "not-found" || code === "failed-precondition") return "FIREBASE_CONFIGURATION";
  return code || "FIREBASE_UNAVAILABLE";
}

function showFirebaseError(error, element = null) {
  console.error("Firebase request failed:", error);
  if (element) updateMessage(element, statusErrorMessage(firebaseErrorCode(error)));
  else showToast(statusErrorMessage(firebaseErrorCode(error)));
}

async function hydrateCloudCovers(items, { all = false, silent = false } = {}) {
  const visibleCovers = new Set([...document.querySelectorAll("[data-cover-key]")]
    .map((image) => image.dataset.coverKey));
  const covers = new Set(
    items.map((item) => item.cover).filter((cover) =>
      typeof cover === "string" &&
      (all || visibleCovers.has(cover)) &&
      (cover.startsWith("storage:") || cover.startsWith("firestore:covers/")) &&
      !cloudCoverUrls.has(cover) && !cloudCoverRequests.has(cover))
  );

  let coverLoadError = null;
  await Promise.all([...covers].map(async (cover) => {
    try {
      await queueCloudCoverDownload(cover);
    } catch (error) {
      console.error("Unable to load a Firebase game cover:", error);
      coverLoadError ||= error;
    }
  }));

  const editorCover = document.querySelector("#translation-cover").value;
  if (editorDialog.open && cloudCoverUrls.has(editorCover)) {
    const preview = document.querySelector("#cover-preview img");
    if (preview) preview.src = cloudCoverUrls.get(editorCover);
  }
  if (coverLoadError && !silent) showToast(statusErrorMessage(firebaseErrorCode(coverLoadError)));
}

function updateMessage(element, message, isSuccess = false) {
  element.textContent = message;
  element.hidden = false;
  element.classList.toggle("success", isSuccess);
}

function hideMessage(element) {
  element.textContent = "";
  element.hidden = true;
  element.classList.remove("success");
}

function showToast(messageOrKey) {
  const message = translations[state.locale][messageOrKey] || messageOrKey;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastRegion.append(toast);
  window.setTimeout(() => toast.remove(), 3200);
}

function showUpdateNotice(messageKey, values = {}, { canInstall = false, progress: progressValue = null } = {}) {
  if (updateToastTimer !== null) {
    window.clearTimeout(updateToastTimer);
    updateToastTimer = null;
  }
  updateToast?.remove();
  const toast = document.createElement("div");
  toast.className = "toast update-toast";
  toast.setAttribute("role", "status");

  const message = document.createElement("p");
  message.className = "update-toast-message";
  message.textContent = text(messageKey).replace(/\{(\w+)\}/g, (_match, key) =>
    String(values[key] ?? ""));
  toast.append(message);

  if (typeof progressValue === "number") {
    const progress = document.createElement("progress");
    progress.className = "update-toast-progress";
    progress.max = 100;
    progress.value = Number.isFinite(progressValue)
      ? Math.max(0, Math.min(100, progressValue))
      : 0;
    progress.setAttribute("aria-label", text("updateDownloading"));
    toast.append(progress);
  }

  if (canInstall) {
    const actions = document.createElement("div");
    actions.className = "update-toast-actions";
    const installButton = document.createElement("button");
    installButton.type = "button";
    installButton.className = "update-toast-install";
    installButton.textContent = text("updateInstall");
    installButton.addEventListener("click", () => void installDownloadedUpdate(installButton));
    const laterButton = document.createElement("button");
    laterButton.type = "button";
    laterButton.className = "update-toast-later";
    laterButton.textContent = text("updateLater");
    laterButton.addEventListener("click", () => {
      toast.remove();
      if (updateToast === toast) {
        updateToast = null;
        if (updateToastTimer !== null) {
          window.clearTimeout(updateToastTimer);
          updateToastTimer = null;
        }
      }
    });
    actions.append(installButton, laterButton);
    toast.append(actions);
  }

  toastRegion.prepend(toast);
  updateToast = toast;
  if (!canInstall && typeof progressValue !== "number") {
    updateToastTimer = window.setTimeout(() => {
      if (updateToast === toast) {
        toast.remove();
        updateToast = null;
      }
      updateToastTimer = null;
    }, 5000);
  }
}

function showMandatoryUpdateState(messageKey, values = {}, { progress = null, ready = false, failed = false } = {}) {
  if (!mandatoryUpdateDialog.open) mandatoryUpdateDialog.showModal();
  const message = document.querySelector("#mandatory-update-message");
  message.textContent = text(messageKey).replace(/\{(\w+)\}/g, (_match, key) =>
    String(values[key] ?? ""));

  const progressElement = document.querySelector("#mandatory-update-progress");
  progressElement.hidden = typeof progress !== "number";
  if (typeof progress === "number") {
    progressElement.value = Math.max(0, Math.min(100, progress));
  }

  document.querySelector("#mandatory-update-retry").hidden = !failed;
  const installButton = document.querySelector("#mandatory-update-install");
  installButton.hidden = !ready;
  installButton.disabled = false;
  installButton.textContent = text("mandatoryUpdateRestart");
}

function closeMandatoryUpdate() {
  mandatoryUpdateMode = false;
  if (mandatoryUpdateDialog.open) mandatoryUpdateDialog.close();
}

function showWhatsNewIfNeeded() {
  if (!installedAppVersion || !state.discordAccessGranted || whatsNewDialog.open) return;
  const storageKey = "dreko-whats-new-version";
  try {
    if (localStorage.getItem(storageKey) === installedAppVersion) return;
  } catch (error) {
    console.error("Unable to read the release notes version:", error?.name || "UNKNOWN");
  }

  document.querySelector("#whats-new-version").textContent =
    text("whatsNewVersion").replace("{version}", installedAppVersion);
  const notes = document.querySelector("#whats-new-list");
  notes.replaceChildren();
  for (const key of ["whatsNewAutoUpdate", "whatsNewRequiredUpdate"]) {
    const item = document.createElement("li");
    item.textContent = text(key);
    notes.append(item);
  }
  whatsNewDialog.showModal();
}

async function startPostLoginExperience() {
  if (postLoginExperienceStarted || !state.discordAccessGranted) return;
  postLoginExperienceStarted = true;
  if (!isPackagedApp) {
    showWhatsNewIfNeeded();
    return;
  }
  mandatoryUpdateMode = true;
  showMandatoryUpdateState("mandatoryUpdateChecking");
  await checkForApplicationUpdates({ mandatory: true });
}

function handleUpdateStatus(status) {
  if (!status || typeof status.type !== "string") return;
  switch (status.type) {
    case "checking":
      if (mandatoryUpdateMode) showMandatoryUpdateState("mandatoryUpdateChecking");
      else showUpdateNotice("updateChecking");
      break;
    case "available":
      requiredUpdateVersion = String(status.version || "");
      if (mandatoryUpdateMode) {
        showMandatoryUpdateState("mandatoryUpdateDownloading", {
          version: requiredUpdateVersion,
          percent: "0"
        }, { progress: 0 });
      } else {
        showUpdateNotice("updateAvailable", { version: String(status.version || "") });
      }
      break;
    case "progress": {
      const percent = Number(status.percent);
      const safePercent = Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0;
      const formattedPercent = new Intl.NumberFormat(state.locale, { maximumFractionDigits: 0 }).format(safePercent);
      if (mandatoryUpdateMode) {
        showMandatoryUpdateState("mandatoryUpdateDownloading", {
          version: requiredUpdateVersion,
          percent: formattedPercent
        }, { progress: safePercent });
      } else {
        showUpdateNotice("updateDownloading", { percent: formattedPercent }, { progress: safePercent });
      }
      break;
    }
    case "not-available":
      updateCheckPending = false;
      if (mandatoryUpdateMode) {
        closeMandatoryUpdate();
        showWhatsNewIfNeeded();
      } else {
        showUpdateNotice("updateCurrent", { version: String(status.version || "") });
      }
      break;
    case "downloaded":
      updateCheckPending = false;
      requiredUpdateVersion = String(status.version || requiredUpdateVersion);
      if (mandatoryUpdateMode) {
        showMandatoryUpdateState("mandatoryUpdateInstalling", {}, { progress: 100 });
      } else {
        showUpdateNotice("updateInstalling");
      }
      break;
    case "error":
      updateCheckPending = false;
      if (mandatoryUpdateMode) showMandatoryUpdateState("mandatoryUpdateFailed", {}, { failed: true });
      else showUpdateNotice("updateUnavailable");
      break;
    default:
      break;
  }
}

async function checkForApplicationUpdates({ mandatory = false } = {}) {
  if (mandatory) mandatoryUpdateMode = true;
  if (updateCheckPending) return;
  updateCheckPending = true;
  if (mandatoryUpdateMode) showMandatoryUpdateState("mandatoryUpdateChecking");
  else showUpdateNotice("updateChecking");
  if (!api?.checkForUpdates) {
    updateCheckPending = false;
    if (mandatoryUpdateMode) showMandatoryUpdateState("mandatoryUpdateFailed", {}, { failed: true });
    else showUpdateNotice("updateUnavailable");
    return;
  }
  try {
    const result = await api.checkForUpdates();
    if (!result?.ok) {
      updateCheckPending = false;
      const messageKey = result?.code === "UPDATE_FEED_NOT_CONFIGURED"
        ? "updateFeedNotConfigured"
        : result?.code === "UPDATES_REQUIRE_INSTALLED_APP"
          ? "updateRequiresInstalledApp"
          : "updateUnavailable";
      if (mandatoryUpdateMode) showMandatoryUpdateState("mandatoryUpdateFailed", {}, { failed: true });
      else showUpdateNotice(messageKey);
    }
  } catch (error) {
    console.error("Unable to check for Dreko updates:", error?.name || "UNKNOWN");
    updateCheckPending = false;
    if (mandatoryUpdateMode) showMandatoryUpdateState("mandatoryUpdateFailed", {}, { failed: true });
    else showUpdateNotice("updateUnavailable");
  }
}

async function installDownloadedUpdate(button) {
  button.disabled = true;
  showUpdateNotice("updateInstalling");
  try {
    const result = await api.installUpdate();
    if (!result?.ok) {
      showUpdateNotice("updateInstallFailed");
    }
  } catch (error) {
    console.error("Unable to install the Dreko update:", error?.name || "UNKNOWN");
    showUpdateNotice("updateInstallFailed");
  }
}

async function installRequiredUpdate() {
  const button = document.querySelector("#mandatory-update-install");
  button.disabled = true;
  document.querySelector("#mandatory-update-message").textContent = text("mandatoryUpdateInstalling");
  try {
    const result = await api.installUpdate();
    if (!result?.ok) throw new Error(result?.code || "UPDATE_INSTALL_FAILED");
  } catch (error) {
    console.error("Unable to start the required Dreko update:", error?.code || error?.name || "UNKNOWN");
    showMandatoryUpdateState("mandatoryUpdateInstallFailed", {}, { progress: 100, ready: true });
  }
}

document.querySelector("#mandatory-update-retry").addEventListener("click", () => {
  void checkForApplicationUpdates({ mandatory: true });
});
document.querySelector("#mandatory-update-install").addEventListener("click", () => {
  void installRequiredUpdate();
});
mandatoryUpdateDialog.addEventListener("cancel", (event) => event.preventDefault());
document.querySelector("#whats-new-done").addEventListener("click", () => {
  try {
    localStorage.setItem("dreko-whats-new-version", installedAppVersion);
  } catch (error) {
    console.error("Unable to save the release notes version:", error?.name || "UNKNOWN");
  }
  whatsNewDialog.close();
});

function updateHeader() {
  const isMember = Boolean(state.discordProfile);
  const accountLabel = document.querySelector("#discord-user-label");
  accountLabel.textContent = state.discordProfile?.username || text("guest");
  const avatarFallback = (state.discordProfile?.username || "D").slice(0, 1).toLocaleUpperCase();
  setDiscordAvatar(document.querySelector("#profile-button .profile-avatar"), state.discordProfile, avatarFallback);
  setDiscordAvatar(document.querySelector("#profile-avatar"), state.discordProfile, avatarFallback);
  document.querySelector("#admin-nav-link").hidden = !state.isAdministrator;
  document.querySelector("#profile-button").hidden = !isMember;
  document.querySelector("#discord-logout").hidden = !isMember;
  document.querySelector("#profile-button").setAttribute(
    "aria-pressed",
    String(state.screen === "profile")
  );
  document.querySelector("#admin-nav-link").classList.toggle(
    "active",
    state.screen === "admin" || state.screen === "auth"
  );
  document.querySelector("#admin-nav-link").setAttribute(
    "aria-pressed",
    String(state.screen === "admin" || state.screen === "auth")
  );
  if (state.screen === "profile") renderProfile();
}

function setDiscordAvatar(container, profile, fallbackText) {
  const fallback = container.querySelector(".profile-avatar-fallback");
  const image = container.querySelector(".discord-avatar-image");
  fallback.textContent = fallbackText;
  fallback.hidden = false;
  image.hidden = true;
  image.removeAttribute("src");

  if (!/^\d{17,20}$/.test(profile?.id || "") ||
      !/^[A-Za-z0-9_]{1,128}$/.test(profile?.avatar || "")) {
    fallback.hidden = false;
    return;
  }

  const extension = profile.avatar.startsWith("a_") ? "gif" : "png";
  image.onerror = () => {
    image.hidden = true;
    fallback.hidden = false;
    image.removeAttribute("src");
  };
  image.onload = () => {
    image.hidden = false;
    fallback.hidden = true;
  };
  image.src = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${extension}?size=128`;
}

function discordAccountCreatedAt(userId) {
  if (!/^\d{17,20}$/.test(userId || "")) return null;
  const timestamp = Number((BigInt(userId) >> 22n) + 1420070400000n);
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
}

function renderProfile() {
  const profile = state.discordProfile;
  document.querySelector("#profile-name").textContent = profile?.username || "—";
  const createdAt = discordAccountCreatedAt(profile?.id);
  document.querySelector("#profile-created").textContent = createdAt
    ? new Intl.DateTimeFormat(state.locale === "ar" ? "ar" : "en", {
      calendar: "gregory",
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(createdAt)
    : text("profileDateUnavailable");
  const guildJoinedAt = typeof profile?.joinedAt === "string" ? new Date(profile.joinedAt) : null;
  document.querySelector("#profile-guild-joined").textContent = guildJoinedAt &&
      Number.isFinite(guildJoinedAt.getTime())
    ? new Intl.DateTimeFormat(state.locale === "ar" ? "ar" : "en", {
      calendar: "gregory",
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(guildJoinedAt)
    : text("profileDateUnavailable");
  const accountType = effectiveAccountType(state.discordAccount);
  document.querySelector("#profile-account-type").textContent = text(
    accountType === "premium" ? "accountTypePremium" : "accountTypeStandard"
  );
  const expiryElement = document.querySelector("#profile-premium-expiry");
  if (accountType === "premium" && state.discordAccount?.premiumExpiresAt) {
    expiryElement.textContent = `${text("premiumExpiresLabel")}: ${formatAccountDate(state.discordAccount.premiumExpiresAt)}`;
    expiryElement.hidden = false;
  } else {
    expiryElement.textContent = "";
    expiryElement.hidden = true;
  }
  renderUsedTranslations();
}

function scheduleAccountPlanRefresh() {
  if (accountPlanExpiryTimer) window.clearTimeout(accountPlanExpiryTimer);
  accountPlanExpiryTimer = null;
  const expirations = [state.discordAccount, ...state.adminAccounts]
    .filter((account) => account?.accountType === "premium" && account.premiumExpiresAt)
    .map((account) => Date.parse(account.premiumExpiresAt))
    .filter((expiresAt) => Number.isFinite(expiresAt) && expiresAt > Date.now());
  if (!expirations.length) return;
  const nextExpiry = Math.min(...expirations);
  accountPlanExpiryTimer = window.setTimeout(() => {
    syncPremiumSubscriptionState();
    renderCatalog();
    if (state.screen === "profile") renderProfile();
    if (state.screen === "admin" && state.adminSubpage === "accounts") renderAdminAccounts();
    scheduleAccountPlanRefresh();
  }, Math.min(Math.max(0, nextExpiry - Date.now() + 50), 2_147_000_000));
}

function effectiveAccountType(account) {
  if (account?.accountType !== "premium") return "standard";
  if (account.premiumExpiresAt === null) return "premium";
  const expiresAt = Date.parse(account.premiumExpiresAt || "");
  return Number.isFinite(expiresAt) && expiresAt > Date.now() ? "premium" : "standard";
}

function formatAccountDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return text("accountExpiryNone");
  return new Intl.DateTimeFormat(state.locale === "ar" ? "ar" : "en", {
    calendar: "gregory",
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

function usedTranslationsStorageKey() {
  const uid = state.firebaseUser?.uid;
  return uid ? `dreko-used-translations:${uid}` : "";
}

function readUsedTranslations() {
  const key = usedTranslationsStorageKey();
  if (!key) return [];
  const stored = localStorage.getItem(key);
  if (!stored) return [];

  let entries;
  try {
    entries = JSON.parse(stored);
  } catch (error) {
    console.error("Unable to read the used translations list:", error);
    localStorage.removeItem(key);
    return [];
  }
  if (!Array.isArray(entries)) {
    console.error("The stored used translations list has an invalid format.");
    localStorage.removeItem(key);
    return [];
  }

  return entries.filter((entry) =>
    entry &&
    typeof entry.id === "string" &&
    /^[A-Za-z0-9-]{1,64}$/.test(entry.id) &&
    typeof entry.title === "string" &&
    typeof entry.usedAt === "string" &&
    !Number.isNaN(Date.parse(entry.usedAt))
  ).slice(0, 100);
}

function renderUsedTranslations() {
  const entries = readUsedTranslations();
  document.querySelector("#used-translations-count").textContent =
    entries.length.toLocaleString(state.locale);
}

function recordUsedTranslation(item) {
  const key = usedTranslationsStorageKey();
  if (!key || !state.discordAccessGranted) return;

  const entries = readUsedTranslations();
  const previousIndex = entries.findIndex((entry) => entry.id === item.id);
  if (previousIndex !== -1) entries.splice(previousIndex, 1);
  entries.unshift({
    id: item.id,
    title: String(item.title || "").slice(0, 100),
    titleEn: String(item.titleEn || "").slice(0, 100),
    developer: String(item.developer || "").slice(0, 80),
    usedAt: new Date().toISOString()
  });
  try {
    localStorage.setItem(key, JSON.stringify(entries.slice(0, 100)));
  } catch (error) {
    console.error("Unable to save the used translations list:", error);
    showToast(state.locale === "ar" ? "تعذر حفظ قائمة تعريباتك على هذا الجهاز." : "Unable to save your translations on this device.");
    return;
  }
  if (state.screen === "profile") renderUsedTranslations();
}

function renderFeaturedCarousel() {
  const track = document.querySelector("#featured-track");
  const timestampValue = (value) => {
    const dateValue = value && typeof value.toDate === "function" ? value.toDate() : value;
    const timestamp = new Date(dateValue || 0).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  };
  const seenGames = new Set();
  const latest = [...state.catalog]
    .sort((left, right) => {
      if (Number.isFinite(left.sortOrder) && Number.isFinite(right.sortOrder)) {
        return left.sortOrder - right.sortOrder || left.id.localeCompare(right.id);
      }
      return timestampValue(right.createdAt || right.updatedAt) - timestampValue(left.createdAt || left.updatedAt) ||
        timestampValue(right.updatedAt) - timestampValue(left.updatedAt) ||
        left.id.localeCompare(right.id);
    })
    .filter((item) => {
      const identity = normalizedGameIdentity(item.titleEn || item.title);
      if (!identity || seenGames.has(identity)) return false;
      seenGames.add(identity);
      return true;
    })
    .slice(0, 10);
  featuredItemCount = latest.length;

  if (!latest.length) {
    track.replaceChildren();
    track.style.transform = "";
    featuredPositionInitialized = false;
    updateFeaturedLoopDistance();
    return;
  }

  const cards = latest.map((item, index) => {
    const title = translationName(item);
    return `
      <article class="feature-card featured-game-card${isPremiumTranslationLocked(item) ? " premium-locked-card" : ""}" style="--enter-delay:${Math.min(index, 6) * 32}ms" data-featured-id="${escapeHtml(item.id)}" tabindex="0" role="button" aria-label="${escapeHtml(title)}${isPremiumTranslationLocked(item) ? `: ${escapeHtml(text("premiumAccessRequired"))}` : ""}">
        <img class="featured-game-art" data-cover-key="${escapeHtml(item.cover)}" src="${escapeHtml(localCoverPath(item.cover))}" alt="" draggable="false" fetchpriority="${index < 4 ? "high" : "auto"}" />
        ${item.premium === true ? `
          <span class="premium-translation-badge">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 12H5L3 7Z"/><path d="M5 22h14"/></svg>
            <span>${escapeHtml(text("premiumTranslationBadge"))}</span>
          </span>
        ` : ""}
        ${item.premium === true ? `<span class="premium-exclusive-overlay">${escapeHtml(text(isPremiumTranslationLocked(item) ? "premiumAccessRequired" : "premiumExclusiveLabel"))}</span>` : ""}
      </article>
    `;
  });

  track.classList.remove("is-animating");
  track.style.transform = "";
  track.innerHTML = cards.join("");
  const originals = Array.from(track.children);
  const groupWidth = track.scrollWidth;
  const viewportWidth = track.parentElement.clientWidth;
  const copyCount = groupWidth > 0
    ? Math.max(1, Math.ceil(viewportWidth / groupWidth))
    : 1;
  for (let copyIndex = 0; copyIndex < copyCount; copyIndex += 1) {
    const copies = originals.map((original) => {
      const card = original.cloneNode(true);
      card.setAttribute("aria-hidden", "true");
      card.setAttribute("tabindex", "-1");
      return card;
    });
    track.append(...copies);
  }
  updateFeaturedLoopDistance();
  track.style.transform = `translate3d(${-featuredOffset}px, 0, 0)`;
  if (!featuredTrackFrame) {
    featuredLastFrameTime = 0;
    featuredTrackFrame = requestAnimationFrame(animateFeaturedCarousel);
  }

  track.querySelectorAll(".featured-game-art").forEach((image) => {
    image.addEventListener("error", () => {
      if (image.dataset.fallback !== "true") {
        image.dataset.fallback = "true";
        image.src = "./assets/covers/astral-observer.svg";
      }
    }, { once: true });
  });
}

function animateFeaturedCarousel(timestamp) {
  if (document.visibilityState === "visible" && featuredLoopDistance > 0) {
    if (featuredLastFrameTime) {
      const elapsed = Math.min(timestamp - featuredLastFrameTime, 50);
      featuredOffset = (featuredOffset + elapsed * 0.05) % featuredLoopDistance;
    }
    document.querySelector("#featured-track").style.transform =
      `translate3d(${-featuredOffset}px, 0, 0)`;
  }
  featuredLastFrameTime = document.visibilityState === "visible" ? timestamp : 0;
  featuredTrackFrame = requestAnimationFrame(animateFeaturedCarousel);
}

function renderLibraryPagination(itemCount) {
  const pageCount = Math.ceil(itemCount / 18);
  state.libraryPage = Math.min(Math.max(1, state.libraryPage), Math.max(1, pageCount));
  if (pageCount <= 1) {
    libraryPagination.hidden = true;
    libraryPagination.replaceChildren();
    return;
  }

  const visiblePages = new Set([1, pageCount]);
  if (state.libraryPage <= 3) {
    for (let page = 2; page <= Math.min(4, pageCount - 1); page += 1) {
      visiblePages.add(page);
    }
  } else {
    for (let page = state.libraryPage - 1; page <= state.libraryPage + 1; page += 1) {
      if (page > 1 && page < pageCount) visiblePages.add(page);
    }
  }

  const pages = [...visiblePages].sort((left, right) => left - right);
  const pageButtons = [];
  let previousPage = 0;
  for (const page of pages) {
    if (page - previousPage > 1) {
      pageButtons.push('<span class="pagination-ellipsis" aria-hidden="true">…</span>');
    }
    pageButtons.push(`
      <button class="pagination-button pagination-page${page === state.libraryPage ? " selected" : ""}" type="button" data-page="${page}" aria-label="${escapeHtml(text("paginationPage"))} ${page}"${page === state.libraryPage ? ' aria-current="page"' : ""}>
        ${page}
      </button>
    `);
    previousPage = page;
  }

  libraryPagination.innerHTML = `
    <button class="pagination-button pagination-next" type="button" data-page="${state.libraryPage + 1}" aria-label="${escapeHtml(text("paginationNext"))}"${state.libraryPage >= pageCount ? " disabled" : ""}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
    </button>
    ${pageButtons.join("")}
    <button class="pagination-button pagination-previous" type="button" data-page="${state.libraryPage - 1}" aria-label="${escapeHtml(text("paginationPrevious"))}"${state.libraryPage <= 1 ? " disabled" : ""}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
    </button>
  `;
  libraryPagination.hidden = false;
}

function renderCatalog() {
  if (state.installedGamesMode) {
    libraryPagination.hidden = true;
    renderInstalledGamesCatalog();
    renderFeaturedCarousel();
    return;
  }
  grid.classList.remove("installed-games-view");
  document.querySelector("#library-title").innerHTML = text("libraryTitle");
  document.querySelector("#result-count-label").textContent = text("translationCount");
  document.querySelector("#platform-button span").textContent = text("platformAll");
  document.querySelector("#platform-button").setAttribute("aria-pressed", "false");
  document.querySelector(".filter-switch").hidden = false;
  document.querySelector("#week-filter").hidden = false;
  document.querySelector("#category-filter").hidden = false;
  emptyState.querySelector("h3").textContent = text("emptyTitle");
  if (searchInput) {
    searchInput.placeholder = text("searchPlaceholder");
    searchInput.setAttribute("aria-label", text("searchLabel"));
  }
  const query = state.query.trim().toLocaleLowerCase(state.locale);
  const seenGames = new Set();
  const filtered = state.catalog
    .filter((item) => {
      const fields = [
        item.title,
        item.titleEn,
        item.developer,
        genreName(item.genre),
        item.id
      ];
      const matchesQuery = !query || fields.some((value) =>
        String(value || "").toLocaleLowerCase(state.locale).includes(query)
      );
      const matchesCategory = state.category === "all" || item.category === state.category;
      const matchesPremium = !state.premiumOnly || item.premium === true;
      return matchesQuery && matchesCategory && matchesPremium;
    })
    .sort((left, right) => {
      if (state.filter === "popular") return right.popularity - left.popularity;
      if (Number.isFinite(left.sortOrder) && Number.isFinite(right.sortOrder)) {
        return left.sortOrder - right.sortOrder || left.id.localeCompare(right.id);
      }
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    })
    .filter((item) => {
      const identity = normalizedGameIdentity(item.titleEn || item.title);
      if (!identity || seenGames.has(identity)) return false;
      seenGames.add(identity);
      return true;
    });

  renderLibraryPagination(filtered.length);
  const pageStart = (state.libraryPage - 1) * 18;
  const pageItems = filtered.slice(pageStart, pageStart + 18);
  grid.innerHTML = pageItems.map((item, index) => {
    const title = translationName(item);
    return `
      <article class="translation-card${item.premium === true ? " premium-card" : ""}${isPremiumTranslationLocked(item) ? " premium-locked-card" : ""}" style="--enter-delay:${Math.min(index, 8) * 24}ms" data-id="${escapeHtml(item.id)}" tabindex="0" role="button" aria-label="${escapeHtml(title)}${isPremiumTranslationLocked(item) ? `: ${escapeHtml(text("premiumAccessRequired"))}` : ""}">
        <div class="game-cover">
          <img class="game-cover-art" data-cover-key="${escapeHtml(item.cover)}" src="${escapeHtml(localCoverPath(item.cover))}" alt="" draggable="false" loading="${index < 6 ? "eager" : "lazy"}" fetchpriority="${index < 4 ? "high" : "auto"}" />
          ${item.premium === true ? `
            <span class="premium-translation-badge">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 12H5L3 7Z"/><path d="M5 22h14"/></svg>
              <span>${escapeHtml(text("premiumTranslationBadge"))}</span>
            </span>
            <span class="premium-exclusive-overlay">${escapeHtml(text(isPremiumTranslationLocked(item) ? "premiumAccessRequired" : "premiumExclusiveLabel"))}</span>
          ` : ""}
        </div>
        <div class="card-content">
          <h3 class="game-title" lang="en" dir="ltr">${escapeHtml(item.titleEn || item.title)}</h3>
          <div class="game-meta">
            <span class="game-meta-genre">${escapeHtml(genreName(item.genre, true))}</span>
            <span class="meta-divider" aria-hidden="true">·</span>
            <span class="game-meta-year">${escapeHtml(String(item.year))}</span>
          </div>
        </div>
      </article>
    `;
  }).join("");

  grid.querySelectorAll(".game-cover-art").forEach((image) => {
    image.addEventListener("error", () => {
      if (image.dataset.fallback !== "true") {
        image.dataset.fallback = "true";
        image.src = "./assets/covers/astral-observer.svg";
      }
    }, { once: true });
  });

  grid.classList.toggle("list-view", state.view === "list");
  resultCount.textContent = filtered.length.toLocaleString(state.locale);
  if (state.premiumOnly && filtered.length === 0) {
    emptyState.querySelector("p").textContent = text("premiumOnlyEmpty");
  } else {
    emptyState.querySelector("p").textContent = text("emptyDescription");
  }
  emptyState.hidden = filtered.length > 0;
  grid.hidden = filtered.length === 0;
  renderFeaturedCarousel();
  void hydrateCloudCovers(state.catalog);
}

function renderInstalledGamesCatalog() {
  libraryPagination.hidden = true;
  grid.classList.add("installed-games-view");
  grid.classList.toggle("list-view", state.view === "list");
  document.querySelector("#library-title").textContent = text("myGamesTitle");
  document.querySelector("#result-count-label").textContent = text("installedGamesCount");
  document.querySelector("#platform-button span").textContent = text("platformBackToTranslations");
  document.querySelector("#platform-button").setAttribute("aria-pressed", "true");
  document.querySelector(".filter-switch").hidden = true;
  document.querySelector("#week-filter").hidden = true;
  document.querySelector("#category-filter").hidden = true;
  categoryMenu.hidden = true;
  searchInput.placeholder = text("myGamesSearch");
  searchInput.setAttribute("aria-label", text("myGamesSearch"));

  if (state.installedGamesStatus === "loading" ||
      state.installedGamesStatus === "idle" ||
      state.installedGamesStatus === "error" ||
      !state.steamDetected ||
      state.installedGames.length === 0) {
    const message = state.installedGamesStatus === "loading" || state.installedGamesStatus === "idle"
      ? "gamesLoading"
      : state.installedGamesStatus === "error"
        ? "gamesLoadError"
        : !state.steamDetected ? "steamUnavailable" : "noInstalledGames";
    grid.replaceChildren();
    grid.hidden = true;
    resultCount.textContent = "0";
    emptyState.querySelector("h3").textContent = text("myGamesTitle");
    emptyState.querySelector("p").textContent = text(message);
    emptyState.hidden = false;
    document.querySelector("#platform-button span").textContent = text("platformBackToTranslations");
    return;
  }

  const query = state.query.trim().toLocaleLowerCase(state.locale);
  const games = state.installedGames.filter((game) =>
    game.title.toLocaleLowerCase(state.locale).includes(query));
  grid.innerHTML = games.map((game) => `
    <article class="translation-card installed-game-tile" data-app-id="${escapeHtml(game.appId)}" tabindex="0" role="button" aria-label="${escapeHtml(game.title)}: ${escapeHtml(text("requestTranslation"))}">
      <div class="game-cover">
        <span class="installed-game-placeholder" aria-hidden="true">${escapeHtml(game.title.slice(0, 1).toLocaleUpperCase())}</span>
        <img class="game-cover-art installed-game-cover-art" src="https://cdn.cloudflare.steamstatic.com/steam/apps/${encodeURIComponent(game.appId)}/header.jpg" alt="" draggable="false" loading="lazy" />
      </div>
      <div class="card-content">
        <h3 class="game-title" lang="en" dir="auto">${escapeHtml(game.title)}</h3>
      </div>
    </article>
  `).join("");
  grid.querySelectorAll(".installed-game-cover-art").forEach((image) => {
    const useFallback = () => {
      image.hidden = true;
    };
    image.addEventListener("load", () => {
      image.previousElementSibling.hidden = true;
    }, { once: true });
    image.addEventListener("error", useFallback, { once: true });
    if (image.complete) {
      if (image.naturalWidth > 0) image.previousElementSibling.hidden = true;
      else useFallback();
    }
  });
  resultCount.textContent = games.length.toLocaleString(state.locale);
  emptyState.querySelector("h3").textContent = text("emptyTitle");
  emptyState.querySelector("p").textContent = text(games.length ? "emptyDescription" : "noMatchingGames");
  emptyState.hidden = games.length > 0;
  grid.hidden = games.length === 0;
}

function renderAdminTable() {
  const search = state.adminQuery.trim().toLocaleLowerCase(state.locale);
  const rows = state.adminTranslations.filter((item) => {
    const matchesVisibility = state.adminVisibility === "all" || item.visibility === state.adminVisibility;
    const matchesSearch = !search || [
      item.title,
      item.titleEn,
      item.developer,
      item.id,
      genreName(item.genre)
    ].some((value) => String(value || "").toLocaleLowerCase(state.locale).includes(search));
    return matchesVisibility && matchesSearch;
  });

  document.querySelector("#stat-total").textContent = state.adminTranslations.length.toLocaleString(state.locale);
  document.querySelector("#stat-published").textContent = state.adminTranslations.filter((item) => item.visibility === "published").length.toLocaleString(state.locale);
  document.querySelector("#stat-drafts").textContent = state.adminTranslations.filter((item) => item.visibility === "draft").length.toLocaleString(state.locale);
  document.querySelector("#stat-ready").textContent = state.adminTranslations.filter((item) => item.status === "ready").length.toLocaleString(state.locale);
  document.querySelector("#admin-count").textContent = state.adminTranslations.length.toLocaleString(state.locale);

  document.querySelector("#admin-table-body").innerHTML = rows.map((item) => {
    const position = state.adminTranslations.findIndex((translation) => translation.id === item.id);
    const visibilityAction = item.visibility === "published" ? "hideTranslation" : "publishTranslation";
    return `
    <tr data-id="${escapeHtml(item.id)}">
      <td>
        <div class="admin-game-cell">
          <div class="admin-game-thumb"><img data-cover-key="${escapeHtml(item.cover)}" src="${escapeHtml(localCoverPath(item.cover))}" alt="" /></div>
          <div class="admin-game-titles"><strong>${escapeHtml(item.title)}</strong><small lang="en">${escapeHtml(item.titleEn)}</small></div>
        </div>
      </td>
      <td>${escapeHtml(genreName(item.genre, true))}</td>
      <td><span class="admin-category-badge ${item.category === "full" ? "full" : ""}">${escapeHtml(categoryName(item.category))}</span></td>
      <td><span class="admin-visibility ${item.visibility === "published" ? "published" : ""}">${escapeHtml(text(item.visibility === "published" ? "publicVisibility" : "privateVisibility"))}</span></td>
      <td dir="auto">${escapeHtml(dateLabel(item.updatedAt))}</td>
      <td>
        <div class="admin-row-actions">
          <button class="row-action" type="button" data-admin-action="edit" data-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(text("editTranslation"))}" title="${escapeHtml(text("editTranslation"))}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5 4 4M4 20l4.5-1L20 7.5 16.5 4 5 15.5 4 20Z"/></svg>
          </button>
          <button class="row-action" type="button" data-admin-action="visibility" data-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(text(visibilityAction))}" title="${escapeHtml(text(visibilityAction))}">
            ${item.visibility === "published"
              ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path d="m4 4 16 16"/></svg>'
              : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>'}
          </button>
          <button class="row-action" type="button" data-admin-action="move-up" data-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(text("moveTranslationUp"))}" title="${escapeHtml(text("moveTranslationUp"))}"${position <= 0 ? " disabled" : ""}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6"/></svg>
          </button>
          <button class="row-action" type="button" data-admin-action="move-down" data-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(text("moveTranslationDown"))}" title="${escapeHtml(text("moveTranslationDown"))}"${position === state.adminTranslations.length - 1 ? " disabled" : ""}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14m6-6-6 6-6-6"/></svg>
          </button>
          <button class="row-action delete" type="button" data-admin-action="delete" data-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(text("deleteTranslation"))}" title="${escapeHtml(text("deleteTranslation"))}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16m-10 4v6m4-6v6M6 7l1 13h10l1-13m-9 0V4h6v3"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `;
  }).join("");
  document.querySelector(".admin-table-wrap").hidden = rows.length === 0;
  document.querySelector("#admin-empty").hidden = rows.length > 0;
}

function renderAdminAccounts() {
  const search = state.adminAccountsQuery.trim().toLocaleLowerCase(state.locale);
  const accounts = state.adminAccounts.filter((account) => [
    account.username,
    account.discordUserId,
    account.id
  ].some((value) => String(value || "").toLocaleLowerCase(state.locale).includes(search)));
  document.querySelector("#accounts-count").textContent = accounts.length.toLocaleString(state.locale);
  document.querySelector("#accounts-admin-list").innerHTML = accounts.map((account) => {
    const isPremium = effectiveAccountType(account) === "premium";
    const wasPremium = account.accountType === "premium";
    const discordUserId = /^\d{17,20}$/.test(account.discordUserId || "")
      ? account.discordUserId
      : "";
    const avatarHash = discordUserId && /^[A-Za-z0-9_]+$/.test(account.avatar || "")
      ? account.avatar
      : "";
    const avatarUrl = avatarHash && discordUserId
      ? `https://cdn.discordapp.com/avatars/${encodeURIComponent(discordUserId)}/${encodeURIComponent(avatarHash)}.${avatarHash.startsWith("a_") ? "gif" : "png"}?size=96`
      : "";
    const fallback = Array.from(account.username || "D")[0].toLocaleUpperCase();
    const expiryText = wasPremium
      ? account.premiumExpiresAt
        ? isPremium
          ? `${text("accountExpiryDate")}: ${formatAccountDate(account.premiumExpiresAt)}`
          : text("accountExpiryExpired")
        : text("accountExpiryPermanent")
      : text("accountExpiryNone");
    return `
      <article class="account-admin-card" data-account-uid="${escapeHtml(account.id)}">
        <div class="account-admin-identity">
          <span class="account-admin-avatar">
            <span>${escapeHtml(fallback)}</span>
            ${avatarUrl ? `<img src="${escapeHtml(avatarUrl)}" alt="" />` : ""}
          </span>
          <div class="account-admin-copy">
            <strong>${escapeHtml(account.username || "—")}</strong>
            <small>${escapeHtml(text("accountIdLabel"))}: <bdi>${escapeHtml(account.discordUserId || account.id.replace(/^discord_/, ""))}</bdi></small>
          </div>
        </div>
        <div class="account-admin-plan">
          <span class="account-plan-badge ${isPremium ? "premium" : ""}">${escapeHtml(text(isPremium ? "accountPlanPremium" : "accountPlanStandard"))}</span>
          <small>${escapeHtml(expiryText)}</small>
        </div>
        <div class="account-admin-actions">
          <label class="account-duration">
            <span>${escapeHtml(text("premiumDurationLabel"))}</span>
            <select class="filter-select" data-account-duration>
              <option value="30">${escapeHtml(text("premiumDuration30"))}</option>
              <option value="90">${escapeHtml(text("premiumDuration90"))}</option>
              <option value="180">${escapeHtml(text("premiumDuration180"))}</option>
              <option value="365">${escapeHtml(text("premiumDuration365"))}</option>
              <option value="permanent">${escapeHtml(text("premiumDurationPermanent"))}</option>
            </select>
          </label>
          <button class="outline-button account-plan-action" type="button" data-account-action="premium">${escapeHtml(text(isPremium ? "accountRenewPremium" : "accountActivatePremium"))}</button>
          ${wasPremium ? `<button class="outline-button account-standard-action" type="button" data-account-action="standard">${escapeHtml(text("accountMakeStandard"))}</button>` : ""}
        </div>
      </article>
    `;
  }).join("");
  document.querySelector("#accounts-empty").hidden = accounts.length > 0;
  document.querySelectorAll(".account-admin-avatar img").forEach((image) => {
    image.addEventListener("error", () => {
      image.hidden = true;
    }, { once: true });
  });
}

const REPORT_ISSUE_KEYS = {
  translation: "reportIssueTranslation",
  missing: "reportIssueMissing",
  display: "reportIssueDisplay",
  font: "reportIssueFont",
  language: "reportIssueLanguage",
  crash: "reportIssueCrash",
  install: "reportIssueInstall",
  other: "reportIssueOther"
};

function reportGameTitle(item) {
  return state.locale === "ar" ? translationName(item) : item.titleEn || item.title;
}

function renderTranslationReportWizard() {
  const draft = state.reportDraft;
  if (!draft) return;
  if (draft.status === "success") {
    reportContent.innerHTML = `
      <section class="report-success">
        <span class="report-success-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg></span>
        <h2 id="report-title">${escapeHtml(text("reportSuccessTitle"))}</h2>
        <p>${escapeHtml(text("reportSuccessDescription"))}</p>
        <button class="primary-action report-primary-action" type="button" data-report-action="close">${escapeHtml(text("reportClose"))}</button>
      </section>
    `;
    return;
  }

  const selectedGame = state.catalog.find((item) => item.id === draft.translationId);
  const issueTypes = Object.entries(REPORT_ISSUE_KEYS);
  const stepLabel = text("reportStep").replace("{step}", String(draft.step));
  let stepMarkup = "";
  if (draft.step === 1) {
    const games = state.catalog.filter((item) => item.visibility === "published");
    stepMarkup = `
      <label class="report-field-label" for="report-game-search">${escapeHtml(text("reportChooseGame"))}</label>
      <div class="report-game-search">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
        <input id="report-game-search" type="search" placeholder="${escapeHtml(text("reportSearchGame"))}" autocomplete="off" />
      </div>
      <div class="report-game-grid">
        ${games.map((item) => `
          <button class="report-game-option${draft.translationId === item.id ? " selected" : ""}" type="button" data-report-game="${escapeHtml(item.id)}" aria-pressed="${String(draft.translationId === item.id)}">
            <span class="report-game-cover"><img data-cover-key="${escapeHtml(item.cover)}" src="${escapeHtml(localCoverPath(item.cover))}" alt="" loading="lazy" /></span>
            <span>${escapeHtml(reportGameTitle(item))}</span>
          </button>
        `).join("")}
      </div>
      <p class="report-game-empty" hidden>${escapeHtml(text("reportNoGames"))}</p>
    `;
  } else if (draft.step === 2) {
    stepMarkup = `
      <div class="report-selected-game">${escapeHtml(selectedGame ? reportGameTitle(selectedGame) : "")}</div>
      <fieldset class="report-fieldset">
        <legend>${escapeHtml(text("reportLatestUpdate"))}</legend>
        <p>${escapeHtml(text("reportLatestUpdateHint"))}</p>
        <div class="report-choice-row">
          ${[
            ["yes", "reportUpdateYes"],
            ["no", "reportUpdateNo"],
            ["unsure", "reportUpdateUnsure"]
          ].map(([value, key]) => `
            <button class="report-choice-card${draft.latestUpdate === value ? " selected" : ""}" type="button" data-report-update="${value}" aria-pressed="${String(draft.latestUpdate === value)}">
              <span class="report-choice-icon" aria-hidden="true">
                ${value === "yes"
                  ? '<svg viewBox="0 0 24 24"><path d="m6 12.5 4 4L18.5 8"/></svg>'
                  : value === "no"
                    ? '<svg viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17"/></svg>'
                    : '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M9.7 9a2.4 2.4 0 0 1 4.6 1c0 1.5-2.3 2-2.3 3.5m0 3h.01"/></svg>'}
              </span>
              <span>${escapeHtml(text(key))}</span>
            </button>
          `).join("")}
        </div>
      </fieldset>
      <fieldset class="report-fieldset">
        <legend>${escapeHtml(text("reportIssueQuestion"))}</legend>
        <div class="report-issue-grid">
          ${issueTypes.map(([value, key]) => `
            <button class="report-issue-option${draft.issueType === value ? " selected" : ""}" type="button" data-report-issue="${value}" aria-pressed="${String(draft.issueType === value)}">
              <span>${escapeHtml(text(key))}</span>
            </button>
          `).join("")}
        </div>
      </fieldset>
    `;
  } else {
    stepMarkup = `
      <div class="report-selected-game">${escapeHtml(selectedGame ? reportGameTitle(selectedGame) : "")}</div>
      <dl class="report-summary">
        <div><dt>${escapeHtml(text("reportLatestLabel"))}</dt><dd>${escapeHtml(text(`reportUpdateValue${draft.latestUpdate[0].toLocaleUpperCase()}${draft.latestUpdate.slice(1)}`))}</dd></div>
        <div><dt>${escapeHtml(text("reportIssueLabel"))}</dt><dd>${escapeHtml(text(REPORT_ISSUE_KEYS[draft.issueType]))}</dd></div>
      </dl>
      <label class="report-field-label" for="report-details">${escapeHtml(text("reportDetailsLabel"))}</label>
      <textarea class="report-details-input" id="report-details" maxlength="500" placeholder="${escapeHtml(text("reportDetailsPlaceholder"))}">${escapeHtml(draft.details)}</textarea>
      <div class="report-details-count">${escapeHtml(text("reportCharacters").replace("{count}", String(draft.details.length)))}</div>
      <p class="report-submit-error" role="alert" hidden></p>
    `;
  }

  reportContent.innerHTML = `
    <header class="report-header">
      <span class="eyebrow"><span class="eyebrow-line"></span>${escapeHtml(text("navReport"))}</span>
      <span class="report-step-count">${escapeHtml(stepLabel)}</span>
      <h2 id="report-title">${escapeHtml(text("reportTitle"))}</h2>
      <p>${escapeHtml(text("reportIntro"))}</p>
      <div class="report-progress" aria-hidden="true">${[1, 2, 3].map((step) =>
        `<span class="${step <= draft.step ? "complete" : ""}"></span>`).join("")}</div>
    </header>
    <div class="report-step-content">${stepMarkup}</div>
    <footer class="report-actions">
      ${draft.step > 1 ? `<button class="outline-button report-back-button" type="button" data-report-action="back">${escapeHtml(text("reportBack"))}</button>` : '<span></span>'}
      ${draft.step < 3
        ? `<button class="primary-action report-primary-action" type="button" data-report-action="next"${(draft.step === 1 && !draft.translationId) || (draft.step === 2 && (!draft.latestUpdate || !draft.issueType)) ? " disabled" : ""}>${escapeHtml(text("reportNext"))}</button>`
        : `<button class="primary-action report-primary-action" type="button" data-report-action="submit">${escapeHtml(text("reportSubmit"))}</button>`}
    </footer>
  `;

  reportContent.querySelectorAll(".report-game-cover img").forEach((image) => {
    image.addEventListener("error", () => {
      image.src = "./assets/covers/astral-observer.svg";
    }, { once: true });
  });
}

function openTranslationReport(translationId = "") {
  if (!state.discordAccessGranted || !state.firebaseUser) {
    showToast("discordGatePrompt");
    return;
  }
  if (!state.catalog.some((item) => item.visibility === "published")) {
    showToast("reportNoGames");
    return;
  }
  const selectedTranslation = translationId
    ? state.catalog.find((item) => item.id === translationId && item.visibility === "published")
    : null;
  if (translationId && !selectedTranslation) {
    showToast("reportNoGames");
    return;
  }
  state.reportDraft = {
    step: selectedTranslation ? 2 : 1,
    translationId: selectedTranslation?.id || "",
    latestUpdate: "",
    issueType: "",
    details: "",
    status: "form"
  };
  renderTranslationReportWizard();
  reportDialog.showModal();
  requestAnimationFrame(() => reportContent.querySelector("#report-game-search")?.focus());
}

async function submitTranslationReport() {
  const draft = state.reportDraft;
  const submitButton = reportContent.querySelector('[data-report-action="submit"]');
  if (!draft || draft.step !== 3 || !submitButton || submitButton.disabled) return;
  submitButton.disabled = true;
  submitButton.textContent = text("reportSubmitting");
  try {
    await firebaseCloud.submitTranslationReport({
      translationId: draft.translationId,
      latestUpdate: draft.latestUpdate,
      issueType: draft.issueType,
      details: draft.details
    }, state.firebaseUser);
    draft.status = "success";
    renderTranslationReportWizard();
  } catch (error) {
    console.error("Unable to submit translation report:", error?.code || error?.name || "UNKNOWN");
    const errorMessage = error?.code === "TRANSLATION_REPORT_ALREADY_EXISTS"
      ? text("reportAlreadySubmitted")
      : error?.code === "GUILD_MEMBERSHIP_REQUIRED" ||
          error?.code === "INVALID_DISCORD_USER"
        ? text("discordGateRejected")
        : text("reportSubmitError");
    const errorElement = reportContent.querySelector(".report-submit-error");
    if (errorElement) {
      errorElement.textContent = errorMessage;
      errorElement.hidden = false;
      submitButton.disabled = false;
      submitButton.textContent = text("reportSubmit");
    } else {
      showToast(errorMessage);
      renderTranslationReportWizard();
    }
  }
}

function renderAdminTranslationReports() {
  const query = state.adminReportsQuery.trim().toLocaleLowerCase(state.locale);
  const reports = state.adminReports.filter((report) => {
    const statusMatches = report.status === state.adminReportsStatus;
    const searchMatches = !query || [
      report.gameName,
      report.username,
      report.discordUserId,
      report.details,
      text(REPORT_ISSUE_KEYS[report.issueType] || "reportIssueOther")
    ].some((value) => String(value || "").toLocaleLowerCase(state.locale).includes(query));
    return statusMatches && searchMatches;
  });

  document.querySelector("#reports-count").textContent = reports.length.toLocaleString(state.locale);
  document.querySelector("#player-reports-list").innerHTML = reports.map((report) => {
    const date = new Date(report.createdAt);
    const dateText = Number.isNaN(date.getTime())
      ? "—"
      : new Intl.DateTimeFormat(state.locale === "ar" ? "ar" : "en", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(date);
    const discordUserId = /^\d{17,20}$/.test(report.discordUserId)
      ? report.discordUserId
      : report.uid.match(/^discord_(\d{17,20})$/)?.[1] || "";
    const avatarHash = /^[A-Za-z0-9_]{1,128}$/.test(report.avatar) ? report.avatar : "";
    const avatarUrl = discordUserId
      ? avatarHash
        ? `https://cdn.discordapp.com/avatars/${discordUserId}/${encodeURIComponent(avatarHash)}.${avatarHash.startsWith("a_") ? "gif" : "png"}?size=64`
        : `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(discordUserId) >> 22n) % 6n)}.png`
      : "";
    const translation = state.catalog.find((item) => item.id === report.translationId);
    const cover = translation ? localCoverPath(translation.cover) : "./assets/covers/astral-observer.svg";
    const statusAction = report.status === "resolved" ? "pending" : "resolved";
    const statusActionKey = report.status === "resolved" ? "reportStatusPendingAction" : "reportStatusResolvedAction";
    const latestUpdateKey = `reportUpdateValue${report.latestUpdate[0].toLocaleUpperCase()}${report.latestUpdate.slice(1)}`;
    return `
      <article class="player-report-card" data-report-id="${escapeHtml(report.id)}">
        <div class="player-report-main">
          <img class="player-report-cover"${translation ? ` data-cover-key="${escapeHtml(translation.cover)}"` : ""} src="${escapeHtml(cover)}" alt="" loading="lazy" />
          <div class="player-report-game-copy">
            <strong>${escapeHtml(report.gameName)}</strong>
            <span>${escapeHtml(text("reportIssueLabel"))}: ${escapeHtml(text(REPORT_ISSUE_KEYS[report.issueType] || "reportIssueOther"))}</span>
            <span>${escapeHtml(text("reportLatestLabel"))}: ${escapeHtml(text(latestUpdateKey))}</span>
          </div>
        </div>
        <div class="player-report-user">
          <span class="translation-request-avatar" aria-hidden="true">
            ${escapeHtml((report.username || "?").slice(0, 1).toLocaleUpperCase(state.locale))}
            ${avatarUrl ? `<img src="${escapeHtml(avatarUrl)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />` : ""}
          </span>
          <div class="translation-request-user-copy">
            <span>${escapeHtml(text("reportSubmittedBy"))}</span>
            <strong>${escapeHtml(report.username || "—")}</strong>
            <small><bdi>${escapeHtml(report.discordUserId || report.uid.replace(/^discord_/, ""))}</bdi></small>
          </div>
        </div>
        <div class="player-report-date">
          <span>${escapeHtml(text("reportSubmittedDate"))}</span>
          <time datetime="${escapeHtml(report.createdAt)}">${escapeHtml(dateText)}</time>
        </div>
        ${report.details ? `<p class="player-report-details"><strong>${escapeHtml(text("reportDetailsAdminLabel"))}:</strong> ${escapeHtml(report.details)}</p>` : ""}
        <div class="player-report-actions">
          <button class="outline-button report-status-action" type="button" data-report-action="${statusAction}">${escapeHtml(text(statusActionKey))}</button>
          <button class="outline-button report-delete-action" type="button" data-report-action="delete">${escapeHtml(text("reportDeleteAction"))}</button>
        </div>
      </article>
    `;
  }).join("");

  document.querySelectorAll(".player-report-user img").forEach((image) => {
    image.addEventListener("error", () => {
      image.hidden = true;
    }, { once: true });
  });
  document.querySelector("#reports-empty").hidden = reports.length > 0;
  document.querySelectorAll("[data-report-status]").forEach((button) => {
    const selected = button.dataset.reportStatus === state.adminReportsStatus;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function renderAdminTranslationRequests() {
  const query = state.adminRequestsQuery.trim().toLocaleLowerCase(state.locale);
  const requests = state.adminTranslationRequests.filter((request) => {
    const statusMatches = state.adminRequestsStatus === "archived"
      ? request.status === "archived"
      : request.status !== "archived";
    const searchMatches = !query || [
      request.gameName,
      request.username,
      request.discordUserId,
      request.steamAppId
    ].some((value) => String(value || "").toLocaleLowerCase(state.locale).includes(query));
    return statusMatches && searchMatches;
  });

  document.querySelector("#requests-count").textContent = requests.length.toLocaleString(state.locale);
  document.querySelector("#translation-requests-list").innerHTML = requests.map((request) => {
    const requestedDate = new Date(request.createdAt);
    const dateText = Number.isNaN(requestedDate.getTime())
      ? "—"
      : new Intl.DateTimeFormat(state.locale === "ar" ? "ar" : "en", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(requestedDate);
    const steamAppId = /^\d{1,10}$/.test(request.steamAppId) ? request.steamAppId : "";
    const discordUserId = /^\d{17,20}$/.test(request.discordUserId)
      ? request.discordUserId
      : request.uid.match(/^discord_(\d{17,20})$/)?.[1] || "";
    const avatarHash = /^[A-Za-z0-9_]{1,128}$/.test(request.avatar) ? request.avatar : "";
    const avatarUrl = discordUserId
      ? avatarHash
        ? `https://cdn.discordapp.com/avatars/${discordUserId}/${encodeURIComponent(avatarHash)}.${avatarHash.startsWith("a_") ? "gif" : "png"}?size=64`
        : `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(discordUserId) >> 22n) % 6n)}.png`
      : "";
    const actions = request.status === "archived"
      ? `<button class="outline-button request-restore-action" type="button" data-request-action="restore">${escapeHtml(text("requestRestoreAction"))}</button>`
      : `<button class="outline-button request-archive-action" type="button" data-request-action="archive">${escapeHtml(text("requestArchiveAction"))}</button>`;
    return `
      <article class="translation-request-card" data-request-id="${escapeHtml(request.id)}">
        <div class="translation-request-game">
          <span class="translation-request-game-art">
            ${steamAppId ? `<img src="https://cdn.akamai.steamstatic.com/steam/apps/${steamAppId}/header.jpg" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />` : ""}
            <svg class="translation-request-game-fallback" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 8.5h11a4 4 0 0 1 3.9 3.1l.7 3.1a2.2 2.2 0 0 1-3.6 2.1l-2.1-1.8H7.6l-2.1 1.8a2.2 2.2 0 0 1-3.6-2.1l.7-3.1a4 4 0 0 1 3.9-3.1Z"/><path d="M8 10.8v4m-2-2h4m7-1h.01M18 14h.01"/></svg>
          </span>
          <div class="translation-request-copy">
            <strong>${escapeHtml(request.gameName)}</strong>
            <small>${escapeHtml(request.platform)} · ${escapeHtml(text("requestSteamIdLabel"))} <bdi>${escapeHtml(request.steamAppId)}</bdi></small>
          </div>
        </div>
        <div class="translation-request-user">
          <span class="translation-request-avatar" aria-hidden="true">
            ${escapeHtml((request.username || "?").slice(0, 1).toLocaleUpperCase(state.locale))}
            ${avatarUrl ? `<img src="${escapeHtml(avatarUrl)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />` : ""}
          </span>
          <div class="translation-request-user-copy">
          <span>${escapeHtml(text("requestAccountLabel"))}</span>
          <strong>${escapeHtml(request.username || "—")}</strong>
          <small>${escapeHtml(text("requestDiscordIdLabel"))}: <bdi>${escapeHtml(request.discordUserId || request.uid.replace(/^discord_/, ""))}</bdi></small>
          </div>
        </div>
        <div class="translation-request-date">
          <span>${escapeHtml(text("requestDateLabel"))}</span>
          <time datetime="${escapeHtml(request.createdAt)}">${escapeHtml(dateText)}</time>
        </div>
        <div class="translation-request-actions">
          ${actions}
          <button class="outline-button request-delete-action" type="button" data-request-action="delete">${escapeHtml(text("requestDeleteAction"))}</button>
        </div>
      </article>
    `;
  }).join("");
  document.querySelectorAll(".translation-request-game-art img").forEach((image) => {
    image.addEventListener("error", () => {
      image.hidden = true;
      image.parentElement.querySelector(".translation-request-game-fallback").hidden = false;
    }, { once: true });
  });
  document.querySelectorAll(".translation-request-avatar img").forEach((image) => {
    image.addEventListener("error", () => {
      const card = image.closest("[data-request-id]");
      const request = state.adminTranslationRequests.find((item) => item.id === card?.dataset.requestId);
      const discordUserId = request?.discordUserId || request?.uid.match(/^discord_(\d{17,20})$/)?.[1] || "";
      if (discordUserId && image.dataset.fallback !== "true") {
        image.dataset.fallback = "true";
        image.src = `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(discordUserId) >> 22n) % 6n)}.png`;
      } else {
        image.hidden = true;
      }
    });
  });
  document.querySelector("#requests-empty").hidden = requests.length > 0;
  document.querySelectorAll("[data-request-status]").forEach((button) => {
    const selected = button.dataset.requestStatus === state.adminRequestsStatus;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function setAdminSubpage(page) {
  state.adminSubpage = page;
  document.querySelector("#translation-admin-view").hidden = page !== "translations";
  document.querySelector("#accounts-admin-view").hidden = page !== "accounts";
  document.querySelector("#requests-admin-view").hidden = page !== "requests";
  document.querySelector("#reports-admin-view").hidden = page !== "reports";
  const activeAdminView = document.querySelector(
    page === "translations" ? "#translation-admin-view" :
      page === "accounts" ? "#accounts-admin-view" :
        page === "requests" ? "#requests-admin-view" : "#reports-admin-view"
  );
  playSlideInDown(activeAdminView);
  document.querySelector("#admin-accounts-toggle").textContent = text(
    page === "accounts" ? "accountsBackToLibrary" : "accountsOpen"
  );
  document.querySelector("#admin-requests-toggle").textContent = text(
    page === "requests" ? "requestsBackToLibrary" : "requestsOpen"
  );
  document.querySelector("#admin-reports-toggle").textContent = text(
    page === "reports" ? "reportsBackToLibrary" : "reportsOpen"
  );
  if (page === "accounts") renderAdminAccounts();
  if (page === "requests") renderAdminTranslationRequests();
  if (page === "reports") renderAdminTranslationReports();
}

function playSlideInDown(element) {
  element.classList.remove("slide-in-down");
  void element.offsetWidth;
  element.classList.add("slide-in-down");
}

function setScreen(screen, { scrollToTop = true } = {}) {
  const screenChanged = state.screen !== screen;
  if (screen !== "admin" && editorDialog.open) {
    state.pendingArtwork = null;
    editorDialog.close();
  }
  state.screen = screen;
  document.querySelector("#public-view").hidden = screen !== "public";
  document.querySelector("#profile-screen").hidden = screen !== "profile";
  document.querySelector("#admin-auth").hidden = screen !== "auth";
  document.querySelector("#admin-panel").hidden = screen !== "admin";
  document.querySelector("#app-footer").hidden = screen === "auth" || screen === "profile";
  if (screenChanged) {
    const activeScreen = document.querySelector(
      screen === "public" ? "#public-view" :
        screen === "profile" ? "#profile-screen" :
          screen === "auth" ? "#admin-auth" : "#admin-panel"
    );
    playSlideInDown(activeScreen);
  }
  document.querySelector("#profile-button").classList.toggle("active", screen === "profile");
  document.querySelector("#profile-button").setAttribute("aria-pressed", String(screen === "profile"));
  const adminSelected = screen === "admin" || screen === "auth";
  document.querySelector("#admin-nav-link").classList.toggle("active", adminSelected);
  document.querySelector("#admin-nav-link").setAttribute("aria-pressed", String(adminSelected));
  document.querySelectorAll(".nav-link").forEach((item) => {
    item.classList.toggle(
      "active",
      screen === "public" && item.getAttribute("href") === state.activeDestination
    );
  });
  if (screen === "public") updateHeader();
  if (screen === "public") {
    requestAnimationFrame(() => {
      renderFeaturedCarousel();
      featuredLastFrameTime = 0;
      if (document.querySelector("#featured-track").children.length &&
          !featuredTrackFrame) {
        featuredTrackFrame = requestAnimationFrame(animateFeaturedCarousel);
      }
    });
  }
  if (screen === "profile") renderProfile();
  if (screen === "auth") renderAuthScreen();
  if (screen === "admin") updateHeader();
  if (scrollToTop) window.scrollTo({ top: 0, behavior: "smooth" });
}

function navigateToPublic(link) {
  if (link.protocol === "https:") {
    if (state.screen === "public") {
      state.activeDestination = link.href;
      document.querySelectorAll(".nav-link").forEach((item) => {
        item.classList.toggle("active", item.href === link.href);
      });
    }
    void openExternalLink(link.href);
    return;
  }

  const destination = link.hash;
  if (destination === "#community" || destination === "#support") {
    if (state.screen === "public") {
      state.activeDestination = destination;
      document.querySelectorAll(".nav-link").forEach((item) => {
        item.classList.toggle("active", item.getAttribute("href") === destination);
      });
    }
    void openDrekoCommunity();
    return;
  }

  setScreen("public", { scrollToTop: false });

  const activeDestination = destination === "#home" ? "#library" : destination;
  state.activeDestination = activeDestination;
  document.querySelectorAll(".nav-link").forEach((item) => {
    item.classList.toggle("active", item.getAttribute("href") === activeDestination);
  });
  if (window.location.hash !== destination) window.history.pushState(null, "", destination);

  const target = destination === "#home"
    ? null
    : document.getElementById(decodeURIComponent(destination.slice(1)));
  if (destination !== "#updates") {
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (destination === "#updates") void checkForApplicationUpdates();
}

async function openDrekoCommunity() {
  await openExternalLink("https://discord.gg/fbkjvss");
}

async function openExternalLink(url) {
  try {
    const result = await api.openTranslationLink(url);
    if (!result.ok) {
      showToast(statusErrorMessage(result.code));
    }
  } catch (error) {
    console.error("Unable to open external Dreko link:", error);
    showToast("externalLinkUnavailable");
  }
}

function renderAuthScreen() {
  document.querySelector("#auth-title").textContent = text("authLoginTitle");
  document.querySelector("#auth-description").textContent = text("authLoginDescription");
  hideMessage(authMessage);
}

function applyLocale() {
  const dictionary = translations[state.locale];
  document.documentElement.lang = state.locale;
  document.documentElement.dir = state.locale === "ar" ? "rtl" : "ltr";
  const languageButton = document.querySelector("#language-toggle");
  languageButton.setAttribute("aria-pressed", String(state.locale === "en"));
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = dictionary[element.dataset.i18n];
    if (typeof value === "string") element.innerHTML = value;
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", text(element.dataset.i18nAriaLabel));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = text(element.dataset.i18nPlaceholder);
  });
  searchInput.placeholder = text("searchPlaceholder");
  searchInput.setAttribute("aria-label", text("searchLabel"));
  document.querySelector("#category-filter span").textContent = text(
    state.category === "all" ? "categoryAll" : state.category === "full" ? "categoryFull" : "categoryInterface"
  );
  document.querySelectorAll(".category-menu [data-category-option]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.categoryOption === state.category);
  });
  if (state.screen === "auth") {
    document.querySelector("#auth-title").textContent = text("authLoginTitle");
    document.querySelector("#auth-description").textContent = text("authLoginDescription");
  }
  if (state.screen === "profile") renderProfile();
  if (state.editingId || editorDialog.open) {
    document.querySelector("#editor-title").textContent = text(
      state.editingId ? "editEditorTitle" : "addEditorTitle"
    );
  }
  document.querySelector("#result-count").textContent = state.catalog.length.toLocaleString(state.locale);
  updateHeader();
  renderCatalog();
  if (state.catalog.length) void hydrateCloudCovers(state.catalog);
  if (state.screen === "admin") setAdminSubpage(state.adminSubpage);
  if (reportDialog.open) renderTranslationReportWizard();
}

function openTranslation(item) {
  if (isPremiumTranslationLocked(item)) {
    showToast("premiumAccessRequired");
    return;
  }
  recordUsedTranslation(item);
  const title = translationName(item);
  dialog.classList.remove("translation-package-stage", "translation-install-progress-stage");
  const installPathInputId = `game-install-path-${crypto.randomUUID()}`;
  const headerMarkup = `
    <div class="dialog-cover install-dialog-cover">
      <img data-cover-key="${escapeHtml(item.cover)}" src="${escapeHtml(localCoverPath(item.cover))}" alt="" />
      <button class="install-report-button" type="button" data-report-translation-id="${escapeHtml(item.id)}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V5m0 0c4-3 8 3 14 0v10c-6 3-10-3-14 0"/></svg>
        <span>${escapeHtml(text("reportGameButton"))}</span>
      </button>
      <div class="install-dialog-heading">
        <div class="dialog-cover-title" lang="en">${escapeHtml(item.titleEn || item.title)}</div>
        <div class="install-dialog-meta">
          <span class="install-category-badge">${escapeHtml(categoryName(item.category))}</span>
          ${item.premium === true ? `<span class="install-premium-badge">${escapeHtml(text("premiumTranslationBadge"))}</span>` : ""}
        </div>
      </div>
    </div>
  `;
  let selectedGameFolder = "";
  let selectedAiSourceToken = "";
  let selectedAiJobId = "";
  let installedPackageForGame = false;
  let externalInstallerForGame = false;
  const gameIdentifier = normalizedGameIdentity(item.titleEn || item.title) || String(item.id);
  const gameDisplayTitle = item.titleEn || item.title;

  const renderGameAiJob = (job) => {
    selectedAiJobId = job.id;
    const container = dialogContent.querySelector(".game-ai-job");
    if (!container) return;
    container.hidden = false;
    container.querySelector(".game-ai-progress").max = Math.max(1, job.total);
    container.querySelector(".game-ai-progress").value = job.completed;
    const stateKey = {
      running: "aiJobRunning",
      completed: "aiJobCompleted",
      interrupted: "aiJobInterrupted",
      cancelled: "aiJobCancelled"
    }[job.status];
    container.querySelector(".game-ai-progress-label").textContent = stateKey
      ? interpolateText(stateKey, { completed: job.completed, total: job.total })
      : interpolateText("aiJobFailed", { code: job.errors?.[0]?.code || "TRANSLATION_FAILED" });
    const failedEntries = job.errors?.[0]?.remainingEntries || [];
    container.querySelector(".game-ai-errors").textContent = job.errors?.length
      ? `${aiErrorMessage(job.errors[0].code)}${failedEntries.length
        ? ` ${interpolateText("aiFailedEntryIds", {
          ids: `${failedEntries.slice(0, 8).join(", ")}${failedEntries.length > 8 ? ", …" : ""}`
        })}`
        : ""}`
      : "";
    container.querySelector(".game-ai-cancel").hidden = job.status !== "running";
    container.querySelector(".game-ai-resume").hidden =
      !["failed", "cancelled", "interrupted"].includes(job.status);
    container.querySelector(".game-ai-export").hidden = job.status !== "completed";
    const scanButton = dialogContent.querySelector(".install-continue-button");
    if (scanButton) scanButton.disabled = job.status === "running" || !selectedGameFolder;
  };

  const renderGameAiHistory = (jobs) => {
    const list = dialogContent.querySelector(".game-ai-history-list");
    list.replaceChildren();
    if (!jobs.length) {
      const empty = document.createElement("p");
      empty.textContent = text("aiJobHistoryEmpty");
      list.append(empty);
      return;
    }
    for (const job of jobs) {
      const row = document.createElement("div");
      row.className = "ai-job-history-row";
      const label = document.createElement("span");
      const statusKey = {
        completed: "aiJobCompleted",
        running: "aiJobRunning",
        interrupted: "aiJobInterrupted",
        cancelled: "aiJobCancelled"
      }[job.status];
      const status = statusKey
        ? interpolateText(statusKey, { completed: job.completed, total: job.total })
        : interpolateText("aiJobFailed", { code: job.errors?.[0]?.code || "TRANSLATION_FAILED" });
      label.textContent = interpolateText("aiJobLabel", {
        file: job.fileName,
        completed: `${job.completed}/${job.total}`,
        status
      });
      row.append(label);
      if (["failed", "cancelled", "interrupted"].includes(job.status)) {
        const resume = document.createElement("button");
        resume.type = "button";
        resume.className = "outline-button";
        resume.dataset.aiResume = job.id;
        resume.textContent = text("aiResumeJob");
        row.append(resume);
      }
      if (job.status === "completed") {
        const exportButton = document.createElement("button");
        exportButton.type = "button";
        exportButton.className = "outline-button";
        exportButton.dataset.aiExport = job.id;
        exportButton.textContent = text("aiExportJob");
        row.append(exportButton);
      }
      list.append(row);
    }
  };

  const refreshGameAiJobs = async () => {
    const result = await api.listAiLocalizationJobs(gameIdentifier);
    if (!result?.ok) {
      const status = dialogContent.querySelector(".game-ai-status");
      if (status) status.textContent = aiErrorMessage(result?.code);
      return;
    }
    const jobs = result.data?.jobs || [];
    renderGameAiHistory(jobs);
    const active = jobs.find((job) => job.id === selectedAiJobId) ||
      jobs.find((job) => job.status === "running");
    if (active) renderGameAiJob(active);
  };

  const getCurrentIdToken = async () => {
    if (!state.firebaseUser) throw Object.assign(new Error("AUTH_REQUIRED"), { code: "AUTH_REQUIRED" });
    return state.firebaseUser.getIdToken();
  };

  const wireGameAiLocalization = () => {
    const status = dialogContent.querySelector(".game-ai-status");
    const setStatus = (code) => {
      status.textContent = aiErrorMessage(code);
      status.hidden = false;
    };
    const scanButton = dialogContent.querySelector(".install-continue-button");
    const registerExistingButton = dialogContent.querySelector(".register-existing-external-translation");
    registerExistingButton?.addEventListener("click", async () => {
      if (!window.confirm(text("confirmRegisterExistingExternalTranslation"))) return;
      registerExistingButton.disabled = true;
      try {
        const result = await api.recordExternalTranslationInstalled(item.id, selectedGameFolder);
        if (!result?.ok) {
          showToast(text("installFailureGeneric"));
          return;
        }
        installedPackageForGame = true;
        externalInstallerForGame = true;
        showToast("externalTranslationStatusRecorded");
        renderFolderStep();
      } catch (error) {
        console.error("Unable to record existing external translation:", error?.code || error?.name || "UNKNOWN");
        showToast(text("installFailureGeneric"));
      } finally {
        registerExistingButton.disabled = false;
      }
    });
    scanButton.addEventListener("click", async () => {
      if (installedPackageForGame) {
        const removingExternalInstaller = externalInstallerForGame;
        if (!window.confirm(text(removingExternalInstaller
          ? "installExternalRemoveConfirm"
          : "installRemoveConfirm"))) return;
        scanButton.disabled = true;
        try {
          const result = await api.removeInstalledTranslation(
            item.id,
            selectedGameFolder,
            removingExternalInstaller
          );
          if (!result?.ok) {
            showToast(result?.code === "INSTALLED_FILE_CHANGED"
              ? text("installFilesChanged")
              : text("installFailureGeneric"));
            return;
          }
          installedPackageForGame = false;
          externalInstallerForGame = false;
          showToast(result.data?.externalInstaller
            ? "installExternalStatusCleared"
            : "installRemoveSuccess");
          renderFolderStep();
        } catch (error) {
          console.error("Unable to remove installed translation:", error?.code || error?.name || "UNKNOWN");
          showToast(text("installFailureGeneric"));
        } finally {
          scanButton.disabled = !selectedGameFolder;
        }
        return;
      }
      if (item.translationUrl || item.installerProgramUrl) {
        void startTranslationInstall(item);
        return;
      }
      if (!selectedGameFolder) return;
      let localizationStarted = false;
      scanButton.disabled = true;
      status.hidden = false;
      status.textContent = text("aiFolderScanning");
      try {
        const sourceResult = await api.scanGameFolderForLocalization(selectedGameFolder, gameDisplayTitle);
        if (!sourceResult?.ok) {
          setStatus(sourceResult?.code);
          return;
        }
        selectedAiSourceToken = sourceResult.data.sourceToken;
        status.textContent = interpolateText("aiFolderSelected", {
          file: sourceResult.data.fileName,
          count: sourceResult.data.entryCount,
          files: sourceResult.data.candidateCount
        });
        const idToken = await getCurrentIdToken();
        status.textContent = interpolateText("aiFolderStarting", {
          file: sourceResult.data.fileName
        });
        const result = await api.startAiLocalization({
          sourceToken: selectedAiSourceToken,
          idToken,
          gameId: gameIdentifier,
          gameTitle: gameDisplayTitle,
          gameDescription: item.description || "",
          glossary: ""
        });
        if (!result?.ok) {
          setStatus(result?.code);
          selectedAiSourceToken = "";
          return;
        }
        selectedAiJobId = result.data.id;
        selectedAiSourceToken = "";
        localizationStarted = true;
        await refreshGameAiJobs();
      } catch (error) {
        console.error("Unable to scan and translate the game's localization:", error?.code || error?.name || "UNKNOWN");
        setStatus(error?.code || "TRANSLATION_JOB_START_FAILED");
      } finally {
        if (!localizationStarted) scanButton.disabled = !selectedGameFolder;
      }
    });
    dialogContent.querySelector(".game-ai-cancel").addEventListener("click", async () => {
      const result = await api.cancelAiLocalizationJob(selectedAiJobId);
      if (!result?.ok) setStatus(result.code);
    });
    const resumeJob = async (jobId) => {
      try {
        const result = await api.resumeAiLocalizationJob(jobId, await getCurrentIdToken());
        if (!result?.ok) {
          setStatus(result.code);
          return;
        }
        selectedAiJobId = result.data.id;
        renderGameAiJob(result.data);
        await refreshGameAiJobs();
      } catch (error) {
        setStatus(error?.code || "AUTH_REQUIRED");
      }
    };
    dialogContent.querySelector(".game-ai-resume").addEventListener("click", () => {
      void resumeJob(selectedAiJobId);
    });
    dialogContent.querySelector(".game-ai-export").addEventListener("click", async () => {
      const result = await api.exportAiLocalizationJob(selectedAiJobId);
      status.textContent = result?.ok
        ? result.data?.canceled ? text("aiJobCompleted") : text("aiExportSuccess")
        : aiErrorMessage(result?.code);
    });
    dialogContent.querySelector(".game-ai-history-list").addEventListener("click", async (event) => {
      const resume = event.target.closest("[data-ai-resume]");
      const exportButton = event.target.closest("[data-ai-export]");
      if (resume) {
        await resumeJob(resume.dataset.aiResume);
      } else if (exportButton) {
        selectedAiJobId = exportButton.dataset.aiExport;
        const result = await api.exportAiLocalizationJob(selectedAiJobId);
        status.textContent = result?.ok
          ? result.data?.canceled ? text("aiJobCompleted") : text("aiExportSuccess")
          : aiErrorMessage(result?.code);
      }
    });
    activeGameAiRefresh = refreshGameAiJobs;
    activeGameAiId = gameIdentifier;
    void refreshGameAiJobs();
  };

  const renderFolderStep = () => {
    dialog.classList.remove("translation-package-stage", "translation-install-progress-stage");
    dialogContent.innerHTML = `
      ${headerMarkup}
      <div class="install-dialog-body" dir="rtl">
        <h2>${escapeHtml(title)}</h2>
        <p class="install-translation-credit"><span>${escapeHtml(text("translatedByLabel"))}</span> ${escapeHtml(item.developer)}</p>
        <button class="outline-button game-folder-auto-detect" type="button">
          <span>${escapeHtml(text("gameFolderAutoDetect"))}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11a9 9 0 0 1 15.4-6.4L21 7M21 3v4h-4M21 13a9 9 0 0 1-15.4 6.4L3 17m0 4v-4h4"/><path d="M8 12h8"/></svg>
        </button>
        <p class="game-folder-detect-status" role="status" aria-live="polite" hidden></p>
        <label class="install-path-label" for="${installPathInputId}">
          <span>${escapeHtml(text("gameInstallPath"))}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H10l2 2h7.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/><path d="m13 15 5-5"/></svg>
        </label>
        <div class="install-path-control">
          <input id="${installPathInputId}" class="install-path-input" type="text" dir="ltr" autocomplete="off" placeholder="${escapeHtml(text("gameFolderPlaceholder"))}" />
          <button class="install-path-browse" type="button" aria-label="${escapeHtml(text("gameInstallPath"))}" title="${escapeHtml(text("gameInstallPath"))}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H10l2 2h7.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/></svg>
          </button>
        </div>
        <p class="install-path-help">${escapeHtml(text("gameFolderHelp"))}</p>
        <button class="dialog-action install-continue-button" type="button" disabled>
          <span>${escapeHtml(text(item.translationUrl
            ? "installReadyPackage"
            : item.installerProgramUrl ? "installReadyInstaller" : "gameFolderContinue"))}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m7 7-7-7 7-7"/></svg>
        </button>
        ${item.installerProgramUrl && !item.translationUrl ? `
          <button class="outline-button register-existing-external-translation" type="button" hidden>
            ${escapeHtml(text("registerExistingExternalTranslation"))}
          </button>
        ` : ""}
        ${item.translationUrl && item.packageVersion ? `
          <section class="ready-translation-package" aria-label="${escapeHtml(text("installReadyPackage"))}">
            <p>${escapeHtml(interpolateText("readyPackageVersion", { version: item.packageVersion }))}</p>
          </section>
        ` : ""}
        <section class="game-ai-localization">
          <h3>${escapeHtml(text("gameAiHeading"))}</h3>
          <p class="game-ai-intro">${escapeHtml(text("gameAiIntro"))}</p>
          <div class="game-ai-panel">
            <p class="ai-localization-status game-ai-status" role="status" aria-live="polite" hidden>${escapeHtml(text("aiInitialStatus"))}</p>
            <div class="ai-localization-job game-ai-job" hidden>
              <progress class="game-ai-progress" max="1" value="0"></progress>
              <p class="game-ai-progress-label"></p>
              <div class="ai-localization-actions">
                <button class="outline-button game-ai-cancel" type="button" hidden>${escapeHtml(text("aiCancel"))}</button>
                <button class="outline-button game-ai-resume" type="button" hidden>${escapeHtml(text("aiResume"))}</button>
                <button class="primary-action game-ai-export" type="button" hidden>${escapeHtml(text("aiExport"))}</button>
              </div>
              <p class="ai-localization-errors game-ai-errors" role="alert"></p>
            </div>
            <section class="ai-localization-history game-ai-history">
              <h3>${escapeHtml(text("aiRecentJobs"))}</h3>
              <div class="game-ai-history-list"></div>
            </section>
            <p class="ai-localization-limit">${escapeHtml(text("aiLimitNote"))}</p>
          </div>
        </section>
      </div>
    `;
    const pathInput = dialogContent.querySelector(".install-path-input");
    const localizationStatus = dialogContent.querySelector(".game-ai-status");
    const folderDetectionStatus = dialogContent.querySelector(".game-folder-detect-status");
    const autoDetectButton = dialogContent.querySelector(".game-folder-auto-detect");
    const continueButton = dialogContent.querySelector(".install-continue-button");
    const registerExistingButton = dialogContent.querySelector(".register-existing-external-translation");
    const packageDetails = dialogContent.querySelector(".ready-translation-package");
    pathInput.value = selectedGameFolder;
    let userChangedGameFolder = Boolean(pathInput.value.trim());
    let installStatusRequest = 0;
    let installStatusTimer = null;
    let installStatusLoading = false;
    const updateContinueButton = () => {
      selectedGameFolder = pathInput.value.trim();
      continueButton.disabled = !selectedGameFolder || installStatusLoading || Boolean(installStatusTimer);
      continueButton.querySelector("span").textContent = text(
        installedPackageForGame
          ? "installRemoveTranslation"
          : item.translationUrl
            ? "installReadyPackage"
            : item.installerProgramUrl ? "installReadyInstaller" : "gameFolderContinue"
      );
      continueButton.classList.toggle("install-remove-active", installedPackageForGame);
      if (packageDetails) packageDetails.hidden = installedPackageForGame;
      if (registerExistingButton) {
        registerExistingButton.hidden = installedPackageForGame;
        registerExistingButton.disabled = !selectedGameFolder || installedPackageForGame;
      }
    };
    const refreshInstalledPackageStatus = async () => {
      const request = ++installStatusRequest;
      clearTimeout(installStatusTimer);
      installStatusTimer = null;
      installStatusLoading = Boolean(selectedGameFolder);
      installedPackageForGame = false;
      externalInstallerForGame = false;
      updateContinueButton();
      if (!selectedGameFolder || !api?.getTranslationInstallStatus) {
        installStatusLoading = false;
        updateContinueButton();
        return;
      }
      updateContinueButton();
      try {
        const result = await api.getTranslationInstallStatus(item.id, selectedGameFolder);
        if (request !== installStatusRequest) return;
        if (!result?.ok) {
          localizationStatus.textContent = text("installStatusUnavailable");
          localizationStatus.hidden = false;
          return;
        }
        installedPackageForGame = result.data?.installed === true;
        externalInstallerForGame = result.data?.externalInstaller === true;
      } catch (error) {
        if (request === installStatusRequest) {
          console.error("Unable to check translation installation status:", error?.code || error?.name || "UNKNOWN");
          localizationStatus.textContent = text("installStatusUnavailable");
          localizationStatus.hidden = false;
        }
      } finally {
        if (request === installStatusRequest) {
          installStatusLoading = false;
          updateContinueButton();
        }
      }
    };
    const autoDetectGameFolder = async (force = false) => {
      if (!force && userChangedGameFolder && selectedGameFolder) return;
      if (!api?.findInstalledGame) {
        folderDetectionStatus.textContent = text("gameFolderNotDetected");
        folderDetectionStatus.hidden = false;
        return;
      }
      autoDetectButton.disabled = true;
      folderDetectionStatus.hidden = false;
      folderDetectionStatus.textContent = text("gameFolderDetecting");
      try {
        const result = await api.findInstalledGame(gameDisplayTitle);
        if (result?.ok && typeof result.data?.installPath === "string") {
          if (force || !userChangedGameFolder || !selectedGameFolder) {
            pathInput.value = result.data.installPath;
            updateContinueButton();
          }
          folderDetectionStatus.textContent = interpolateText("gameFolderDetected", {
            game: result.data.title || gameDisplayTitle
          });
          userChangedGameFolder = false;
          await refreshInstalledPackageStatus();
          return;
        }
        const statusKey = result?.code === "INSTALLED_GAME_MATCH_AMBIGUOUS"
          ? "gameFolderDetectionAmbiguous"
          : result?.code === "GAME_SEARCH_LIMIT_REACHED"
            ? "gameFolderSearchLimited"
            : "gameFolderNotDetected";
        folderDetectionStatus.textContent = text(statusKey);
      } catch (error) {
        console.error("Unable to detect the installed game folder:", error?.code || error?.name || "UNKNOWN");
        folderDetectionStatus.textContent = text("gameFolderNotDetected");
      } finally {
        autoDetectButton.disabled = false;
      }
    };
    autoDetectButton.addEventListener("click", () => void autoDetectGameFolder(true));
    pathInput.addEventListener("input", () => {
      userChangedGameFolder = true;
      installStatusRequest += 1;
      installStatusLoading = false;
      installedPackageForGame = false;
      externalInstallerForGame = false;
      clearTimeout(installStatusTimer);
      installStatusTimer = setTimeout(() => {
        installStatusTimer = null;
        void refreshInstalledPackageStatus();
      }, 500);
      updateContinueButton();
    });
    dialogContent.querySelector(".install-path-browse").addEventListener("click", async () => {
      try {
        const result = await api.chooseGameFolder();
        if (!result?.ok) {
          localizationStatus.textContent = text("gameFolderPickerFailed");
          return;
        }
        if (result.data?.canceled) return;
        userChangedGameFolder = true;
        pathInput.value = result.data?.folderPath || "";
        installStatusRequest += 1;
        installStatusLoading = false;
        installedPackageForGame = false;
        externalInstallerForGame = false;
        updateContinueButton();
        await refreshInstalledPackageStatus();
      } catch (error) {
        console.error("Unable to choose a game installation folder:", error?.message || error?.name || "UNKNOWN");
        localizationStatus.textContent = text("gameFolderPickerFailed");
      }
    });
    wireGameAiLocalization();
    void autoDetectGameFolder();
  };

  const formatInstallBytes = (value) => {
    const bytes = Number(value) || 0;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  const installProgressTitle = (stage) => ({
    downloading: "installDownloading",
    "downloading-installer": "installDownloadingProgram",
    extracting: "installExtracting",
    "installing-files": "installCopyingFiles",
    "running-installer": "installRunningProgram",
    cancelling: "installCancelling"
  })[stage] || "installDownloading";
  const installFailureMessage = (code) => ({
    INVALID_DOWNLOAD_URL: "installFailureInvalidUrl",
    PACKAGE_DOWNLOAD_FAILED: "installFailureDownload",
    PACKAGE_SIZE_LIMIT: "installFailureDownload",
    DOWNLOAD_REDIRECT_LIMIT: "installFailureDownload",
    INVALID_TRANSLATION_PACKAGE: "installFailureArchive",
    EXECUTABLE_PACKAGE_NOT_SUPPORTED: "installFailureUnsupportedExe",
    INSTALL_ROLLBACK_FAILED: "installFailureRollback",
    INSTALL_CANCELLED: "installFailureCancelled",
    INSTALLER_CANCELLED: "installFailureCancelled",
    INSTALLER_PROGRAM_CANCELLED: "installFailureCancelled",
    INVALID_ARCHIVE_PATH: "installFailureArchive",
    INVALID_ARCHIVE_SIZE: "installFailureArchive",
    ARCHIVE_SIZE_LIMIT: "installFailureArchive",
    EMPTY_TRANSLATION_PACKAGE: "installFailureNoFiles",
    INVALID_GAME_FOLDER: "installFailureFolder",
    UNSAFE_GAME_FOLDER: "installFailureFolder",
    EACCES: "installFailurePermission",
    EPERM: "installFailurePermission",
    INVALID_INSTALLER_PROGRAM: "installFailureExe",
    INSTALLER_PROGRAM_REQUIRES_WINDOWS: "installFailureExe",
    INSTALLER_PROGRAM_FAILED: "installFailureProgram",
  })[code] || "installFailureGeneric";

  const renderInstallProgress = (translation, progress = {}) => {
    dialog.classList.add("translation-package-stage", "translation-install-progress-stage");
    if (progress.stage !== "cancelling" && activeTranslationInstall) {
      activeTranslationInstall.lastProgress = progress;
    }
    const visualProgress = progress.stage === "cancelling"
      ? activeTranslationInstall?.lastProgress || progress
      : progress;
    const downloaded = Number(visualProgress.downloadedBytes) || 0;
    const total = Number(visualProgress.totalBytes) || 0;
    const visualStage = visualProgress.stage || progress.stage;
    let percent = 4;
    if (visualStage === "downloading" && total > 0) percent = Math.min(67, downloaded / total * 67);
    else if (visualStage === "downloading-installer" && total > 0) {
      percent = 70 + Math.min(12, downloaded / total * 12);
    } else if (visualStage === "extracting") percent = 84;
    else if (visualStage === "installing-files") {
      percent = 86 + (visualProgress.totalFiles
        ? Math.min(8, (visualProgress.completedFiles / visualProgress.totalFiles) * 8)
        : 2);
    } else if (visualStage === "running-installer") percent = 96;
    const statusText = progress.stage === "cancelling"
      ? text("installCancelling")
      : total > 0
      ? text("installDownloadProgress")
        .replace("{downloaded}", formatInstallBytes(downloaded))
        .replace("{total}", formatInstallBytes(total))
      : text("installDownloadUnknown").replace("{downloaded}", formatInstallBytes(downloaded));
    const stageText = progress.stage === "cancelling"
      ? text("installCancelling")
      : visualStage === "extracting"
      ? text("installExtractProgress").replace("{files}", String(visualProgress.completedFiles || 0))
      : visualStage === "installing-files" && visualProgress.totalFiles
      ? text("installFilesProgress")
        .replace("{completed}", String(visualProgress.completedFiles || 0))
        .replace("{total}", String(visualProgress.totalFiles))
      : statusText;
    let progressBody = dialogContent.querySelector(".install-state-body");
    if (!progressBody) {
      dialogContent.innerHTML = `
        ${headerMarkup}
        <section class="install-state-body" dir="rtl">
          <div class="install-progress-ring" style="--install-progress:${Math.round(percent)}%">
            <span>${Math.round(percent)}%</span>
          </div>
          <h2>${escapeHtml(text(installProgressTitle(progress.stage)))}</h2>
          <p class="install-state-description">${escapeHtml(stageText)}</p>
          <div class="install-progress-track"><span style="width:${Math.round(percent)}%"></span></div>
          <button class="install-state-cancel" type="button">${escapeHtml(text("installCancelDuringInstall"))}</button>
        </section>
      `;
      progressBody = dialogContent.querySelector(".install-state-body");
      const cancelButton = progressBody.querySelector(".install-state-cancel");
      cancelButton.addEventListener("click", () => {
        const jobId = activeTranslationInstall?.jobId;
        if (!jobId || activeTranslationInstall.cancelRequested) return;
        activeTranslationInstall.cancelRequested = true;
        cancelButton.disabled = true;
        cancelButton.textContent = text("installCancelling");
        void api.cancelTranslationInstall(jobId).then((result) => {
          if (!result?.ok) {
            console.error("Unable to cancel translation installation:", result?.code || "UNKNOWN");
            if (activeTranslationInstall?.jobId === jobId) {
              activeTranslationInstall.cancelRequested = false;
              renderInstallProgress(translation, activeTranslationInstall.lastProgress || { stage: "downloading" });
              showToast(text("installFailureGeneric"));
            }
          }
        }).catch((error) => {
          console.error("Unable to cancel translation installation:", error?.code || error?.name || "UNKNOWN");
          if (activeTranslationInstall?.jobId === jobId) {
            activeTranslationInstall.cancelRequested = false;
            renderInstallProgress(translation, activeTranslationInstall.lastProgress || { stage: "downloading" });
            showToast(text("installFailureGeneric"));
          }
        });
      });
    }
    progressBody.querySelector(".install-progress-ring").style.setProperty("--install-progress", `${Math.round(percent)}%`);
    progressBody.querySelector(".install-progress-ring span").textContent = `${Math.round(percent)}%`;
    progressBody.querySelector("h2").textContent = text(installProgressTitle(progress.stage));
    progressBody.querySelector(".install-state-description").textContent = stageText;
    progressBody.querySelector(".install-progress-track > span").style.width = `${Math.round(percent)}%`;
    const cancelButton = progressBody.querySelector(".install-state-cancel");
    cancelButton.disabled = Boolean(activeTranslationInstall?.cancelRequested);
    cancelButton.textContent = activeTranslationInstall?.cancelRequested
      ? text("installCancelling")
      : text("installCancelDuringInstall");
    if (progress.stage === "installer-confirmation") {
      if (!dialogContent.querySelector(".install-program-confirmation")) {
        const confirmation = document.createElement("section");
        confirmation.className = "install-program-confirmation";
        confirmation.setAttribute("role", "dialog");
        confirmation.setAttribute("aria-modal", "true");
        confirmation.innerHTML = `
          <div class="install-program-shield" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6z"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <h2>${escapeHtml(text("installAwaitingProgramTitle"))}</h2>
          <p>${escapeHtml(text("installAwaitingProgramDescription"))}</p>
          <code>${escapeHtml(progress.installerName || "Translation installer.exe")}</code>
          <p class="install-program-warning">${escapeHtml(text("installTrustWarning"))}</p>
          <div class="install-program-actions">
            <button class="install-program-cancel" type="button">${escapeHtml(text("installProgramCancel"))}</button>
            <button class="install-program-run" type="button">${escapeHtml(text("installProgramRun"))}</button>
          </div>
        `;
        dialogContent.append(confirmation);
        confirmation.querySelector(".install-program-cancel").addEventListener("click", () => {
          if (activeTranslationInstall) {
            void api.confirmTranslationInstaller(activeTranslationInstall.jobId, false);
          }
        });
        confirmation.querySelector(".install-program-run").addEventListener("click", (event) => {
          if (!activeTranslationInstall) return;
          event.currentTarget.disabled = true;
          confirmation.querySelector(".install-program-cancel").disabled = true;
          void api.confirmTranslationInstaller(activeTranslationInstall.jobId, true);
        });
      }
    } else {
      dialogContent.querySelector(".install-program-confirmation")?.remove();
    }
  };

  const renderInstallFailure = (code) => {
    activeTranslationInstall = null;
    document.querySelector("#dialog-close").disabled = false;
    dialog.classList.add("translation-package-stage", "translation-install-progress-stage");
    dialogContent.innerHTML = `
      ${headerMarkup}
      <section class="install-state-body install-failed-state" dir="rtl">
        <div class="install-state-icon install-error-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 4h.01"/></svg>
        </div>
        <h2>${escapeHtml(text("installFailedTitle"))}</h2>
        <p class="install-state-description">${escapeHtml(text(installFailureMessage(code)))}</p>
        <div class="install-state-actions">
          <button class="dialog-action install-retry-button" type="button">${escapeHtml(text("installTryAgain"))}</button>
          <button class="install-state-cancel" type="button">${escapeHtml(text("installCancel"))}</button>
        </div>
      </section>
    `;
    dialogContent.querySelector(".install-retry-button").addEventListener("click", () => {
      renderFolderStep();
    });
    dialogContent.querySelector(".install-state-cancel").addEventListener("click", () => {
      dialog.close();
    });
  };

  const renderInstallCompleted = (translation, installedFiles) => {
    activeTranslationInstall = null;
    document.querySelector("#dialog-close").disabled = false;
    dialog.classList.add("translation-package-stage", "translation-install-progress-stage");
    dialogContent.innerHTML = `
      ${headerMarkup}
      <section class="install-state-body install-completed-state" dir="rtl">
        <div class="install-complete-card">
          <span class="install-state-icon install-success-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg>
          </span>
          <span><strong>${escapeHtml(text("installCompletedTitle"))}</strong><small>${escapeHtml(text("installCompletedDescription"))}</small></span>
        </div>
        <button class="dialog-action install-launch-button" type="button">${escapeHtml(text("installLaunchGame"))}</button>
        ${translation.translationUrl || translation.installerProgramUrl ? `
          <button class="install-remove-button" type="button">
            <span>${escapeHtml(text("installRemoveTranslation"))}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16m-10 4v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3"/></svg>
          </button>
        ` : ""}
      </section>
    `;
    if (installedFiles > 0) {
      dialogContent.querySelector(".install-complete-card small").textContent =
        `${text("installCompletedDescription")} (${installedFiles})`;
    }
    dialogContent.querySelector(".install-launch-button").addEventListener("click", async () => {
      try {
        const result = await api.launchInstalledGame(selectedGameFolder);
        if (!result?.ok) showToast(text("installFailureGeneric"));
        else if (!result.data?.launched) {
          dialogContent.querySelector(".install-launch-button").textContent = text("installOpenGameFolder");
        }
      } catch (error) {
        console.error("Unable to launch game:", error?.code || error?.name || "UNKNOWN");
        showToast(text("installFailureGeneric"));
      }
    });
    const removeButton = dialogContent.querySelector(".install-remove-button");
    removeButton?.addEventListener("click", async () => {
      const removingExternalInstaller = !translation.translationUrl &&
        Boolean(translation.installerProgramUrl);
      if (!window.confirm(text(removingExternalInstaller
        ? "installExternalRemoveConfirm"
        : "installRemoveConfirm"))) return;
      try {
        const result = await api.removeInstalledTranslation(
          translation.id,
          selectedGameFolder,
          removingExternalInstaller
        );
        if (!result?.ok) {
          showToast(result?.code === "INSTALLED_FILE_CHANGED"
            ? text("installFilesChanged")
            : text("installFailureGeneric"));
          return;
        }
        externalInstallerForGame = false;
        installedPackageForGame = false;
        showToast(result.data?.externalInstaller
          ? "installExternalStatusCleared"
          : "installRemoveSuccess");
        renderFolderStep();
      } catch (error) {
        console.error("Unable to remove installed translation:", error?.code || error?.name || "UNKNOWN");
        showToast(text("installFailureGeneric"));
      }
    });
  };

  const startTranslationInstall = async (translation) => {
    if (activeTranslationInstall) return;
    const jobId = crypto.randomUUID();
    const cancellationCodes = new Set([
      "INSTALL_CANCELLED",
      "INSTALLER_CANCELLED",
      "INSTALLER_PROGRAM_CANCELLED"
    ]);
    activeTranslationInstall = { jobId, cancelRequested: false };
    document.querySelector("#dialog-close").disabled = true;
    const unsubscribeProgress = api.onTranslationInstallProgress((progress) => {
      if (progress.jobId !== jobId) return;
      if (progress.stage === "failed") {
        if (!cancellationCodes.has(progress.code)) renderInstallFailure(progress.code);
      } else if (progress.stage === "completed") renderInstallCompleted(translation, progress.installedFiles);
      else {
        if (progress.stage !== "cancelling" && activeTranslationInstall) {
          activeTranslationInstall.lastProgress = progress;
        }
        renderInstallProgress(translation, progress);
      }
    });
    renderInstallProgress(translation, { stage: "downloading" });
    try {
      const result = await api.installTranslationPackage({
        jobId,
        translationId: translation.id,
        translationUrl: translation.translationUrl,
        installerProgramUrl: translation.installerProgramUrl || "",
        gameFolder: selectedGameFolder
      });
      if (!result?.ok) {
        if (cancellationCodes.has(result?.code)) {
          renderFolderStep();
          showToast(text("installFailureCancelled"));
        } else {
          renderInstallFailure(result?.code || "TRANSLATION_INSTALL_FAILED");
        }
      } else {
        externalInstallerForGame = !translation.translationUrl && Boolean(translation.installerProgramUrl);
        installedPackageForGame = Boolean(translation.translationUrl);
        renderInstallCompleted(translation, result.data?.installedFiles || 0);
      }
    } catch (error) {
      console.error("Translation install request failed:", error?.code || error?.name || "UNKNOWN");
      if (cancellationCodes.has(error?.code)) {
        renderFolderStep();
        showToast(text("installFailureCancelled"));
      } else {
        renderInstallFailure(error?.code || "TRANSLATION_INSTALL_FAILED");
      }
    } finally {
      unsubscribeProgress();
      activeTranslationInstall = null;
      document.querySelector("#dialog-close").disabled = false;
    }
  };

  renderFolderStep();
  dialog.showModal();
}

async function showAdmin() {
  if (!api) {
    showToast(text("authenticationUnavailable"));
    return;
  }
  try {
    await firebaseCloud.waitForAuthentication();
    const user = firebaseCloud.currentUser();
    state.firebaseUser = user;
    if (!user) {
      state.authenticated = false;
      state.adminTranslations = [];
      lockDiscordGate("discordGatePrompt");
      return;
    }
    if (!await firebaseCloud.isDiscordGuildMember(user)) {
      state.authenticated = false;
      state.adminTranslations = [];
      await firebaseCloud.signOutCurrentUser();
      lockDiscordGate("discordGateRejected");
      return;
    }
    state.authenticated = await firebaseCloud.isAdministrator(user);
    state.isAdministrator = state.authenticated;
    if (!state.authenticated) {
      state.adminTranslations = [];
      updateHeader();
      setScreen("auth");
      updateMessage(document.querySelector("#auth-message"), text("accessDenied"));
      return;
    }
    state.adminTranslations = await firebaseCloud.listAdminTranslations(user);
    setScreen("admin");
    setAdminSubpage("translations");
    renderAdminTable();
    void hydrateCloudCovers(state.adminTranslations);
  } catch (error) {
    if (error?.code === "ADMIN_REQUIRED") {
      state.authenticated = false;
      state.adminTranslations = [];
      setScreen("auth");
      updateMessage(document.querySelector("#auth-message"), text("accessDenied"));
      return;
    }
    showFirebaseError(error);
  }
}

async function refreshCatalog() {
  if (!state.discordAccessGranted || !state.firebaseUser) return false;
  const verifiedUid = state.firebaseUser.uid;
  try {
    const appInfo = await firebaseCloud.getAppInfo();
    if (!state.discordAccessGranted || state.firebaseUser?.uid !== verifiedUid) return false;
    state.version = appInfo.version;
    document.querySelector("#app-version").textContent = `v${escapeHtml(state.version)}`;
    const translations = await firebaseCloud.listPublicTranslations();
    if (!state.discordAccessGranted || state.firebaseUser?.uid !== verifiedUid) return false;
    state.catalog = translations;
    renderCatalog();
    void hydrateCloudCovers(state.catalog, { all: true, silent: true });
    return true;
  } catch (error) {
    showFirebaseError(error);
    return false;
  }
}

function setDiscordGateStatus(messageKey, status = "info") {
  const statusElement = document.querySelector("#discord-gate-status");
  statusElement.textContent = Array.isArray(messageKey)
    ? messageKey.map(text).join(" ")
    : text(messageKey);
  statusElement.dataset.state = status;
}

function discordAuthErrorMessage(code) {
  if (code === "ACCOUNT_STORAGE_UNAVAILABLE") return "discordAccountStorageUnavailable";
  if (code === "AUTH_SERVER_NOT_CONFIGURED") return "discordGateSetupNeeded";
  if (code === "DISCORD_AUTHORIZATION_DECLINED") return "discordGateCancelled";
  if (code === "AUTH_SESSION_EXPIRED" || code === "INVALID_AUTH_SESSION") return "discordGateExpired";
  if (code === "GUILD_MEMBERSHIP_REQUIRED") return "discordGateNotMember";
  if (code === "AUTH_SERVER_NOT_CONFIGURED" ||
      code === "AUTH_SERVER_UNAVAILABLE" ||
      code === "DISCORD_BOT_MISCONFIGURED" ||
      code === "DISCORD_OAUTH_MISCONFIGURED" ||
      code === "DISCORD_INVITE_UNAVAILABLE") return "discordGateUnavailable";
  return "discordGateRejected";
}

function isDefinitiveDiscordMembershipFailure(code) {
  return ["GUILD_MEMBERSHIP_REQUIRED", "INVALID_FIREBASE_TOKEN", "INVALID_DISCORD_USER"].includes(code);
}

function discordSetupMessage(setupIssues) {
  const messages = {
    DISCORD_CLIENT_ID: "discordSetupNeedClientId",
    DISCORD_CLIENT_SECRET: "discordSetupNeedClientSecret",
    DISCORD_BOT_TOKEN: "discordSetupNeedBotToken",
    DISCORD_GUILD_ID: "discordSetupNeedGuildId",
    DISCORD_INVITE_URL: "discordSetupNeedInvite",
    DISCORD_REDIRECT_URI: "discordSetupNeedRedirect",
    DISCORD_BOT_TOKEN_INVALID: "discordSetupBotToken",
    DISCORD_BOT_GUILD_ACCESS_REQUIRED: "discordSetupBotGuildAccess",
    DISCORD_GUILD_CHECK_FAILED: "discordSetupBotGuildAccess",
    DISCORD_CLIENT_ID_MISMATCH: "discordSetupClientIdMismatch",
    FIREBASE_ADMIN_CREDENTIALS: "discordSetupFirebaseAdmin"
  };
  const uniqueMessages = [...new Set(setupIssues.map((issue) => messages[issue]).filter(Boolean))];
  return uniqueMessages.length ? uniqueMessages : ["discordGateSetupNeeded"];
}

async function activateDiscordUser(user, { recordLogin = false } = {}) {
  if (!api || !user) throw Object.assign(new Error("GUILD_MEMBERSHIP_REQUIRED"), {
    code: "GUILD_MEMBERSHIP_REQUIRED"
  });
  if (state.discordAccessGranted && state.firebaseUser?.uid === user.uid) return true;
  state.discordVerifyingUserUid = user.uid;
  state.firebaseUser = user;
  setDiscordGateStatus("discordGateChecking");

  try {
    if (!await firebaseCloud.isDiscordGuildMember(user)) {
      throw Object.assign(new Error("GUILD_MEMBERSHIP_REQUIRED"), {
        code: "GUILD_MEMBERSHIP_REQUIRED"
      });
    }
    let verifiedUser = user;
    const response = await api.verifyDiscordMembership(await user.getIdToken(true));
    if (!response.ok || response.data?.ok !== true || !response.data.user) {
      throw Object.assign(new Error(response.data?.code || response.code || "GUILD_MEMBERSHIP_REQUIRED"), {
        code: response.data?.code || response.code || "GUILD_MEMBERSHIP_REQUIRED"
      });
    }
    if (firebaseCloud.currentUser()?.uid !== user.uid ||
        state.discordVerifyingUserUid !== user.uid) {
      throw Object.assign(new Error("GUILD_MEMBERSHIP_REQUIRED"), {
        code: "GUILD_MEMBERSHIP_REQUIRED"
      });
    }
    if (typeof response.data.customToken === "string") {
      discordLoginInProgress = true;
      try {
        verifiedUser = await firebaseCloud.signInWithDiscordToken(response.data.customToken);
      } finally {
        discordLoginInProgress = false;
      }
    }

    state.firebaseUser = verifiedUser;
    state.discordProfile = response.data.user;
    state.discordAccount = await firebaseCloud.saveDiscordAccount(verifiedUser, { recordLogin });
    syncPremiumSubscriptionState();
    scheduleAccountPlanRefresh();
    state.isAdministrator = await firebaseCloud.isAdministrator(verifiedUser);
    state.discordAccessGranted = true;
    document.body.classList.add("discord-verified");
    updateHeader();

    await refreshCatalog();
    if (publicCatalogUnsubscribe) publicCatalogUnsubscribe();
    publicCatalogUnsubscribe = await firebaseCloud.subscribeToPublicTranslations((items) => {
      if (!state.discordAccessGranted) return;
      state.catalog = items;
      renderCatalog();
      void hydrateCloudCovers(items, { all: true, silent: true });
    }, showFirebaseError);

    if (discordMembershipTimer) window.clearInterval(discordMembershipTimer);
    discordMembershipTimer = window.setInterval(() => {
      void reverifyDiscordMembership();
    }, 4 * 60 * 1000);
    state.discordVerifyingUserUid = "";
    void startPostLoginExperience();
    return true;
  } catch (error) {
    state.discordVerifyingUserUid = "";
    throw error;
  }
}

async function reverifyDiscordMembership() {
  const user = state.firebaseUser;
  if (!user || !state.discordAccessGranted) return;
  try {
    const response = await api.verifyDiscordMembership(await user.getIdToken(true));
    if (!response.ok || response.data?.ok !== true) {
      const code = response.data?.code || response.code || "GUILD_MEMBERSHIP_REQUIRED";
      lockDiscordGate(discordAuthErrorMessage(code), "error");
      if (isDefinitiveDiscordMembershipFailure(code)) {
        await firebaseCloud.signOutCurrentUser();
      }
      return;
    }
    if (typeof response.data.customToken === "string") {
      discordLoginInProgress = true;
      try {
        state.firebaseUser = await firebaseCloud.signInWithDiscordToken(response.data.customToken);
      } finally {
        discordLoginInProgress = false;
      }
    }
    state.discordProfile = response.data.user || state.discordProfile;
    state.isAdministrator = await firebaseCloud.isAdministrator(state.firebaseUser);
    if (!state.isAdministrator && state.screen === "admin") {
      state.authenticated = false;
      state.adminTranslations = [];
      state.adminAccounts = [];
      scheduleAccountPlanRefresh();
      setScreen("public");
    }
    updateHeader();
  } catch (error) {
    console.error("Discord membership re-verification failed:", error);
    lockDiscordGate("discordGateUnavailable", "error");
  }
}

function lockDiscordGate(messageKey = "discordGatePrompt", status = "info") {
  if (publicCatalogUnsubscribe) {
    publicCatalogUnsubscribe();
    publicCatalogUnsubscribe = null;
  }
  if (discordMembershipTimer) {
    window.clearInterval(discordMembershipTimer);
    discordMembershipTimer = null;
  }
  if (accountPlanExpiryTimer) {
    window.clearTimeout(accountPlanExpiryTimer);
    accountPlanExpiryTimer = null;
  }
  document.body.classList.remove("discord-verified");
  state.discordAccessGranted = false;
  state.discordProfile = null;
  state.discordAccount = null;
  document.body.classList.remove("premium-subscriber");
  state.firebaseUser = null;
  state.discordVerifyingUserUid = "";
  state.authenticated = false;
  state.isAdministrator = false;
  state.adminTranslations = [];
  state.adminAccounts = [];
  state.adminTranslationRequests = [];
  state.adminReports = [];
  state.reportDraft = null;
  state.adminSubpage = "translations";
  state.catalog = [];
  state.pendingArtwork = null;
  cloudCoverGeneration += 1;
  cloudCoverUrls.clear();
  cloudCoverRequests.clear();
  cloudCoverPromises.clear();
  if (dialog.open) dialog.close();
  if (reportDialog.open) reportDialog.close();
  setScreen("public", { scrollToTop: false });
  renderCatalog();
  renderAdminTable();
  updateHeader();
  document.querySelector("#discord-join").hidden = true;
  document.querySelector("#discord-login").disabled = !discordLoginEnabled;
  setDiscordGateStatus(messageKey, status);
}

async function signOutDiscordUser() {
  lockDiscordGate("discordGatePrompt");
  try {
    await firebaseCloud.signOutCurrentUser();
  } catch (error) {
    showFirebaseError(error);
  }
}

async function handleDiscordLogin() {
  const button = document.querySelector("#discord-login");
  if (!discordLoginEnabled || button.disabled) return;
  button.disabled = true;
  document.querySelector("#discord-join").hidden = true;
  setDiscordGateStatus("discordGateConnecting");

  try {
    const start = await api.startDiscordLogin();
    if (!start.ok || !start.data?.sessionId) {
      throw Object.assign(new Error(start.code || "AUTH_SERVER_UNAVAILABLE"), {
        code: start.code || "AUTH_SERVER_UNAVAILABLE"
      });
    }

    const deadline = Date.now() + 5 * 60 * 1000;
    while (Date.now() < deadline) {
      await new Promise((resolve) => window.setTimeout(resolve, 1200));
      const poll = await api.pollDiscordLogin(start.data.sessionId);
      if (!poll.ok) {
        throw Object.assign(new Error(poll.code || "AUTH_SERVER_UNAVAILABLE"), {
          code: poll.code || "AUTH_SERVER_UNAVAILABLE"
        });
      }
      const session = poll.data;
      if (session.status === "pending" || session.status === "verifying") continue;
      if (session.status === "not_member") {
        setDiscordGateStatus("discordGateNotMember", "error");
        document.querySelector("#discord-join").hidden = !discordInviteAvailable;
        button.disabled = false;
        return;
      }
      if (session.status === "failed") {
        throw Object.assign(new Error(session.code || "DISCORD_SIGN_IN_FAILED"), {
          code: session.code || "DISCORD_SIGN_IN_FAILED"
        });
      }
      if (session.status === "expired") {
        throw Object.assign(new Error("AUTH_SESSION_EXPIRED"), {
          code: "AUTH_SESSION_EXPIRED"
        });
      }
      if (session.status === "completed" && typeof session.customToken === "string") {
        setDiscordGateStatus("discordGateChecking");
        discordLoginInProgress = true;
        const user = await firebaseCloud.signInWithDiscordToken(session.customToken);
        state.firebaseUser = user;
        discordLoginInProgress = false;
        await activateDiscordUser(user, { recordLogin: true });
        return;
      }
    }
    throw Object.assign(new Error("AUTH_SESSION_EXPIRED"), {
      code: "AUTH_SESSION_EXPIRED"
    });
  } catch (error) {
    discordLoginInProgress = false;
    console.error("Discord sign-in failed:", error?.code || error?.name || "UNKNOWN");
    if (isDefinitiveDiscordMembershipFailure(error?.code) && firebaseCloud.currentUser()) {
      try {
        await firebaseCloud.signOutCurrentUser();
      } catch (signOutError) {
        console.error("Unable to clear a rejected Discord sign-in:", signOutError?.code || signOutError?.name || "UNKNOWN");
      }
    }
    const messageKey = discordAuthErrorMessage(error?.code);
    setDiscordGateStatus(messageKey, "error");
    document.querySelector("#discord-join").hidden =
      messageKey !== "discordGateNotMember" || !discordInviteAvailable;
    button.disabled = !discordLoginEnabled;
  }
}

let discordInviteAvailable = false;

async function initializeDiscordGate() {
  const button = document.querySelector("#discord-login");
  if (!api) {
    setDiscordGateStatus("discordGateUnavailable", "error");
    return;
  }

  try {
    const config = await api.getDiscordConfig();
    discordServerReady = config.ok && config.data?.ready === true;
    discordLoginEnabled = discordServerReady;
    discordInviteAvailable = config.ok && config.data?.inviteAvailable === true;
    button.disabled = !discordLoginEnabled;
    if (!config.ok) {
      setDiscordGateStatus(discordAuthErrorMessage(config.code), "error");
    } else if (!discordServerReady) {
      setDiscordGateStatus(discordSetupMessage(config.data?.setupIssues || []), "error");
      return;
    }

    await firebaseCloud.waitForAuthentication();
    const user = firebaseCloud.currentUser();
    if (user) {
      try {
        await activateDiscordUser(user);
      } catch (error) {
        console.error("Stored Discord sign-in is no longer valid:", error?.code || error?.name || "UNKNOWN");
        if (isDefinitiveDiscordMembershipFailure(error?.code)) {
          await firebaseCloud.signOutCurrentUser();
        }
        setDiscordGateStatus(discordAuthErrorMessage(error?.code), "error");
      }
    } else if (discordServerReady) {
      setDiscordGateStatus("discordGatePrompt");
    }
  } catch (error) {
    console.error("Unable to initialize the Discord membership gate:", error?.code || error?.name || "UNKNOWN");
    discordLoginEnabled = Boolean(api);
    button.disabled = !discordLoginEnabled;
    setDiscordGateStatus("discordGateUnavailable", "error");
  } finally {
    state.discordAuthInitialized = true;
    firebaseCloud.onUserChanged((user) => {
      if (!state.discordAuthInitialized || discordLoginInProgress) return;
      if (!discordServerReady) return;
      if (!user) {
        if (state.discordAccessGranted) lockDiscordGate("discordGatePrompt");
        return;
      }
      if (user.uid === state.discordVerifyingUserUid ||
          (state.discordAccessGranted && user.uid === state.firebaseUser?.uid)) return;
      void activateDiscordUser(user).catch(async (error) => {
        console.error("Discord membership gate rejected the Firebase session:", error?.code || error?.name || "UNKNOWN");
        lockDiscordGate(discordAuthErrorMessage(error?.code), "error");
        if (isDefinitiveDiscordMembershipFailure(error?.code)) {
          await firebaseCloud.signOutCurrentUser();
        }
      });
    }, (error) => {
      console.error("Firebase authentication state listener failed:", error);
      lockDiscordGate("discordGateUnavailable", "error");
    });
  }
}

async function refreshAdminList() {
  try {
    state.adminTranslations = await firebaseCloud.listAdminTranslations(state.firebaseUser);
    renderAdminTable();
    void hydrateCloudCovers(state.adminTranslations, { all: true, silent: true });
    return true;
  } catch (error) {
    if (error?.code === "ADMIN_REQUIRED") {
      state.authenticated = false;
      state.isAdministrator = false;
      state.adminTranslations = [];
      state.adminAccounts = [];
      state.adminTranslationRequests = [];
      state.adminReports = [];
      updateHeader();
      setScreen("auth");
      showToast("accessDenied");
      return false;
    }
    showFirebaseError(error);
    return false;
  }
}

async function refreshAdminAccounts() {
  try {
    state.adminAccounts = await firebaseCloud.listAdminAccounts(state.firebaseUser);
    const ownAccount = state.adminAccounts.find((account) => account.id === state.firebaseUser?.uid);
    if (ownAccount) {
      state.discordAccount = ownAccount;
      syncPremiumSubscriptionState();
      renderCatalog();
    }
    scheduleAccountPlanRefresh();
    renderAdminAccounts();
    return true;
  } catch (error) {
    if (error?.code === "ADMIN_REQUIRED") {
      state.authenticated = false;
      state.isAdministrator = false;
      state.adminAccounts = [];
      setScreen("public");
      showToast("accessDenied");
      return false;
    }
    showFirebaseError(error);
    return false;
  }
}

async function refreshAdminTranslationRequests() {
  try {
    state.adminTranslationRequests = await firebaseCloud.listAdminTranslationRequests(state.firebaseUser);
    renderAdminTranslationRequests();
    return true;
  } catch (error) {
    if (error?.code === "ADMIN_REQUIRED") {
      state.authenticated = false;
      state.isAdministrator = false;
      state.adminTranslationRequests = [];
      state.adminReports = [];
      setScreen("public");
      showToast("accessDenied");
      return false;
    }
    showFirebaseError(error);
    return false;
  }
}

async function refreshAdminTranslationReports() {
  try {
    state.adminReports = await firebaseCloud.listAdminTranslationReports(state.firebaseUser);
    renderAdminTranslationReports();
    return true;
  } catch (error) {
    if (error?.code === "ADMIN_REQUIRED") {
      state.authenticated = false;
      state.isAdministrator = false;
      state.adminReports = [];
      setScreen("public");
      showToast("accessDenied");
      return false;
    }
    showFirebaseError(error);
    return false;
  }
}

async function showAdminAccounts() {
  if (!state.authenticated || !state.firebaseUser || !state.isAdministrator) {
    showToast("accessDenied");
    return;
  }
  try {
    if (!await firebaseCloud.isAdministrator(state.firebaseUser)) {
      state.authenticated = false;
      state.isAdministrator = false;
      state.adminAccounts = [];
      setScreen("public");
      showToast("accessDenied");
      return;
    }
    setAdminSubpage("accounts");
    await refreshAdminAccounts();
  } catch (error) {
    showFirebaseError(error);
  }
}

async function showAdminTranslationRequests() {
  if (!state.authenticated || !state.firebaseUser || !state.isAdministrator) {
    showToast("accessDenied");
    return;
  }
  try {
    if (!await firebaseCloud.isAdministrator(state.firebaseUser)) {
      state.authenticated = false;
      state.isAdministrator = false;
      state.adminTranslationRequests = [];
      state.adminReports = [];
      setScreen("public");
      showToast("accessDenied");
      return;
    }
    setAdminSubpage("requests");
    await refreshAdminTranslationRequests();
  } catch (error) {
    showFirebaseError(error);
  }
}

async function showAdminTranslationReports() {
  if (!state.authenticated || !state.firebaseUser || !state.isAdministrator) {
    showToast("accessDenied");
    return;
  }
  try {
    if (!await firebaseCloud.isAdministrator(state.firebaseUser)) {
      state.authenticated = false;
      state.isAdministrator = false;
      state.adminReports = [];
      setScreen("public");
      showToast("accessDenied");
      return;
    }
    setAdminSubpage("reports");
    await refreshAdminTranslationReports();
  } catch (error) {
    showFirebaseError(error);
  }
}

function builtInCoverSource(cover) {
  return localCoverPath(cover);
}

function setCoverSearchMessage(message, tone = "") {
  coverSearchMessage.textContent = message;
  coverSearchMessage.dataset.tone = tone;
  coverSearchMessage.hidden = !message;
}

function coverSearchProviderName(provider) {
  const keys = {
    igdb: "imageSearchProviderIgdb",
    thegamesdb: "imageSearchProviderGamesDb",
    steamgriddb: "imageSearchProviderSteamGridDb"
  };
  return text(keys[provider] || "imageSearchProviderIgdb");
}

function renderCoverSearchConfigStatus(config) {
  const providers = [
    config?.igdb && text("imageSearchProviderIgdb"),
    config?.thegamesdb && text("imageSearchProviderGamesDb"),
    config?.steamgriddb && text("imageSearchProviderSteamGridDb")
  ].filter(Boolean);
  const status = document.querySelector("#cover-search-config-status");
  status.textContent = providers.length
    ? `${text("imageSearchConfigured")} ${providers.join(state.locale === "ar" ? "، " : ", ")}`
    : text("imageSearchNotConfigured");
}

async function refreshCoverSearchConfig() {
  try {
    const user = firebaseCloud.currentUser();
    if (!user) throw new Error("ADMIN_REQUIRED");
    const result = await api.getImageSearchConfig(await user.getIdToken());
    if (!result.ok) {
      renderCoverSearchConfigStatus({});
      setCoverSearchMessage(
        result.code === "ADMIN_REQUIRED"
          ? text("imageSearchUnavailable")
          : text("imageSearchNotConfigured"),
        "error"
      );
      return;
    }
    renderCoverSearchConfigStatus(result.data);
  } catch (error) {
    console.error("Unable to load image search settings:", error?.name || "UNKNOWN");
    setCoverSearchMessage(text("imageSearchUnavailable"), "error");
  }
}

function resetCoverSearch() {
  state.coverSearchRequestId += 1;
  state.coverSearchBusy = false;
  document.querySelector("#cover-search-button").disabled = false;
  state.coverSearchResults = [];
  coverSearchResults.replaceChildren();
  coverSearchInput.value = "";
  setCoverSearchMessage("");
}

function clearCoverSearch() {
  resetCoverSearch();
  void refreshCoverSearchConfig();
}

function renderCoverSearchResults(images) {
  state.coverSearchResults = images;
  coverSearchResults.innerHTML = images.map((image, index) => `
    <button class="cover-search-result" type="button" data-cover-image-index="${index}" aria-label="${escapeHtml(text("imageSearchSelect"))}">
      <img src="${escapeHtml(image.url)}" alt="" loading="lazy" />
      <span class="cover-search-result-copy">
        <strong>${escapeHtml(image.title || coverSearchProviderName(image.source))}</strong>
        <small>${escapeHtml(`${coverSearchProviderName(image.source)} · ${image.type}`)}</small>
      </span>
    </button>
  `).join("");
}

async function compressArtworkForFirestore(artwork) {
  if (!artwork ||
      typeof artwork.base64 !== "string" ||
      !["image/png", "image/jpeg", "image/webp"].includes(artwork.contentType)) {
    const error = new Error("INVALID_COVER");
    error.code = "INVALID_COVER";
    throw error;
  }

  const sourceBytes = Uint8Array.from(atob(artwork.base64), (character) => character.charCodeAt(0));
  let bitmap;
  try {
    bitmap = await createImageBitmap(new Blob([sourceBytes], { type: artwork.contentType }));
  } catch {
    const error = new Error("COVER_COMPRESS_FAILED");
    error.code = "COVER_COMPRESS_FAILED";
    throw error;
  }
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    const error = new Error("COVER_COMPRESS_FAILED");
    error.code = "COVER_COMPRESS_FAILED";
    throw error;
  }

  try {
    for (const dimensionLimit of [1200, 1000, 850, 700]) {
      const scale = Math.min(1, dimensionLimit / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.82, 0.72, 0.62, 0.52]) {
        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob((result) => result
            ? resolve(result)
            : reject(new Error("COVER_COMPRESS_FAILED")), "image/webp", quality);
        });
        if (blob.size > 300 * 1024) continue;

        const bytes = new Uint8Array(await blob.arrayBuffer());
        let binary = "";
        for (let start = 0; start < bytes.length; start += 0x8000) {
          binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
        }
        const base64 = btoa(binary);
        return {
          contentType: "image/webp",
          base64,
          size: bytes.length,
          src: `data:image/webp;base64,${base64}`
        };
      }
    }
  } catch (error) {
    if (error?.code === "COVER_COMPRESS_FAILED") throw error;
    const compressionError = new Error("COVER_COMPRESS_FAILED");
    compressionError.code = "COVER_COMPRESS_FAILED";
    throw compressionError;
  } finally {
    bitmap.close();
    canvas.width = 0;
    canvas.height = 0;
  }

  const error = new Error("COVER_COMPRESS_FAILED");
  error.code = "COVER_COMPRESS_FAILED";
  throw error;
}

async function searchCoverArtwork() {
  if (state.coverSearchBusy) return;
  const query = (coverSearchInput.value || document.querySelector("#translation-title-en").value).trim();
  if (!query) {
    setCoverSearchMessage(text("imageSearchQueryRequired"), "error");
    coverSearchInput.focus();
    return;
  }
  const requestId = ++state.coverSearchRequestId;
  state.coverSearchBusy = true;
  document.querySelector("#cover-search-button").disabled = true;
  coverSearchResults.replaceChildren();
  setCoverSearchMessage(text("imageSearchLoading"));
  try {
    const user = firebaseCloud.currentUser();
    if (!user) throw new Error("ADMIN_REQUIRED");
    const result = await api.searchGameArtwork(query, await user.getIdToken());
    if (requestId !== state.coverSearchRequestId) return;
    if (!result.ok) {
      const message = result.code === "IMAGE_SEARCH_NOT_CONFIGURED"
        ? text("imageSearchNoProviders")
        : text("imageSearchUnavailable");
      setCoverSearchMessage(message, "error");
      return;
    }
    if (!result.data.images.length) {
      setCoverSearchMessage(
        result.data.failures.length ? text("imageSearchUnavailable") : text("imageSearchNotFound"),
        result.data.failures.length ? "error" : ""
      );
      return;
    }
    renderCoverSearchResults(result.data.images);
    const provider = coverSearchProviderName(result.data.provider);
    let message = text("imageSearchFound")
      .replace("{count}", result.data.images.length.toLocaleString(state.locale))
      .replace("{provider}", provider);
    if (result.data.failures.length) message += ` ${text("imageSearchProviderWarning")}`;
    setCoverSearchMessage(message, result.data.failures.length ? "warning" : "success");
  } catch (error) {
    if (requestId !== state.coverSearchRequestId) return;
    console.error("Game artwork search failed:", error?.name || "UNKNOWN");
    setCoverSearchMessage(text("imageSearchUnavailable"), "error");
  } finally {
    if (requestId === state.coverSearchRequestId) {
      state.coverSearchBusy = false;
      document.querySelector("#cover-search-button").disabled = false;
    }
  }
}

async function selectCoverSearchResult(index) {
  const image = state.coverSearchResults[index];
  if (!image) return;
  const requestId = ++state.coverSearchRequestId;
  coverSearchResults.querySelectorAll("button").forEach((button) => { button.disabled = true; });
  setCoverSearchMessage(text("imageSearchLoading"));
  try {
    const result = await api.downloadGameArtwork(image.url);
    if (requestId !== state.coverSearchRequestId) return;
    if (!result.ok) {
      const message = result.code === "COVER_SIZE_LIMIT"
        ? text("imageSearchCoverSizeLimit")
        : result.code === "UNSUPPORTED_COVER"
          ? text("imageSearchUnsupportedCover")
          : text("imageSearchArtworkDownloadFailed");
      setCoverSearchMessage(message, "error");
      return;
    }
    state.pendingArtwork = await compressArtworkForFirestore(result.data);
    state.selectedCoverSrc = state.pendingArtwork.src;
    document.querySelector("#cover-preview").innerHTML =
      `<img src="${escapeHtml(state.pendingArtwork.src)}" alt="" />`;
    hideMessage(editorMessage);
    setCoverSearchMessage(text("imageSearchSelected"), "success");
  } catch (error) {
    if (requestId !== state.coverSearchRequestId) return;
    console.error("Unable to select game artwork:", error?.name || "UNKNOWN");
    setCoverSearchMessage(
      text(error?.code === "COVER_COMPRESS_FAILED" ? "coverCompressFailed" : "imageSearchArtworkDownloadFailed"),
      "error"
    );
  } finally {
    if (requestId === state.coverSearchRequestId) {
      coverSearchResults.querySelectorAll("button").forEach((button) => { button.disabled = false; });
    }
  }
}

function applyRemoteCoverUrl(url, { showNotice = true } = {}) {
  const value = String(url ?? "").trim();
  if (!isRemoteCoverUrl(value)) {
    updateMessage(editorMessage, text("coverUrlInvalid"));
    return false;
  }

  state.pendingArtwork = null;
  state.selectedCover = value;
  document.querySelector("#translation-cover").value = value;
  document.querySelector("#cover-url-input").value = value;
  document.querySelector("#cover-preview").innerHTML = `<img src="${escapeHtml(value)}" alt="" />`;
  hideMessage(editorMessage);
  if (showNotice) showToast("coverSelected");
  return true;
}

function previewCoverUrlInput() {
  const value = document.querySelector("#cover-url-input").value.trim();
  if (!value) {
    hideMessage(editorMessage);
    return;
  }
  if (!applyRemoteCoverUrl(value, { showNotice: false })) return;
}

function createNewTranslation() {
  editorForm.reset();
  state.editingId = null;
  state.originalCover = null;
  state.pendingArtwork = null;
  state.selectedCover = "astral-observer";
  document.querySelector("#translation-id").value = "";
  document.querySelector("#translation-title").value = "";
  document.querySelector("#translation-title-en").value = "";
  document.querySelector("#translation-developer").value = "Dreko Studio";
  document.querySelector("#translation-genre").value = "adventure";
  document.querySelector("#translation-status").value = "ready";
  document.querySelector("#translation-year").value = String(new Date().getFullYear());
  document.querySelector("#translation-description").value = "";
  document.querySelector("#translation-package-url").value = "";
  document.querySelector("#translation-installer-url").value = "";
  document.querySelector("#translation-package-version").value = "";
  document.querySelector("#translation-published").checked = true;
  document.querySelector("#translation-premium").checked = false;
  document.querySelector("#cover-url-input").value = "";
  document.querySelector("#cover-preview").innerHTML = `<img src="${builtInCoverSource(state.selectedCover)}" alt="" />`;
  document.querySelector("#translation-cover").value = state.selectedCover;
  document.querySelector("#editor-title").textContent = text("addEditorTitle");
  document.querySelector("#editor-save").disabled = false;
  hideMessage(editorMessage);
  clearCoverSearch();
  editorDialog.showModal();
  document.querySelector("#translation-title").focus();
}

function editTranslation(id) {
  const item = state.adminTranslations.find((entry) => entry.id === id);
  if (!item) {
    showToast("translationNotFound");
    return;
  }
  editorForm.reset();
  state.editingId = item.id;
  state.originalCover = item.cover;
  state.pendingArtwork = null;
  state.selectedCover = item.cover;
  document.querySelector("#translation-id").value = item.id;
  document.querySelector("#translation-title").value = item.title;
  document.querySelector("#translation-title-en").value = item.titleEn;
  document.querySelector("#translation-developer").value = "Dreko Studio";
  document.querySelector("#translation-genre").value = item.genre;
  document.querySelector("#translation-status").value = item.status;
  document.querySelector("#translation-year").value = String(item.year);
  document.querySelector("#translation-description").value = item.description;
  document.querySelector("#translation-package-url").value = item.translationUrl || "";
  document.querySelector("#translation-installer-url").value = item.installerProgramUrl || "";
  document.querySelector("#translation-package-version").value = item.packageVersion || "";
  document.querySelector("#translation-published").checked = item.visibility === "published";
  document.querySelector("#translation-premium").checked = item.premium === true;
  document.querySelector("#translation-title").dir = "auto";
  document.querySelector("#translation-title-en").dir = "ltr";
  document.querySelector("#editor-title").textContent = text("editEditorTitle");
  document.querySelector("#translation-cover").value = item.cover;
  document.querySelector("#cover-url-input").value = isRemoteCoverUrl(item.cover) ? item.cover : "";
  document.querySelector("#cover-preview").innerHTML = `<img src="${escapeHtml(localCoverPath(item.cover))}" alt="" />`;
  if ((item.cover.startsWith("storage:") || item.cover.startsWith("firestore:covers/")) &&
      cloudCoverUrls.has(item.cover)) {
    document.querySelector("#cover-preview img").src = cloudCoverUrls.get(item.cover);
  }
  document.querySelector("#editor-save").disabled = false;
  hideMessage(editorMessage);
  clearCoverSearch();
  editorDialog.showModal();
  document.querySelector("#translation-title").focus();
}

async function closeEditor() {
  if (!editorDialog.open) return;
  state.pendingArtwork = null;
  hideMessage(editorMessage);
  editorDialog.close();
}

async function deleteTranslation(id) {
  const item = state.adminTranslations.find((entry) => entry.id === id);
  if (!item) return;
  const answer = window.confirm(text("deleteConfirm").replace("{title}", item.title));
  if (!answer) return;

  try {
    await firebaseCloud.deleteTranslation(id, state.firebaseUser);
    state.adminTranslations = await firebaseCloud.listAdminTranslations(state.firebaseUser);
    state.catalog = await firebaseCloud.listPublicTranslations();
    renderAdminTable();
    renderCatalog();
    void hydrateCloudCovers(state.catalog);
    showToast("translationDeleted");
  } catch (error) {
    if (error?.code === "ADMIN_REQUIRED") {
      state.authenticated = false;
      setScreen("auth");
    }
    showFirebaseError(error);
  }
}

async function changeTranslationVisibility(id) {
  const item = state.adminTranslations.find((entry) => entry.id === id);
  if (!item) return;
  const visibility = item.visibility === "published" ? "draft" : "published";

  try {
    await firebaseCloud.setTranslationVisibility(id, visibility, state.firebaseUser);
    state.adminTranslations = await firebaseCloud.listAdminTranslations(state.firebaseUser);
    state.catalog = await firebaseCloud.listPublicTranslations();
    renderAdminTable();
    renderCatalog();
    if (visibility === "published") void hydrateCloudCovers(state.catalog);
    showToast(visibility === "published" ? "translationPublished" : "translationHidden");
  } catch (error) {
    console.error("Unable to change translation visibility:", error);
    if (error?.code === "ADMIN_REQUIRED") {
      state.authenticated = false;
      setScreen("auth");
    }
    showToast(`${statusErrorMessage(firebaseErrorCode(error))} [${error?.code || "unknown"}]`);
  }
}

async function moveTranslation(id, direction) {
  try {
    const result = await firebaseCloud.moveTranslation(
      id,
      direction,
      state.adminTranslations,
      state.firebaseUser
    );
    if (result === false) return;
    const sortOrders = new Map(result.sortOrders.map(({ id: translationId, sortOrder }) => [
      translationId,
      sortOrder
    ]));
    for (const translation of [...state.adminTranslations, ...state.catalog]) {
      if (sortOrders.has(translation.id)) {
        translation.sortOrder = sortOrders.get(translation.id);
      }
    }
    state.adminTranslations.sort((left, right) =>
      left.sortOrder - right.sortOrder || left.id.localeCompare(right.id)
    );
    renderAdminTable();
    renderCatalog();
    showToast("translationOrderUpdated");
  } catch (error) {
    console.error("Unable to change translation order:", error);
    if (error?.code === "ADMIN_REQUIRED") {
      state.authenticated = false;
      setScreen("auth");
    }
    showToast(`${statusErrorMessage(firebaseErrorCode(error))} [${error?.code || "unknown"}]`);
  }
}

async function saveTranslation(event) {
  event.preventDefault();
  hideMessage(editorMessage);
  if (!editorForm.reportValidity()) return;

  const submit = document.querySelector("#editor-save");
  submit.disabled = true;
  const translationId = document.querySelector("#translation-id").value;
  const existingTranslation = state.adminTranslations.find((item) => item.id === translationId);
  const enteredGameName = normalizedGameIdentity(document.querySelector("#translation-title-en").value);
  const duplicateGame = state.adminTranslations.find((item) =>
    item.id !== translationId &&
    normalizedGameIdentity(item.titleEn || item.title) === enteredGameName
  );
  if (duplicateGame) {
    updateMessage(editorMessage, text("duplicateGame"));
    submit.disabled = false;
    return;
  }
  const currentSortOrders = state.adminTranslations.map((item) => item.sortOrder);
  const nextSortOrder = !translationId && currentSortOrders.length > 0 &&
    currentSortOrders.every(Number.isSafeInteger)
    ? currentSortOrders.reduce((minimum, value) => Math.min(minimum, value), Number.MAX_SAFE_INTEGER) - 10
    : null;
  const record = {
    id: translationId || undefined,
    title: document.querySelector("#translation-title").value,
    titleEn: document.querySelector("#translation-title-en").value,
    developer: "Dreko Studio",
    genre: document.querySelector("#translation-genre").value,
    category: "full",
    status: document.querySelector("#translation-status").value,
    year: Number(document.querySelector("#translation-year").value),
    popularity: Number.isSafeInteger(Number(existingTranslation?.popularity))
      ? Number(existingTranslation.popularity)
      : 0,
    premium: document.querySelector("#translation-premium").checked,
    cover: document.querySelector("#translation-cover").value,
    description: document.querySelector("#translation-description").value,
    translationUrl: document.querySelector("#translation-package-url").value,
    installerProgramUrl: document.querySelector("#translation-installer-url").value,
    packageVersion: document.querySelector("#translation-package-version").value,
    sortOrder: Number.isFinite(existingTranslation?.sortOrder)
      ? existingTranslation.sortOrder
      : nextSortOrder,
    visibility: document.querySelector("#translation-published").checked ? "published" : "draft"
  };
  const wasEditing = Boolean(record.id);

  try {
    const saved = await firebaseCloud.saveTranslation(
      record,
      state.firebaseUser,
      state.pendingArtwork
    );
    state.adminTranslations = await firebaseCloud.listAdminTranslations(state.firebaseUser);
    state.catalog = await firebaseCloud.listPublicTranslations();
    state.originalCover = saved.cover;
    state.selectedCover = null;
    state.selectedCoverSrc = "";
    state.pendingArtwork = null;
    editorDialog.close();
    renderAdminTable();
    renderCatalog();
    void hydrateCloudCovers(state.catalog);
    void hydrateCloudCovers(state.adminTranslations);
    showToast(wasEditing ? "translationSaved" : "translationAdded");
  } catch (error) {
    if (error?.code === "ADMIN_REQUIRED") {
      state.authenticated = false;
      setScreen("auth");
    }
    showFirebaseError(error, editorMessage);
  } finally {
    submit.disabled = false;
  }
}

document.querySelector("#language-toggle").addEventListener("click", () => {
  state.locale = state.locale === "ar" ? "en" : "ar";
  localStorage.setItem("dreko-locale", state.locale);
  applyLocale();
});

document.querySelector("#theme-toggle").addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
  const isLight = document.body.classList.contains("light-theme");
  document.querySelector("#theme-toggle").setAttribute("aria-pressed", String(isLight));
  document.querySelector('meta[name="theme-color"]').content = isLight ? "#f3f5f7" : "#090a0d";
  localStorage.setItem("dreko-theme", isLight ? "light" : "dark");
});

document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    state.libraryPage = 1;
    document.querySelectorAll(".filter-button").forEach((filter) => filter.classList.toggle("selected", filter === button));
    renderCatalog();
  });
});

libraryPagination.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-page]");
  if (!button || button.disabled) return;
  const page = Number(button.dataset.page);
  if (!Number.isInteger(page) || page < 1 || page === state.libraryPage) return;
  state.libraryPage = page;
  renderCatalog();
  libraryPagination.querySelector('[aria-current="page"]')?.focus({ preventScroll: true });
  document.querySelector("#library").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelectorAll(".view-button").forEach((button) => {
  button.addEventListener("click", () => {
    state.view = button.dataset.view;
    grid.classList.toggle("list-view", state.view === "list");
    document.querySelectorAll(".view-button").forEach((view) => view.classList.toggle("selected", view === button));
    localStorage.setItem("dreko-view", state.view);
  });
});

function positionCategoryMenu() {
  if (categoryMenu.hidden) return;
  const section = document.querySelector("#library").getBoundingClientRect();
  const button = document.querySelector("#category-filter").getBoundingClientRect();
  categoryMenu.style.top = `${button.bottom - section.top + 8}px`;
  if (document.documentElement.dir === "rtl") {
    categoryMenu.style.right = `${section.right - button.right}px`;
    categoryMenu.style.left = "";
  } else {
    categoryMenu.style.left = `${button.left - section.left}px`;
    categoryMenu.style.right = "";
  }
}

function gamesDialogHeader(title, description) {
  return `
    <header class="games-dialog-heading">
      <span class="eyebrow"><span class="eyebrow-line"></span>${escapeHtml(text("myGamesEyebrow"))}</span>
      <h2 id="installed-games-title">${escapeHtml(text(title))}</h2>
      <p>${escapeHtml(text(description))}</p>
    </header>
  `;
}

async function loadInstalledGames() {
  state.installedGamesStatus = "loading";
  renderCatalog();
  try {
    const result = await api.listInstalledGames();
    if (!result?.ok) {
      console.error("Unable to list installed games:", result?.code || "UNKNOWN");
      state.installedGamesStatus = "error";
    } else {
      state.installedGames = Array.isArray(result.data?.games) ? result.data.games : [];
      state.steamDetected = result.data?.steamDetected === true;
      state.installedGamesStatus = "ready";
    }
  } catch (error) {
    console.error("Unable to list installed games:", error);
    state.installedGamesStatus = "error";
  }
  renderCatalog();
}

function renderTranslationRequest(game, status = "") {
  installedGamesDialog.classList.add("request-confirmation-dialog");
  const isSuccess = status === "success";
  const errorKey = {
    error: "requestFailed",
    available: "requestGameAvailable",
    pending: "requestAlreadyPending"
  }[status];
  const errorMessage = errorKey
    ? `<p class="games-request-error" role="alert">${escapeHtml(text(errorKey))}</p>`
    : "";
  installedGamesContent.innerHTML = `
    <section class="request-popout" aria-labelledby="installed-games-title">
      <div class="request-popout-heading">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 8.5h11a4 4 0 0 1 3.9 3.1l.7 3.1a2.2 2.2 0 0 1-3.6 2.1l-2.1-1.8H7.6l-2.1 1.8a2.2 2.2 0 0 1-3.6-2.1l.7-3.1a4 4 0 0 1 3.9-3.1Z"/><path d="M8 10.8v4m-2-2h4m7-1h.01M18 14h.01"/></svg>
        <h2 id="installed-games-title">${escapeHtml(text(isSuccess ? "requestTranslationSuccessTitle" : "requestTranslationConfirmTitle"))}</h2>
      </div>
      <p class="request-popout-description">${escapeHtml(text(isSuccess ? "requestTranslationSuccessDescription" : "requestTranslationConfirmDescription"))}</p>
      <strong class="request-popout-game" dir="auto">${escapeHtml(game.title)}</strong>
      ${errorMessage}
      <div class="request-popout-actions">
        ${isSuccess
          ? `<button class="primary-action" id="request-done" type="button">${escapeHtml(text("requestDone"))}</button>`
          : `<button class="primary-action" id="request-submit" type="button"><span>${escapeHtml(text("requestTranslation"))}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13"/></svg></button>
             <button class="request-popout-cancel" id="request-cancel" type="button">${escapeHtml(text("cancel"))}</button>`}
      </div>
    </section>
  `;
}

async function submitSelectedTranslationRequest() {
  if (!selectedRequestGame || translationRequestSubmitting) return;
  if (!state.firebaseUser) {
    showToast("requestLoginRequired");
    return;
  }
  translationRequestSubmitting = true;
  const submitButton = installedGamesContent.querySelector("#request-submit");
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = text("requestSubmitting");
  }
  try {
    await firebaseCloud.submitTranslationRequest(selectedRequestGame, state.firebaseUser);
    translationRequestSubmitting = false;
    renderTranslationRequest(selectedRequestGame, "success");
  } catch (error) {
    translationRequestSubmitting = false;
    const requestErrorStatus = {
      GAME_TRANSLATION_AVAILABLE: "available",
      USER_HAS_PENDING_TRANSLATION_REQUEST: "pending"
    }[error?.code];
    if (!requestErrorStatus) showFirebaseError(error);
    renderTranslationRequest(selectedRequestGame, requestErrorStatus || "error");
  }
}

document.querySelector("#category-filter").addEventListener("click", () => {
  categoryMenu.hidden = !categoryMenu.hidden;
  positionCategoryMenu();
});
window.addEventListener("resize", positionCategoryMenu);

document.querySelector("#platform-button").addEventListener("click", () => {
  if (!state.installedGamesMode && (!state.discordAccessGranted || !state.firebaseUser)) {
    showToast("requestLoginRequired");
    return;
  }
  state.installedGamesMode = !state.installedGamesMode;
  state.query = "";
  searchInput.value = "";
  renderCatalog();
  if (state.installedGamesMode) void loadInstalledGames();
});

document.querySelector("#installed-games-close").addEventListener("click", () => {
  installedGamesDialog.close();
});

installedGamesContent.addEventListener("click", (event) => {
  if (event.target.closest("#request-cancel")) {
    selectedRequestGame = null;
    installedGamesDialog.close();
    return;
  }
  if (event.target.closest("#request-submit")) {
    void submitSelectedTranslationRequest();
    return;
  }
  if (event.target.closest("#request-done")) {
    selectedRequestGame = null;
    installedGamesDialog.close();
  }
});

let selectedAiSourceToken = "";
let currentAiJobId = "";
let aiApiKeyConfigured = false;

function aiErrorMessage(code) {
  const keys = {
    AUTH_REQUIRED: "aiAuthRequired",
    INVALID_GAME_FOLDER: "gameFolderNotFound",
    LOCALIZATION_SCAN_LIMIT: "aiFolderScanLimit",
    LOCALIZATION_SOURCE_NOT_FOUND: "aiNoFolderSource",
    LOCALIZATION_GAME_MISMATCH: "aiFolderGameMismatch",
    UNSUPPORTED_PROTECTED_GAME: "aiProtectedGame",
    ARABIC_LOCALIZATION_PRESENT: "aiArabicAlreadyAvailable",
    SOTTR_ARABIC_LOCALIZATION_PRESENT: "aiSottrArabicAlreadyAvailable",
    UNSUPPORTED_UNREAL_RESOURCE_FORMAT: "aiUnsupportedUnrealFiles",
    UNSUPPORTED_GAME_RESOURCE_FORMAT: "aiUnsupportedGameFiles",
    GUILD_MEMBERSHIP_REQUIRED: "aiAuthRequired",
    GEMINI_SERVICE_NOT_CONFIGURED: "aiServiceNotConfigured",
    AUTH_SERVER_NOT_CONFIGURED: "aiServiceNotConfigured",
    INVALID_TRANSLATION_OPTIONS: "aiSourceFormatUnsupported",
    INVALID_TRANSLATION_REQUEST: "aiSourceFormatUnsupported",
    API_QUOTA_EXHAUSTED: "aiQuotaExhausted",
    API_RATE_LIMITED: "aiRateLimited",
    MODEL_UNAVAILABLE: "aiModelUnavailable",
    GEMINI_NETWORK_ERROR: "aiNetworkError",
    GEMINI_SERVICE_UNAVAILABLE: "aiNetworkError",
    INVALID_GEMINI_RESPONSE: "aiResponseInvalid",
    INCOMPLETE_GEMINI_RESPONSE: "aiResponseInvalid",
    PROTECTED_TOKEN_MISMATCH: "aiTokensChanged",
    UNSUPPORTED_FILE_FORMAT: "aiSourceFormatUnsupported",
    INVALID_JSON: "aiSourceFormatUnsupported",
    UNSUPPORTED_JSON_SCHEMA: "aiSourceFormatUnsupported",
    DUPLICATE_LOCALIZATION_KEY: "aiSourceFormatUnsupported",
    INVALID_TEXT_ENCODING: "aiSourceFormatUnsupported",
    UNSUPPORTED_CSV_SCHEMA: "aiSourceFormatUnsupported",
    AMBIGUOUS_CSV_HEADER: "aiSourceFormatUnsupported",
    DUPLICATE_OR_EMPTY_LOCALIZATION_KEY: "aiSourceFormatUnsupported",
    NO_TRANSLATABLE_ENTRIES: "aiSourceFormatUnsupported",
    LOCALIZATION_ENTRY_LIMIT: "aiSourceTooLarge",
    LOCALIZATION_FILE_NOT_FOUND: "aiUnknownError",
    LOCALIZATION_FILE_READ_FAILED: "aiUnknownError",
    SOURCE_SIZE_LIMIT: "aiSourceTooLarge",
    LOCALIZATION_ENTRY_TOO_LARGE: "aiEntryTooLarge",
    AI_JOB_STORAGE_FAILED: "aiStorageFailed",
    CANNOT_OVERWRITE_SOURCE_FILE: "aiSourceOverwrite",
    LOCALIZATION_ARCHIVE_SOURCE_CHANGED: "aiArchiveChanged",
    LOCALIZATION_ARCHIVE_LIMIT: "aiSourceTooLarge",
    LOCALIZATION_ARCHIVE_LINK_NOT_SUPPORTED: "aiArchiveExportFailed",
    LOCALIZATION_ARCHIVE_SOURCE_MISSING: "aiArchiveExportFailed",
    INVALID_LOCALIZATION_ARCHIVE_PATH: "aiArchiveExportFailed"
  };
  return text(keys[code] || "aiUnknownError");
}

function renderAiSourcePreview(source) {
  const preview = document.querySelector("#ai-localization-preview");
  preview.replaceChildren();
  if (!source) {
    preview.hidden = true;
    return;
  }
  const heading = document.createElement("h3");
  heading.textContent = interpolateText("aiPreviewTitle");
  const file = document.createElement("p");
  file.textContent = interpolateText("aiFileSelected", {
    file: source.fileName,
    count: source.entryCount
  });
  const list = document.createElement("ul");
  for (const entry of source.preview) {
    const item = document.createElement("li");
    const identifier = document.createElement("code");
    identifier.textContent = entry.id;
    const value = document.createElement("span");
    value.dir = "auto";
    value.textContent = entry.text;
    item.append(identifier, value);
    list.append(item);
  }
  preview.append(heading, file, list);
  preview.hidden = false;
}

function renderAiJob(job) {
  if (!job) return;
  currentAiJobId = job.id;
  const container = document.querySelector("#ai-localization-job");
  const progress = document.querySelector("#ai-localization-progress");
  const progressLabel = document.querySelector("#ai-localization-progress-label");
  const errors = document.querySelector("#ai-localization-errors");
  const cancel = document.querySelector("#ai-cancel-job");
  const resume = document.querySelector("#ai-resume-job");
  const exportButton = document.querySelector("#ai-export-job");
  const statusKey = {
    running: "aiJobRunning",
    completed: "aiJobCompleted",
    interrupted: "aiJobInterrupted",
    cancelled: "aiJobCancelled"
  }[job.status];
  container.hidden = false;
  progress.max = Math.max(1, job.total);
  progress.value = job.completed;
  progressLabel.textContent = statusKey
    ? interpolateText(statusKey, { completed: job.completed, total: job.total })
    : interpolateText("aiJobFailed", { code: job.errors?.[0]?.code || "TRANSLATION_FAILED" });
  const failedEntries = job.errors?.[0]?.remainingEntries || [];
  errors.textContent = job.errors?.length
    ? `${aiErrorMessage(job.errors[0].code)}${failedEntries.length
      ? ` ${interpolateText("aiFailedEntryIds", {
        ids: `${failedEntries.slice(0, 8).join(", ")}${failedEntries.length > 8 ? ", …" : ""}`
      })}`
      : ""}`
    : "";
  cancel.hidden = job.status !== "running";
  resume.hidden = !["failed", "cancelled", "interrupted"].includes(job.status);
  exportButton.hidden = job.status !== "completed";
}

function renderAiJobHistory(jobs) {
  const list = document.querySelector("#ai-localization-history-list");
  list.replaceChildren();
  if (!jobs.length) {
    const empty = document.createElement("p");
    empty.textContent = text("aiJobHistoryEmpty");
    list.append(empty);
    return;
  }
  for (const job of jobs) {
    const row = document.createElement("div");
    row.className = "ai-job-history-row";
    const label = document.createElement("span");
    const stateText = job.status === "completed"
      ? text("aiJobCompleted").replace("{completed}", job.completed).replace("{total}", job.total)
      : job.status === "running"
        ? text("aiJobRunning").replace("{completed}", job.completed).replace("{total}", job.total)
        : job.status === "interrupted"
          ? text("aiJobInterrupted")
          : job.status === "cancelled"
            ? text("aiJobCancelled")
            : text("aiJobFailed").replace("{code}", job.errors?.[0]?.code || "TRANSLATION_FAILED");
    label.textContent = interpolateText("aiJobLabel", {
      file: job.fileName,
      completed: `${job.completed}/${job.total}`,
      status: stateText
    });
    row.append(label);
    if (["failed", "cancelled", "interrupted"].includes(job.status)) {
      const resume = document.createElement("button");
      resume.type = "button";
      resume.className = "outline-button";
      resume.dataset.aiResume = job.id;
      resume.textContent = text("aiResumeJob");
      row.append(resume);
    }
    if (job.status === "completed") {
      const exportButton = document.createElement("button");
      exportButton.type = "button";
      exportButton.className = "outline-button";
      exportButton.dataset.aiExport = job.id;
      exportButton.textContent = text("aiExportJob");
      row.append(exportButton);
    }
    list.append(row);
  }
}

async function refreshAiLocalizationJobs() {
  const result = await api.listAiLocalizationJobs();
  if (!result?.ok) {
    document.querySelector("#ai-localization-status").textContent = aiErrorMessage(result?.code);
    return;
  }
  const jobs = result.data?.jobs || [];
  renderAiJobHistory(jobs);
  const current = jobs.find((job) => job.id === currentAiJobId) ||
    jobs.find((job) => job.status === "running");
  if (current) renderAiJob(current);
}

async function loadAiLocalizationSettings() {
  const status = document.querySelector("#ai-localization-status");
  try {
    const result = await api.getAiLocalizationConfig();
    if (!result?.ok) {
      status.textContent = aiErrorMessage(result?.code);
      return;
    }
    const config = result.data;
    aiApiKeyConfigured = config.apiKeyConfigured === true;
    document.querySelector("#ai-model").value = config.model;
    status.textContent = config.code
      ? aiErrorMessage(config.code)
      : aiApiKeyConfigured ? text("aiKeyConfigured") : text("aiKeyNotConfigured");
    if (!config.secureStorageAvailable && !aiApiKeyConfigured) {
      status.textContent = text("aiSecureStorageUnavailable");
    }
    document.querySelector("#ai-start-job").disabled = !aiApiKeyConfigured || !selectedAiSourceToken;
  } catch (error) {
    console.error("Unable to load AI localization settings:", error);
    status.textContent = aiErrorMessage("AI_CONFIG_UNAVAILABLE");
  }
}

if (document.querySelector("#ai-localization-open")) {
document.querySelector("#ai-localization-open").addEventListener("click", () => {
  document.querySelector("#ai-localization-dialog").showModal();
  void loadAiLocalizationSettings();
  void refreshAiLocalizationJobs();
});
document.querySelector("#ai-localization-close").addEventListener("click", () => {
  document.querySelector("#ai-localization-dialog").close();
});
document.querySelector("#ai-save-settings").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    const result = await api.saveAiLocalizationConfig({
      apiKey: document.querySelector("#ai-api-key").value,
      model: document.querySelector("#ai-model").value.trim(),
      clearApiKey: false
    });
    if (!result?.ok) {
      document.querySelector("#ai-localization-status").textContent = aiErrorMessage(result?.code);
      return;
    }
    document.querySelector("#ai-api-key").value = "";
    aiApiKeyConfigured = result.data.apiKeyConfigured;
    document.querySelector("#ai-localization-status").textContent = aiApiKeyConfigured
      ? text("aiSettingsSaved")
      : text("aiKeyNotConfigured");
    document.querySelector("#ai-start-job").disabled = !aiApiKeyConfigured || !selectedAiSourceToken;
  } catch (error) {
    console.error("Unable to save AI localization settings:", error);
    document.querySelector("#ai-localization-status").textContent = aiErrorMessage("AI_CONFIG_SAVE_FAILED");
  } finally {
    button.disabled = false;
  }
});
document.querySelector("#ai-choose-source").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    const result = await api.chooseAiLocalizationSource();
    if (!result?.ok) {
      document.querySelector("#ai-localization-status").textContent = aiErrorMessage(result?.code);
      return;
    }
    if (result.data.canceled) return;
    selectedAiSourceToken = result.data.sourceToken;
    renderAiSourcePreview(result.data);
    document.querySelector("#ai-localization-status").textContent = interpolateText("aiFileSelected", {
      file: result.data.fileName,
      count: result.data.entryCount
    });
    document.querySelector("#ai-start-job").disabled = !aiApiKeyConfigured;
  } catch (error) {
    console.error("Unable to inspect localization source:", error);
    document.querySelector("#ai-localization-status").textContent = aiErrorMessage("LOCALIZATION_FILE_READ_FAILED");
  } finally {
    button.disabled = false;
  }
});
document.querySelector("#ai-start-job").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  if (!aiApiKeyConfigured) {
    document.querySelector("#ai-localization-status").textContent = text("aiKeyRequired");
    return;
  }
  button.disabled = true;
  try {
    const result = await api.startAiLocalization({
      sourceToken: selectedAiSourceToken,
      sourceLanguage: document.querySelector("#ai-source-language").value,
      category: document.querySelector("#ai-category").value,
      glossary: document.querySelector("#ai-glossary").value
    });
    if (!result?.ok) {
      document.querySelector("#ai-localization-status").textContent = aiErrorMessage(result?.code);
      button.disabled = !aiApiKeyConfigured || !selectedAiSourceToken;
      return;
    }
    currentAiJobId = result.data.id;
    selectedAiSourceToken = "";
    document.querySelector("#ai-localization-preview").hidden = true;
    await refreshAiLocalizationJobs();
  } catch (error) {
    console.error("Unable to start AI localization:", error);
    document.querySelector("#ai-localization-status").textContent = aiErrorMessage("TRANSLATION_JOB_START_FAILED");
    button.disabled = !aiApiKeyConfigured || !selectedAiSourceToken;
  }
});
document.querySelector("#ai-cancel-job").addEventListener("click", async () => {
  if (!currentAiJobId) return;
  const result = await api.cancelAiLocalizationJob(currentAiJobId);
  if (!result?.ok) {
    document.querySelector("#ai-localization-errors").textContent = aiErrorMessage(result?.code);
  }
});
document.querySelector("#ai-resume-job").addEventListener("click", async () => {
  if (!currentAiJobId) return;
  const result = await api.resumeAiLocalizationJob(currentAiJobId);
  if (!result?.ok) {
    document.querySelector("#ai-localization-errors").textContent = aiErrorMessage(result?.code);
    return;
  }
  renderAiJob(result.data);
  await refreshAiLocalizationJobs();
});
document.querySelector("#ai-export-job").addEventListener("click", async () => {
  if (!currentAiJobId) return;
  const result = await api.exportAiLocalizationJob(currentAiJobId);
  document.querySelector("#ai-localization-status").textContent = result?.ok
    ? result.data?.canceled ? text("aiJobCompleted") : text("aiExportSuccess")
    : aiErrorMessage(result?.code);
});
document.querySelector("#ai-localization-history-list").addEventListener("click", async (event) => {
  const resume = event.target.closest("[data-ai-resume]");
  const exportButton = event.target.closest("[data-ai-export]");
  if (resume) {
    currentAiJobId = resume.dataset.aiResume;
    const result = await api.resumeAiLocalizationJob(currentAiJobId);
    if (!result?.ok) {
      document.querySelector("#ai-localization-status").textContent = aiErrorMessage(result?.code);
      return;
    }
    renderAiJob(result.data);
    await refreshAiLocalizationJobs();
  } else if (exportButton) {
    currentAiJobId = exportButton.dataset.aiExport;
    const result = await api.exportAiLocalizationJob(currentAiJobId);
    document.querySelector("#ai-localization-status").textContent = result?.ok
      ? result.data?.canceled ? text("aiJobCompleted") : text("aiExportSuccess")
      : aiErrorMessage(result?.code);
  }
});
if (api?.onAiLocalizationProgress) {
  api.onAiLocalizationProgress((progress) => {
    if (progress.id === currentAiJobId || !currentAiJobId) renderAiJob(progress);
    void refreshAiLocalizationJobs();
  });
}
}

if (api?.onAiLocalizationProgress) {
  api.onAiLocalizationProgress((progress) => {
    if (progress?.gameId !== activeGameAiId || typeof activeGameAiRefresh !== "function") return;
    void activeGameAiRefresh();
  });
}

categoryMenu.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category-option]");
  if (!button) return;
  state.category = button.dataset.categoryOption;
  state.libraryPage = 1;
  document.querySelector("#category-filter span").textContent = text(
    state.category === "all" ? "categoryAll" : state.category === "full" ? "categoryFull" : "categoryInterface"
  );
  categoryMenu.hidden = true;
  renderCatalog();
});

searchInput.addEventListener("input", () => {
  state.query = searchInput.value;
  state.libraryPage = 1;
  renderCatalog();
});

document.querySelector("#refresh-library").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.classList.add("is-spinning");
  if (state.installedGamesMode) {
    await loadInstalledGames();
    button.classList.remove("is-spinning");
    return;
  }
  const refreshed = await refreshCatalog();
  button.classList.remove("is-spinning");
  if (refreshed) showToast("catalogRefreshed");
});

document.querySelector("#week-filter").addEventListener("click", (event) => {
  const button = event.currentTarget;
  state.premiumOnly = !state.premiumOnly;
  state.libraryPage = 1;
  button.dataset.active = String(state.premiumOnly);
  button.setAttribute("aria-pressed", String(state.premiumOnly));
  renderCatalog();
});

grid.addEventListener("pointermove", (event) => {
  const card = event.target.closest(".game-cover");
  if (!card) return;
  const rect = card.getBoundingClientRect();
  card.style.setProperty("--pointer-x", `${Math.round(((event.clientX - rect.left) / rect.width) * 100)}%`);
  card.style.setProperty("--pointer-y", `${Math.round(((event.clientY - rect.top) / rect.height) * 100)}%`);
});

grid.addEventListener("click", (event) => {
  const card = event.target.closest(".translation-card");
  if (state.installedGamesMode && card?.dataset.appId) {
    selectedRequestGame = state.installedGames.find((game) => game.appId === card.dataset.appId);
    if (!selectedRequestGame) return;
    translationRequestSubmitting = false;
    renderTranslationRequest(selectedRequestGame);
    installedGamesDialog.showModal();
    return;
  }
  const item = card && state.catalog.find((entry) => entry.id === card.dataset.id);
  if (item) openTranslation(item);
});

grid.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest(".translation-card");
  if (!card) return;
  event.preventDefault();
  if (state.installedGamesMode && card.dataset.appId) {
    selectedRequestGame = state.installedGames.find((game) => game.appId === card.dataset.appId);
    if (!selectedRequestGame) return;
    translationRequestSubmitting = false;
    renderTranslationRequest(selectedRequestGame);
    installedGamesDialog.showModal();
    return;
  }
  const item = state.catalog.find((entry) => entry.id === card.dataset.id);
  if (item) openTranslation(item);
});

const featuredTrack = document.querySelector("#featured-track");
featuredTrack.addEventListener("click", (event) => {
  const card = event.target.closest("[data-featured-id]");
  if (!card) return;
  const translation = state.catalog.find((item) => item.id === card.dataset.featuredId);
  if (translation) openTranslation(translation);
});
featuredTrack.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest("[data-featured-id]");
  if (!card) return;
  event.preventDefault();
  const translation = state.catalog.find((item) => item.id === card.dataset.featuredId);
  if (translation) openTranslation(translation);
});
window.addEventListener("resize", renderFeaturedCarousel);

document.querySelector("#dialog-close").addEventListener("click", () => {
  if (activeTranslationInstall) return;
  dialog.close();
});
dialog.addEventListener("cancel", (event) => {
  if (activeTranslationInstall) event.preventDefault();
});
dialog.addEventListener("click", (event) => {
  if (activeTranslationInstall) return;
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  const clickedOutside = event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom;
  if (clickedOutside) dialog.close();
});
document.querySelectorAll("[data-toast]").forEach((button) => {
  button.addEventListener("click", () => showToast(button.dataset.toast));
});
if (api?.onUpdateStatus) api.onUpdateStatus(handleUpdateStatus);
document.querySelectorAll(".brand[href='#home'], .primary-nav a[href], #app-footer a[href^='#']").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    navigateToPublic(link);
  });
});

document.querySelector("#profile-button").addEventListener("click", () => {
  if (!state.discordProfile) return;
  setScreen("profile");
});
document.querySelector("#profile-back").addEventListener("click", () => {
  setScreen("public");
});
document.querySelector("#admin-nav-link").addEventListener("click", () => void showAdmin());
document.querySelector("#support").addEventListener("click", () => void openDrekoCommunity());
document.querySelector("#admin-accounts-toggle").addEventListener("click", () => {
  if (state.adminSubpage === "accounts") setAdminSubpage("translations");
  else void showAdminAccounts();
});
document.querySelector("#admin-requests-toggle").addEventListener("click", () => {
  if (state.adminSubpage === "requests") setAdminSubpage("translations");
  else void showAdminTranslationRequests();
});
document.querySelector("#admin-reports-toggle").addEventListener("click", () => {
  if (state.adminSubpage === "reports") setAdminSubpage("translations");
  else void showAdminTranslationReports();
});
document.querySelector("#report-nav-link").addEventListener("click", () => openTranslationReport());
dialogContent.addEventListener("click", (event) => {
  const reportButton = event.target.closest("[data-report-translation-id]");
  if (reportButton) openTranslationReport(reportButton.dataset.reportTranslationId);
});
document.querySelector("#report-close").addEventListener("click", () => reportDialog.close());
reportDialog.addEventListener("close", () => {
  state.reportDraft = null;
});
reportContent.addEventListener("input", (event) => {
  if (event.target.id === "report-game-search") {
    const query = event.target.value.trim().toLocaleLowerCase(state.locale);
    let visibleGames = 0;
    reportContent.querySelectorAll(".report-game-option").forEach((button) => {
      const visible = button.textContent.toLocaleLowerCase(state.locale).includes(query);
      button.hidden = !visible;
      if (visible) visibleGames += 1;
    });
    reportContent.querySelector(".report-game-empty").hidden = visibleGames > 0;
  } else if (event.target.id === "report-details" && state.reportDraft) {
    state.reportDraft.details = event.target.value.slice(0, 500);
    reportContent.querySelector(".report-details-count").textContent =
      text("reportCharacters").replace("{count}", String(state.reportDraft.details.length));
  }
});
reportContent.addEventListener("click", async (event) => {
  const gameButton = event.target.closest("[data-report-game]");
  if (gameButton && state.reportDraft) {
    state.reportDraft.translationId = gameButton.dataset.reportGame;
    renderTranslationReportWizard();
    return;
  }
  const updateButton = event.target.closest("[data-report-update]");
  if (updateButton && state.reportDraft) {
    state.reportDraft.latestUpdate = updateButton.dataset.reportUpdate;
    renderTranslationReportWizard();
    return;
  }
  const issueButton = event.target.closest("[data-report-issue]");
  if (issueButton && state.reportDraft) {
    state.reportDraft.issueType = issueButton.dataset.reportIssue;
    renderTranslationReportWizard();
    return;
  }
  const actionButton = event.target.closest("[data-report-action]");
  if (!actionButton || actionButton.disabled || !state.reportDraft) return;
  const action = actionButton.dataset.reportAction;
  if (action === "close") {
    reportDialog.close();
  } else if (action === "back") {
    state.reportDraft.step = Math.max(1, state.reportDraft.step - 1);
    renderTranslationReportWizard();
  } else if (action === "next") {
    if (state.reportDraft.step === 1 &&
        !state.catalog.some((item) => item.id === state.reportDraft.translationId &&
          item.visibility === "published")) return;
    if (state.reportDraft.step === 2 &&
        (!state.reportDraft.latestUpdate || !REPORT_ISSUE_KEYS[state.reportDraft.issueType])) return;
    state.reportDraft.step = Math.min(3, state.reportDraft.step + 1);
    renderTranslationReportWizard();
  } else if (action === "submit") {
    await submitTranslationReport();
  }
});
document.querySelector("#auth-back").addEventListener("click", () => {
  hideMessage(authMessage);
  setScreen("public");
});

document.querySelector("#discord-logout").addEventListener("click", () => {
  void signOutDiscordUser();
});
document.querySelector("#discord-login").addEventListener("click", () => {
  void handleDiscordLogin();
});
document.querySelector("#discord-join").addEventListener("click", async (event) => {
  event.preventDefault();
  const result = await api.openDiscordInvite();
  if (!result.ok) setDiscordGateStatus(discordAuthErrorMessage(result.code), "error");
});

document.querySelector("#admin-search").addEventListener("input", (event) => {
  state.adminQuery = event.target.value;
  renderAdminTable();
});
document.querySelector("#admin-status-filter").addEventListener("change", (event) => {
  state.adminVisibility = event.target.value;
  renderAdminTable();
});
document.querySelector("#admin-refresh").addEventListener("click", () => void refreshAdminList());
document.querySelector("#accounts-search").addEventListener("input", (event) => {
  state.adminAccountsQuery = event.target.value;
  renderAdminAccounts();
});
document.querySelector("#accounts-refresh").addEventListener("click", () => void refreshAdminAccounts());
document.querySelector("#requests-refresh").addEventListener("click", () => void refreshAdminTranslationRequests());
document.querySelector("#reports-refresh").addEventListener("click", () => void refreshAdminTranslationReports());
document.querySelector("#requests-search").addEventListener("input", (event) => {
  state.adminRequestsQuery = event.target.value;
  renderAdminTranslationRequests();
});
document.querySelectorAll("[data-request-status]").forEach((button) => {
  button.addEventListener("click", () => {
    state.adminRequestsStatus = button.dataset.requestStatus;
    renderAdminTranslationRequests();
  });
});
document.querySelector("#reports-search").addEventListener("input", (event) => {
  state.adminReportsQuery = event.target.value;
  renderAdminTranslationReports();
});
document.querySelectorAll("[data-report-status]").forEach((button) => {
  button.addEventListener("click", () => {
    state.adminReportsStatus = button.dataset.reportStatus;
    renderAdminTranslationReports();
  });
});
document.querySelector("#player-reports-list").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-report-action]");
  if (!button || button.disabled) return;
  const card = button.closest("[data-report-id]");
  if (!card) return;
  const report = state.adminReports.find((item) => item.id === card.dataset.reportId);
  if (!report) return;
  const action = button.dataset.reportAction;
  if (action === "delete" &&
      !window.confirm(text("reportDeleteConfirm").replace("{game}", report.gameName))) return;
  button.disabled = true;
  try {
    if (action === "delete") {
      await firebaseCloud.deleteAdminTranslationReport(report.id, state.firebaseUser);
    } else {
      await firebaseCloud.setAdminTranslationReportStatus(report.id, action, state.firebaseUser);
    }
    if (await refreshAdminTranslationReports()) {
      showToast(action === "delete" ? "reportDeleted" : "reportStatusSaved");
    }
  } catch (error) {
    console.error("Unable to update translation report:", error?.code || error?.name || "UNKNOWN");
    if (error?.code === "ADMIN_REQUIRED") {
      state.authenticated = false;
      state.isAdministrator = false;
      state.adminReports = [];
      setScreen("public");
      showToast("accessDenied");
    } else {
      showFirebaseError(error);
      renderAdminTranslationReports();
    }
  }
});
document.querySelector("#translation-requests-list").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-request-action]");
  if (!button || button.disabled) return;
  const card = button.closest("[data-request-id]");
  if (!card) return;
  const action = button.dataset.requestAction;
  if (action === "delete") {
    const request = state.adminTranslationRequests.find((item) => item.id === card.dataset.requestId);
    if (!request || !window.confirm(text("requestDeleteConfirm").replace("{title}", request.gameName))) return;
  }
  button.disabled = true;
  try {
    if (action === "delete") {
      await firebaseCloud.deleteAdminTranslationRequest(card.dataset.requestId, state.firebaseUser);
    } else {
      await firebaseCloud.setAdminTranslationRequestStatus(
        card.dataset.requestId,
        action === "archive" ? "archived" : "pending",
        state.firebaseUser
      );
    }
    if (await refreshAdminTranslationRequests()) {
      showToast(action === "delete" ? "requestDeleted" : "requestStatusSaved");
    }
  } catch (error) {
    if (error?.code === "USER_HAS_PENDING_TRANSLATION_REQUEST") {
      showToast("requestRestoreBlocked");
    } else if (error?.code === "TRANSLATION_REQUEST_STATE_CONFLICT") {
      showToast("requestStateConflict");
    } else {
      showFirebaseError(error);
    }
    button.disabled = false;
  }
});
document.querySelector("#accounts-admin-list").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-account-action]");
  if (!button || button.disabled) return;
  const card = button.closest("[data-account-uid]");
  if (!card) return;
  const accountType = button.dataset.accountAction;
  const durationValue = card.querySelector("[data-account-duration]")?.value;
  const durationDays = accountType === "premium"
    ? durationValue === "permanent" ? null : Number(durationValue)
    : null;
  button.disabled = true;
  try {
    await firebaseCloud.setAdminAccountType(
      card.dataset.accountUid,
      accountType,
      durationDays,
      state.firebaseUser
    );
    showToast("accountPlanSaved");
    await refreshAdminAccounts();
  } catch (error) {
    showFirebaseError(error);
    button.disabled = false;
  }
});
document.querySelector("#add-translation").addEventListener("click", createNewTranslation);
document.querySelector("#admin-empty-add").addEventListener("click", createNewTranslation);
document.querySelector("#admin-table-body").addEventListener("click", (event) => {
  const button = event.target.closest("[data-admin-action]");
  if (!button || button.disabled) return;
  if (button.dataset.adminAction === "edit") editTranslation(button.dataset.id);
  if (button.dataset.adminAction === "delete") void deleteTranslation(button.dataset.id);
  if (button.dataset.adminAction === "visibility") void changeTranslationVisibility(button.dataset.id);
  if (button.dataset.adminAction === "move-up") void moveTranslation(button.dataset.id, "up");
  if (button.dataset.adminAction === "move-down") void moveTranslation(button.dataset.id, "down");
});
editorForm.addEventListener("submit", saveTranslation);

document.querySelector("#cover-search-button").addEventListener("click", () => void searchCoverArtwork());
coverSearchInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  void searchCoverArtwork();
});
coverSearchResults.addEventListener("click", (event) => {
  const button = event.target.closest("[data-cover-image-index]");
  if (button) void selectCoverSearchResult(Number(button.dataset.coverImageIndex));
});
document.querySelector("#cover-url-input").addEventListener("input", previewCoverUrlInput);
document.querySelector("#use-cover-url").addEventListener("click", () => {
  const nextUrl = document.querySelector("#cover-url-input").value.trim();
  if (!applyRemoteCoverUrl(nextUrl)) return;
  document.querySelector("#translation-cover").value = nextUrl;
});
document.querySelector("#cover-url-input").addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  const nextUrl = document.querySelector("#cover-url-input").value.trim();
  if (!applyRemoteCoverUrl(nextUrl)) return;
  document.querySelector("#translation-cover").value = nextUrl;
});
document.querySelector("#choose-cover").addEventListener("click", async () => {
  try {
    const result = await api.chooseCover();
    if (!result.ok) {
      showFirebaseError({ code: result.code }, editorMessage);
      return;
    }
    if (result.data.canceled) {
      showToast("coverSelectionCancelled");
      return;
    }

    state.pendingArtwork = await compressArtworkForFirestore(result.data);
    state.selectedCoverSrc = state.pendingArtwork.src;
    document.querySelector("#cover-preview").innerHTML =
      `<img src="${escapeHtml(state.pendingArtwork.src)}" alt="" />`;
    document.querySelector("#cover-url-input").value = "";
    document.querySelector("#translation-cover").value = state.selectedCoverSrc;
    hideMessage(editorMessage);
    showToast("coverSelected");
  } catch (error) {
    if (error?.code === "COVER_COMPRESS_FAILED") {
      updateMessage(editorMessage, text("coverCompressFailed"));
    } else {
      showFirebaseError(error, editorMessage);
    }
  }
});

document.querySelector("#editor-close").addEventListener("click", () => void closeEditor());
document.querySelector("#editor-cancel").addEventListener("click", () => void closeEditor());
editorDialog.addEventListener("cancel", () => {
  state.pendingArtwork = null;
  resetCoverSearch();
});
editorDialog.addEventListener("close", () => {
  hideMessage(editorMessage);
  resetCoverSearch();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("#category-filter, #category-menu")) categoryMenu.hidden = true;
});

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    if (state.screen === "admin" && state.adminSubpage === "accounts") document.querySelector("#accounts-search").focus();
    else if (state.screen === "admin") document.querySelector("#admin-search").focus();
    else searchInput.focus();
  }
  if (event.key === "Escape") categoryMenu.hidden = true;
});

const storedTheme = localStorage.getItem("dreko-theme");
if (storedTheme === "light") {
  document.body.classList.add("light-theme");
  document.querySelector("#theme-toggle").setAttribute("aria-pressed", "true");
  document.querySelector('meta[name="theme-color"]').content = "#f3f5f7";
}
const storedView = localStorage.getItem("dreko-view");
if (storedView === "list" || storedView === "grid") {
  state.view = storedView;
  document.querySelectorAll(".view-button").forEach((button) => {
    button.classList.toggle("selected", button.dataset.view === state.view);
  });
}

async function initializeApp() {
  try {
    const appInfo = await api?.bootstrap();
    installedAppVersion = typeof appInfo?.version === "string" ? appInfo.version : "";
    isPackagedApp = appInfo?.packaged === true;
    if (appInfo?.installerLocale === "ar" || appInfo?.installerLocale === "en") {
      state.locale = appInfo.installerLocale;
      localStorage.setItem("dreko-locale", state.locale);
    }
  } catch (error) {
    console.error("Unable to read the selected installer language:", error?.code || error?.name || "UNKNOWN");
  }
  applyLocale();
  renderFeaturedCarousel();
  void initializeDiscordGate();
}

void initializeApp();
