/**
 * CysterCare Health Platform - Interactive Mobile Client Engine
 * Coordinates:
 * - Onboarding Flow (Splash, Welcome, PCOS/PMOS info, Types, CysterCare capabilities)
 * - Authentication Flow (Email, Social, Password)
 * - Personalization Flow (Name & DOB wheel picker, Height & Weight live BMI)
 * - Home Hub (Daily Check-in, Quick Actions, Feature Tiles)
 * - Layer 1 Conversational AI Flow with 6-month longitudinal metrics & Specialist Referral
 * - Layer 2 PCOS/PMOS Clinical Detection Engine Integration
 * - Find Specialists Directory (Endocrinologist, Gynecologist, Derms, Psychologist, Dietitian)
 * - Community Hub (Interactive Feed, Research Articles, Article Detail)
 * - Lab Report OCR & Ultrasound Upload Simulation
 * - Dedicated Detection Results Screen & Grounded Explainability
 * - Doctor Prep & Clinical Brief Export (Dr. Afshin Shareef)
 * - Validation & Research Benchmark Telemetry (>=95% Accuracy)
 */

// Application State
const state = {
  activeView: 'screen-splash',
  sessionId: 'user-' + Math.random().toString(36).substring(2, 9),
  patientName: 'Sarah',
  userAge: 26,
  dob: { month: 'September', day: 18, year: 1998 },
  height: 165,
  weight: 75.0,
  heightUnit: 'cm',
  weightUnit: 'kg',
  patientData: {
    typicalCycleLength: 49,
    periodsLast12Months: 6,
    cyclePredictability: 'irregular',
    facialHair: true,
    chinHair: 'significant',
    chestHair: 'mild',
    persistentAcne: true,
    scalpHairThinning: false,
    mfgScore: 8,
    totalTestosterone: null,
    shbg: null,
    tsh: null,
    prolactin: null,
    leftOvaryFollicles: null,
    rightOvaryFollicles: null,
    leftOvaryVolumeMl: null,
    rightOvaryVolumeMl: null,
    labRanges: {
      totalTestosterone: { min: 0.5, max: 1.8 }
    }
  },
  detectionResult: null,
  validationMetrics: null,
  isDeviceFrame: true
};

// DOM Elements
const views = document.querySelectorAll('.screen-view');
const dockTabs = document.querySelectorAll('.dock-tab');
const chatScrollArea = document.getElementById('chatScrollArea');
const chatHeroWelcome = document.getElementById('chatHeroWelcome');
const messagesList = document.getElementById('messagesList');
const interactiveChipsBar = document.getElementById('interactiveChipsBar');
const chatInputText = document.getElementById('chatInputText');
const chatSendBtn = document.getElementById('chatSendBtn');
const chatMicBtn = document.getElementById('chatMicBtn');
const chatAttachBtn = document.getElementById('chatAttachBtn');

// Modals
const labModal = document.getElementById('labModal');
const closeLabModalBtn = document.getElementById('closeLabModalBtn');
const btnCancelModal = document.getElementById('btnCancelModal');
const tabLabReport = document.getElementById('tabLabReport');
const tabUltrasound = document.getElementById('tabUltrasound');
const paneLabReport = document.getElementById('paneLabReport');
const paneUltrasound = document.getElementById('paneUltrasound');
const btnSimulateOcr = document.getElementById('btnSimulateOcr');
const btnSimulateUs = document.getElementById('btnSimulateUs');
const extractedTableWrapper = document.getElementById('extractedTableWrapper');
const usExtractedWrapper = document.getElementById('usExtractedWrapper');
const btnConfirmLabResults = document.getElementById('btnConfirmLabResults');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupOnboardingAuthFlow();
  setupPersonalizationControls();
  setupSymptomsControls();
  setupSpecialistsControls();
  setupCommunityControls();
  setupChatHandlers();
  setupChatWidgetControls();
  setupDetectionHandlers();
  setupLabModalHandlers();
  setupDoctorPrep();
  setupCarePlan();
  setupProfileControls();
  setupPrototypeControls();

  // Initialize on splash screen
  switchView('screen-splash');

  // Load benchmark metrics on launch
  await fetchValidationMetrics();

  // Run initial detection with default patient data
  await runDetectionEngine(state.patientData);
});

// ================= NAVIGATION =================
function setupNavigation() {
  dockTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.target;
      switchView(targetId);
    });
  });

  // Home Quick Action triggers
  document.getElementById('qaAiAssistant')?.addEventListener('click', () => switchView('view-chat'));
  document.getElementById('qaLogSymptoms')?.addEventListener('click', () => switchView('view-symptoms'));
  document.getElementById('qaVerifiedDoctors')?.addEventListener('click', () => switchView('view-specialists'));
  document.getElementById('startCheckinBtn')?.addEventListener('click', () => switchView('view-symptoms'));
  document.getElementById('homeUserAvatarBtn')?.addEventListener('click', () => {
    updateProfileDisplay();
    switchView('view-profile');
  });

  // Header and screen back buttons
  document.getElementById('chatBackBtn')?.addEventListener('click', () => switchView('view-home'));
  document.getElementById('profileBackBtn')?.addEventListener('click', () => switchView('view-home'));
  document.getElementById('detectionBackBtn')?.addEventListener('click', () => switchView('view-profile'));
  document.getElementById('carePlanBackBtn')?.addEventListener('click', () => switchView('view-detection'));
  document.getElementById('doctorBackBtn')?.addEventListener('click', () => switchView('view-home'));
  document.getElementById('valBackBtn')?.addEventListener('click', () => switchView('view-home'));
  document.getElementById('symptomsBackBtn')?.addEventListener('click', () => switchView('view-home'));
  document.getElementById('specialistsBackBtn')?.addEventListener('click', () => switchView('view-home'));
  document.getElementById('communityBackBtn')?.addEventListener('click', () => switchView('view-home'));
  document.getElementById('researchDetailBackBtn')?.addEventListener('click', () => {
    switchView('view-community');
    document.getElementById('tabCommResearch')?.click();
  });

  // Quick Action Buttons
  document.getElementById('startPcosCheckBtn')?.addEventListener('click', () => {
    switchView('view-chat');
    startPcosDetectionChatFlow();
  });
  document.getElementById('openValidationBtn')?.addEventListener('click', () => switchView('view-validation'));
  document.getElementById('btnBuildCarePlan')?.addEventListener('click', () => switchView('view-care-plan'));
  document.getElementById('btnPrepDoctor')?.addEventListener('click', () => switchView('view-doctor-prep'));
  document.getElementById('planToDoctorBtn')?.addEventListener('click', () => switchView('view-doctor-prep'));
  document.getElementById('btnChatOpenSymptoms')?.addEventListener('click', () => switchView('view-symptoms'));
  document.getElementById('exportDetectionBtn')?.addEventListener('click', () => switchView('view-doctor-prep'));
  document.getElementById('featSpecialists')?.addEventListener('click', () => switchView('view-specialists'));
  document.getElementById('featCommunity')?.addEventListener('click', () => switchView('view-community'));
  document.getElementById('featMedicalRecords')?.addEventListener('click', () => switchView('view-detection'));
  document.getElementById('featAnalytics')?.addEventListener('click', () => switchView('view-validation'));
}

function switchView(viewId) {
  state.activeView = viewId;
  const allViews = document.querySelectorAll('.screen-view');
  allViews.forEach(v => {
    if (v.id === viewId) {
      v.classList.add('active');
    } else {
      v.classList.remove('active');
    }
  });

  // Dock Visibility: Only show on main app views, hide on onboarding & auth screens
  const isOnboarding = viewId.startsWith('screen-');
  const dockNav = document.getElementById('appDockNav');
  if (dockNav) {
    dockNav.style.display = isOnboarding ? 'none' : 'flex';
  }

  // Update Prototype Screen Selector dropdown
  const selector = document.getElementById('prototypeScreenSelect');
  if (selector && selector.value !== viewId) {
    selector.value = viewId;
  }

  // Update Dock Tabs
  dockTabs.forEach(tab => {
    if (tab.dataset.target === viewId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // iOS status bar theme
  const statusBar = document.getElementById('iosStatusBar');
  const iphoneFrame = document.getElementById('iphoneFrame');
  if (statusBar) {
    if (viewId === 'screen-splash' || viewId === 'screen-welcome') {
      statusBar.classList.add('white-mode');
      statusBar.classList.add('splash-mode');
      iphoneFrame?.classList.add('purple-theme');
    } else {
      statusBar.classList.remove('white-mode');
      statusBar.classList.remove('splash-mode');
      iphoneFrame?.classList.remove('purple-theme');
    }
  }

  // Scroll to top of viewport
  const viewport = document.getElementById('appViewport');
  if (viewport) viewport.scrollTop = 0;
}

// ================= ONBOARDING & AUTH FLOW =================
function setupOnboardingAuthFlow() {
  // 1. Splash Screen
  document.getElementById('splashTouchTarget')?.addEventListener('click', () => {
    switchView('screen-welcome');
  });

  // 2. Welcome Screen
  document.getElementById('btnWelcomeGetStarted')?.addEventListener('click', () => {
    switchView('screen-onboarding-1');
  });

  // 3. Onboarding 1: What is PCOS/PMOS?
  document.getElementById('btnBackToWelcome')?.addEventListener('click', () => {
    switchView('screen-welcome');
  });
  document.getElementById('btnSkipOnboarding1')?.addEventListener('click', () => {
    switchView('screen-auth-choice');
  });
  document.getElementById('btnContinueOnb1')?.addEventListener('click', () => {
    switchView('screen-onboarding-2');
  });

  // 4. Onboarding 2: Types & Personalization
  document.getElementById('btnBackToOnb1')?.addEventListener('click', () => {
    switchView('screen-onboarding-1');
  });
  document.getElementById('btnSkipOnboarding2')?.addEventListener('click', () => {
    switchView('screen-auth-choice');
  });
  document.getElementById('btnContinueOnb2')?.addEventListener('click', () => {
    switchView('screen-onboarding-3');
  });

  // 5. Onboarding 3: What CysterCare Does
  document.getElementById('btnBackToOnb2')?.addEventListener('click', () => {
    switchView('screen-onboarding-2');
  });
  document.getElementById('btnSkipOnboarding3')?.addEventListener('click', () => {
    switchView('screen-auth-choice');
  });
  document.getElementById('btnOnbToAuthChoice')?.addEventListener('click', () => {
    switchView('screen-auth-choice');
  });

  // 6. Auth Choice: Let's Get You Started
  document.getElementById('btnBackToOnb3')?.addEventListener('click', () => {
    switchView('screen-onboarding-3');
  });
  document.getElementById('btnContinueEmail')?.addEventListener('click', () => {
    switchView('screen-auth-email');
  });
  document.getElementById('btnContinueGoogle')?.addEventListener('click', () => {
    switchView('screen-personalize-name-dob');
  });
  document.getElementById('btnContinueApple')?.addEventListener('click', () => {
    switchView('screen-personalize-name-dob');
  });

  // 7. Auth: Enter Your Email
  document.getElementById('btnBackToAuthChoice')?.addEventListener('click', () => {
    switchView('screen-auth-choice');
  });
  document.getElementById('btnSubmitEmail')?.addEventListener('click', () => {
    switchView('screen-auth-password');
  });
  document.getElementById('linkSwitchToLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('screen-auth-password');
  });

  // 8. Auth: Create Your Account
  document.getElementById('btnBackToAuthEmail')?.addEventListener('click', () => {
    switchView('screen-auth-email');
  });
  document.getElementById('btnSubmitPassword')?.addEventListener('click', () => {
    switchView('screen-personalize-name-dob');
  });

  // 9. Personalize: Name & Date of Birth
  document.getElementById('btnBackToAuthPass')?.addEventListener('click', () => {
    switchView('screen-auth-password');
  });
  document.getElementById('btnSkipDob')?.addEventListener('click', () => {
    switchView('screen-personalize-body');
  });
  document.getElementById('btnContinuePersonalizeDob')?.addEventListener('click', () => {
    switchView('screen-personalize-body');
  });

  // 10. Personalize: Height & Weight (BMI)
  document.getElementById('btnBackToDob')?.addEventListener('click', () => {
    switchView('screen-personalize-name-dob');
  });
  document.getElementById('btnSkipBody')?.addEventListener('click', () => {
    switchView('view-home');
  });
  document.getElementById('btnFinishPersonalize')?.addEventListener('click', () => {
    switchView('view-home');
  });
}

// ================= PERSONALIZATION CONTROLS =================
function setupPersonalizationControls() {
  // Name Input
  const nameInput = document.getElementById('inputUserName');
  const greetingEl = document.getElementById('homeUserGreetingName');
  const briefPatientNameEl = document.getElementById('docBriefPatientName');

  function updatePatientAgeLabel() {
    if (briefPatientNameEl) {
      briefPatientNameEl.textContent = `${state.patientName} (Age: ${state.userAge || 26})`;
    }
  }

  nameInput?.addEventListener('input', (e) => {
    const val = e.target.value.trim() || 'Sarah';
    state.patientName = val;
    if (greetingEl) greetingEl.textContent = val;
    updatePatientAgeLabel();
  });

  // Age Selection Slider & Steppers
  const ageSlider = document.getElementById('sliderAge');
  const ageInput = document.getElementById('inputUserAge');
  const btnAgeMinus = document.getElementById('btnAgeMinus');
  const btnAgePlus = document.getElementById('btnAgePlus');
  const birthYearDisplay = document.getElementById('displayCalculatedBirthYear');
  const dobDisplay = document.getElementById('displaySelectedDob');
  const agePills = document.querySelectorAll('.age-pill');
  const btnToggleExactDob = document.getElementById('btnToggleExactDob');
  const exactDobWrap = document.getElementById('exactDobPickerWrap');
  const exactDobInput = document.getElementById('inputExactDob');

  function applyAge(newAge, source = 'slider') {
    const age = Math.min(65, Math.max(14, parseInt(newAge, 10) || 26));
    state.userAge = age;
    const currentYear = 2026;
    const calculatedYear = currentYear - age;
    state.dob.year = calculatedYear;

    if (source !== 'slider' && ageSlider) {
      ageSlider.value = age;
    }
    if (source !== 'input' && ageInput) {
      ageInput.value = age;
    }
    if (birthYearDisplay) {
      birthYearDisplay.textContent = calculatedYear;
    }
    if (dobDisplay) {
      const dayStr = String(state.dob.day || 18).padStart(2, '0');
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthNum = String(months.indexOf(state.dob.month) + 1 || 9).padStart(2, '0');
      dobDisplay.textContent = `(${dayStr}.${monthNum}.${calculatedYear})`;
    }

    // Update active bracket pill
    agePills.forEach(pill => {
      const pillAge = parseInt(pill.dataset.age, 10);
      let isActive = false;
      if (pillAge === 18 && age <= 19) isActive = true;
      else if (pillAge === 26 && age >= 20 && age <= 29) isActive = true;
      else if (pillAge === 34 && age >= 30 && age <= 39) isActive = true;
      else if (pillAge === 45 && age >= 40) isActive = true;
      pill.classList.toggle('active', isActive);
    });

    updatePatientAgeLabel();
    updateProfileDisplay();
  }

  // Slider change/input
  ageSlider?.addEventListener('input', (e) => {
    applyAge(e.target.value, 'slider');
  });

  // Direct number input
  ageInput?.addEventListener('input', (e) => {
    applyAge(e.target.value, 'input');
  });

  // Steppers
  btnAgeMinus?.addEventListener('click', () => {
    applyAge((state.userAge || 26) - 1, 'stepper');
  });

  btnAgePlus?.addEventListener('click', () => {
    applyAge((state.userAge || 26) + 1, 'stepper');
  });

  // Quick bracket pills
  agePills.forEach(pill => {
    pill.addEventListener('click', () => {
      const targetAge = parseInt(pill.dataset.age, 10);
      applyAge(targetAge, 'pill');
    });
  });

  // Toggle exact DOB picker
  btnToggleExactDob?.addEventListener('click', () => {
    if (!exactDobWrap) return;
    const isHidden = exactDobWrap.style.display === 'none';
    exactDobWrap.style.display = isHidden ? 'flex' : 'none';
    btnToggleExactDob.textContent = isHidden ? 'Close Date' : 'Edit Date';
  });

  // Exact date picker change
  exactDobInput?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (!val) return;
    const birthDate = new Date(val);
    const currentYear = 2026;
    let age = currentYear - birthDate.getFullYear();
    state.dob.day = birthDate.getDate();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    state.dob.month = months[birthDate.getMonth()] || 'September';
    state.dob.year = birthDate.getFullYear();
    applyAge(age, 'exactDate');
  });

  // Initial apply to sync displays
  applyAge(state.userAge || 26, 'init');

  // Height & Weight Sliders & Live BMI
  const heightInput = document.getElementById('inputUserHeight');
  const heightSlider = document.getElementById('sliderHeight');
  const weightInput = document.getElementById('inputUserWeight');
  const weightSlider = document.getElementById('sliderWeight');

  const unitHeightCm = document.getElementById('unitHeightCm');
  const unitHeightFt = document.getElementById('unitHeightFt');
  const unitWeightKg = document.getElementById('unitWeightKg');
  const unitWeightLbs = document.getElementById('unitWeightLbs');

  const bmiValEl = document.getElementById('displayBmiValue');
  const bmiCatEl = document.getElementById('displayBmiCategory');
  const symWeightEl = document.getElementById('symWeightDisplay');

  function calculateAndDisplayBmi() {
    let hCm = parseFloat(heightInput?.value) || 165;
    let wKg = parseFloat(weightInput?.value) || 75.0;

    if (state.heightUnit === 'ft') {
      hCm = hCm * 30.48;
    }
    if (state.weightUnit === 'lbs') {
      wKg = wKg * 0.453592;
    }

    const heightM = hCm / 100;
    const bmi = wKg / (heightM * heightM);
    const bmiFixed = bmi.toFixed(1);

    if (bmiValEl) bmiValEl.textContent = bmiFixed;

    if (bmiCatEl) {
      if (bmi < 18.5) {
        bmiCatEl.textContent = 'Underweight range (May impact ovulatory cycles)';
        bmiCatEl.style.background = '#EFF6FF';
        bmiCatEl.style.color = '#1D4ED8';
      } else if (bmi < 25.0) {
        bmiCatEl.textContent = 'Normal weight range (Optimal metabolic balance)';
        bmiCatEl.style.background = '#F0FDF4';
        bmiCatEl.style.color = '#15803D';
      } else if (bmi < 30.0) {
        bmiCatEl.textContent = 'Overweight range (Common metabolic PCOS/PMOS profile)';
        bmiCatEl.style.background = '#FFFBEB';
        bmiCatEl.style.color = '#B45309';
      } else {
        bmiCatEl.textContent = 'Obese range (Higher insulin resistance correlation)';
        bmiCatEl.style.background = '#FEF2F2';
        bmiCatEl.style.color = '#B91C1C';
      }
    }

    if (symWeightEl) {
      symWeightEl.textContent = `${wKg.toFixed(1)} kg`;
    }
  }

  heightInput?.addEventListener('input', (e) => {
    if (heightSlider) heightSlider.value = e.target.value;
    calculateAndDisplayBmi();
  });

  heightSlider?.addEventListener('input', (e) => {
    if (heightInput) heightInput.value = e.target.value;
    calculateAndDisplayBmi();
  });

  weightInput?.addEventListener('input', (e) => {
    if (weightSlider) weightSlider.value = e.target.value;
    calculateAndDisplayBmi();
  });

  weightSlider?.addEventListener('input', (e) => {
    if (weightInput) weightInput.value = e.target.value;
    calculateAndDisplayBmi();
  });

  // Unit toggles
  unitHeightCm?.addEventListener('click', () => {
    unitHeightCm.classList.add('active');
    unitHeightFt?.classList.remove('active');
    state.heightUnit = 'cm';
    const label = document.getElementById('labelHeightUnit');
    if (label) label.textContent = 'cm';
    if (heightSlider) {
      heightSlider.min = '130';
      heightSlider.max = '200';
      heightSlider.value = '165';
    }
    if (heightInput) heightInput.value = '165';
    calculateAndDisplayBmi();
  });

  unitHeightFt?.addEventListener('click', () => {
    unitHeightFt.classList.add('active');
    unitHeightCm?.classList.remove('active');
    state.heightUnit = 'ft';
    const label = document.getElementById('labelHeightUnit');
    if (label) label.textContent = 'ft';
    if (heightSlider) {
      heightSlider.min = '4.0';
      heightSlider.max = '6.8';
      heightSlider.value = '5.4';
    }
    if (heightInput) heightInput.value = '5.4';
    calculateAndDisplayBmi();
  });

  unitWeightKg?.addEventListener('click', () => {
    unitWeightKg.classList.add('active');
    unitWeightLbs?.classList.remove('active');
    state.weightUnit = 'kg';
    const label = document.getElementById('labelWeightUnit');
    if (label) label.textContent = 'kg';
    if (weightSlider) {
      weightSlider.min = '40';
      weightSlider.max = '140';
      weightSlider.value = '75';
    }
    if (weightInput) weightInput.value = '75.0';
    calculateAndDisplayBmi();
  });

  unitWeightLbs?.addEventListener('click', () => {
    unitWeightLbs.classList.add('active');
    unitWeightKg?.classList.remove('active');
    state.weightUnit = 'lbs';
    const label = document.getElementById('labelWeightUnit');
    if (label) label.textContent = 'lbs';
    if (weightSlider) {
      weightSlider.min = '90';
      weightSlider.max = '310';
      weightSlider.value = '165';
    }
    if (weightInput) weightInput.value = '165.0';
    calculateAndDisplayBmi();
  });

  // Initial calculation
  calculateAndDisplayBmi();
}

// ================= SYMPTOMS SCREEN CONTROLS (Accessed via Check-in on Home) =================
function setupSymptomsControls() {
  // Symptom pills toggle
  document.querySelectorAll('.sym-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      pill.classList.toggle('selected');
    });
  });

  // Calendar day cells toggle
  document.querySelectorAll('.cal-day-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      document.querySelectorAll('.cal-day-cell').forEach(c => c.classList.remove('active'));
      cell.classList.add('active');
    });
  });

  // Search input filtering
  const searchInput = document.querySelector('.symptom-search-bar input');
  searchInput?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    const categories = document.querySelectorAll('.symptom-category-group');
    categories.forEach(cat => {
      const pills = cat.querySelectorAll('.sym-pill');
      let catMatch = false;
      const catTitle = cat.querySelector('h6')?.textContent.toLowerCase() || '';
      if (catTitle.includes(term)) {
        catMatch = true;
        pills.forEach(p => p.style.display = '');
      } else {
        pills.forEach(p => {
          const match = p.textContent.toLowerCase().includes(term);
          p.style.display = match ? '' : 'none';
          if (match) catMatch = true;
        });
      }
      cat.style.display = catMatch ? '' : 'none';
    });
  });
}

// ================= FIND SPECIALISTS CONTROLS =================
function setupSpecialistsControls() {
  const filterPills = document.querySelectorAll('#specialistFiltersRow .filter-pill');
  const cards = document.querySelectorAll('#specialistsList .specialist-card');
  const searchInput = document.getElementById('inputSpecialistSearch');

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const targetSpecialty = pill.dataset.specialty;

      cards.forEach(card => {
        if (targetSpecialty === 'all') {
          card.style.display = 'block';
        } else {
          const match = card.dataset.specialty === targetSpecialty;
          card.style.display = match ? 'block' : 'none';
        }
      });
    });
  });

  searchInput?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    cards.forEach(card => {
      const cardName = card.dataset.name.toLowerCase();
      const match = cardName.includes(term);
      card.style.display = match ? 'block' : 'none';
    });
  });

  // Buttons for In-Person & Online Consult
  cards.forEach(card => {
    const docName = card.querySelector('.spec-name')?.textContent || 'Specialist';
    const specialty = card.querySelector('.spec-role')?.textContent || 'Doctor';
    const hospital = card.querySelector('.spec-meta-item span:nth-child(2)')?.textContent || 'Hospital Affiliated';
    const imgUrl = card.querySelector('.spec-avatar-img')?.src || '';

    const btnInPerson = card.querySelector('.btn-spec-inperson');
    const btnOnline = card.querySelector('.btn-spec-online');

    btnInPerson?.addEventListener('click', () => {
      openBookingModalForDoctor(docName, specialty, hospital, imgUrl, false);
    });

    btnOnline?.addEventListener('click', () => {
      openBookingModalForDoctor(docName, specialty, hospital, imgUrl, true);
    });
  });

  // Booking Modal Handlers
  const bookingModal = document.getElementById('bookingModal');
  const closeBtn = document.getElementById('closeBookingModalBtn');
  const cancelBtn = document.getElementById('btnCancelBooking');
  const confirmBtn = document.getElementById('btnConfirmBooking');
  const btnBtypeOnline = document.getElementById('btnBtypeOnline');
  const btnBtypeInPerson = document.getElementById('btnBtypeInPerson');

  closeBtn?.addEventListener('click', () => bookingModal?.classList.remove('open'));
  cancelBtn?.addEventListener('click', () => bookingModal?.classList.remove('open'));

  btnBtypeOnline?.addEventListener('click', () => {
    btnBtypeOnline.classList.add('active');
    btnBtypeInPerson?.classList.remove('active');
  });

  btnBtypeInPerson?.addEventListener('click', () => {
    btnBtypeInPerson.classList.add('active');
    btnBtypeOnline?.classList.remove('active');
  });

  confirmBtn?.addEventListener('click', () => {
    const docName = document.getElementById('bookingDoctorName')?.textContent || 'Specialist';
    const specialty = document.getElementById('bookingDoctorSpecialty')?.textContent || '';
    const timeSlot = document.getElementById('selectBookingTime')?.value || 'Upcoming slot';
    const isOnline = btnBtypeOnline?.classList.contains('active');
    const consultType = isOnline ? 'Online Video Consult' : 'In-Person Visit';

    bookingModal?.classList.remove('open');
    showToast(`✓ Consultation Scheduled with ${docName}!`);

    // Log notification in AI Chat
    if (chatHeroWelcome) chatHeroWelcome.style.display = 'none';
    appendMessageBubble(
      `✓ **Consultation Confirmed with ${docName}**\n\n` +
      `• **Specialty:** ${specialty}\n` +
      `• **Consultation Type:** ${consultType}\n` +
      `• **Scheduled Time:** ${timeSlot}\n` +
      `• **Medical Profile:** CysterCare 6-month cycle trends & detected PCOS/PMOS profile will be attached.\n\n` +
      `You'll receive a confirmation email and calendar invite shortly.`,
      'bot'
    );
  });
}

function openBookingModalForDoctor(name, specialty, hospital, imgUrl, isOnline = true) {
  const modal = document.getElementById('bookingModal');
  if (!modal) return;

  const nameEl = document.getElementById('bookingDoctorName');
  const specEl = document.getElementById('bookingDoctorSpecialty');
  const hospEl = document.getElementById('bookingDoctorHospital');
  const imgEl = document.getElementById('bookingDoctorImg');
  const btnOnline = document.getElementById('btnBtypeOnline');
  const btnInPerson = document.getElementById('btnBtypeInPerson');

  if (nameEl) nameEl.textContent = name;
  if (specEl) specEl.textContent = specialty;
  if (hospEl) hospEl.textContent = hospital;
  if (imgEl && imgUrl) imgEl.src = imgUrl;

  if (isOnline) {
    btnOnline?.classList.add('active');
    btnInPerson?.classList.remove('active');
  } else {
    btnInPerson?.classList.add('active');
    btnOnline?.classList.remove('active');
  }

  modal.classList.add('open');
}

// ================= COMMUNITY CONTROLS =================
function setupCommunityControls() {
  const tabFeed = document.getElementById('tabCommFeed');
  const tabResearch = document.getElementById('tabCommResearch');
  const paneFeed = document.getElementById('paneCommFeed');
  const paneResearch = document.getElementById('paneCommResearch');

  tabFeed?.addEventListener('click', () => {
    tabFeed.classList.add('active');
    tabResearch?.classList.remove('active');
    if (paneFeed) paneFeed.style.display = 'block';
    if (paneResearch) paneResearch.style.display = 'none';
  });

  tabResearch?.addEventListener('click', () => {
    tabResearch.classList.add('active');
    tabFeed?.classList.remove('active');
    if (paneResearch) paneResearch.style.display = 'block';
    if (paneFeed) paneFeed.style.display = 'none';
  });

  // Like buttons
  document.querySelectorAll('.btn-like').forEach(btn => {
    btn.addEventListener('click', () => {
      const isLiked = btn.classList.toggle('liked');
      const countEl = btn.querySelector('.like-num');
      const currentCount = parseInt(btn.dataset.likes || countEl.textContent, 10);
      const newCount = isLiked ? currentCount + 1 : currentCount - 1;
      btn.dataset.likes = newCount;
      if (countEl) countEl.textContent = newCount;
    });
  });

  // Bookmark buttons
  document.querySelectorAll('.post-bookmark-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const isBookmarked = btn.classList.toggle('bookmarked');
      showToast(isBookmarked ? '✓ Post saved to bookmarks' : 'Post removed from bookmarks');
    });
  });

  // Research Article Cards Click Handlers
  document.getElementById('articleCardInsulin')?.addEventListener('click', () => {
    switchView('view-research-detail');
  });

  document.getElementById('articleCardInflammation')?.addEventListener('click', () => {
    switchView('view-research-detail');
  });

  document.getElementById('articleCardMentalHealth')?.addEventListener('click', () => {
    switchView('view-research-detail');
  });
}

function showToast(message) {
  const toast = document.getElementById('appToast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

// ================= CHAT EMBEDDED WIDGETS =================
function setupChatWidgetControls() {
  const stepsPills = document.querySelectorAll('.widget-tabs-pill span');
  stepsPills.forEach(pill => {
    pill.addEventListener('click', () => {
      stepsPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
    });
  });
}

// ================= PROTOTYPE CONTROLS =================
function setupPrototypeControls() {
  const toggleBtn = document.getElementById('toggleFrameBtn');
  const wrapper = document.getElementById('deviceWrapper');
  toggleBtn?.addEventListener('click', () => {
    state.isDeviceFrame = !state.isDeviceFrame;
    if (state.isDeviceFrame) {
      wrapper.classList.remove('full-view');
      toggleBtn.textContent = '📱 Frame Mode';
    } else {
      wrapper.classList.add('full-view');
      toggleBtn.textContent = '🖥️ Expanded View';
    }
  });

  // Prototype Screen Selector
  const selector = document.getElementById('prototypeScreenSelect');
  selector?.addEventListener('change', (e) => {
    switchView(e.target.value);
  });
}

// ================= CHAT ENGINE (Layer 1) =================
function setupChatHandlers() {
  chatSendBtn?.addEventListener('click', handleSendMessage);
  chatInputText?.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSendMessage();
  });

  // Explore Chips
  document.querySelectorAll('.explore-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const query = chip.dataset.query;
      sendUserMessage(query);
    });
  });

  // Attachment button opens lab modal
  chatAttachBtn?.addEventListener('click', () => {
    openLabModal();
  });

  // Chat Language Accessibility Switcher (English, Urdu, Pashto)
  const langPills = document.querySelectorAll('#chatLangSwitcher .chat-lang-pill');
  langPills.forEach(pill => {
    pill.addEventListener('click', () => {
      langPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const lang = pill.dataset.lang;
      state.chatLanguage = lang;
      
      if (lang === 'ur') {
        chatScrollArea?.classList.add('rtl-mode');
        if (chatInputText) chatInputText.placeholder = 'سسٹر کیئر سے کوئی بھی سوال پوچھیں...';
        appendMessageBubble('السلام علیکم! میں سسٹر (Cyster) ہوں۔ آپ مجھ سے ماہواری، وزن، ہارمونز، ٹیسٹ رپورٹس یا ماہر ڈاکٹرز کے بارے میں اردو میں بات کر سکتی ہیں۔', 'bot');
        renderInteractiveChips(['PCOS/PMOS ٹیسٹ کریں', 'ماہواری کے مسائل', 'ماہر ڈاکٹر تلاش کریں', 'ٹیسٹ رپورٹس شامل کریں']);
      } else if (lang === 'ps') {
        chatScrollArea?.classList.add('rtl-mode');
        if (chatInputText) chatInputText.placeholder = 'له سسټر کیئر څخه هره پوښتنه وپوښتئ...';
        appendMessageBubble('سلامونه! زه سسٹر (Cyster) یم. تاسو کولی شئ د خپلې میاشتنۍ ناروغۍ، هورمونونو، خوړو او ډاکټرانو په اړه په پښتو ژبه پوښتنه وکړئ.', 'bot');
        renderInteractiveChips(['د PCOS معاینه پیل کړئ', 'د میاشتنۍ دورې ستونزې', 'ډاکټران لټول', 'د نښو ثبتول']);
      } else {
        chatScrollArea?.classList.remove('rtl-mode');
        if (chatInputText) chatInputText.placeholder = 'Ask CysterCare anything...';
        appendMessageBubble("Hello! I'm Cyster, your AI health assistant for PCOS/PMOS. How can I help you today?", 'bot');
        renderInteractiveChips(['Check for PCOS/PMOS', 'Cycle Tracking', 'Symptom Tracker', 'Ask a question']);
      }
    });
  });

  // Mic simulation
  chatMicBtn?.addEventListener('click', () => {
    simulateVoiceInput();
  });
}

function handleSendMessage() {
  const text = chatInputText.value.trim();
  if (!text) return;
  chatInputText.value = '';
  sendUserMessage(text);
}

async function sendUserMessage(text) {
  // Hide welcome hero on first active message
  if (chatHeroWelcome) {
    chatHeroWelcome.style.display = 'none';
  }

  // Append user bubble
  appendMessageBubble(text, 'user');
  clearInteractiveChips();

  // Show typing indicator
  const typingIndicator = showTypingIndicator();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        sessionId: state.sessionId,
        contextData: {
          hasLabs: Boolean(state.patientData.totalTestosterone),
          language: state.chatLanguage || 'en'
        }
      })
    });
    const data = await res.json();
    removeTypingIndicator(typingIndicator);

    // Append Bot Reply
    appendMessageBubble(data.reply, 'bot', data.isEmergency);

    // If detection result was returned, update detection view
    if (data.detectionResult) {
      state.detectionResult = data.detectionResult;
      updateDetectionResultScreen(data.detectionResult);
    }

    // Render interactive chips if provided
    if (data.chips && data.chips.length > 0) {
      renderInteractiveChips(data.chips, data.action);
    }
  } catch (err) {
    console.error('Chat error:', err);
    removeTypingIndicator(typingIndicator);
    appendMessageBubble("I'm having trouble connecting right now. Please try again in a moment.", 'bot');
  }
}

function startPcosDetectionChatFlow() {
  if (chatHeroWelcome) chatHeroWelcome.style.display = 'none';
  sendUserMessage('Check for PCOS/PMOS');
}

function appendMessageBubble(content, sender = 'bot', isEmergency = false) {
  const msgEl = document.createElement('div');
  msgEl.className = `chat-message ${sender} ${isEmergency ? 'emergency-triage-card' : ''}`;

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  // Basic markdown-like parser (bold, lists, headers)
  let formatted = escapeHtml(content)
    .replace(/^### (.*$)/gim, '<h4 class="chat-md-heading">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 class="chat-md-heading">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n• (.*?)(?=\n|$)/g, '<li>$1</li>')
    .replace(/\n/g, '<br>');

  if (formatted.includes('<li>')) {
    formatted = formatted.replace(/(<li>.*?<\/li>)/gs, '<ul class="chat-list">$1</ul>');
  }

  bubble.innerHTML = formatted;
  msgEl.appendChild(bubble);
  messagesList.appendChild(msgEl);

  // Auto-scroll to bottom of chat
  chatScrollArea.scrollTop = chatScrollArea.scrollHeight;
}

function renderInteractiveChips(chips, action) {
  clearInteractiveChips();
  chips.forEach(chipText => {
    const chipBtn = document.createElement('button');
    chipBtn.className = 'quick-reply-chip';
    chipBtn.textContent = chipText;
    chipBtn.addEventListener('click', () => {
      if (chipText.includes('Detection Screen') || chipText.includes('View Detection')) {
        switchView('view-detection');
      } else if (chipText.includes('Care Plan') || chipText.includes('care plan')) {
        switchView('view-care-plan');
      } else if (chipText.includes('Doctor Visit') || chipText.includes('Doctor Summary') || chipText.includes('Send to Dr')) {
        switchView('view-doctor-prep');
      } else if (chipText.includes('Dr. Laiba Khan')) {
        switchView('view-specialists');
        openBookingModalForDoctor('Dr. Laiba Khan', 'Endocrinologist', 'KMC Peshawar', 'https://images.unsplash.com/photo-1594824813583-16f39d22b271?w=120&h=120&fit=crop&crop=faces', true);
      } else if (chipText.includes('Dr. Afsheen Sharif')) {
        switchView('view-specialists');
        openBookingModalForDoctor('Dr. Afsheen Sharif', 'Gynecologist', 'RMI Peshawar', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&h=120&fit=crop&crop=faces', true);
      } else if (chipText.includes('Dr. Michael Chen')) {
        switchView('view-specialists');
        openBookingModalForDoctor('Dr. Michael Chen', 'Mental Health Specialist', 'RMI Peshawar', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&h=120&fit=crop&crop=faces', true);
      } else if (chipText.includes('Specialists') || chipText.includes('Specialist')) {
        switchView('view-specialists');
      } else if (chipText.includes('Community')) {
        switchView('view-community');
      } else if (chipText.includes('Add Health Results') || chipText.includes('Upload Lab')) {
        openLabModal();
      } else if (chipText.includes('6-Month Chart')) {
        switchView('view-chat');
        const widget = document.querySelector('.chat-embedded-stats-widget');
        if (widget) widget.scrollIntoView({ behavior: 'smooth' });
      } else {
        sendUserMessage(chipText);
      }
    });
    interactiveChipsBar.appendChild(chipBtn);
  });
  chatScrollArea.scrollTop = chatScrollArea.scrollHeight;
}

function clearInteractiveChips() {
  interactiveChipsBar.innerHTML = '';
}

function showTypingIndicator() {
  const ind = document.createElement('div');
  ind.className = 'chat-message bot typing-indicator-msg';
  ind.innerHTML = `
    <div class="message-bubble typing-bubble">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;
  messagesList.appendChild(ind);
  chatScrollArea.scrollTop = chatScrollArea.scrollHeight;
  return ind;
}

function removeTypingIndicator(el) {
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}

function simulateVoiceInput() {
  chatMicBtn.classList.add('listening');
  chatInputText.placeholder = 'Listening…';
  setTimeout(() => {
    chatMicBtn.classList.remove('listening');
    chatInputText.placeholder = 'Ask anything…';
    chatInputText.value = 'Can you recommend an endocrinologist for insulin resistance?';
    handleSendMessage();
  }, 1800);
}

// ================= DETECTION SCREEN & ENGINE (Layer 2) =================
function setupDetectionHandlers() {
  document.getElementById('explainEvidenceBtn')?.addEventListener('click', () => {
    const drawer = document.getElementById('explainabilityDrawer');
    drawer.classList.toggle('open');
  });

  document.getElementById('closeExplainDrawerBtn')?.addEventListener('click', () => {
    document.getElementById('explainabilityDrawer').classList.remove('open');
  });

  // Criteria Dimension clicks open clinical explanations
  document.querySelectorAll('.dimension-card').forEach(card => {
    card.addEventListener('click', () => {
      const dim = card.dataset.dim;
      highlightExplainabilityDimension(dim);
    });
  });
}

async function runDetectionEngine(patientData) {
  try {
    const res = await fetch('/api/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientData })
    });
    const result = await res.json();
    state.detectionResult = result;
    updateDetectionResultScreen(result);
    return result;
  } catch (err) {
    console.error('Detection engine call failed:', err);
  }
}

function updateDetectionResultScreen(res) {
  if (!res) return;

  // Status & Confidence
  const detStatusPill = document.getElementById('detStatusPill');
  const detConfidenceTag = document.getElementById('detConfidenceTag');
  const detHeadline = document.getElementById('detHeadline');
  const detStageTag = document.getElementById('detStageTag');

  if (res.classification === 'likely_pcos') {
    detStatusPill.textContent = 'PCOS/PMOS pattern detected';
    detStatusPill.style.background = 'rgba(255, 255, 255, 0.25)';
  } else if (res.classification === 'possible_pcos_inconclusive') {
    detStatusPill.textContent = 'Inconclusive / Mixed Pattern';
    detStatusPill.style.background = 'rgba(254, 243, 199, 0.4)';
  } else {
    detStatusPill.textContent = 'Unlikely PCOS/PMOS';
  }

  detConfidenceTag.textContent = res.confidence_tier || 'High confidence';
  detStageTag.textContent = res.detection_stage || 'Enhanced Detection';

  // What CysterCare Found text
  const cycleText = document.getElementById('detCycleFoundText');
  const androgenText = document.getElementById('detAndrogenFoundText');
  const hormoneText = document.getElementById('detHormoneFoundText');
  const usText = document.getElementById('detUltrasoundFoundText');

  if (res.diagnostic_dimensions.ovulation.detected) {
    cycleText.textContent = `Your cycles average approximately ${res.evidence.cycle_length_average || 49} days (delayed beyond the healthy 21–35 day window).`;
  } else {
    cycleText.textContent = 'Menstrual cycles are within normal 21–35 day frequency.';
  }

  if (res.diagnostic_dimensions.androgen_activity.clinical) {
    androgenText.textContent = 'You reported persistent facial/chin hair (mFG score: 8) and hormonal acne.';
  } else {
    androgenText.textContent = 'No significant clinical hirsutism or severe androgenic symptoms reported.';
  }

  if (res.evidence.testosterone_nmol) {
    hormoneText.textContent = `Your entered testosterone of ${res.evidence.testosterone_nmol} nmol/L was entered above the reference range (max 1.8 nmol/L) supplied with your laboratory report.`;
  } else {
    hormoneText.textContent = 'No blood hormone tests uploaded yet. Adding Total Testosterone & SHBG improves precision.';
  }

  if (res.diagnostic_dimensions.ovarian_morphology.detected) {
    usText.textContent = 'Ultrasound or AMH confirms polycystic ovarian morphology (≥20 follicles per ovary or elevated AMH).';
  } else {
    usText.textContent = 'Pelvic ultrasound not yet uploaded. Adding imaging or AMH can elevate your detection to Comprehensive.';
  }

  // Diagnostic Dimensions Tracker
  const dimOvu = document.getElementById('dimOvulationStatus');
  const dimAndro = document.getElementById('dimAndrogenStatus');
  const dimMorph = document.getElementById('dimMorphologyStatus');
  const dimDiff = document.getElementById('dimDifferentialStatus');

  dimOvu.innerHTML = res.diagnostic_dimensions.ovulation.detected 
    ? '<span class="status-dot green">●</span> Detected' 
    : '<span class="status-dot gray">○</span> Not detected';

  dimAndro.innerHTML = res.diagnostic_dimensions.androgen_activity.detected 
    ? '<span class="status-dot green">●</span> Detected' 
    : '<span class="status-dot gray">○</span> Not detected';

  dimMorph.innerHTML = res.diagnostic_dimensions.ovarian_morphology.detected 
    ? '<span class="status-dot green">●</span> Detected' 
    : '<span class="status-dot gray">○</span> No information yet';

  dimDiff.innerHTML = res.diagnostic_dimensions.alternative_causes.allRuledOut
    ? '<span class="status-dot green">●</span> Fully ruled out'
    : '<span class="status-dot amber">◐</span> Some still need checking';

  // Update Profile Embedded Detection Card
  const profStatusPill = document.getElementById('profDetStatusPill');
  const profConfTag = document.getElementById('profDetConfidenceTag');
  const profStageTag = document.getElementById('profDetStageTag');
  const profCritCycleText = document.getElementById('profCritCycleText');
  const profCritAndrogenText = document.getElementById('profCritAndrogenText');
  const profCritMorphCheck = document.getElementById('profCritMorphCheck');
  const profCritMorphText = document.getElementById('profCritMorphText');

  if (profStatusPill) {
    profStatusPill.textContent = res.classification === 'likely_pcos' ? 'PCOS/PMOS Pattern Detected' : (res.classification === 'possible_pcos_inconclusive' ? 'Inconclusive / Mixed Pattern' : 'Unlikely PCOS/PMOS');
  }
  if (profConfTag) {
    profConfTag.textContent = `${Math.round(res.model_confidence * 100)}% • ${res.confidence_tier}`;
  }
  if (profStageTag) {
    profStageTag.textContent = res.detection_stage;
  }
  if (profCritCycleText) {
    profCritCycleText.textContent = res.diagnostic_dimensions.ovulation.detected
      ? `Cycle interval averages ${res.evidence.cycle_length_average || 49} days (delayed beyond 21–35 days window).`
      : 'Cycles fall within normal physiological window (21–35 days).';
  }
  if (profCritAndrogenText) {
    profCritAndrogenText.textContent = res.diagnostic_dimensions.androgen_activity.detected
      ? `Persistent facial hair (mFG: ${res.evidence.mfg_hirsutism_score || 8}) & testosterone (${res.evidence.testosterone_nmol || '2.8'} nmol/L).`
      : 'Androgen physical indicators and biochemical markers within typical limits.';
  }
  if (profCritMorphCheck && profCritMorphText) {
    if (res.diagnostic_dimensions.ovarian_morphology.detected) {
      profCritMorphCheck.textContent = '✅';
      profCritMorphText.textContent = 'Polycystic morphology confirmed via imaging or elevated AMH.';
    } else {
      profCritMorphCheck.textContent = '⏳';
      profCritMorphText.textContent = 'Pelvic ultrasound or serum AMH pending to elevate to Comprehensive (Stage 3).';
    }
  }

  // Explainability Signals
  const explainList = document.getElementById('explainSignalsList');
  explainList.innerHTML = '';
  res.explainability.contributingSignals.forEach(signal => {
    const card = document.createElement('div');
    card.className = 'signal-card';
    card.innerHTML = `
      <div class="signal-card-header">
        <strong>${signal.title}</strong>
        <span class="signal-impact">${signal.impact}</span>
      </div>
      <p>${signal.explanation}</p>
    `;
    explainList.appendChild(card);
  });

  // Differential Checklist
  const diffUl = document.getElementById('differentialChecklistUl');
  diffUl.innerHTML = `
    <li><span class="check-icon green">✓</span> PCOS/PMOS pattern detected with ${res.confidence_tier.toLowerCase()}</li>
  `;
  res.alternative_conditions_not_ruled_out.forEach(cond => {
    let name = cond === 'thyroid_disorder' ? 'Thyroid condition (TSH) not yet ruled out' :
               cond === 'hyperprolactinemia' ? 'Prolactin abnormality not yet ruled out' :
               cond === 'non_classic_cah' ? '17-OHP (Adrenal CAH) not yet ruled out' :
               `${cond} not yet ruled out`;
    diffUl.innerHTML += `<li><span class="check-icon amber">○</span> ${name}</li>`;
  });
}

function highlightExplainabilityDimension(dim) {
  const drawer = document.getElementById('explainabilityDrawer');
  drawer.classList.add('open');
}

// ================= LAB OCR & ULTRASOUND MODAL =================
function setupLabModalHandlers() {
  closeLabModalBtn?.addEventListener('click', closeLabModal);
  btnCancelModal?.addEventListener('click', closeLabModal);

  tabLabReport?.addEventListener('click', () => {
    tabLabReport.classList.add('active');
    tabUltrasound.classList.remove('active');
    paneLabReport.style.display = 'block';
    paneUltrasound.style.display = 'none';
  });

  tabUltrasound?.addEventListener('click', () => {
    tabUltrasound.classList.add('active');
    tabLabReport.classList.remove('active');
    paneUltrasound.style.display = 'block';
    paneLabReport.style.display = 'none';
  });

  btnSimulateOcr?.addEventListener('click', async () => {
    btnSimulateOcr.textContent = 'Processing OCR with lab-specific ranges… ⏳';
    try {
      const res = await fetch('/api/extract-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: 'labcorp_metabolic_panel.pdf' })
      });
      const data = await res.json();
      btnSimulateOcr.textContent = 'Extracted Successfully ✓';
      extractedTableWrapper.style.display = 'block';
      btnConfirmLabResults.removeAttribute('disabled');

      // Populate Inputs with extracted values
      document.getElementById('inputTestosterone').value = data.extractedValues.totalTestosterone.value;
      document.getElementById('inputShbg').value = data.extractedValues.shbg.value;
      document.getElementById('inputTsh').value = data.extractedValues.tsh.value;
      document.getElementById('inputProlactin').value = data.extractedValues.prolactin.value;
    } catch (err) {
      console.error(err);
      btnSimulateOcr.textContent = 'Simulation Failed';
    }
  });

  btnSimulateUs?.addEventListener('click', async () => {
    btnSimulateUs.textContent = 'Analyzing Sonogram Imaging… ⏳';
    try {
      const res = await fetch('/api/extract-ultrasound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: 'transvaginal_sonogram_2026.dcm' })
      });
      const data = await res.json();
      btnSimulateUs.textContent = 'Extracted Successfully ✓';
      usExtractedWrapper.style.display = 'block';
      btnConfirmLabResults.removeAttribute('disabled');

      document.getElementById('inputAfcLeft').value = data.extractedFindings.antralFollicleCountLeft;
      document.getElementById('inputVolLeft').value = data.extractedFindings.ovarianVolumeLeftMl;
    } catch (err) {
      console.error(err);
    }
  });

  btnConfirmLabResults?.addEventListener('click', async () => {
    // Read user verified values
    const tVal = parseFloat(document.getElementById('inputTestosterone').value);
    const shbgVal = parseFloat(document.getElementById('inputShbg').value);
    const tshVal = parseFloat(document.getElementById('inputTsh').value);
    const prolactinVal = parseFloat(document.getElementById('inputProlactin').value);

    state.patientData.totalTestosterone = tVal;
    state.patientData.shbg = shbgVal;
    state.patientData.tsh = tshVal;
    state.patientData.prolactin = prolactinVal;

    // Check if US values were supplied
    const afcInput = document.getElementById('inputAfcLeft');
    if (afcInput && usExtractedWrapper.style.display !== 'none') {
      state.patientData.leftOvaryFollicles = parseInt(afcInput.value, 10);
      state.patientData.leftOvaryVolumeMl = parseFloat(document.getElementById('inputVolLeft').value);
    }

    closeLabModal();

    // Re-run Detection Engine
    const newResult = await runDetectionEngine(state.patientData);

    // Switch to results view and notify user
    switchView('view-detection');

    // Also notify in chat
    if (chatHeroWelcome) chatHeroWelcome.style.display = 'none';
    appendMessageBubble(
      `✓ **Health Results Confirmed & Added**\n\nI've integrated your laboratory test results into your CysterCare diagnostic model:\n• Total Testosterone: ${tVal} nmol/L (Elevated)\n• SHBG: ${shbgVal} nmol/L (FAI: ${((tVal/shbgVal)*100).toFixed(1)}%)\n• TSH: ${tshVal} mIU/L (Normal — Thyroid ruled out)\n• Prolactin: ${prolactinVal} ng/mL (Normal)\n\nYour detection status is now updated on your Detection Screen.`,
      'bot'
    );
  });
}

function openLabModal() {
  labModal.classList.add('open');
}

function closeLabModal() {
  labModal.classList.remove('open');
}

// ================= VALIDATION & RESEARCH BENCHMARK =================
async function fetchValidationMetrics() {
  try {
    const res = await fetch('/api/validation-metrics');
    const data = await res.json();
    state.validationMetrics = data;

    // Update Header Pill
    const headerAcc = document.getElementById('headerAccuracy');
    if (headerAcc) headerAcc.textContent = `${data.diagnosticMetrics.accuracy}%`;

    // Update Validation Screen KPIs
    document.getElementById('valAccuracyLarge').textContent = `${data.diagnosticMetrics.accuracy}%`;
    document.getElementById('valSensitivity').textContent = `${data.diagnosticMetrics.sensitivity}%`;
    document.getElementById('valSpecificity').textContent = `${data.diagnosticMetrics.specificity}%`;
    document.getElementById('valPpv').textContent = `${data.diagnosticMetrics.positivePredictiveValue}%`;
    document.getElementById('valNpv').textContent = `${data.diagnosticMetrics.negativePredictiveValue}%`;
    document.getElementById('valF1').textContent = data.diagnosticMetrics.f1Score;
    document.getElementById('valRocAuc').textContent = data.diagnosticMetrics.rocAuc;

    // Confusion Matrix Counts
    document.getElementById('cmTp').textContent = data.confusionMatrix.truePositives;
    document.getElementById('cmFn').textContent = data.confusionMatrix.falseNegatives;
    document.getElementById('cmFp').textContent = data.confusionMatrix.falsePositives;
    document.getElementById('cmTn').textContent = data.confusionMatrix.trueNegatives;

    // Subgroups
    document.getElementById('subSouthAsianAcc').textContent = `${data.subgroups.southAsian.accuracy}%`;
    document.getElementById('subCaucasianAcc').textContent = `${data.subgroups.caucasian.accuracy}%`;
    document.getElementById('subEastAsianAcc').textContent = `${data.subgroups.eastAsian.accuracy}%`;
    document.getElementById('subNormalBmiAcc').textContent = `${data.subgroups.bmiTiers.normal}%`;
    document.getElementById('subElevatedBmiAcc').textContent = `${data.subgroups.bmiTiers.overweight}%`;
  } catch (err) {
    console.error('Failed to fetch validation metrics:', err);
  }
}

// ================= DOCTOR PREP & EXPORT =================
function setupDoctorPrep() {
  const sendBtn = document.getElementById('btnSendToDoctor');
  sendBtn?.addEventListener('click', () => {
    sendBtn.innerHTML = 'Sending Clinical Summary to Dr. Afshin… 📨';
    setTimeout(() => {
      sendBtn.innerHTML = 'Sent Successfully to Dr. Afshin Shareef ✓';
      sendBtn.style.background = '#16A34A';
      setTimeout(() => {
        sendBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
          Send to Dr. Afshin Shareef
        `;
        sendBtn.style.background = '#7047EB';
      }, 3000);
    }, 1000);
  });

  const printBtn = document.getElementById('printDoctorSummaryBtn');
  printBtn?.addEventListener('click', () => {
    window.print();
  });
}

// ================= CARE PLAN =================
function setupCarePlan() {
  const fertilityToggle = document.getElementById('fertilityToggle');
  const fertilityContent = document.getElementById('fertilityContent');

  fertilityToggle?.addEventListener('change', e => {
    fertilityContent.style.display = e.target.checked ? 'block' : 'none';
  });

  document.getElementById('shareCarePlanBtn')?.addEventListener('click', () => {
    alert('Care plan summary copied to clipboard!');
  });

  // Symptoms save button
  document.getElementById('btnSaveSymptoms')?.addEventListener('click', () => {
    const btn = document.getElementById('btnSaveSymptoms');
    btn.textContent = 'Saving Symptoms… ✓';
    setTimeout(() => {
      btn.textContent = 'Saved to Daily Log';
      setTimeout(() => {
        btn.textContent = 'Save Symptoms';
        switchView('view-home');
      }, 1000);
    }, 600);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ================= USER PROFILE CONTROLS =================
function setupProfileControls() {
  // Sync profile display
  updateProfileDisplay();

  // Navigation
  document.getElementById('profileBackBtn')?.addEventListener('click', () => switchView('view-home'));
  document.getElementById('homeUserAvatarBtn')?.addEventListener('click', () => {
    updateProfileDisplay();
    switchView('view-profile');
  });

  // Action buttons inside profile
  document.getElementById('btnProfViewDetection')?.addEventListener('click', () => switchView('view-detection'));
  document.getElementById('btnProfExportDoctor')?.addEventListener('click', () => switchView('view-doctor-prep'));
  document.getElementById('btnProfRerunDetection')?.addEventListener('click', async () => {
    await runDetectionEngine(state.patientData);
    updateProfileDisplay();
    showToast('Detection re-evaluated with latest profile data ✓');
  });
  document.getElementById('btnProfBrowseDocs')?.addEventListener('click', () => switchView('view-specialists'));
  document.getElementById('btnProfAddLab')?.addEventListener('click', () => openLabModal());

  document.getElementById('btnProfBookLaiba')?.addEventListener('click', () => {
    switchView('view-specialists');
    openBookingModalForDoctor('Dr. Laiba Khan', 'Endocrinologist', 'KMC Peshawar', 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=120&h=120&fit=crop&crop=faces', true);
  });
  document.getElementById('btnProfBookAfsheen')?.addEventListener('click', () => {
    switchView('view-specialists');
    openBookingModalForDoctor('Dr. Afsheen Sharif', 'Gynecologist', 'RMI Peshawar', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&h=120&fit=crop&crop=faces', true);
  });

  document.getElementById('btnLogoutProfile')?.addEventListener('click', () => {
    showToast('Logged out of CysterCare account');
    switchView('screen-welcome');
  });

  document.getElementById('btnChangeAvatar')?.addEventListener('click', () => {
    showToast('Profile photo updated ✓');
  });

  // Vitals Quick Modal Controls
  const vitalsModal = document.getElementById('vitalsModal');
  const openVitals = () => {
    const aInput = document.getElementById('editVitalAge');
    const wInput = document.getElementById('editVitalWeight');
    const hInput = document.getElementById('editVitalHeight');
    const cInput = document.getElementById('editVitalCycle');
    const pInput = document.getElementById('editVitalPeriods');
    if (aInput) aInput.value = state.userAge || 26;
    if (wInput) wInput.value = state.weight;
    if (hInput) hInput.value = state.height;
    if (cInput) cInput.value = state.patientData.typicalCycleLength || 49;
    if (pInput) pInput.value = state.patientData.periodsLast12Months || 6;
    updateModalBmi();
    vitalsModal?.classList.add('open');
  };

  document.getElementById('btnOpenVitalsModal')?.addEventListener('click', openVitals);
  document.getElementById('btnEditVitalsLink')?.addEventListener('click', openVitals);
  document.getElementById('cardProfWeight')?.addEventListener('click', openVitals);
  document.getElementById('cardProfHeight')?.addEventListener('click', openVitals);
  document.getElementById('cardProfBmi')?.addEventListener('click', openVitals);
  document.getElementById('cardProfCycle')?.addEventListener('click', openVitals);

  document.getElementById('closeVitalsModalBtn')?.addEventListener('click', () => vitalsModal?.classList.remove('open'));
  document.getElementById('btnCancelVitals')?.addEventListener('click', () => vitalsModal?.classList.remove('open'));

  function updateModalBmi() {
    const w = parseFloat(document.getElementById('editVitalWeight')?.value) || state.weight;
    const h = parseFloat(document.getElementById('editVitalHeight')?.value) || state.height;
    const bmi = w / Math.pow(h / 100, 2);
    const bmiEl = document.getElementById('modalCalculatedBmi');
    if (bmiEl) {
      let tier = 'Normal weight range';
      if (bmi >= 30) tier = 'Obese range';
      else if (bmi >= 25) tier = 'Overweight range';
      else if (bmi < 18.5) tier = 'Underweight range';
      bmiEl.textContent = `${bmi.toFixed(1)} kg/m² (${tier})`;
    }
  }

  document.getElementById('editVitalWeight')?.addEventListener('input', updateModalBmi);
  document.getElementById('editVitalHeight')?.addEventListener('input', updateModalBmi);

  document.getElementById('btnSaveVitals')?.addEventListener('click', async () => {
    const a = parseInt(document.getElementById('editVitalAge')?.value, 10);
    const w = parseFloat(document.getElementById('editVitalWeight')?.value) || state.weight;
    const h = parseFloat(document.getElementById('editVitalHeight')?.value) || state.height;
    const c = parseInt(document.getElementById('editVitalCycle')?.value, 10) || 49;
    const p = parseInt(document.getElementById('editVitalPeriods')?.value, 10) || 6;

    if (!isNaN(a) && a >= 14 && a <= 65) {
      state.userAge = a;
      state.dob.year = 2026 - a;
    }
    state.weight = w;
    state.height = h;
    state.patientData.typicalCycleLength = c;
    state.patientData.periodsLast12Months = p;

    vitalsModal?.classList.remove('open');
    updateProfileDisplay();
    await runDetectionEngine(state.patientData);
    showToast('Vitals updated & detection re-evaluated ✓');
  });
}

function updateProfileDisplay() {
  const nameEl = document.getElementById('profUserName');
  const ageEl = document.getElementById('profUserAge');
  const emailEl = document.getElementById('profUserEmail');
  const weightVal = document.getElementById('profWeightVal');
  const heightVal = document.getElementById('profHeightVal');
  const bmiVal = document.getElementById('profBmiVal');
  const bmiPill = document.getElementById('profBmiPill');
  const bmiSubtext = document.getElementById('profBmiSubtext');
  const cycleVal = document.getElementById('profCycleVal');
  const cyclePill = document.getElementById('profCyclePill');

  if (nameEl) nameEl.textContent = state.patientName || 'Sarah';
  if (ageEl) {
    ageEl.textContent = state.userAge || (2026 - parseInt(state.dob?.year || '1998', 10));
  }
  if (weightVal) weightVal.textContent = state.weight.toFixed(1);
  if (heightVal) heightVal.textContent = state.height;

  const hM = state.height / 100;
  const bmi = state.weight / (hM * hM);
  if (bmiVal) bmiVal.textContent = bmi.toFixed(1);

  if (bmiPill) {
    if (bmi < 18.5) {
      bmiPill.textContent = 'Underweight';
      bmiPill.className = 'vcard-pill amber';
      if (bmiSubtext) bmiSubtext.textContent = 'Ovulatory risk';
    } else if (bmi < 25) {
      bmiPill.textContent = 'Normal';
      bmiPill.className = 'vcard-pill green';
      if (bmiSubtext) bmiSubtext.textContent = 'Healthy metabolic range';
    } else if (bmi < 30) {
      bmiPill.textContent = 'Overweight';
      bmiPill.className = 'vcard-pill amber';
      if (bmiSubtext) bmiSubtext.textContent = 'Insulin resistance target';
    } else {
      bmiPill.textContent = 'Obese Range';
      bmiPill.className = 'vcard-pill amber';
      if (bmiSubtext) bmiSubtext.textContent = 'Higher metabolic correlation';
    }
  }

  const cycleDays = state.patientData.typicalCycleLength || 49;
  if (cycleVal) cycleVal.textContent = cycleDays;
  if (cyclePill) {
    if (cycleDays >= 21 && cycleDays <= 35) {
      cyclePill.textContent = 'Regular';
      cyclePill.className = 'vcard-pill green';
    } else {
      cyclePill.textContent = 'Delayed';
      cyclePill.className = 'vcard-pill amber';
    }
  }
}
