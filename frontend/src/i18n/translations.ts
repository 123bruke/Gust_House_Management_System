/**
 * Translation dictionary — Amharic (default) + English.
 *
 * Flat key namespace with `{param}` interpolation tokens (see `useI18n().t`).
 * Brand and proper nouns (Family Guest House, Telebirr, CBE Birr) are kept
 * as-is in both languages.
 */

export type Lang = 'am' | 'en'
export type Params = Record<string, string | number>

export const translations: Record<string, { am: string; en: string }> = {
  /* ------------------------------------------------------------------ */
  /* Common                                                             */
  /* ------------------------------------------------------------------ */
  'common.actions': { am: 'ተግባራት', en: 'Actions' },
  'common.add': { am: 'ጨምር', en: 'Add' },
  'common.edit': { am: 'አርትዕ', en: 'Edit' },
  'common.delete': { am: 'ሰርዝ', en: 'Delete' },
  'common.cancel': { am: 'ይቅር', en: 'Cancel' },
  'common.close': { am: 'ዝጋ', en: 'Close' },
  'common.save': { am: 'አስቀምጥ', en: 'Save' },
  'common.saveChanges': { am: 'ለውጦችን አስቀምጥ', en: 'Save Changes' },
  'common.loading': { am: 'በመጫን ላይ…', en: 'Loading…' },
  'common.loadingData': { am: 'ውሂብ በመጫን ላይ…', en: 'Loading data…' },
  'common.loadMore': { am: 'ተጨማሪ ጫን', en: 'Load More' },
  'common.search': { am: 'ፈልግ', en: 'Search' },
  'common.export': { am: 'ኤክስፖርት', en: 'Export' },
  'common.print': { am: 'አትም', en: 'Print' },
  'common.printPdf': { am: 'አትም / PDF', en: 'Print / PDF' },
  'common.download': { am: 'አውርድ', en: 'Download' },
  'common.view': { am: 'እይ', en: 'View' },
  'common.viewAll': { am: 'ሁሉንም እይ', en: 'View All' },
  'common.all': { am: 'ሁሉም', en: 'All' },
  'common.yes': { am: 'አዎ', en: 'Yes' },
  'common.no': { am: 'አይ', en: 'No' },
  'common.none': { am: 'የለም', en: 'None' },
  'common.today': { am: 'ዛሬ', en: 'Today' },
  'common.yesterday': { am: 'ትናንት', en: 'Yesterday' },
  'common.name': { am: 'ስም', en: 'Name' },
  'common.fullName': { am: 'ሙሉ ስም', en: 'Full Name' },
  'common.phone': { am: 'ስልክ', en: 'Phone' },
  'common.phoneNumber': { am: 'የስልክ ቁጥር', en: 'Phone Number' },
  'common.email': { am: 'ኢሜይል', en: 'Email' },
  'common.role': { am: 'ሚና', en: 'Role' },
  'common.status': { am: 'ሁኔታ', en: 'Status' },
  'common.date': { am: 'ቀን', en: 'Date' },
  'common.notes': { am: 'ማስታወሻ', en: 'Notes' },
  'common.amount': { am: 'መጠን', en: 'Amount' },
  'common.total': { am: 'ጠቅላላ', en: 'Total' },
  'common.totalPaid': { am: 'የተከፈለ ጠቅላላ', en: 'Total Paid' },
  'common.paid': { am: 'የተከፈለ', en: 'Paid' },
  'common.method': { am: 'ዘዴ', en: 'Method' },
  'common.reference': { am: 'ማጣቀሻ', en: 'Reference' },
  'common.description': { am: 'መግለጫ', en: 'Description' },
  'common.category': { am: 'ምድብ', en: 'Category' },
  'common.reason': { am: 'ምክንያት', en: 'Reason' },
  'common.nationality': { am: 'ዜግነት', en: 'Nationality' },
  'common.idNumber': { am: 'መታወቂያ', en: 'ID' },
  'common.addedOn': { am: 'የተገባበት ቀን', en: 'Added' },
  'common.guest': { am: 'እንግዳ', en: 'Guest' },
  'common.room': { am: 'ክፍል', en: 'Room' },
  'common.noResults': { am: 'መዝገብ አልተገኘም።', en: 'No records found.' },
  'common.staffUser': { am: 'የሠራተኛ ተጠቃሚ', en: 'Staff User' },
  'common.perNight': { am: '/ ሌሊት', en: '/ night' },
  'common.perHour': { am: '/ ሰዓት', en: '/ hr' },
  'common.confirmDelete': { am: 'ሰርዝ አረጋግጥ', en: 'Confirm Delete' },
  'common.deleteRoom': { am: 'ክፍል ሰርዝ', en: 'Delete Room' },

  /* Payment methods */
  'pm.cash': { am: 'ጥሬ ገንዘብ', en: 'Cash' },
  'pm.credit': { am: 'ብድር', en: 'Credit' },
  'pm.telebirr': { am: 'ቴሌቢር', en: 'Telebirr' },
  'pm.cbeBirr': { am: 'CBE ብር', en: 'CBE Birr' },
  'pm.bank': { am: 'ባንክ', en: 'Bank' },
  'pm.bankTransfer': { am: 'የባንክ ሽግግር', en: 'Bank Transfer' },
  'pm.other': { am: 'ሌላ', en: 'Other' },
  'pm.otherBank': { am: 'ሌላ ባንክ', en: 'Other Bank' },

  /* Room / logbook statuses */
  'room.status.available': { am: 'ክፍት', en: 'Available' },
  'room.status.occupied': { am: 'ተይዟል', en: 'Occupied' },
  'room.status.cleaning': { am: 'ጽዳት', en: 'Cleaning' },
  'room.status.reserved': { am: 'የተያዘ', en: 'Reserved' },
  'room.status.expected': { am: 'ዛሬ ይመጣል', en: 'Arriving today' },
  'room.status.inactive': { am: 'ተቋርጧል', en: 'Inactive' },
  'room.vacant': { am: 'ባዶ', en: 'Vacant' },

  /* ------------------------------------------------------------------ */
  /* AppShell / navigation                                              */
  /* ------------------------------------------------------------------ */
  'nav.platform': { am: 'መድረክ', en: 'Platform' },
  'nav.operations': { am: 'ክዋኔዎች', en: 'Operations' },
  'nav.management': { am: 'አስተዳደር', en: 'Management' },
  'nav.properties': { am: 'ንብረቶች እና ተከራዮች', en: 'Properties & Tenants' },
  'nav.dashboard': { am: 'የዕለት መዝገብ', en: 'Daily Logbook' },
  'nav.reservations': { am: 'ቦታ ማስያዝ', en: 'Reservations' },
  'nav.guests': { am: 'እንግዶች', en: 'Guests' },
  'nav.expenses': { am: 'ወጪዎች', en: 'Expenses' },
  'nav.rooms': { am: 'ክፍሎች', en: 'Rooms' },
  'nav.stays': { am: 'የመቆያ መዝገብ', en: 'Stays Archive' },
  'nav.reports': { am: 'ሪፖርቶች', en: 'Reports' },
  'nav.financeReports': { am: 'የፋይናንስ ሪፖርቶች', en: 'Finance Reports' },
  'nav.settings': { am: 'ቅንብሮች', en: 'Settings' },
  'nav.auditLog': { am: 'የክትትል መዝገብ', en: 'Audit Log' },
  'nav.platformConsole': { am: 'የመድረክ ኮንሶል', en: 'Platform Console' },
  'nav.multiTenant': { am: 'ለብዙ ተከራዮች አገልግሎት', en: 'Multi-Tenant SaaS' },
  'nav.managementSystem': { am: 'የአስተዳደር ሥርዓት', en: 'Management System' },
  'nav.openMenu': { am: 'የመስመር ሜኑ ክፈት', en: 'Open navigation menu' },
  'nav.closeMenu': { am: 'የመስመር ሜኑ ዝጋ', en: 'Close navigation menu' },
  'nav.signOut': { am: 'ውጣ', en: 'Sign out' },
  'nav.userMenu': { am: 'የተጠቃሚ መለያ ሜኑ', en: 'User account menu' },

  'role.superAdmin': { am: 'ሱፐር አድሚን', en: 'Super Admin' },
  'role.platformSuperAdmin': { am: 'የመድረክ ሱፐር አድሚን', en: 'Platform Super Admin' },
  'role.administrator': { am: 'አስተዳዳሪ', en: 'Administrator' },
  'role.receptionist': { am: 'የእንግዳ ተቀባይ', en: 'Receptionist' },
  'role.receptionStaff': { am: 'የእንግዳ ተቀባይ ሠራተኛ', en: 'Reception Staff' },
  'role.receptionDesk': { am: 'የእንግዳ መቀበያ', en: 'Reception Desk' },

  'settings.guestHouseSettings': { am: 'የእንግዳ ቤት ቅንብሮች', en: 'Guest House Settings' },
  'settings.changePassword': { am: 'የይለፍ ቃል ቀይር', en: 'Change Password' },
  'userMenu.profile': { am: 'መገለጫ', en: 'Profile' },

  'theme.lightMode': { am: 'የቀን ሁነታ', en: 'Light Mode' },
  'theme.nightMode': { am: 'የሌሊት ሁነታ', en: 'Night Mode' },
  'theme.toLight': { am: 'ወደ ቀን ሁነታ ቀይር', en: 'Switch to light mode' },
  'theme.toNight': { am: 'ወደ ሌሊት ሁነታ ቀይር', en: 'Switch to night mode' },

  'lang.english': { am: 'English', en: 'English' },
  'lang.amharic': { am: 'አማርኛ', en: 'Amharic' },
  'lang.switchToEnglish': { am: 'ወደ እንግሊዝኛ ቀይር', en: 'Switch to English' },
  'lang.switchToAmharic': { am: 'ወደ አማርኛ ቀይር', en: 'Switch to Amharic' },

  /* ------------------------------------------------------------------ */
  /* Login                                                              */
  /* ------------------------------------------------------------------ */
  'login.helpSupport': { am: 'እገዛ እና ድጋፍ', en: 'Help & Support' },
  'login.currentlySignedIn': { am: 'በአሁኑ ጊዜ ገብተዋል', en: 'Currently Signed In' },
  'login.welcomeBackName': { am: 'እንኳን ደህና መጡ፣ {name}', en: 'Welcome back, {name}' },
  'login.signedInAs': { am: 'የገቡት እንደ {role}', en: 'Signed in as {role}' },
  'login.continueToDashboard': { am: 'ወደ ዳሽቦርድ ይቀጥሉ', en: 'Continue to Dashboard' },
  'login.signOutSwitchUser': { am: 'ውጣ / ተጠቃሚ ቀይር', en: 'Sign Out / Switch User' },
  'login.staffPortal': { am: 'የሠራተኞች ፖርታል', en: 'Staff Portal' },
  'login.welcomeBack': { am: 'እንኳን ደህና መጡ', en: 'Welcome back' },
  'login.signInPrompt': {
    am: 'የእንግዳ ቤትዎን ክዋኔዎች ለማስተዳደር ይግቡ።',
    en: 'Sign in to manage your guest house operations.',
  },
  'login.username': { am: 'የተጠቃሚ ስም', en: 'Username' },
  'login.usernameOrPhone': { am: 'የተጠቃሚ ስም ወይም ስልክ', en: 'Username or Phone' },
  'login.phoneNumber': { am: 'ስልክ ቁጥር', en: 'Phone Number' },
  'login.password': { am: 'የይለፍ ቃል', en: 'Password' },
  'login.enterPassword': { am: 'የይለፍ ቃልዎን ያስገቡ', en: 'Enter your password' },
  'login.hidePassword': { am: 'የይለፍ ቃል ደብቅ', en: 'Hide password' },
  'login.showPassword': { am: 'የይለፍ ቃል አሳይ', en: 'Show password' },
  'login.signingIn': { am: 'በመግባት ላይ…', en: 'Signing in…' },
  'login.signInToGH': { am: 'ወደ እንግዳ ቤት ይግቡ', en: 'Sign In to Guest House' },
  'login.authorizedOnly': {
    am: 'ለተፈቀደላቸው ሠራተኞች ብቻ · Family Guest House Management System',
    en: 'Authorized staff access only · Family Guest House Management System',
  },
  'login.allRightsReserved': { am: 'ሁሉም መብቶች የተጠበቁ ናቸው።', en: 'All rights reserved.' },
  'login.privacy': { am: 'ግላዊነት', en: 'Privacy' },
  'login.terms': { am: 'ውሎች', en: 'Terms' },
  'login.managementSystem': { am: 'የእንግዳ ቤት አስተዳደር ሥርዓት', en: 'Guest House Management System' },
  'login.needHelp': { am: 'የመግቢያ እገዛ ይፈልጋሉ?', en: 'Need Sign In Help?' },
  'login.helpDescription': { am: 'መለያዎን እንዴት እንደሚደርሱበት እነሆ።', en: 'Here is how to get access to your account.' },
  'login.defaultAccounts': { am: 'ነባሪ መለያዎች', en: 'Default Accounts:' },
  'login.adminUsername': { am: 'አስተዳዳሪ፡ የተጠቃሚ ስም', en: 'Administrator: username' },
  'login.receptionUsername': { am: 'የእንግዳ ተቀባይ፡ የተጠቃሚ ስም', en: 'Reception Desk: username' },
  'login.forgotPassword': { am: 'የይለፍ ቃል ረስተዋል?', en: 'Forgotten Passwords:' },
  'login.forgotHint': {
    am: 'እባክዎ የሠራተኞችን መረጃ ለመቀየር የሥርዓት አስተዳዳሪዎን ከቅንብሮች ፓነል ያነጋግሩ።',
    en: 'Please contact your system Administrator to reset your staff credentials from the Settings panel.',
  },
  'login.frontDeskInternal': { am: 'የፊት ካውንተር · የውስጥ ሥርዓት', en: 'Front Desk • Internal System' },
  'login.unableToSignIn': {
    am: 'መግባት አልተቻለም። እባክዎ የመለያ መረጃዎን እና ግንኙነትዎን ያረጋግጡ።',
    en: 'Unable to sign in. Please verify your credentials and connection.',
  },

  /* ------------------------------------------------------------------ */
  /* Dashboard                                                          */
  /* ------------------------------------------------------------------ */
  'dash.title': { am: 'ዳሽቦርድ አጠቃላይ እይታ', en: 'Dashboard Overview' },
  'dash.overview': { am: 'የእንግዳ ቤት አጠቃላይ እይታ', en: 'Guest House Overview' },
  'dash.managementOverview': { am: 'የአስተዳደር አጠቃላይ እይታ', en: 'Management Overview' },
  'dash.adminOnlySummary': {
    am: 'የእውነተኛ ጊዜ የፋይናንስ እና የመያዝ ጥቅል (ለአስተዳዳሪ ብቻ)',
    en: 'Real-time financial & occupancy summary (Administrator only)',
  },
  'dash.todayIncome': { am: 'የዛሬ ገቢ', en: "Today's Income" },
  'dash.todayExpenses': { am: 'የዛሬ ወጪ', en: "Today's Expenses" },
  'dash.netIncome': { am: 'የተጣራ ገቢ', en: 'Net Income' },
  'dash.occupiedRooms': { am: 'የተያዙ ክፍሎች', en: 'Occupied Rooms' },
  'dash.availableRooms': { am: 'ክፍት ክፍሎች', en: 'Available Rooms' },
  'dash.reservationsToday': { am: 'የዛሬ ቦታ ማስያዣዎች', en: 'Reservations Today' },
  'dash.recentGuests': { am: 'የቅርብ እንግዶች', en: 'Recent Guests' },
  'dash.expectedArrivals': { am: 'የሚጠበቁ መድረሻዎች', en: 'Expected Arrivals' },
  'dash.guestSettlements': { am: 'የዛሬ የእንግዳ ክፍያዎች', en: 'Guest settlements today' },
  'dash.pettyCash': { am: 'የኪስ ገንዘብ ክፍያዎች', en: 'Disbursed petty cash' },
  'dash.revMinusExp': { am: 'ገቢ ሲቀነስ ወጪ', en: 'Revenue minus expenses' },
  'dash.occupancyRate': { am: '{rate}% የመያዝ መጠን', en: '{rate}% occupancy rate' },
  'dash.readyCheckin': { am: 'ለፈጣን ማስገባት ዝግጁ', en: 'Ready for instant check-in' },
  'dash.pendingBookings': { am: 'በመጠባበቅ ላይ ያሉ የቦታ ማስያዣዎች', en: 'Scheduled bookings pending' },
  'dash.activityManifest': {
    am: 'የዛሬ የእንግዳ እንቅስቃሴ እና የዕለት ዝርዝር',
    en: "Today's Guest Activity & Daily Manifest",
  },
  'dash.liveAudit': { am: 'የቀጥታ ክትትል', en: 'Live Audit' },
  'dash.manifestSub': {
    am: 'የዛሬን የገቡ፣ የወጡ እና የተያዙ እንግዶችን የመቆያ ቆይታ እና የክፍያ ክትትል ይመልከቱ።',
    en: "Review today's checked-in, checked-out, and reserved guests with stay durations and payment tracking.",
  },
  'dash.viewPrintManifest': { am: 'የዕለት ዝርዝርን እይ እና አትም', en: 'View & Print Daily Manifest' },
  'dash.loading': { am: 'ዳሽቦርድ እና የክፍል መረጃ በመጫን ላይ…', en: 'Loading dashboard and room information…' },
  'dash.emptyGuests': { am: 'ዛሬ የገቡ እንግዶች የሉም', en: 'No guests checked in today' },
  'dash.emptyPayments': { am: 'የተመዘገቡ ክፍያዎች የሉም', en: 'No payments recorded' },

  /* ------------------------------------------------------------------ */
  /* Logbook                                                            */
  /* ------------------------------------------------------------------ */
  'logbook.title': { am: 'የዕለት መዝገብ', en: 'Daily Logbook' },
  'logbook.previousMonth': { am: 'ያለፈው ወር', en: 'Previous Month' },
  'logbook.nextMonth': { am: 'የሚቀጥለው ወር', en: 'Next Month' },
  'logbook.days': { am: '{count} ቀናት', en: '{count} Days' },
  'logbook.returnCurrentMonth': { am: 'ወደ አሁኑ ወር ተመለስ', en: 'Return to Current Month' },
  'logbook.todayManifest': { am: 'የዛሬ ዝርዝር', en: "Today's Manifest" },
  'logbook.manifestHint': {
    am: "የዛሬን የገቡ፣ የወጡ እና የተያዙ እንግዶችን ዝርዝር ይመልከቱ እና ያትሙ",
    en: "View & print today's checked-in, checked-out, and reserved guest manifest",
  },
  'logbook.pastCheckedOut': { am: 'ያለፈ / የወጣ', en: 'Past / Checked Out' },
  'logbook.jumpToday': { am: 'ወደ ዛሬ ዝለል', en: 'Jump to Today' },
  'logbook.roomRate': { am: 'ክፍል / ተመን', en: 'Room / Rate' },
  'logbook.roomsCount': { am: '{count} ክፍሎች', en: '{count} Rooms' },
  'logbook.checkIn': { am: 'አስግባ', en: 'Check In' },
  'logbook.checkOut': { am: 'አስወጣ', en: 'Check Out' },
  'logbook.checkingIn': { am: 'በማስገባት ላይ…', en: 'Checking in…' },
  'logbook.pastReservation': { am: 'ያለፈ ቦታ ማስያዣ', en: 'Past Reservation' },
  'logbook.reservedByReception': { am: 'የተያዘ · በእንግዳ ተቀባይ ይከናወናል', en: 'Reserved · Check-in by receptions' },
  'logbook.done': { am: 'ተጠናቋል', en: 'Done' },
  'logbook.readyRefresh': { am: 'በሚቀጥለው እድሳት ዝግጁ', en: 'Ready on next refresh' },
  'logbook.turnaround': { am: 'የጽዳት ሥራ በመካሄድ ላይ', en: 'Turnaround in progress' },
  'logbook.checkedOut': { am: 'ወጥቷል', en: 'Checked Out' },
  'logbook.wasOccupied': { am: 'ተይዞ ነበር', en: 'Was Occupied' },
  'logbook.departed': { am: 'ከቶ ወጥቷል', en: 'Departed' },
  'logbook.stay': { am: 'መቆየት', en: 'Stay' },
  'logbook.readySoon': { am: 'በቅርቡ ዝግጁ…', en: 'Ready soon…' },
  'logbook.checkinByReception': { am: 'በእንግዳ ተቀባይ ይከናወናል', en: 'Check-in by reception' },
  'logbook.pastDateNoCheckin': {
    am: 'ያለፈ ቀን ({date}) — ወደ ኋላ ተመልሶ ማስገባት አይቻልም',
    en: 'Past date ({date}) — cannot check in retroactively',
  },
  'logbook.clickToCheckin': {
    am: 'ክፍል {room}ን ለማስገባት ይጫኑ (ማስገባት በዛሬ ይጀምራል)',
    en: 'Click to check in room {room} (check-in starts today)',
  },
  'logbook.dayCount': { am: 'ቀን {night}/{total}', en: 'Day {night}/{total}' },
  'logbook.roomCheckedIn': { am: 'ክፍል {room} — ገብቷል', en: 'Room {room} — Checked In' },
  'logbook.reviewStay': {
    am: 'የመቆየት ዝርዝሮችን ይመልከቱ ወይም ወደ መውጫ ይቀጥሉ።',
    en: 'Review the stay details or continue to checkout.',
  },
  'logbook.extendStay': { am: 'ቆይታ አራዝም', en: 'Extend Stay' },
  'logbook.guestNo': { am: 'እንግዳ #{id}', en: 'Guest #{id}' },
  'logbook.bookingNo': { am: 'ቦታ ማስያዣ #{id}', en: 'Booking #{id}' },
  'logbook.frontDeskRegistered': { am: 'በፊት ካውንተር ተመዝግቧል', en: 'Front desk registered' },
  'logbook.stayInfo': {
    am: 'ስልክ፡ {phone} · ተመን፡ {rate}',
    en: 'Phone: {phone} · Rate: {rate}',
  },
  'logbook.creditValue': { am: 'ብድር፡ {amount}', en: 'Credit: {amount}' },
  'logbook.extensionCharge': { am: 'የቆይታ ማራዘሚያ ክፍያ', en: 'Extension charge' },
  'logbook.latePenalty': { am: 'የዘገየ መውጫ ቅጣት', en: 'Late penalty' },
  'logbook.subtotal': { am: 'ድምር', en: 'Subtotal' },
  'logbook.balance': { am: 'ቀሪ ሂሳብ', en: 'Balance' },
  'logbook.occupied': { am: 'የተያዘ', en: 'Occupied' },
  'logbook.today': { am: 'ዛሬ', en: 'Today' },
  'logbook.dayOfTotal': { am: 'ቀን {night} ከ {total}', en: 'Day {night} of {total}' },
  'common.vacant': { am: 'ክፍት', en: 'Vacant' },

  /* ------------------------------------------------------------------ */
  /* Guests                                                             */
  /* ------------------------------------------------------------------ */
  'guests.title': { am: 'እንግዶች', en: 'Guests' },
  'guests.directory': { am: 'የእንግዶች መዝገብ', en: 'Guest Directory' },
  'guests.add': { am: 'እንግዳ ጨምር', en: 'Add Guest' },
  'guests.newReservation': { am: 'አዲስ ቦታ ማስያዣ', en: 'New Reservation' },
  'guests.searchPlaceholder': {
    am: 'በስም፣ በስልክ ወይም በመታወቂያ ይፈልጉ…',
    en: 'Search by name, phone, or ID…',
  },
  'guests.empty': { am: 'እንግዶች አልተገኙም።', en: 'No guests found.' },
  'guests.defaultNationality': { am: 'ኢትዮጵያዊ', en: 'Ethiopian' },

  /* ------------------------------------------------------------------ */
  /* Rooms                                                              */
  /* ------------------------------------------------------------------ */
  'rooms.title': { am: 'ክፍሎች', en: 'Rooms' },
  'rooms.add': { am: 'ክፍል ጨምር', en: 'Add Room' },
  'rooms.out': { am: 'መውጫ፡ {date}', en: 'Out: {date}' },
  'rooms.guest': { am: 'እንግዳ፡ {name}', en: 'Guest: {name}' },
  'rooms.expectedCheckout': { am: 'የሚጠበቅ መውጫ', en: 'Expected check-out' },
  'rooms.comfortBed': { am: 'ምቹ አልጋ', en: 'Comfort Bed' },
  'rooms.maxGuests': { am: 'እስከ {count} እንግዶች', en: 'Max {count} Guests' },
  'rooms.standardOccupancy': { am: 'መደበኛ የእንግዳ መጠን', en: 'Standard Occupancy' },
  'rooms.checkedInGuest': { am: 'የገባ እንግዳ', en: 'Checked-in Guest' },
  'rooms.activeStay': { am: 'ንቁ መቆየት', en: 'Active Stay' },
  'rooms.inProgress': { am: 'በሂደት ላይ', en: 'In Progress' },
  'rooms.housekeeping': { am: 'የጽዳት አገልግሎት', en: 'Housekeeping' },
  'rooms.minutesLeft': { am: '{count} ደቂቃ ቀርቷል', en: '{count}m left' },
  'rooms.arrivalToday': { am: 'ዛሬ ይመጣል', en: 'Arrival Today' },
  'rooms.editAdminOnly': { am: 'ክፍል አርትዕ (ለአስተዳዳሪ ብቻ)', en: 'Edit Room (Admin Only)' },
  'rooms.deleteAdminOnly': { am: 'ክፍል ሰርዝ (ለአስተዳዳሪ ብቻ)', en: 'Delete Room (Admin Only)' },
  'rooms.status.label': { am: 'ሁኔታ', en: 'Status' },
  'rooms.pricePerNight': { am: 'የሌሊት ዋጋ', en: 'Price Per Night' },
  'rooms.roomNumber': { am: 'ቁጥር', en: 'Room Number' },
  'rooms.roomType': { am: 'የክፍል አይነት', en: 'Room Type' },
  'rooms.noRoomsFound': { am: 'ክፍሎች አልተገኙም', en: 'No rooms found' },
  'common.done': { am: 'ተጠናቋል', en: 'Done' },
  'common.hint': { am: 'ፍንጭ', en: 'Hint' },
  'common.displayedOn': { am: 'የሚታየው በ', en: 'Displayed on' },

  /* ------------------------------------------------------------------ */
  /* Reservations                                                       */
  /* ------------------------------------------------------------------ */
  'res.title': { am: 'ቦታ ማስያዝ', en: 'Reservations' },
  'res.new': { am: 'አዲስ ቦታ ማስያዣ', en: 'New Reservation' },
  'res.arrival': { am: 'የመድረሻ ቀን', en: 'Arrival' },
  'res.checkout': { am: 'የመውጫ ቀን', en: 'Checkout' },
  'res.status.reserved': { am: 'የተያዘ', en: 'Reserved' },
  'res.status.pending': { am: 'በመጠባበቅ ላይ', en: 'Pending' },
  'res.status.cancelled': { am: 'ተሰርዟል', en: 'Cancelled' },
  'res.status.checkedIn': { am: 'ገብቷል', en: 'Checked In' },
  'res.allStatuses': { am: 'ሁሉም ሁኔታዎች', en: 'All statuses' },

  /* ------------------------------------------------------------------ */
  /* Stays                                                              */
  /* ------------------------------------------------------------------ */
  'stays.title': { am: 'የመቆያ መዝገብ', en: 'Stays' },
  'stays.occupiedRooms': { am: 'የተያዙ ክፍሎች', en: 'Occupied Rooms' },
  'stays.recordPayment': { am: 'ክፍያ መዝግብ', en: 'Record Payment' },
  'stays.checkedInOn': { am: 'የገባበት ቀን {date}', en: 'Checked In {date}' },
  'stays.due': { am: '{amount} ብር መከፈል አለበት', en: '{amount} ETB Due' },
  'stays.settled': { am: 'ተከፍሏል', en: 'Settled' },
  'stays.summary': { am: 'ጠቅላላ {total} · የተከፈለ {paid}', en: 'Total {total} • Paid {paid}' },

  /* ------------------------------------------------------------------ */
  /* Expenses                                                           */
  /* ------------------------------------------------------------------ */
  'exp.title': { am: 'የወጪ ክዋኔዎች', en: 'Operational Expenses' },
  'exp.record': { am: 'ወጪ መዝግብ', en: 'Record Expense' },
  'exp.totalThisMonth': { am: 'የዚህ ወር ጠቅላላ ወጪ', en: 'Total Expenses — This Month' },
  'exp.empty': { am: 'እስካሁን የተመዘገበ ወጪ የለም', en: 'No expenses recorded yet' },

  /* ------------------------------------------------------------------ */
  /* Reports / Finance                                                  */
  /* ------------------------------------------------------------------ */
  'reports.title': { am: 'ሪፖርቶች', en: 'Reports' },
  'reports.tab.daily': { am: 'ዕለታዊ', en: 'Daily' },
  'reports.tab.income': { am: 'ገቢ', en: 'Income' },
  'reports.tab.expenses': { am: 'ወጪ', en: 'Expenses' },
  'reports.tab.weekly': { am: 'ሳምንታዊ', en: 'Weekly' },
  'reports.tab.monthly': { am: 'ወርሃዊ', en: 'Monthly' },
  'reports.avgDaily': { am: 'አማካይ ዕለታዊ', en: 'Avg Daily' },
  'reports.totalIncome': { am: 'ጠቅላላ ገቢ', en: 'Total Income' },
  'reports.totalExpenses': { am: 'ጠቅላላ ወጪ', en: 'Total Expenses' },
  'reports.grossIncome': { am: 'አጠቃላይ ገቢ', en: 'Gross Income' },
  'reports.dailyRevenue': { am: 'ዕለታዊ ገቢ', en: 'Daily Revenue' },
  'reports.netCashflow': { am: 'የተጣራ የገንዘብ ፍሰት', en: 'Net Cashflow' },
  'reports.penalties': { am: 'ቅጣቶች', en: 'Penalties' },

  'fin.title': { am: 'የፋይናንስ ሪፖርቶች', en: 'Finance Reports' },
  'fin.incomeStatement': { am: 'የገቢ መግለጫ', en: 'Income Statement' },
  'fin.exchangeRate': { am: 'የብር–ዶላር የመገበያያ ዋጋ', en: 'Birr per US dollar exchange rate' },
  'fin.exchangeRateHelper': {
    am: 'የተቀየረውን ድምር ለማሳየት የአሁኑን የብር–ዶላር ዋጋ ያስገቡ። ዋጋው በዚህ አሳሽ ውስጥ ይቀመጣል።',
    en: 'Enter the current Birr-per-dollar rate to display converted totals. The rate is saved in this browser.',
  },

  /* ------------------------------------------------------------------ */
  /* Super Admin                                                        */
  /* ------------------------------------------------------------------ */
  'sa.title': { am: 'ንብረቶች እና ተከራዮች', en: 'Properties & Tenants' },
  'sa.onboard': { am: 'አዲስ ንብረት ይመዝግብ', en: 'Onboard New Property' },
  'sa.manage': { am: 'አስተዳድር', en: 'Manage' },
  'sa.statusActive': { am: 'ንቁ', en: 'Active' },
  'sa.statusSuspended': { am: 'የተቋረጠ', en: 'Suspended' },
  'sa.onboarded': { am: 'የተመዘገበበት ቀን {date}', en: 'Onboarded {date}' },
  'sa.revenue': { am: 'ገቢ', en: 'Revenue' },
  'sa.expenses': { am: 'ወጪዎች', en: 'Expenses' },
  'sa.netIncome': { am: 'የተጣራ ገቢ', en: 'Net Income' },
  'sa.empty': { am: 'እስካሁን የተመዘገበ ንብረት የለም', en: 'No properties onboarded yet' },

  /* ------------------------------------------------------------------ */
  /* Settings                                                           */
  /* ------------------------------------------------------------------ */
  'settings.title': { am: 'ቅንብሮች', en: 'Settings' },
  'settings.propertyBilling': { am: 'የንብረት እና የክፍያ ቅንብሮች', en: 'Property & Billing' },
  'settings.paymentMethods': { am: 'የክፍያ ዘዴዎች', en: 'Payment Methods' },
  'settings.account': { am: 'መለያ', en: 'Account' },
  'settings.currencyCode': { am: 'የገንዘብ ኮድ', en: 'Currency Code' },
  'settings.checkoutDeadline': {
    am: 'የመውጫ ጊዜ ገደብ (ሰዓት/ደቂቃ)',
    en: 'Checkout Deadline Hour/Minute',
  },
  'settings.latePenalty': { am: 'የዘገየ መውጫ ቅጣት (ETB) *', en: 'Late Checkout Penalty Charge (ETB) *' },
  'settings.penaltyHelper': {
    am: 'የዮናስ መስፈርት፦ ዘግይቶ መውጫ ሲኖር 600 ብር በራስ-ሰር ወደ የእንግዳ ሒሳብ ይጨመራል።',
    en: 'Yonas specification: 600 ETB automatically added to folio upon late checkout.',
  },
  'settings.save': { am: 'ቅንብሮችን አስቀምጥ', en: 'Save Settings' },

  /* ------------------------------------------------------------------ */
  /* ErrorBoundary                                                      */
  /* ------------------------------------------------------------------ */
  'error.title': { am: 'የሆነ ችግር ተከስቷል', en: 'Something went wrong' },
  'error.description': {
    am: 'ያልተጠበቀ የመገናኛ ስህተት ተከስቷል። ገጹን እንደገና ካሳደሱ የተጠቃሚዎ ክፍለ ጊዜ ይመለሳል።',
    en: 'An unexpected interface error occurred. You can reload the page to restore your active desk session.',
  },

  /* ------------------------------------------------------------------ */
  /* Placeholder / secondary modules                                    */
  /* ------------------------------------------------------------------ */
  'ph.auditDesc': {
    am: 'የክዋኔ እንቅስቃሴዎች (በማስገባት፣ በማስወጣት እና በሒሳብ ዝመናዎች ላይ) የማይለወጥ መዝገብ።',
    en: 'A durable record of operational check-ins, check-outs, and folio updates.',
  },
  'ph.tax': { am: 'ታክስ', en: 'Tax' },
  'ph.taxSchedule': { am: 'የታክስ መርሐ ግብር', en: 'Tax Schedule' },
  'ph.invoices': { am: 'ደረሰኞች', en: 'Invoices' },
  'ph.receipts': { am: 'ደረሰኞች (Receipts)', en: 'Receipts' },
  'ph.etbDesc': {
    am: 'የኢትዮጵያ ብር የታክስ መርሐ ግብሮች እና የደረሰኝ መዝገቦች።',
    en: 'Ethiopian Birr tax schedules and invoice records.',
  },
}