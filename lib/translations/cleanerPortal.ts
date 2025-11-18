export type Language = "en" | "es" | "ro" | "pt-BR" | "hi";

export type Translations = {
  // Header
  cleaningCompany: string;
  individualCleaner: string;
  phone: string;
  notes: string;
  payment: string;
  descriptionCompany: string;
  descriptionIndividual: string;
  noPropertiesAssigned: string;
  schedule: string;

  // Schedule
  today: string;
  timeline: string;
  calendar: string;
  emptyStateText: string;

  // Status options
  scheduled: string;
  completed: string;
  cancelled: string;
  scheduledDescription: string;
  completedDescription: string;
  cancelledDescription: string;

  // Actions
  saveUpdates: string;
  saving: string;
  updatesSaved: string;
  unableToSave: string;
  selectCleanToUpdate: string;
  readOnly: string;

  // Maintenance notes
  maintenanceNotes: string;
  maintenanceNoteOptions: string[];

  // Reimbursements
  reimbursements: string;
  addReimbursement: string;
  item: string;
  amount: string;
  reimbursementLogged: string;
  unableToAddReimbursement: string;
  addValidItemAndAmount: string;
  reimbursementUpdated: string;
  unableToUpdateReimbursement: string;
  enterValidAmountAndDescription: string;
  reimbursementRemoved: string;
  unableToDeleteReimbursement: string;
  removeReimbursement: string;
  edit: string;
  delete: string;
  cancel: string;

  // On-site details
  address: string;
  accessCodes: string;
  binLocations: string;
  keyLocations: string;
  noDetails: string;
  utilityDetails: string;
  manageClean: string;
  cleanerActions: string;

  // Clean details
  scheduledFor: string;
  currentStatus: string;
  updateStatus: string;
  chooseOptionBestReflectsProgress: string;
  hostNote: string;
  selectPropertyViewDetails: string;

  // Maintenance notes
  pickNotesApplyToClean: string;
  hostWillSeeNotesSelected: string;
  selectMaintenanceNotes: string;
  note: string;
  notesPlural: string;
  selected: string;

  // Reimbursements
  logItemsPurchasedForRefund: string;
  noReimbursementsLogged: string;
  cleaningSuppliesExample: string;
  logReimbursement: string;
  removing: string;

  // Weekdays
  weekdays: string[];
};

const translations: Record<Language, Translations> = {
  en: {
    cleaningCompany: "Cleaning company",
    individualCleaner: "Individual cleaner",
    phone: "Phone",
    notes: "Host Notes",
    payment: "Payment",
    descriptionCompany:
      "This link is read-only. You can review every scheduled clean for the properties assigned to your team.",
    descriptionIndividual: "Review every clean that has been assigned to you.",
    noPropertiesAssigned: "No properties assigned yet.",
    schedule: "Schedule",
    today: "Today",
    timeline: "Timeline",
    calendar: "Calendar",
    emptyStateText:
      "Add a property first to start exploring your schedule. Once synced, every clean will appear on this timeline and calendar.",
    scheduled: "Scheduled",
    completed: "Completed",
    cancelled: "Cancelled",
    scheduledDescription: "Use while the clean is pending or in progress.",
    completedDescription:
      "Confirm once the clean is finished and walkthrough is done.",
    cancelledDescription: "Only use if the clean is no longer going ahead.",
    saveUpdates: "Save updates",
    saving: "Saving...",
    updatesSaved: "Updates saved.",
    unableToSave: "Unable to save updates.",
    selectCleanToUpdate:
      "Select a clean from the timeline or table to update its status, add notes, or request reimbursements.",
    readOnly: "This view is read-only.",
    maintenanceNotes: "Cleaner Notes",
    maintenanceNoteOptions: [
      "Restocked toiletries and consumables",
      "Left fresh linens and towels ready for guests",
      "Flagged wear and tear that needs attention",
      "Replenished on-site cleaning supplies",
      "Captured photos for reported damage",
    ],
    reimbursements: "Reimbursements",
    addReimbursement: "Add reimbursement",
    item: "Item",
    amount: "Amount",
    reimbursementLogged: "Reimbursement logged.",
    unableToAddReimbursement: "Unable to add reimbursement.",
    addValidItemAndAmount:
      "Add a valid item and amount before logging a reimbursement.",
    reimbursementUpdated: "Reimbursement updated.",
    unableToUpdateReimbursement: "Unable to update reimbursement.",
    enterValidAmountAndDescription:
      "Enter a valid amount and description before saving.",
    reimbursementRemoved: "Reimbursement removed.",
    unableToDeleteReimbursement: "Unable to delete reimbursement.",
    removeReimbursement: "Remove this reimbursement?",
    edit: "Edit",
    delete: "Delete",
    cancel: "Cancel",
    address: "Address",
    accessCodes: "Access Codes",
    binLocations: "Bin Locations",
    keyLocations: "Key Locations",
    noDetails: "No details available",
    utilityDetails: "On-site details",
    manageClean: "Manage clean",
    cleanerActions: "Cleaner actions",
    scheduledFor: "Scheduled for",
    currentStatus: "Current status",
    updateStatus: "Update status",
    chooseOptionBestReflectsProgress:
      "Choose the option that best reflects progress.",
    hostNote: "Host note",
    selectPropertyViewDetails:
      "Select a property to view its on-site information and cleans.",
    pickNotesApplyToClean: "Pick the notes that apply to this clean.",
    hostWillSeeNotesSelected:
      "The host will see any notes you select alongside this clean.",
    selectMaintenanceNotes: "Select notes",
    note: "note",
    notesPlural: "notes",
    selected: "selected",
    logItemsPurchasedForRefund:
      "Log items you purchased so the host can refund you.",
    noReimbursementsLogged: "No reimbursements logged yet.",
    cleaningSuppliesExample: "e.g. Cleaning supplies",
    logReimbursement: "Log reimbursement",
    removing: "Removing...",
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },
  es: {
    cleaningCompany: "Empresa de limpieza",
    individualCleaner: "Limpieza individual",
    phone: "Teléfono",
    notes: "Notas del Anfitrión",
    payment: "Pago",
    descriptionCompany:
      "Este enlace es de solo lectura. Puedes revisar cada limpieza programada para las propiedades asignadas a tu equipo.",
    descriptionIndividual: "Revisa cada limpieza que te ha sido asignada.",
    noPropertiesAssigned: "Aún no hay propiedades asignadas.",
    schedule: "Horario",
    today: "Hoy",
    timeline: "Línea de tiempo",
    calendar: "Calendario",
    emptyStateText:
      "Agrega una propiedad primero para comenzar a explorar tu horario. Una vez sincronizado, cada limpieza aparecerá en esta línea de tiempo y calendario.",
    scheduled: "Programada",
    completed: "Completada",
    cancelled: "Cancelada",
    scheduledDescription:
      "Usa mientras la limpieza está pendiente o en progreso.",
    completedDescription:
      "Confirma una vez que la limpieza esté terminada y el recorrido esté completo.",
    cancelledDescription: "Solo usa si la limpieza ya no va a realizarse.",
    saveUpdates: "Guardar actualizaciones",
    saving: "Guardando...",
    updatesSaved: "Actualizaciones guardadas.",
    unableToSave: "No se pudieron guardar las actualizaciones.",
    selectCleanToUpdate:
      "Selecciona una limpieza de la línea de tiempo o tabla para actualizar su estado, agregar notas o solicitar reembolsos.",
    readOnly: "Esta vista es de solo lectura.",
    maintenanceNotes: "Notas del Limpiador",
    maintenanceNoteOptions: [
      "Reabastecido artículos de tocador y consumibles",
      "Dejado ropa de cama y toallas frescas listas para los huéspedes",
      "Marcado desgaste que necesita atención",
      "Reabastecido suministros de limpieza en el sitio",
      "Capturado fotos para daños reportados",
    ],
    reimbursements: "Reembolsos",
    addReimbursement: "Agregar reembolso",
    item: "Artículo",
    amount: "Cantidad",
    reimbursementLogged: "Reembolso registrado.",
    unableToAddReimbursement: "No se pudo agregar el reembolso.",
    addValidItemAndAmount:
      "Agrega un artículo y cantidad válidos antes de registrar un reembolso.",
    reimbursementUpdated: "Reembolso actualizado.",
    unableToUpdateReimbursement: "No se pudo actualizar el reembolso.",
    enterValidAmountAndDescription:
      "Ingresa una cantidad y descripción válidas antes de guardar.",
    reimbursementRemoved: "Reembolso eliminado.",
    unableToDeleteReimbursement: "No se pudo eliminar el reembolso.",
    removeReimbursement: "¿Eliminar este reembolso?",
    edit: "Editar",
    delete: "Eliminar",
    cancel: "Cancelar",
    address: "Dirección",
    accessCodes: "Códigos de Acceso",
    binLocations: "Ubicaciones de Contenedores",
    keyLocations: "Ubicaciones de Llaves",
    noDetails: "No hay detalles disponibles",
    utilityDetails: "Detalles de utilidades",
    manageClean: "Gestionar limpieza",
    cleanerActions: "Acciones de limpieza",
    scheduledFor: "Programado para",
    currentStatus: "Estado actual",
    updateStatus: "Actualizar estado",
    chooseOptionBestReflectsProgress:
      "Elige la opción que mejor refleje el progreso.",
    hostNote: "Nota del anfitrión",
    selectPropertyViewDetails:
      "Selecciona una propiedad para ver su información de utilidades y limpiezas.",
    pickNotesApplyToClean: "Elige las notas que se aplican a esta limpieza.",
    hostWillSeeNotesSelected:
      "El anfitrión verá las notas que selecciones junto con esta limpieza.",
    selectMaintenanceNotes: "Seleccionar notas",
    note: "nota",
    notesPlural: "notas",
    selected: "seleccionada",
    logItemsPurchasedForRefund:
      "Registra los artículos que compraste para que el anfitrión te reembolse.",
    noReimbursementsLogged: "Aún no se han registrado reembolsos.",
    cleaningSuppliesExample: "p. ej. Suministros de limpieza",
    logReimbursement: "Registrar reembolso",
    removing: "Eliminando...",
    weekdays: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
  },
  ro: {
    cleaningCompany: "Companie de curățenie",
    individualCleaner: "Curățenie individuală",
    phone: "Telefon",
    notes: "Note Gazdă",
    payment: "Plată",
    descriptionCompany:
      "Acest link este doar pentru citire. Poți revizui fiecare curățenie programată pentru proprietățile alocate echipei tale.",
    descriptionIndividual:
      "Revizuiește fiecare curățenie care ți-a fost atribuită.",
    noPropertiesAssigned: "Încă nu sunt proprietăți alocate.",
    schedule: "Program",
    today: "Astăzi",
    timeline: "Cronologie",
    calendar: "Calendar",
    emptyStateText:
      "Adaugă mai întâi o proprietate pentru a începe să explorezi programul. Odată sincronizat, fiecare curățenie va apărea pe această cronologie și calendar.",
    scheduled: "Programată",
    completed: "Completată",
    cancelled: "Anulată",
    scheduledDescription:
      "Folosește în timp ce curățenia este în așteptare sau în progres.",
    completedDescription:
      "Confirmă odată ce curățenia este terminată și turul este făcut.",
    cancelledDescription: "Folosește doar dacă curățenia nu mai va avea loc.",
    saveUpdates: "Salvează actualizări",
    saving: "Se salvează...",
    updatesSaved: "Actualizări salvate.",
    unableToSave: "Nu s-au putut salva actualizările.",
    selectCleanToUpdate:
      "Selectează o curățenie din cronologie sau tabel pentru a actualiza statusul, a adăuga note sau a solicita rambursări.",
    readOnly: "Această vedere este doar pentru citire.",
    maintenanceNotes: "Note Curățător",
    maintenanceNoteOptions: [
      "Reîncărcat articole de toaletă și consumabile",
      "Lăsat lenjerie și prosoape proaspete gata pentru oaspeți",
      "Marcat uzură care necesită atenție",
      "Reîncărcat provizii de curățenie la fața locului",
      "Făcut fotografii pentru daune raportate",
    ],
    reimbursements: "Rambursări",
    addReimbursement: "Adaugă rambursare",
    item: "Articol",
    amount: "Sumă",
    reimbursementLogged: "Rambursare înregistrată.",
    unableToAddReimbursement: "Nu s-a putut adăuga rambursarea.",
    addValidItemAndAmount:
      "Adaugă un articol și o sumă valide înainte de a înregistra o rambursare.",
    reimbursementUpdated: "Rambursare actualizată.",
    unableToUpdateReimbursement: "Nu s-a putut actualiza rambursarea.",
    enterValidAmountAndDescription:
      "Introdu o sumă și o descriere valide înainte de a salva.",
    reimbursementRemoved: "Rambursare eliminată.",
    unableToDeleteReimbursement: "Nu s-a putut elimina rambursarea.",
    removeReimbursement: "Elimini această rambursare?",
    edit: "Editează",
    delete: "Șterge",
    cancel: "Anulează",
    address: "Adresă",
    accessCodes: "Coduri de Acces",
    binLocations: "Locații Recipiente",
    keyLocations: "Locații Chei",
    noDetails: "Nu sunt detalii disponibile",
    utilityDetails: "Detalii utilități",
    manageClean: "Gestionare curățenie",
    cleanerActions: "Acțiuni curățenie",
    scheduledFor: "Programat pentru",
    currentStatus: "Status actual",
    updateStatus: "Actualizare status",
    chooseOptionBestReflectsProgress:
      "Alege opțiunea care reflectă cel mai bine progresul.",
    hostNote: "Notă gazdă",
    selectPropertyViewDetails:
      "Selectează o proprietate pentru a vedea informațiile despre utilități și curățenii.",
    pickNotesApplyToClean: "Alege notele care se aplică acestei curățenii.",
    hostWillSeeNotesSelected:
      "Gazda va vedea notele pe care le selectezi împreună cu această curățenie.",
    selectMaintenanceNotes: "Selectează note",
    note: "notă",
    notesPlural: "note",
    selected: "selectate",
    logItemsPurchasedForRefund:
      "Înregistrează articolele pe care le-ai cumpărat pentru ca gazda să te ramburseze.",
    noReimbursementsLogged: "Încă nu au fost înregistrate rambursări.",
    cleaningSuppliesExample: "ex. Materiale de curățenie",
    logReimbursement: "Înregistrează rambursare",
    removing: "Se elimină...",
    weekdays: ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"],
  },
  "pt-BR": {
    cleaningCompany: "Empresa de limpeza",
    individualCleaner: "Limpeza individual",
    phone: "Telefone",
    notes: "Notas do Anfitrião",
    payment: "Pagamento",
    descriptionCompany:
      "Este link é somente leitura. Você pode revisar cada limpeza agendada para as propriedades atribuídas à sua equipe.",
    descriptionIndividual: "Revise cada limpeza que foi atribuída a você.",
    noPropertiesAssigned: "Nenhuma propriedade atribuída ainda.",
    schedule: "Agenda",
    today: "Hoje",
    timeline: "Linha do tempo",
    calendar: "Calendário",
    emptyStateText:
      "Adicione uma propriedade primeiro para começar a explorar sua agenda. Uma vez sincronizado, cada limpeza aparecerá nesta linha do tempo e calendário.",
    scheduled: "Agendada",
    completed: "Concluída",
    cancelled: "Cancelada",
    scheduledDescription:
      "Use enquanto a limpeza está pendente ou em andamento.",
    completedDescription:
      "Confirme assim que a limpeza estiver concluída e a inspeção estiver feita.",
    cancelledDescription: "Use apenas se a limpeza não for mais realizada.",
    saveUpdates: "Salvar atualizações",
    saving: "Salvando...",
    updatesSaved: "Atualizações salvas.",
    unableToSave: "Não foi possível salvar as atualizações.",
    selectCleanToUpdate:
      "Selecione uma limpeza da linha do tempo ou tabela para atualizar seu status, adicionar notas ou solicitar reembolsos.",
    readOnly: "Esta visualização é somente leitura.",
    maintenanceNotes: "Notas do Limpador",
    maintenanceNoteOptions: [
      "Reabastecido produtos de higiene e consumíveis",
      "Deixado roupas de cama e toalhas frescas prontas para os hóspedes",
      "Marcado desgaste que precisa de atenção",
      "Reabastecido suprimentos de limpeza no local",
      "Tirado fotos para danos reportados",
    ],
    reimbursements: "Reembolsos",
    addReimbursement: "Adicionar reembolso",
    item: "Item",
    amount: "Valor",
    reimbursementLogged: "Reembolso registrado.",
    unableToAddReimbursement: "Não foi possível adicionar o reembolso.",
    addValidItemAndAmount:
      "Adicione um item e valor válidos antes de registrar um reembolso.",
    reimbursementUpdated: "Reembolso atualizado.",
    unableToUpdateReimbursement: "Não foi possível atualizar o reembolso.",
    enterValidAmountAndDescription:
      "Digite um valor e descrição válidos antes de salvar.",
    reimbursementRemoved: "Reembolso removido.",
    unableToDeleteReimbursement: "Não foi possível excluir o reembolso.",
    removeReimbursement: "Remover este reembolso?",
    edit: "Editar",
    delete: "Excluir",
    cancel: "Cancelar",
    address: "Endereço",
    accessCodes: "Códigos de Acesso",
    binLocations: "Localizações de Lixeiras",
    keyLocations: "Localizações de Chaves",
    noDetails: "Nenhum detalhe disponível",
    utilityDetails: "Detalhes de utilidades",
    manageClean: "Gerenciar limpeza",
    cleanerActions: "Ações de limpeza",
    scheduledFor: "Agendado para",
    currentStatus: "Status atual",
    updateStatus: "Atualizar status",
    chooseOptionBestReflectsProgress:
      "Escolha a opção que melhor reflete o progresso.",
    hostNote: "Nota do anfitrião",
    selectPropertyViewDetails:
      "Selecione uma propriedade para ver suas informações de utilidades e limpezas.",
    pickNotesApplyToClean: "Escolha as notas que se aplicam a esta limpeza.",
    hostWillSeeNotesSelected:
      "O anfitrião verá as notas que você selecionar junto com esta limpeza.",
    selectMaintenanceNotes: "Selecionar notas",
    note: "nota",
    notesPlural: "notas",
    selected: "selecionada",
    logItemsPurchasedForRefund:
      "Registre os itens que você comprou para que o anfitrião possa reembolsá-lo.",
    noReimbursementsLogged: "Nenhum reembolso registrado ainda.",
    cleaningSuppliesExample: "ex. Materiais de limpeza",
    logReimbursement: "Registrar reembolso",
    removing: "Removendo...",
    weekdays: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
  },
  hi: {
    cleaningCompany: "सफाई कंपनी",
    individualCleaner: "व्यक्तिगत सफाई",
    phone: "फोन",
    notes: "मेजबान नोट्स",
    payment: "भुगतान",
    descriptionCompany:
      "यह लिंक केवल पढ़ने के लिए है। आप अपनी टीम को सौंपी गई संपत्तियों के लिए प्रत्येक निर्धारित सफाई की समीक्षा कर सकते हैं।",
    descriptionIndividual: "आपको सौंपी गई प्रत्येक सफाई की समीक्षा करें।",
    noPropertiesAssigned: "अभी तक कोई संपत्ति नहीं सौंपी गई।",
    schedule: "अनुसूची",
    today: "आज",
    timeline: "टाइमलाइन",
    calendar: "कैलेंडर",
    emptyStateText:
      "अपनी अनुसूची की खोज शुरू करने के लिए पहले एक संपत्ति जोड़ें। एक बार सिंक होने के बाद, प्रत्येक सफाई इस टाइमलाइन और कैलेंडर पर दिखाई देगी।",
    scheduled: "निर्धारित",
    completed: "पूर्ण",
    cancelled: "रद्द",
    scheduledDescription: "जब सफाई लंबित है या प्रगति में है तब उपयोग करें।",
    completedDescription:
      "एक बार सफाई पूरी हो जाने और वॉकथ्रू हो जाने के बाद पुष्टि करें।",
    cancelledDescription:
      "केवल तभी उपयोग करें यदि सफाई अब आगे नहीं बढ़ रही है।",
    saveUpdates: "अपडेट सहेजें",
    saving: "सहेजा जा रहा है...",
    updatesSaved: "अपडेट सहेजे गए।",
    unableToSave: "अपडेट सहेजने में असमर्थ।",
    selectCleanToUpdate:
      "इसकी स्थिति अपडेट करने, नोट्स जोड़ने, या प्रतिपूर्ति अनुरोध करने के लिए टाइमलाइन या तालिका से एक सफाई चुनें।",
    readOnly: "यह दृश्य केवल पढ़ने के लिए है।",
    maintenanceNotes: "सफाईकर्मी नोट्स",
    maintenanceNoteOptions: [
      "टॉयलेटरी और उपभोग्य सामग्री फिर से भरी गई",
      "मेहमानों के लिए ताजे बिस्तर और तौलिए तैयार छोड़े गए",
      "ध्यान देने की आवश्यकता वाले घिसाव को चिह्नित किया",
      "साइट पर सफाई की आपूर्ति फिर से भरी गई",
      "रिपोर्ट किए गए नुकसान के लिए तस्वीरें ली गईं",
    ],
    reimbursements: "प्रतिपूर्ति",
    addReimbursement: "प्रतिपूर्ति जोड़ें",
    item: "आइटम",
    amount: "राशि",
    reimbursementLogged: "प्रतिपूर्ति दर्ज की गई।",
    unableToAddReimbursement: "प्रतिपूर्ति जोड़ने में असमर्थ।",
    addValidItemAndAmount:
      "प्रतिपूर्ति दर्ज करने से पहले एक मान्य आइटम और राशि जोड़ें।",
    reimbursementUpdated: "प्रतिपूर्ति अपडेट की गई।",
    unableToUpdateReimbursement: "प्रतिपूर्ति अपडेट करने में असमर्थ।",
    enterValidAmountAndDescription:
      "सहेजने से पहले एक मान्य राशि और विवरण दर्ज करें।",
    reimbursementRemoved: "प्रतिपूर्ति हटाई गई।",
    unableToDeleteReimbursement: "प्रतिपूर्ति हटाने में असमर्थ।",
    removeReimbursement: "इस प्रतिपूर्ति को हटाएं?",
    edit: "संपादित करें",
    delete: "हटाएं",
    cancel: "रद्द करें",
    address: "पता",
    accessCodes: "एक्सेस कोड",
    binLocations: "बिन लोकेशन",
    keyLocations: "चाबी लोकेशन",
    noDetails: "कोई विवरण उपलब्ध नहीं",
    utilityDetails: "उपयोगिता विवरण",
    manageClean: "सफाई प्रबंधित करें",
    cleanerActions: "सफाई कार्य",
    scheduledFor: "निर्धारित",
    currentStatus: "वर्तमान स्थिति",
    updateStatus: "स्थिति अपडेट करें",
    chooseOptionBestReflectsProgress:
      "वह विकल्प चुनें जो प्रगति को सबसे अच्छी तरह दर्शाता है।",
    hostNote: "मेजबान नोट",
    selectPropertyViewDetails:
      "उपयोगिता जानकारी और सफाई देखने के लिए एक संपत्ति चुनें।",
    pickNotesApplyToClean: "इस सफाई पर लागू होने वाले नोट्स चुनें।",
    hostWillSeeNotesSelected:
      "मेजबान आपके द्वारा चुने गए नोट्स को इस सफाई के साथ देखेगा।",
    selectMaintenanceNotes: "नोट्स चुनें",
    note: "नोट",
    notesPlural: "नोट्स",
    selected: "चयनित",
    logItemsPurchasedForRefund:
      "आपके द्वारा खरीदे गए आइटम लॉग करें ताकि मेजबान आपको रिफंड कर सके।",
    noReimbursementsLogged: "अभी तक कोई प्रतिपूर्ति दर्ज नहीं की गई।",
    cleaningSuppliesExample: "उदा. सफाई की आपूर्ति",
    logReimbursement: "प्रतिपूर्ति लॉग करें",
    removing: "हटाया जा रहा है...",
    weekdays: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"],
  },
};

export function getTranslations(language: Language): Translations {
  return translations[language] || translations.en;
}

export const languageNames: Record<Language, string> = {
  en: "English",
  es: "Español",
  ro: "Română",
  "pt-BR": "Português (Brasil)",
  hi: "हिंदी",
};
