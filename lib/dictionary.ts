/*
 * English words → the other languages of lib/languages.ts (D94), for every part's Words options.
 * Shared words ("Close", "Clear all") are written once and serve every part that says them.
 * Written without a native speaker's check: [TODO: have each language reviewed].
 */
export type Translated = { es: string; fr: string; de: string; pt: string; ar: string; he: string; hi: string; ja: string; zh: string };

export const dictionary: Record<string, Translated> = {
  "Applied filters": {"es": "Filtros aplicados", "fr": "Filtres appliqués", "de": "Aktive Filter", "pt": "Filtros aplicados", "ar": "عوامل التصفية المطبقة", "he": "מסננים פעילים", "hi": "लागू फ़िल्टर", "ja": "適用中のフィルター", "zh": "已应用的筛选条件"},
  "Clear all": {"es": "Borrar todo", "fr": "Tout effacer", "de": "Alle entfernen", "pt": "Limpar tudo", "ar": "مسح الكل", "he": "ניקוי הכול", "hi": "सब हटाएँ", "ja": "すべてクリア", "zh": "全部清除"},
  "Close": {"es": "Cerrar", "fr": "Fermer", "de": "Schließen", "pt": "Fechar", "ar": "إغلاق", "he": "סגירה", "hi": "बंद करें", "ja": "閉じる", "zh": "关闭"},
  "Close this message": {"es": "Cerrar este mensaje", "fr": "Fermer ce message", "de": "Diese Nachricht schließen", "pt": "Fechar esta mensagem", "ar": "إغلاق هذه الرسالة", "he": "סגירת ההודעה", "hi": "यह संदेश बंद करें", "ja": "このメッセージを閉じる", "zh": "关闭此消息"},
  "Country code": {"es": "Código de país", "fr": "Indicatif du pays", "de": "Ländervorwahl", "pt": "Código do país", "ar": "رمز الدولة", "he": "קידומת מדינה", "hi": "देश कोड", "ja": "国番号", "zh": "国家代码"},
  "No filters applied": {"es": "No hay filtros aplicados", "fr": "Aucun filtre appliqué", "de": "Keine Filter aktiv", "pt": "Nenhum filtro aplicado", "ar": "لا توجد عوامل تصفية مطبقة", "he": "לא הוחלו מסננים", "hi": "कोई फ़िल्टर लागू नहीं", "ja": "フィルターは適用されていません", "zh": "未应用筛选条件"},
  "Notifications": {"es": "Notificaciones", "fr": "Notifications", "de": "Benachrichtigungen", "pt": "Notificações", "ar": "الإشعارات", "he": "התראות", "hi": "सूचनाएँ", "ja": "通知", "zh": "通知"},
  "Off": {"es": "Desactivado", "fr": "Désactivé", "de": "Aus", "pt": "Desligado", "ar": "معطّل", "he": "כבוי", "hi": "बंद", "ja": "オフ", "zh": "关"},
  "On": {"es": "Activado", "fr": "Activé", "de": "An", "pt": "Ligado", "ar": "مفعّل", "he": "פועל", "hi": "चालू", "ja": "オン", "zh": "开"},
  "{count} filter applied: {filters}": {"es": "{count} filtro aplicado: {filters}", "fr": "{count} filtre appliqué : {filters}", "de": "{count} Filter aktiv: {filters}", "pt": "{count} filtro aplicado: {filters}", "ar": "عامل تصفية واحد مطبق: {filters}", "he": "מסנן אחד הוחל: {filters}", "hi": "{count} फ़िल्टर लागू: {filters}", "ja": "{count} 件のフィルターを適用中: {filters}", "zh": "已应用 {count} 个筛选条件：{filters}"},
  "{count} filters applied: {filters}": {"es": "{count} filtros aplicados: {filters}", "fr": "{count} filtres appliqués : {filters}", "de": "{count} Filter aktiv: {filters}", "pt": "{count} filtros aplicados: {filters}", "ar": "{count} عوامل تصفية مطبقة: {filters}", "he": "{count} מסננים הוחלו: {filters}", "hi": "{count} फ़िल्टर लागू: {filters}", "ja": "{count} 件のフィルターを適用中: {filters}", "zh": "已应用 {count} 个筛选条件：{filters}"},
};
