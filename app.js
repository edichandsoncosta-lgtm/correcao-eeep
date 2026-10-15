(() => {
  const STORAGE_KEY = 'eeep-correcao-provas-v1';
  const OPTIONS = ['', 'A', 'B', 'C', 'D', 'E'];
  const DEFAULT_COUNT = 10;
  const EXAM_TYPES = [
    'Avaliação Global',
    'Avaliação Parcial',
    'Simulado ENEM',
    'Simulado SPAECE',
    'Simulado'
  ];
  const KNOWLEDGE_AREAS = [
    'Linguagens e suas Tecnologias',
    'Matemática e suas Tecnologias',
    'Ciências da Natureza e suas Tecnologias',
    'Ciências Humanas e Sociais Aplicadas',
    'Formação Técnica e Profissional (Base Técnica)'
  ];
  const $ = (selector) => document.querySelector(selector);
  const elements = {
    loginScreen: $('#login-screen'),
    adminLoginScreen: $('#admin-login-screen'),
    appShell: $('#app-shell'),
    adminShell: $('#admin-shell'),
    loginForm: $('#login-form'),
    loginEmail: $('#login-email'),
    loginPassword: $('#login-password'),
    loginSubmit: $('#login-submit'),
    authMessage: $('#auth-message'),
    adminLoginForm: $('#admin-login-form'),
    adminLoginEmail: $('#admin-login-email'),
    adminLoginPassword: $('#admin-login-password'),
    adminLoginSubmit: $('#admin-login-submit'),
    adminAuthMessage: $('#admin-auth-message'),
    adminUserEmail: $('#admin-user-email'),
    adminSignoutButton: $('#admin-signout-button'),
    openAdminLogin: $('#open-admin-login'),
    openTeacherLogin: $('#open-teacher-login'),
    adminAccessButton: $('#admin-access-button'),
    userEmail: $('#user-email'),
    signoutButton: $('#signout-button'),
    examName: $('#exam-name'),
    examArea: $('#exam-area'),
    examDiscipline: $('#exam-discipline'),
    examClass: $('#exam-class'),
    teacherStudentForm: $('#teacher-student-form'),
    teacherStudentName: $('#teacher-student-name'),
    teacherStudentSeries: $('#teacher-student-series'),
    teacherStudentClass: $('#teacher-student-class'),
    teacherStudentsBody: $('#teacher-students-body'),
    teacherStudentsEmpty: $('#teacher-students-empty'),
    printStudentCards: $('#print-student-cards'),
    cardPreviewStudent: $('#card-preview-student'),
    previewStudentName: $('#preview-student-name'),
    previewStudentSeries: $('#preview-student-series'),
    previewStudentClass: $('#preview-student-class'),
    previewExamName: $('#preview-exam-name'),
    previewExamDiscipline: $('#preview-exam-discipline'),
    previewAnswerGrid: $('#preview-answer-grid'),
    answerKeyPreview: $('#answer-key-preview'),
    questionCount: $('#question-count'),
    savedKeySelect: $('#saved-key-select'),
    newKey: $('#new-key'),
    deleteKey: $('#delete-key'),
    answerGrid: $('#answer-grid'),
    answerProgress: $('#answer-progress'),
    saveKey: $('#save-key'),
    scanButton: $('#scan-button'),
    resultsBody: $('#results-body'),
    emptyState: $('#empty-state'),
    resultsCount: $('#results-count'),
    totalStat: $('#total-stat'),
    averageStat: $('#average-stat'),
    lastStat: $('#last-stat'),
    exportButton: $('#export-button'),
    clearButton: $('#clear-button'),
    directoryStatus: $('#directory-status'),
    classForm: $('#class-form'),
    className: $('#class-name'),
    saveClass: $('#save-class'),
    cancelClassEdit: $('#cancel-class-edit'),
    classesBody: $('#classes-body'),
    classesEmpty: $('#classes-empty'),
    classCount: $('#class-count'),
    addDefaultClasses: $('#add-default-classes'),
    studentForm: $('#student-form'),
    studentName: $('#student-name'),
    studentEnrollment: $('#student-enrollment'),
    studentClass: $('#student-class'),
    saveStudent: $('#save-student'),
    cancelStudentEdit: $('#cancel-student-edit'),
    studentsBody: $('#students-body'),
    studentsEmpty: $('#students-empty'),
    studentCount: $('#student-count'),
    subjectForm: $('#subject-form'),
    subjectName: $('#subject-name'),
    subjectClass: $('#subject-class'),
    saveSubject: $('#save-subject'),
    cancelSubjectEdit: $('#cancel-subject-edit'),
    subjectsBody: $('#subjects-body'),
    subjectsEmpty: $('#subjects-empty'),
    subjectCount: $('#subject-count'),
    subjectArea: $('#subject-area'),
    subjectTeacher: $('#subject-teacher'),
    teacherForm: $('#teacher-form'),
    teacherName: $('#teacher-name'),
    teacherAssignments: $('#teacher-assignments'),
    addTeacherAssignment: $('#add-teacher-assignment'),
    saveTeacher: $('#save-teacher'),
    cancelTeacherEdit: $('#cancel-teacher-edit'),
    teachersBody: $('#teachers-body'),
    teachersEmpty: $('#teachers-empty'),
    teacherCount: $('#teacher-count'),
    areaForm: $('#area-form'),
    areaName: $('#area-name'),
    saveArea: $('#save-area'),
    cancelAreaEdit: $('#cancel-area-edit'),
    areasBody: $('#areas-body'),
    areasEmpty: $('#areas-empty'),
    areaCount: $('#area-count'),
    addDefaultAreas: $('#add-default-areas'),
    scannerModal: $('#scanner-modal'),
    scannerStatus: $('#scanner-status'),
    qrFile: $('#qr-file'),
    manualCorrectionModal: $('#manual-correction-modal'),
    manualCorrectionForm: $('#manual-correction-form'),
    manualCorrectionDescription: $('#manual-correction-description'),
    manualAnswerGrid: $('#manual-answer-grid'),
    manualCorrectionMessage: $('#manual-correction-message'),
    printRoot: $('#print-root'),
    toast: $('#toast')
  };

  let state;
  let scanner = null;
  let toastTimeout;
  let supabaseClient = null;
  let activeUserId = null;
  let activeUserIsAdmin = false;
  let loginScreenAfterSignOut = 'teacher';
  let activeStorageKey = STORAGE_KEY;
  let appInitialized = false;
  let pendingCardCorrection = null;
  let directory = { classes: [], students: [], subjects: [], teachers: [], areas: [] };
  let editingRecords = { classes: null, students: null, subjects: null, teachers: null, areas: null };

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(activeStorageKey) || '{}');
      return {
        examName: typeof saved.examName === 'string' ? saved.examName : '',
        examArea: typeof saved.examArea === 'string' ? saved.examArea : '',
        examDiscipline: typeof saved.examDiscipline === 'string' ? saved.examDiscipline : '',
        examClass: typeof saved.examClass === 'string' ? saved.examClass : '',
        students: Array.isArray(saved.students) ? saved.students.filter(isValidRosterStudent) : [],
        answers: Array.isArray(saved.answers) ? saved.answers.filter((answer) => OPTIONS.includes(answer)) : [],
        savedKeys: Array.isArray(saved.savedKeys) ? saved.savedKeys.filter(isValidSavedKey) : [],
        selectedKeyId: typeof saved.selectedKeyId === 'string' ? saved.selectedKeyId : '',
        results: Array.isArray(saved.results) ? saved.results.filter(isValidResult) : []
      };
    } catch (error) {
      console.error('Não foi possível carregar os dados salvos.', error);
      return { examName: '', examArea: '', examDiscipline: '', examClass: '', students: [], answers: [], savedKeys: [], selectedKeyId: '', results: [] };
    }
  }

  function isValidRosterStudent(student) {
    return student && typeof student.id === 'string' && typeof student.name === 'string' &&
      typeof student.className === 'string' &&
      (typeof student.series === 'undefined' || typeof student.series === 'string');
  }

  function inferStudentSeries(className) {
    return className.match(/^[1-3][º°o]?\s*ano\b/i)?.[0] || '';
  }

  function getStudentSeries(student) {
    return student.series || inferStudentSeries(student.className) || '—';
  }

  function getStudentClass(student) {
    if (student.series || !inferStudentSeries(student.className)) return student.className;
    return student.className.replace(/^[1-3][º°o]?\s*ano\s*/i, '') || '—';
  }

  function isValidSavedKey(key) {
    return key && typeof key.id === 'string' && typeof key.examName === 'string' &&
      typeof key.discipline === 'string' && typeof key.className === 'string' &&
      (typeof key.area === 'undefined' || KNOWLEDGE_AREAS.includes(key.area)) &&
      Array.isArray(key.answers) && key.answers.length > 0 &&
      key.answers.every((answer) => OPTIONS.slice(1).includes(answer));
  }

  function isValidResult(result) {
    return result && typeof result.id === 'string' && typeof result.student === 'string' &&
      typeof result.exam === 'string' && Array.isArray(result.responses) &&
      Number.isFinite(result.correct) && Number.isFinite(result.total) &&
      typeof result.date === 'string';
  }

  function persist() {
    try {
      localStorage.setItem(activeStorageKey, JSON.stringify(state));
      return true;
    } catch (error) {
      console.error('Não foi possível salvar os dados neste navegador.', error);
      showToast('Não foi possível salvar. Verifique o espaço disponível no navegador.');
      return false;
    }
  }

  function initialize() {
    if (!appInitialized) {
      for (let count = 1; count <= 50; count += 1) {
        const option = document.createElement('option');
        option.value = String(count);
        option.textContent = `${count} ${count === 1 ? 'questão' : 'questões'}`;
        elements.questionCount.append(option);
      }
      bindEvents();
      appInitialized = true;
    }

    elements.examName.value = state.examName;
    if (!EXAM_TYPES.includes(state.examName)) elements.examName.value = '';
    elements.examArea.value = state.examArea;
    elements.examDiscipline.value = state.examDiscipline;
    elements.examClass.value = state.examClass;
    const count = Math.min(50, Math.max(1, state.answers.length || DEFAULT_COUNT));
    elements.questionCount.value = String(count);
    state.answers = Array.from({ length: count }, (_, index) => state.answers[index] || '');
    renderSavedKeyOptions();
    renderTeacherStudents();
    renderAnswerKey();
    renderCardPreview();
    renderResults();
  }

  function renderAnswerKey() {
    const count = Number(elements.questionCount.value);
    state.answers = Array.from({ length: count }, (_, index) => state.answers[index] || '');
    elements.answerGrid.replaceChildren();
    state.answers.forEach((answer, index) => {
      const item = document.createElement('div');
      item.className = 'answer-item';
      const label = document.createElement('label');
      label.htmlFor = `answer-${index}`;
      label.textContent = `Q${String(index + 1).padStart(2, '0')}`;
      const select = document.createElement('select');
      select.id = label.htmlFor;
      select.setAttribute('aria-label', `Resposta correta da questão ${index + 1}`);
      OPTIONS.forEach((value) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value || '—';
        select.append(option);
      });
      select.value = answer;
      select.addEventListener('change', () => {
        state.answers[index] = select.value;
        updateAnswerProgress();
        renderCardPreview();
      });
      item.append(label, select);
      elements.answerGrid.append(item);
    });
    updateAnswerProgress();
    renderCardPreview();
  }

  function updateAnswerProgress() {
    const marked = state.answers.filter(Boolean).length;
    elements.answerProgress.textContent = `${marked} de ${state.answers.length} respostas marcadas`;
  }

  function saveExamSettings() {
    state.examName = elements.examName.value.trim();
    state.examArea = elements.examArea.value;
    state.examDiscipline = elements.examDiscipline.value.trim();
    state.examClass = elements.examClass.value.trim();
    const isExistingLegacyName = state.savedKeys.some((key) =>
      key.id === state.selectedKeyId && key.examName === state.examName
    );
    if (!EXAM_TYPES.includes(state.examName) && !isExistingLegacyName) {
      showToast('Selecione um dos tipos de prova disponíveis.');
      elements.examName.focus();
      return false;
    }
    if (!KNOWLEDGE_AREAS.includes(state.examArea)) {
      showToast('Selecione uma área de conhecimento para a prova.');
      elements.examArea.focus();
      return false;
    }
    if (!state.examDiscipline) {
      showToast('Informe a disciplina antes de salvar o gabarito.');
      elements.examDiscipline.focus();
      return false;
    }
    if (state.answers.length === 0 || state.answers.some((answer) => !answer)) {
      showToast('Marque uma alternativa para todas as questões.');
      return false;
    }
    const existingKey = state.savedKeys.find((key) =>
      key.id === state.selectedKeyId ||
      (!state.selectedKeyId &&
        key.examName.toLocaleLowerCase('pt-BR') === state.examName.toLocaleLowerCase('pt-BR') &&
        key.area === state.examArea &&
        key.discipline.toLocaleLowerCase('pt-BR') === state.examDiscipline.toLocaleLowerCase('pt-BR'))
    );
    const savedKey = {
      id: existingKey?.id || createId(),
      examName: state.examName,
      area: state.examArea,
      discipline: state.examDiscipline,
      className: state.examClass,
      answers: [...state.answers]
    };
    const previousSavedKeys = state.savedKeys;
    const previousSelectedKeyId = state.selectedKeyId;
    state.savedKeys = [...state.savedKeys];
    const savedIndex = state.savedKeys.findIndex((key) => key.id === savedKey.id);
    if (savedIndex < 0) state.savedKeys.push(savedKey);
    else state.savedKeys[savedIndex] = savedKey;
    state.selectedKeyId = savedKey.id;
    if (!persist()) {
      state.savedKeys = previousSavedKeys;
      state.selectedKeyId = previousSelectedKeyId;
      renderSavedKeyOptions();
      return false;
    }
    renderSavedKeyOptions();
    renderCardPreview();
    elements.deleteKey.disabled = false;
    showToast('Gabarito salvo. Pronto para corrigir!');
    return true;
  }

  function renderSavedKeyOptions() {
    const selectedId = state.selectedKeyId || '';
    elements.savedKeySelect.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Selecione um gabarito salvo';
    elements.savedKeySelect.append(placeholder);
    state.savedKeys.forEach((key) => {
      const option = document.createElement('option');
      option.value = key.id;
      option.textContent = `${key.examName} — ${key.area || 'Área não definida'} — ${key.discipline}${key.className ? ` (${key.className})` : ''}`;
      elements.savedKeySelect.append(option);
    });
    elements.savedKeySelect.value = selectedId;
    elements.deleteKey.disabled = !selectedId || !state.savedKeys.some((key) => key.id === selectedId);
    elements.printStudentCards.disabled = !state.students.length ||
      !state.savedKeys.some((key) => key.id === selectedId);
    renderCardPreview();
  }

  function loadSavedKey(id) {
    const savedKey = state.savedKeys.find((key) => key.id === id);
    if (!savedKey) return;
    state.selectedKeyId = savedKey.id;
    state.examName = savedKey.examName;
    if (!EXAM_TYPES.includes(savedKey.examName) &&
        ![...elements.examName.options].some((option) => option.value === savedKey.examName)) {
      const legacyOption = document.createElement('option');
      legacyOption.value = savedKey.examName;
      legacyOption.textContent = `${savedKey.examName} (gabarito salvo anteriormente)`;
      elements.examName.append(legacyOption);
    }
    state.examArea = KNOWLEDGE_AREAS.includes(savedKey.area) ? savedKey.area : '';
    state.examDiscipline = savedKey.discipline;
    state.examClass = savedKey.className;
    state.answers = [...savedKey.answers];
    elements.examName.value = state.examName;
    elements.examArea.value = state.examArea;
    elements.examDiscipline.value = state.examDiscipline;
    elements.examClass.value = state.examClass;
    elements.questionCount.value = String(state.answers.length);
    renderSavedKeyOptions();
    renderAnswerKey();
    renderCardPreview();
  }

  function startNewKey() {
    state.selectedKeyId = '';
    state.examName = '';
    state.examArea = '';
    state.examDiscipline = '';
    state.examClass = '';
    state.answers = Array.from({ length: DEFAULT_COUNT }, () => '');
    [...elements.examName.options].forEach((option) => {
      if (option.value && !EXAM_TYPES.includes(option.value)) option.remove();
    });
    elements.savedKeySelect.value = '';
    elements.examName.value = '';
    elements.examArea.value = '';
    elements.examDiscipline.value = '';
    elements.examClass.value = '';
    elements.questionCount.value = String(DEFAULT_COUNT);
    renderSavedKeyOptions();
    renderAnswerKey();
    renderCardPreview();
    elements.examName.focus();
  }

  function addTeacherStudent(event) {
    event.preventDefault();
    const name = elements.teacherStudentName.value.trim();
    const series = elements.teacherStudentSeries.value;
    const className = elements.teacherStudentClass.value.trim();
    if (!name || !series || !className) return;
    if (state.students.some((student) =>
      student.name.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR') &&
      (student.series || inferStudentSeries(student.className)) === series &&
      getStudentClass(student).toLocaleLowerCase('pt-BR') === className.toLocaleLowerCase('pt-BR')
    )) {
      showToast('Esse aluno já está cadastrado nessa turma.');
      return;
    }
    const student = { id: createId(), name, series, className };
    state.students = [...state.students, student].sort((left, right) =>
      left.name.localeCompare(right.name, 'pt-BR')
    );
    if (!persist()) {
      state.students = state.students.filter((record) => record.id !== student.id);
      return;
    }
    elements.teacherStudentForm.reset();
    renderTeacherStudents();
    elements.cardPreviewStudent.value = student.id;
    renderCardPreview();
    showToast('Aluno cadastrado.');
    elements.teacherStudentName.focus();
  }

  function renderTeacherStudents() {
    if (!elements.teacherStudentsBody) return;
    elements.teacherStudentsBody.replaceChildren();
    state.students.forEach((student) => {
      const row = document.createElement('tr');
      [student.name, getStudentSeries(student), getStudentClass(student)].forEach((value) => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      });
      const actions = document.createElement('td');
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'delete-record';
      remove.dataset.action = 'delete-student';
      remove.dataset.id = student.id;
      remove.textContent = 'Excluir';
      actions.append(remove);
      row.append(actions);
      elements.teacherStudentsBody.append(row);
    });
    elements.teacherStudentsEmpty.hidden = state.students.length > 0;
    const selectedStudentId = elements.cardPreviewStudent.value;
    elements.cardPreviewStudent.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = state.students.length ? 'Selecione um aluno' : 'Cadastre um aluno';
    elements.cardPreviewStudent.append(placeholder);
    state.students.forEach((student) => {
      const option = document.createElement('option');
      option.value = student.id;
      option.textContent = `${student.name} — ${getStudentSeries(student)} ${getStudentClass(student)}`.trim();
      elements.cardPreviewStudent.append(option);
    });
    if (state.students.some((student) => student.id === selectedStudentId)) {
      elements.cardPreviewStudent.value = selectedStudentId;
    } else if (state.students.length) {
      elements.cardPreviewStudent.value = state.students[0].id;
    }
    elements.printStudentCards.disabled = state.students.length === 0 ||
      !state.savedKeys.some((key) => key.id === state.selectedKeyId);
    renderCardPreview();
  }

  function renderCardPreview() {
    if (!elements.previewAnswerGrid) return;
    const student = state.students.find((record) => record.id === elements.cardPreviewStudent.value);
    const savedKey = state.savedKeys.find((key) => key.id === state.selectedKeyId);
    const answers = savedKey ? savedKey.answers : state.answers;
    elements.previewStudentName.textContent = student?.name || 'Selecione um aluno';
    elements.previewStudentSeries.textContent = student ? getStudentSeries(student) : '—';
    elements.previewStudentClass.textContent = student ? getStudentClass(student) : '—';
    elements.previewExamName.textContent = savedKey?.examName || elements.examName.value || '—';
    elements.previewExamDiscipline.textContent =
      savedKey?.discipline || elements.examDiscipline.value.trim() || '—';
    elements.previewAnswerGrid.replaceChildren();
    answers.forEach((_, index) => {
      const row = document.createElement('div');
      row.className = 'question-row';
      const number = document.createElement('span');
      number.className = 'question-number';
      number.textContent = `${index + 1}.`;
      row.append(number);
      OPTIONS.slice(1).forEach((option) => {
        const choice = document.createElement('span');
        choice.className = 'choice';
        const bubble = document.createElement('span');
        bubble.className = 'bubble';
        const letter = document.createElement('span');
        letter.textContent = option;
        choice.append(bubble, letter);
        row.append(choice);
      });
      elements.previewAnswerGrid.append(row);
    });
    elements.answerKeyPreview.replaceChildren();
    answers.forEach((answer, index) => {
      const item = document.createElement('span');
      item.className = `answer-key-chip${answer ? '' : ' unanswered'}`;
      item.textContent = `Q${index + 1}: ${answer || '—'}`;
      elements.answerKeyPreview.append(item);
    });
  }

  function handleTeacherStudentAction(event) {
    const button = event.target.closest('button[data-action="delete-student"]');
    if (!button) return;
    const student = state.students.find((record) => record.id === button.dataset.id);
    if (!student || !window.confirm(`Deseja excluir o aluno "${student.name}" da turma ${student.className}?`)) return;
    const previousStudents = state.students;
    state.students = state.students.filter((record) => record.id !== student.id);
    if (!persist()) {
      state.students = previousStudents;
      return;
    }
    renderTeacherStudents();
    renderCardPreview();
    showToast('Aluno excluído.');
  }

  function printStudentCards() {
    const savedKey = state.savedKeys.find((key) => key.id === state.selectedKeyId);
    if (!savedKey) {
      showToast('Selecione ou salve um gabarito antes de imprimir os cartões.');
      elements.savedKeySelect.focus();
      return;
    }
    if (!state.students.length) {
      showToast('Cadastre pelo menos um aluno antes de imprimir.');
      return;
    }
    if (typeof window.QRCode !== 'function') {
      showToast('Não foi possível carregar o gerador de QR Code. Verifique a conexão e recarregue a página.');
      return;
    }
    const root = elements.printRoot;
    root.replaceChildren();
    for (let index = 0; index < state.students.length; index += 1) {
      const student = state.students[index];
      if (index % 4 === 0) {
        const page = document.createElement('section');
        page.className = 'print-page';
        root.append(page);
      }
      const page = root.lastElementChild;
      const card = document.createElement('article');
      card.className = 'answer-card';
      const header = document.createElement('header');
      header.className = 'card-header';
      const identity = document.createElement('div');
      identity.className = 'card-identity';
      const series = getStudentSeries(student);
      const className = getStudentClass(student);
      identity.innerHTML = `<p class="card-school">EEEP LUIZETE ALBANO DE FREITAS MENEZES</p><p class="card-title">CARTÃO-RESPOSTA</p><p class="card-meta"><strong>Aluno:</strong> ${escapeHtml(student.name)}<br><strong>Série:</strong> ${escapeHtml(series)}<br><strong>Turma:</strong> ${escapeHtml(className)}<br><strong>Prova:</strong> ${escapeHtml(savedKey.examName)}<br><strong>Disciplina:</strong> ${escapeHtml(savedKey.discipline)}</p>`;
      const qr = document.createElement('div');
      qr.className = 'card-qr';
      header.append(identity, qr);
      card.append(header);

      const answers = document.createElement('div');
      answers.className = 'answer-grid';
      savedKey.answers.forEach((answer, questionIndex) => {
        const row = document.createElement('div');
        row.className = 'question-row';
        const number = document.createElement('span');
        number.className = 'question-number';
        number.textContent = `${questionIndex + 1}.`;
        row.append(number);
        OPTIONS.slice(1).forEach((option) => {
          const choice = document.createElement('span');
          choice.className = 'choice';
          const bubble = document.createElement('span');
          bubble.className = 'bubble';
          const letter = document.createElement('span');
          letter.textContent = option;
          choice.append(bubble, letter);
          row.append(choice);
        });
        answers.append(row);
      });
      card.append(answers);
      const instruction = document.createElement('p');
      instruction.className = 'instructions';
      instruction.textContent = 'Preencha uma alternativa por questão. O QR Code identifica o aluno e a prova.';
      card.append(instruction);
      page.append(card);

      const qrPayload = [
        'C',
        student.id,
        student.name,
        className,
        student.series || inferStudentSeries(student.className) || '',
        savedKey.id
      ];
      try {
        new window.QRCode(qr, {
          text: stringifyQrPayload(qrPayload),
          width: 100,
          height: 100,
          correctLevel: window.QRCode.CorrectLevel.M
        });
      } catch (error) {
        console.error(`Não foi possível gerar o QR Code do cartão de ${student.name}.`, error);
        root.replaceChildren();
        showToast(`Não foi possível gerar o QR Code do cartão de ${student.name}. Confira os dados do aluno e tente novamente.`);
        return;
      }
    }
    renderSavedKeyOptions();
    window.addEventListener('afterprint', () => root.replaceChildren(), { once: true });
    window.print();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }

  function stringifyQrPayload(payload) {
    return JSON.stringify(payload).replace(/[^\x00-\x7F]/g, (character) =>
      `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`
    );
  }

  function showManualCorrection(payload, savedKey) {
    pendingCardCorrection = { payload, savedKey };
    const classLabel = [payload.serie, payload.turma].filter(Boolean).join(' ');
    elements.manualCorrectionDescription.textContent =
      `${payload.aluno} · ${classLabel || 'Turma não informada'} · ${savedKey.examName} — ${savedKey.discipline}`;
    elements.manualCorrectionMessage.textContent = '';
    elements.manualCorrectionMessage.classList.remove('error');
    elements.manualAnswerGrid.replaceChildren();
    savedKey.answers.forEach((_, index) => {
      const label = document.createElement('label');
      label.className = 'manual-answer-field';
      const question = document.createElement('span');
      question.textContent = `Questão ${index + 1}`;
      const select = document.createElement('select');
      select.required = true;
      select.setAttribute('aria-label', `Resposta do aluno na questão ${index + 1}`);
      OPTIONS.forEach((optionValue) => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue || 'Selecione';
        select.append(option);
      });
      label.append(question, select);
      elements.manualAnswerGrid.append(label);
    });
    closeModal('scanner-modal');
    showModal('manual-correction-modal');
  }

  function submitManualCorrection(event) {
    event.preventDefault();
    if (!pendingCardCorrection) return;
    const { payload, savedKey } = pendingCardCorrection;
    const responses = [...elements.manualAnswerGrid.querySelectorAll('select')].map((select) => select.value);
    if (responses.length !== savedKey.answers.length || responses.some((answer) => !OPTIONS.slice(1).includes(answer))) {
      elements.manualCorrectionMessage.textContent = 'Selecione uma resposta para cada questão.';
      elements.manualCorrectionMessage.classList.add('error');
      return;
    }
    const className = [payload.serie, payload.turma].filter(Boolean).join(' ') || '—';
    const result = {
      id: createId(),
      student: payload.aluno,
      className,
      exam: savedKey.examName,
      responses,
      correct: responses.reduce((total, answer, index) => total + Number(answer === savedKey.answers[index]), 0),
      total: savedKey.answers.length,
      date: new Date().toISOString()
    };
    const duplicate = state.results.some((item) =>
      item.student.toLocaleLowerCase('pt-BR') === result.student.toLocaleLowerCase('pt-BR') &&
      item.exam.toLocaleLowerCase('pt-BR') === result.exam.toLocaleLowerCase('pt-BR')
    );
    if (duplicate) {
      elements.manualCorrectionMessage.textContent = `${result.student} já tem uma correção registrada para esta prova.`;
      elements.manualCorrectionMessage.classList.add('error');
      return;
    }
    state.results.unshift(result);
    if (!persist()) {
      state.results.shift();
      return;
    }
    pendingCardCorrection = null;
    elements.manualCorrectionForm.reset();
    renderResults();
    closeModal('manual-correction-modal');
    showToast(`Prova de ${result.student} corrigida com sucesso!`);
  }

  function deleteSavedKey() {
    const keyId = elements.savedKeySelect.value;
    const keyIndex = state.savedKeys.findIndex((key) => key.id === keyId);
    if (keyIndex < 0) return;
    const key = state.savedKeys[keyIndex];
    if (!window.confirm(`Deseja excluir o gabarito "${key.examName} — ${key.discipline}"?`)) return;

    const previousKeys = state.savedKeys;
    const previousSelectedKeyId = state.selectedKeyId;
    state.savedKeys = state.savedKeys.filter((savedKey) => savedKey.id !== keyId);
    if (state.selectedKeyId === keyId) state.selectedKeyId = '';
    if (!persist()) {
      state.savedKeys = previousKeys;
      state.selectedKeyId = previousSelectedKeyId;
      renderSavedKeyOptions();
      return;
    }
    renderSavedKeyOptions();
    showToast('Gabarito excluído.');
  }

  function bindEvents() {
    elements.questionCount.addEventListener('change', renderAnswerKey);
    elements.saveKey.addEventListener('click', saveExamSettings);
    elements.savedKeySelect.addEventListener('change', () => {
      if (!elements.savedKeySelect.value) {
        state.selectedKeyId = '';
        renderSavedKeyOptions();
        renderCardPreview();
        persist();
        return;
      }
      loadSavedKey(elements.savedKeySelect.value);
    });
    elements.newKey.addEventListener('click', startNewKey);
    elements.deleteKey.addEventListener('click', deleteSavedKey);
    elements.scanButton.addEventListener('click', openScanner);
    elements.teacherStudentForm.addEventListener('submit', addTeacherStudent);
    elements.teacherStudentsBody.addEventListener('click', handleTeacherStudentAction);
    elements.cardPreviewStudent.addEventListener('change', renderCardPreview);
    [elements.examName, elements.examDiscipline].forEach((field) => {
      field.addEventListener('input', renderCardPreview);
      field.addEventListener('change', renderCardPreview);
    });
    elements.printStudentCards.addEventListener('click', printStudentCards);
    elements.manualCorrectionForm.addEventListener('submit', submitManualCorrection);
    $('#format-button').addEventListener('click', () => showModal('format-modal'));
    elements.exportButton.addEventListener('click', exportCsv);
    elements.clearButton.addEventListener('click', clearResults);
    $('#upload-qr').addEventListener('click', () => elements.qrFile.click());
    elements.qrFile.addEventListener('change', scanImage);
    elements.classForm.addEventListener('submit', (event) => {
      event.preventDefault();
      saveDirectoryRecord('classes', { name: elements.className.value.trim() });
    });
    elements.addDefaultClasses.addEventListener('click', addDefaultClasses);
    elements.studentForm.addEventListener('submit', (event) => {
      event.preventDefault();
      saveDirectoryRecord('students', {
        name: elements.studentName.value.trim(),
        enrollment: elements.studentEnrollment.value.trim(),
        class_id: elements.studentClass.value
      });
    });
    elements.subjectForm.addEventListener('submit', (event) => {
      event.preventDefault();
      saveDirectoryRecord('subjects', {
        name: elements.subjectName.value.trim(),
        class_id: elements.subjectClass.value || null,
        area_id: elements.subjectArea.value,
        teacher_id: elements.subjectTeacher.value || null
      });
    });
    elements.teacherForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const assignments = [...elements.teacherAssignments.querySelectorAll('.teacher-assignment-row')].map((row) => ({
        name: row.querySelector('[data-assignment-name]').value.trim(),
        area_id: row.querySelector('[data-assignment-area]').value,
        class_ids: [...row.querySelectorAll('[data-assignment-class]:checked')].map((input) => input.value),
        subject_ids: JSON.parse(row.dataset.subjectIds || '[]')
      }));
      saveTeacherRecord(elements.teacherName.value.trim(), assignments);
    });
    elements.areaForm.addEventListener('submit', (event) => {
      event.preventDefault();
      saveDirectoryRecord('areas', { name: elements.areaName.value.trim() });
    });
    elements.addDefaultAreas.addEventListener('click', addDefaultAreas);
    elements.addTeacherAssignment.addEventListener('click', () => appendTeacherAssignment());
    elements.cancelClassEdit.addEventListener('click', () => resetDirectoryForm('classes'));
    elements.cancelStudentEdit.addEventListener('click', () => resetDirectoryForm('students'));
    elements.cancelSubjectEdit.addEventListener('click', () => resetDirectoryForm('subjects'));
    elements.cancelTeacherEdit.addEventListener('click', () => resetDirectoryForm('teachers'));
    elements.cancelAreaEdit.addEventListener('click', () => resetDirectoryForm('areas'));
    document.querySelectorAll('[data-directory-tab]').forEach((button) => {
      button.addEventListener('click', () => showDirectoryTab(button.dataset.directoryTab));
    });
    elements.classesBody.addEventListener('click', (event) => handleDirectoryAction(event, 'classes'));
    elements.studentsBody.addEventListener('click', (event) => handleDirectoryAction(event, 'students'));
    elements.subjectsBody.addEventListener('click', (event) => handleDirectoryAction(event, 'subjects'));
    elements.teachersBody.addEventListener('click', (event) => handleDirectoryAction(event, 'teachers'));
    elements.areasBody.addEventListener('click', (event) => handleDirectoryAction(event, 'areas'));
    document.querySelectorAll('[data-close]').forEach((button) => {
      button.addEventListener('click', () => closeModal(button.dataset.close));
    });
    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (event) => {
        if (event.target === backdrop) closeModal(backdrop.id);
      });
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop:not([hidden])').forEach((modal) => closeModal(modal.id));
      }
    });
  }

  function initializeAuth() {
    elements.loginForm.addEventListener('submit', signIn);
    elements.adminLoginForm.addEventListener('submit', signIn);
    elements.openAdminLogin.addEventListener('click', (event) => {
      event.preventDefault();
      showLoginScreen('admin');
    });
    elements.openTeacherLogin.addEventListener('click', (event) => {
      event.preventDefault();
      showLoginScreen('teacher');
    });
    elements.signoutButton.addEventListener('click', signOut);
    elements.adminSignoutButton.addEventListener('click', signOut);
    elements.adminAccessButton.addEventListener('click', () => {
      loginScreenAfterSignOut = 'admin';
      signOut({ currentTarget: elements.adminAccessButton });
    });
    const config = window.SUPABASE_CONFIG;
    if (!config || !config.url || !config.anonKey) {
      setAuthMessage('O login ainda precisa ser conectado ao projeto Supabase.', true);
      setAdminAuthMessage('O login ainda precisa ser conectado ao projeto Supabase.', true);
      elements.loginSubmit.disabled = true;
      elements.adminLoginSubmit.disabled = true;
      return;
    }
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      setAuthMessage('Não foi possível carregar o serviço de login. Verifique sua conexão e recarregue a página.', true);
      setAdminAuthMessage('Não foi possível carregar o serviço de login. Verifique sua conexão e recarregue a página.', true);
      elements.loginSubmit.disabled = true;
      elements.adminLoginSubmit.disabled = true;
      return;
    }

    try {
      supabaseClient = window.supabase.createClient(config.url, config.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    } catch (error) {
      console.error('Não foi possível configurar o cliente de autenticação.', error);
      setAuthMessage('A configuração do Supabase é inválida. Confira a URL e a chave pública.', true);
      setAdminAuthMessage('A configuração do Supabase é inválida. Confira a URL e a chave pública.', true);
      elements.loginSubmit.disabled = true;
      elements.adminLoginSubmit.disabled = true;
      return;
    }

    elements.loginSubmit.disabled = false;
    elements.adminLoginSubmit.disabled = false;
    setAuthMessage('');
    setAdminAuthMessage('');
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      activateUser(session?.user || null);
    });
    supabaseClient.auth.getSession().then(({ data, error }) => {
      if (error) throw error;
      activateUser(data.session?.user || null);
    }).catch((error) => {
      console.error('Não foi possível verificar a sessão de autenticação.', error);
      setAuthMessage('Não foi possível validar a sessão. Verifique sua conexão e tente novamente.', true);
      setAdminAuthMessage('Não foi possível validar a sessão. Verifique sua conexão e tente novamente.', true);
    });
  }

  async function signIn(event) {
    event.preventDefault();
    if (!supabaseClient) return;
    const isAdminLogin = event.currentTarget === elements.adminLoginForm;
    const emailInput = isAdminLogin ? elements.adminLoginEmail : elements.loginEmail;
    const passwordInput = isAdminLogin ? elements.adminLoginPassword : elements.loginPassword;
    const submitButton = isAdminLogin ? elements.adminLoginSubmit : elements.loginSubmit;
    const email = emailInput.value.trim();
    const isAdminEmail = email.toLowerCase() === (window.SUPABASE_CONFIG.adminEmail || '').trim().toLowerCase();
    const showMessage = isAdminLogin ? setAdminAuthMessage : setAuthMessage;
    if (isAdminLogin && !isAdminEmail) {
      showMessage('Use o e-mail da conta administradora para entrar nesta área.', true);
      return;
    }
    if (!isAdminLogin && isAdminEmail) {
      showMessage('Esta é a conta administrativa. Use a tela de acesso do administrador.', true);
      return;
    }
    submitButton.disabled = true;
    submitButton.textContent = 'Entrando…';
    showMessage('');
    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password: passwordInput.value
      });
      if (error) throw error;
      passwordInput.value = '';
    } catch (error) {
      console.error('Falha na autenticação do usuário.', error);
      showMessage(authErrorMessage(error), true);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = isAdminLogin ? 'Entrar na administração' : 'Entrar';
    }
  }

  async function signOut(event) {
    if (!supabaseClient) return;
    const button = event.currentTarget;
    button.disabled = true;
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Não foi possível encerrar a sessão.', error);
      loginScreenAfterSignOut = 'teacher';
      showToast('Não foi possível sair. Verifique sua conexão e tente novamente.');
    } finally {
      button.disabled = false;
    }
  }

  function activateUser(user) {
    if (!user) {
      activeUserId = null;
      activeUserIsAdmin = false;
      directory = { classes: [], students: [], subjects: [], teachers: [], areas: [] };
      if (appInitialized) {
        resetDirectoryForm('classes');
        resetDirectoryForm('students');
        resetDirectoryForm('subjects');
        resetDirectoryForm('teachers');
        resetDirectoryForm('areas');
        setDirectoryStatus('');
      }
      elements.appShell.hidden = true;
      elements.adminShell.hidden = true;
      showLoginScreen(loginScreenAfterSignOut);
      loginScreenAfterSignOut = 'teacher';
      elements.loginPassword.value = '';
      elements.adminLoginPassword.value = '';
      setAuthMessage('');
      setAdminAuthMessage('');
      return;
    }
    if (activeUserId === user.id) return;
    if (activeUserId && appInitialized) {
      resetDirectoryForm('classes');
      resetDirectoryForm('students');
      resetDirectoryForm('subjects');
      resetDirectoryForm('teachers');
      resetDirectoryForm('areas');
    }
    activeUserId = user.id;
    activeUserIsAdmin = (user.email || '').toLowerCase() ===
      (window.SUPABASE_CONFIG.adminEmail || '').trim().toLowerCase();
    activeStorageKey = `${STORAGE_KEY}:${user.id}`;
    state = loadState();
    elements.loginScreen.hidden = true;
    elements.adminLoginScreen.hidden = true;
    elements.appShell.hidden = activeUserIsAdmin;
    elements.adminShell.hidden = !activeUserIsAdmin;
    if (activeUserIsAdmin) {
      elements.adminUserEmail.textContent = user.email || 'Conta conectada';
    } else {
      elements.userEmail.textContent = user.email || 'Conta conectada';
      directory = { classes: [], students: [], subjects: [], teachers: [], areas: [] };
    }
    initialize();
    if (activeUserIsAdmin) {
      showDirectoryTab('teachers');
      loadDirectory();
    }
  }

  function showLoginScreen(role) {
    const isAdminLogin = role === 'admin';
    elements.loginScreen.hidden = isAdminLogin;
    elements.adminLoginScreen.hidden = !isAdminLogin;
    setAuthMessage('');
    setAdminAuthMessage('');
  }

  async function loadDirectory() {
    if (!supabaseClient || !activeUserId) return;
    setDirectoryStatus('Carregando seus cadastros…');
    try {
      const [classes, students, subjects, teachers, areas] = await Promise.all([
        supabaseClient.from('classes').select('id, name, created_at').eq('user_id', activeUserId).order('name'),
        supabaseClient.from('students').select('id, name, enrollment, class_id, created_at').eq('user_id', activeUserId).order('name'),
        supabaseClient.from('subjects').select('id, name, class_id, area_id, teacher_id, created_at').eq('user_id', activeUserId).order('name'),
        supabaseClient.from('teachers').select('id, name, created_at').eq('user_id', activeUserId).order('name'),
        supabaseClient.from('knowledge_areas').select('id, name, created_at').eq('user_id', activeUserId).order('name')
      ]);
      const responseError = [classes.error, students.error, subjects.error, teachers.error, areas.error].find(Boolean);
      if (responseError) throw responseError;
      directory = { classes: classes.data, students: students.data, subjects: subjects.data, teachers: teachers.data, areas: areas.data };
      renderDirectory();
      setDirectoryStatus('');
    } catch (error) {
      console.error('Não foi possível carregar os cadastros escolares.', error);
      setDirectoryStatus(directoryErrorMessage(error), true);
    }
  }

  function renderDirectory() {
    renderDirectoryTable(elements.classesBody, directory.classes, (record) => [
      record.name,
      String(directory.students.filter((student) => student.class_id === record.id).length),
      String(directory.subjects.filter((subject) => subject.class_id === record.id).length)
    ]);
    renderDirectoryTable(elements.studentsBody, directory.students, (record) => [
      record.name,
      record.enrollment,
      getClassName(record.class_id)
    ]);
    renderDirectoryTable(elements.subjectsBody, directory.subjects, (record) => [
      record.name,
      getClassName(record.class_id),
      getAreaName(record.area_id),
      getTeacherName(record.teacher_id)
    ]);
    renderDirectoryTable(elements.teachersBody, directory.teachers, (record) => {
      const assignments = directory.subjects.filter((subject) => subject.teacher_id === record.id);
      return [
        record.name,
        assignments.length ? assignments.map((subject) => `${subject.name} (${getClassName(subject.class_id)})`).join(', ') : '—',
        assignments.length ? [...new Set(assignments.map((subject) => getAreaName(subject.area_id)))].join(', ') : '—'
      ];
    });
    renderDirectoryTable(elements.areasBody, directory.areas, (record) => [
      record.name,
      String(directory.subjects.filter((subject) => subject.area_id === record.id).length)
    ]);

    elements.classesEmpty.hidden = directory.classes.length > 0;
    elements.studentsEmpty.hidden = directory.students.length > 0;
    elements.subjectsEmpty.hidden = directory.subjects.length > 0;
    elements.teachersEmpty.hidden = directory.teachers.length > 0;
    elements.areasEmpty.hidden = directory.areas.length > 0;
    elements.classCount.textContent = String(directory.classes.length);
    elements.studentCount.textContent = String(directory.students.length);
    elements.subjectCount.textContent = String(directory.subjects.length);
    elements.teacherCount.textContent = String(directory.teachers.length);
    elements.areaCount.textContent = String(directory.areas.length);
    renderClassOptions(elements.studentClass);
    renderClassOptions(elements.subjectClass, true);
    renderOptions(elements.subjectArea, directory.areas, 'Selecione uma área');
    renderOptions(elements.subjectTeacher, directory.teachers, 'Sem professor atribuído', true);
    renderTeacherAssignments(editingRecords.teachers);
  }

  function renderDirectoryTable(tbody, records, getValues) {
    tbody.replaceChildren();
    records.forEach((record) => {
      const row = document.createElement('tr');
      getValues(record).forEach((value) => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      });
      const actions = document.createElement('td');
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.dataset.action = 'edit';
      edit.dataset.id = record.id;
      edit.textContent = 'Editar';
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'delete-record';
      remove.dataset.action = 'delete';
      remove.dataset.id = record.id;
      remove.textContent = 'Excluir';
      actions.append(edit, remove);
      row.append(actions);
      tbody.append(row);
    });
  }

  function renderClassOptions(select, optional = false) {
    const selectedId = select.value;
    select.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = optional ? 'Sem turma específica' : 'Selecione uma turma';
    select.append(placeholder);
    select.required = !optional;
    directory.classes.forEach((record) => {
      const option = document.createElement('option');
      option.value = record.id;
      option.textContent = record.name;
      select.append(option);
    });
    if (directory.classes.some((record) => record.id === selectedId)) select.value = selectedId;
  }

  function renderOptions(select, records, placeholderText, optional = false) {
    const selectedId = select.value;
    select.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = placeholderText;
    select.append(placeholder);
    records.forEach((record) => {
      const option = document.createElement('option');
      option.value = record.id;
      option.textContent = record.name;
      select.append(option);
    });
    if (optional) select.required = false;
    if (records.some((record) => record.id === selectedId)) select.value = selectedId;
  }

  function renderTeacherAssignments(teacherId = null) {
    elements.teacherAssignments.replaceChildren();
    if (!teacherId) {
      appendTeacherAssignment();
      return;
    }
    const groups = new Map();
    directory.subjects.filter((subject) => subject.teacher_id === teacherId).forEach((subject) => {
      const key = JSON.stringify([subject.name, subject.area_id, subject.class_id ? 'class' : 'general']);
      if (!groups.has(key)) {
        groups.set(key, { name: subject.name, area_id: subject.area_id, class_ids: [], subject_ids: [] });
      }
      const group = groups.get(key);
      if (subject.class_id) group.class_ids.push(subject.class_id);
      group.subject_ids.push({ id: subject.id, classId: subject.class_id });
    });
    if (!groups.size) appendTeacherAssignment();
    groups.forEach((assignment) => appendTeacherAssignment(assignment));
  }

  function appendTeacherAssignment(assignment = null) {
    const row = document.createElement('div');
    row.className = 'teacher-assignment-row';
    row.dataset.subjectIds = JSON.stringify(assignment?.subject_ids || []);

    const nameField = document.createElement('label');
    nameField.className = 'field';
    const nameLabel = document.createElement('span');
    nameLabel.textContent = 'Disciplina';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.maxLength = 80;
    nameInput.placeholder = 'Ex.: Língua Portuguesa';
    nameInput.value = assignment?.name || '';
    nameInput.dataset.assignmentName = '';
    nameField.append(nameLabel, nameInput);

    const areaField = document.createElement('label');
    areaField.className = 'field';
    const areaLabel = document.createElement('span');
    areaLabel.textContent = 'Área de conhecimento';
    const areaSelect = document.createElement('select');
    areaSelect.dataset.assignmentArea = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Selecione uma área';
    areaSelect.append(placeholder);
    directory.areas.forEach((area) => {
      const option = document.createElement('option');
      option.value = area.id;
      option.textContent = area.name;
      areaSelect.append(option);
    });
    areaSelect.value = assignment?.area_id || '';
    areaField.append(areaLabel, areaSelect);

    const classes = document.createElement('details');
    classes.className = 'teacher-assignment-classes';
    const summary = document.createElement('summary');
    const selectedClassIds = new Set(assignment?.class_ids || []);
    summary.textContent = selectedClassIds.size
      ? `${selectedClassIds.size} ${selectedClassIds.size === 1 ? 'turma selecionada' : 'turmas selecionadas'}`
      : 'Selecionar turmas (vazio = sem turma específica)';
    const classOptions = document.createElement('div');
    classOptions.className = 'teacher-assignment-class-options';
    directory.classes.forEach((classRecord) => {
      const classLabel = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = classRecord.id;
      checkbox.dataset.assignmentClass = '';
      checkbox.checked = selectedClassIds.has(classRecord.id);
      checkbox.addEventListener('change', () => {
        const selectedCount = classOptions.querySelectorAll('input:checked').length;
        summary.textContent = selectedCount
          ? `${selectedCount} ${selectedCount === 1 ? 'turma selecionada' : 'turmas selecionadas'}`
          : 'Selecionar turmas (vazio = sem turma específica)';
      });
      classLabel.append(checkbox, document.createTextNode(classRecord.name));
      classOptions.append(classLabel);
    });
    classes.append(summary, classOptions);

    const remove = document.createElement('button');
    remove.className = 'teacher-remove-assignment';
    remove.type = 'button';
    remove.setAttribute('aria-label', 'Remover disciplina');
    remove.textContent = '×';
    remove.addEventListener('click', () => {
      if (elements.teacherAssignments.querySelectorAll('.teacher-assignment-row').length === 1) {
        nameInput.value = '';
        areaSelect.value = '';
        row.dataset.subjectIds = '[]';
        classOptions.querySelectorAll('input').forEach((checkbox) => { checkbox.checked = false; });
        summary.textContent = 'Selecionar turmas (vazio = sem turma específica)';
        return;
      }
      row.remove();
    });
    row.append(nameField, areaField, classes, remove);
    elements.teacherAssignments.append(row);
  }

  function getClassName(classId) {
    return directory.classes.find((record) => record.id === classId)?.name || '—';
  }

  function getAreaName(areaId) {
    return directory.areas.find((record) => record.id === areaId)?.name || '—';
  }

  function getTeacherName(teacherId) {
    return directory.teachers.find((record) => record.id === teacherId)?.name || '—';
  }

  function showDirectoryTab(name) {
    document.querySelectorAll('[data-directory-tab]').forEach((button) => {
      const selected = button.dataset.directoryTab === name;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-selected', String(selected));
    });
    document.querySelectorAll('.directory-pane').forEach((pane) => {
      pane.hidden = pane.id !== `pane-${name}`;
    });
  }

  async function saveDirectoryRecord(table, values) {
    if (!supabaseClient || !activeUserId) return;
    if (table === 'students' && !values.class_id) {
      setDirectoryStatus('Selecione uma turma para este cadastro.', true);
      return;
    }
    if (table === 'subjects' && !values.area_id) {
      setDirectoryStatus('Selecione uma área de conhecimento para a disciplina.', true);
      return;
    }
    const recordId = editingRecords[table];
    const button = getDirectoryButton(table);
    const databaseTable = table === 'areas' ? 'knowledge_areas' : table;
    button.disabled = true;
    try {
      const payload = { ...values, user_id: activeUserId };
      const query = recordId
        ? supabaseClient.from(databaseTable).update(payload).eq('id', recordId).eq('user_id', activeUserId)
        : supabaseClient.from(databaseTable).insert(payload);
      const { error } = await query;
      if (error) throw error;
      resetDirectoryForm(table);
      await loadDirectory();
      showToast(recordId ? 'Cadastro atualizado.' : 'Cadastro realizado com sucesso.');
    } catch (error) {
      console.error('Não foi possível salvar o cadastro.', error);
      setDirectoryStatus(directoryErrorMessage(error, table), true);
    } finally {
      button.disabled = false;
    }
  }

  async function saveTeacherRecord(name, assignments) {
    if (!supabaseClient || !activeUserId) return;
    const completed = assignments.filter((assignment) =>
      assignment.name || assignment.area_id || assignment.class_ids.length
    );
    if (completed.some((assignment) => !assignment.name || !assignment.area_id)) {
      setDirectoryStatus('Preencha o nome da disciplina e selecione a área de conhecimento em cada linha iniciada.', true);
      return;
    }
    const desired = completed.flatMap((assignment) => {
      const classIds = assignment.class_ids.length ? assignment.class_ids : [null];
      return classIds.map((classId) => ({
        name: assignment.name,
        area_id: assignment.area_id,
        class_id: classId,
        subject_id: assignment.subject_ids.find((subject) => subject.classId === classId)?.id || null
      }));
    });
    const uniqueKeys = new Set();
    for (const subject of desired) {
      const key = `${subject.class_id || 'general'}:${subject.name.trim().toLocaleLowerCase('pt-BR')}`;
      if (uniqueKeys.has(key)) {
        setDirectoryStatus('A mesma disciplina foi informada mais de uma vez para a mesma turma.', true);
        return;
      }
      uniqueKeys.add(key);
    }

    const recordId = editingRecords.teachers;
    elements.saveTeacher.disabled = true;
    let failedTable = 'teachers';
    try {
      let teacherId = recordId;
      const payload = { name, user_id: activeUserId };
      if (recordId) {
        const { error } = await supabaseClient.from('teachers').update(payload)
          .eq('id', recordId).eq('user_id', activeUserId);
        if (error) throw error;
      } else {
        const { data, error } = await supabaseClient.from('teachers').insert(payload).select('id').single();
        if (error) throw error;
        teacherId = data.id;
      }

      failedTable = 'teacher-assignment';
      const currentAssignments = directory.subjects.filter((subject) => subject.teacher_id === teacherId);
      const currentById = new Map(currentAssignments.map((subject) => [subject.id, subject]));
      const retainedIds = new Set(desired.map((subject) => subject.subject_id).filter(Boolean));

      for (const subject of desired) {
        const values = {
          name: subject.name,
          area_id: subject.area_id,
          class_id: subject.class_id,
          teacher_id: teacherId,
          user_id: activeUserId
        };
        if (subject.subject_id && currentById.has(subject.subject_id)) {
          const { error } = await supabaseClient.from('subjects').update(values)
            .eq('id', subject.subject_id).eq('user_id', activeUserId).eq('teacher_id', teacherId);
          if (error) throw error;
        } else {
          const { error } = await supabaseClient.from('subjects').insert(values);
          if (error) throw error;
        }
      }

      for (const subject of currentAssignments) {
        if (retainedIds.has(subject.id)) continue;
        const { error } = await supabaseClient.from('subjects').update({ teacher_id: null })
          .eq('id', subject.id).eq('user_id', activeUserId).eq('teacher_id', teacherId);
        if (error) throw error;
      }

      resetDirectoryForm('teachers');
      await loadDirectory();
      showToast(recordId ? 'Professor e disciplinas atualizados.' : 'Professor cadastrado com sucesso.');
    } catch (error) {
      console.error('Não foi possível salvar o professor e suas disciplinas.', error);
      setDirectoryStatus(directoryErrorMessage(error, failedTable), true);
      if (!recordId && failedTable === 'teacher-assignment') {
        setDirectoryStatus('O professor foi cadastrado, mas nem todas as disciplinas foram salvas. Atualize a lista e edite o cadastro para tentar novamente.', true);
      }
    } finally {
      elements.saveTeacher.disabled = false;
    }
  }

  async function addDefaultClasses() {
    if (!supabaseClient || !activeUserId) return;
    const courses = ['Informática', 'Administração', 'Meio Ambiente'];
    const defaults = [1, 2, 3].flatMap((year) =>
      courses.map((course) => ({ name: `${year}º ${course}`, user_id: activeUserId }))
    );
    elements.addDefaultClasses.disabled = true;
    setDirectoryStatus('Adicionando as turmas padrão…');
    try {
      const { error } = await supabaseClient.from('classes').upsert(defaults, {
        onConflict: 'user_id,name',
        ignoreDuplicates: true
      });
      if (error) throw error;
      await loadDirectory();
      showToast('Turmas dos três cursos adicionadas.');
    } catch (error) {
      console.error('Não foi possível adicionar as turmas padrão.', error);
      setDirectoryStatus(directoryErrorMessage(error, 'classes'), true);
    } finally {
      elements.addDefaultClasses.disabled = false;
    }
  }

  async function addDefaultAreas() {
    if (!supabaseClient || !activeUserId) return;
    const defaults = KNOWLEDGE_AREAS.map((name) => ({ name, user_id: activeUserId }));
    elements.addDefaultAreas.disabled = true;
    setDirectoryStatus('Adicionando as áreas sugeridas…');
    try {
      const { error } = await supabaseClient.from('knowledge_areas').upsert(defaults, {
        onConflict: 'user_id,name',
        ignoreDuplicates: true
      });
      if (error) throw error;
      await loadDirectory();
      showToast('Áreas de conhecimento adicionadas.');
    } catch (error) {
      console.error('Não foi possível adicionar as áreas de conhecimento.', error);
      setDirectoryStatus(directoryErrorMessage(error, 'areas'), true);
    } finally {
      elements.addDefaultAreas.disabled = false;
    }
  }

  function getDirectoryButton(table) {
    return {
      classes: elements.saveClass,
      students: elements.saveStudent,
      subjects: elements.saveSubject,
      teachers: elements.saveTeacher,
      areas: elements.saveArea
    }[table];
  }

  function handleDirectoryAction(event, table) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const record = directory[table].find((item) => item.id === button.dataset.id);
    if (!record) return;
    if (button.dataset.action === 'edit') {
      beginDirectoryEdit(table, record);
    } else if (button.dataset.action === 'delete') {
      deleteDirectoryRecord(table, record);
    }
  }

  function beginDirectoryEdit(table, record) {
    editingRecords[table] = record.id;
    if (table === 'classes') {
      elements.className.value = record.name;
      elements.saveClass.textContent = 'Salvar alterações';
      elements.cancelClassEdit.hidden = false;
      showDirectoryTab('classes');
      elements.className.focus();
    } else if (table === 'students') {
      elements.studentName.value = record.name;
      elements.studentEnrollment.value = record.enrollment;
      elements.studentClass.value = record.class_id;
      elements.saveStudent.textContent = 'Salvar alterações';
      elements.cancelStudentEdit.hidden = false;
      showDirectoryTab('students');
      elements.studentName.focus();
    } else if (table === 'subjects') {
      elements.subjectName.value = record.name;
      elements.subjectClass.value = record.class_id;
      elements.subjectArea.value = record.area_id || '';
      elements.subjectTeacher.value = record.teacher_id || '';
      elements.saveSubject.textContent = 'Salvar alterações';
      elements.cancelSubjectEdit.hidden = false;
      showDirectoryTab('subjects');
      elements.subjectName.focus();
    } else if (table === 'teachers') {
      elements.teacherName.value = record.name;
      elements.saveTeacher.textContent = 'Salvar alterações';
      elements.cancelTeacherEdit.hidden = false;
      renderTeacherAssignments(record.id);
      showDirectoryTab('teachers');
      elements.teacherName.focus();
    } else {
      elements.areaName.value = record.name;
      elements.saveArea.textContent = 'Salvar alterações';
      elements.cancelAreaEdit.hidden = false;
      showDirectoryTab('areas');
      elements.areaName.focus();
    }
  }

  function resetDirectoryForm(table) {
    editingRecords[table] = null;
    const forms = {
      classes: [elements.classForm, elements.saveClass, elements.cancelClassEdit, 'Cadastrar turma'],
      students: [elements.studentForm, elements.saveStudent, elements.cancelStudentEdit, 'Cadastrar aluno'],
      subjects: [elements.subjectForm, elements.saveSubject, elements.cancelSubjectEdit, 'Cadastrar disciplina'],
      teachers: [elements.teacherForm, elements.saveTeacher, elements.cancelTeacherEdit, 'Cadastrar professor'],
      areas: [elements.areaForm, elements.saveArea, elements.cancelAreaEdit, 'Cadastrar área']
    };
    const [form, button, cancel, label] = forms[table];
    form.reset();
    button.textContent = label;
    cancel.hidden = true;
    if (table === 'teachers') renderTeacherAssignments();
  }

  async function deleteDirectoryRecord(table, record) {
    const typeLabel = {
      classes: 'a turma',
      students: 'o aluno',
      subjects: 'a disciplina',
      teachers: 'o professor',
      areas: 'a área de conhecimento'
    }[table];
    if (!window.confirm(`Deseja excluir ${typeLabel} "${record.name}"?`)) return;
    try {
      const databaseTable = table === 'areas' ? 'knowledge_areas' : table;
      const { error } = await supabaseClient.from(databaseTable).delete()
        .eq('id', record.id).eq('user_id', activeUserId);
      if (error) throw error;
      if (editingRecords[table] === record.id) resetDirectoryForm(table);
      await loadDirectory();
      showToast('Cadastro excluído.');
    } catch (error) {
      console.error('Não foi possível excluir o cadastro.', error);
      setDirectoryStatus(directoryErrorMessage(error, table), true);
    }
  }

  function directoryErrorMessage(error, table = '') {
    if (error && ['42P01', '42703', 'PGRST204', 'PGRST205'].includes(error.code)) {
      return 'O banco ainda não tem todas as tabelas ou campos novos. Execute novamente o arquivo supabase-schema.sql no Editor SQL do Supabase e recarregue a página.';
    }
    if (error && error.code === '23505') {
      if (table === 'students') return 'Já existe um aluno com essa matrícula na sua conta.';
      if (table === 'subjects') return 'Essa disciplina já está cadastrada para a turma selecionada.';
      if (table === 'classes') return 'Já existe uma turma com esse nome na sua conta.';
      if (table === 'teachers') return 'Já existe um professor com esse nome na sua conta.';
      if (table === 'areas') return 'Já existe uma área com esse nome na sua conta.';
      if (table === 'teacher-assignment') return 'Essa disciplina já existe para a turma selecionada. Edite a disciplina existente para associá-la ao professor.';
      return 'Esse cadastro já existe.';
    }
    if (error && error.code === '23503') {
      return 'Este cadastro está vinculado a outros registros. Remova ou transfira os vínculos antes de excluí-lo.';
    }
    if (error && (error.status === 401 || error.status === 403)) {
      return 'Sua sessão expirou ou não tem permissão. Saia da conta e entre novamente.';
    }
    if (!navigator.onLine) return 'Sem conexão com a internet. Confira sua rede e tente novamente.';
    return 'Não foi possível concluir a operação. Confira a conexão com o Supabase e tente novamente.';
  }

  function setDirectoryStatus(message, isError = false) {
    elements.directoryStatus.textContent = message;
    elements.directoryStatus.classList.toggle('error', isError);
  }

  function setAuthMessage(message, isError = false) {
    elements.authMessage.textContent = message;
    elements.authMessage.classList.toggle('error', isError);
  }

  function setAdminAuthMessage(message, isError = false) {
    elements.adminAuthMessage.textContent = message;
    elements.adminAuthMessage.classList.toggle('error', isError);
  }

  function authErrorMessage(error) {
    if (error && ['invalid_credentials', 'user_not_found'].includes(error.code)) {
      return 'E-mail ou senha incorretos.';
    }
    if (error && error.status === 429) return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
    if (!navigator.onLine) return 'Sem conexão com a internet. Confira sua rede e tente novamente.';
    return 'Não foi possível entrar. Confira seus dados ou tente novamente mais tarde.';
  }

  function showModal(id) {
    $(`#${id}`).hidden = false;
    document.body.style.overflow = 'hidden';
  }

  async function closeModal(id) {
    $(`#${id}`).hidden = true;
    if (id === 'manual-correction-modal') {
      pendingCardCorrection = null;
      elements.manualCorrectionForm.reset();
    }
    if (document.querySelector('.modal-backdrop:not([hidden])')) return;
    document.body.style.overflow = '';
    if (id === 'scanner-modal') await stopScanner();
  }

  async function openScanner() {
    if (!saveExamSettings()) return;
    showModal('scanner-modal');
    elements.scannerStatus.className = 'scanner-status';
    elements.scannerStatus.textContent = 'Solicitando acesso à câmera…';
    if (!window.Html5Qrcode) {
      setScannerError('O leitor de QR Code não carregou. Verifique sua conexão com a internet e tente novamente.');
      return;
    }
    try {
      scanner = new Html5Qrcode('reader', { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE] });
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 230, height: 230 }, aspectRatio: 1 },
        handleQrCode,
        () => {}
      );
      elements.scannerStatus.textContent = 'Câmera ativa. Posicione o QR Code dentro da moldura.';
    } catch (error) {
      console.error('Não foi possível iniciar a câmera.', error);
      setScannerError(cameraErrorMessage(error));
    }
  }

  function cameraErrorMessage(error) {
    if (!window.isSecureContext) return 'A câmera só funciona em uma conexão HTTPS ou em localhost.';
    if (error && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')) {
      return 'Acesso à câmera negado. Libere a permissão nas configurações do navegador.';
    }
    if (error && (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError')) {
      return 'Nenhuma câmera foi encontrada neste dispositivo.';
    }
    return 'Não foi possível acessar a câmera. Verifique as permissões ou envie uma imagem do QR Code.';
  }

  function setScannerError(message) {
    elements.scannerStatus.className = 'scanner-status error';
    elements.scannerStatus.textContent = message;
  }

  async function stopScanner() {
    if (!scanner) return;
    const activeScanner = scanner;
    scanner = null;
    try {
      if (activeScanner.isScanning) await activeScanner.stop();
      activeScanner.clear();
    } catch (error) {
      console.error('Não foi possível encerrar a câmera corretamente.', error);
    }
  }

  async function scanImage(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file || !window.Html5Qrcode) {
      if (file) setScannerError('O leitor de QR Code não carregou. Verifique sua conexão com a internet.');
      return;
    }
    try {
      await stopScanner();
      scanner = new Html5Qrcode('reader', { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE] });
      const decoded = await scanner.scanFile(file, true);
      handleQrCode(decoded);
    } catch (error) {
      console.error('Não foi possível ler o QR Code da imagem.', error);
      setScannerError('QR Code não encontrado nessa imagem. Tente outra foto, com o código nítido e bem iluminado.');
    } finally {
      if (scanner) {
        scanner.clear();
        scanner = null;
      }
    }
  }

  function handleQrCode(decodedText) {
    if (!scanner) return;
    const scannedBy = scanner;
    scanner = null;
    scannedBy.stop().then(() => scannedBy.clear()).catch((error) => {
      console.error('Não foi possível encerrar a câmera após a leitura.', error);
    });
    try {
      const decodedPayload = JSON.parse(decodedText);
      const payload = Array.isArray(decodedPayload) && decodedPayload[0] === 'C'
        ? {
          tipo: 'cartao-aluno',
          aluno_id: decodedPayload[1],
          aluno: decodedPayload[2],
          turma: decodedPayload[3],
          serie: decodedPayload[4],
          gabarito_id: decodedPayload[5]
        }
        : decodedPayload;
      if (payload && payload.tipo === 'cartao-aluno') {
        const savedKey = state.savedKeys.find((key) => key.id === payload.gabarito_id);
        if (!savedKey) {
          setScannerError('Este cartão pertence a um gabarito que não está salvo nesta conta. Selecione o mesmo gabarito usado para imprimir o cartão.');
          return;
        }
        if (typeof payload.aluno !== 'string' || !payload.aluno.trim()) {
          throw new Error('O QR Code do cartão não contém o nome do aluno.');
        }
        loadSavedKey(savedKey.id);
        showManualCorrection(payload, savedKey);
        return;
      }
      const result = gradePayload(payload);
      if (!result) return;
      const duplicate = state.results.some((item) =>
        item.student.toLocaleLowerCase('pt-BR') === result.student.toLocaleLowerCase('pt-BR') &&
        item.exam.toLocaleLowerCase('pt-BR') === result.exam.toLocaleLowerCase('pt-BR')
      );
      if (duplicate) {
        setScannerError(`${result.student} já tem uma correção registrada para esta prova.`);
        return;
      }
      state.results.unshift(result);
      if (!persist()) {
        state.results.shift();
        return;
      }
      renderResults();
      closeModal('scanner-modal');
      showToast(`Prova de ${result.student} corrigida com sucesso!`);
    } catch (error) {
      console.error('O QR Code não contém um cartão-resposta válido.', error);
      setScannerError(error.message || 'QR Code inválido. Confira o formato do cartão-resposta.');
    }
  }

  function gradePayload(payload) {
    if (!payload || Array.isArray(payload) || typeof payload !== 'object') {
      throw new Error('O QR Code precisa conter um objeto JSON com os dados do aluno.');
    }
    const student = firstString(payload.aluno, payload.nome, payload.student, payload.name);
    const rawAnswers = payload.respostas ?? payload.answers;
    if (!student) throw new Error('O QR Code precisa informar o nome do aluno no campo "aluno".');
    if (!Array.isArray(rawAnswers)) throw new Error('O QR Code precisa conter as respostas em uma lista no campo "respostas".');
    if (rawAnswers.length !== state.answers.length) {
      throw new Error(`Este gabarito tem ${state.answers.length} questões, mas o QR Code contém ${rawAnswers.length} respostas.`);
    }
    const responses = rawAnswers.map((answer) => String(answer).trim().toUpperCase());
    const invalid = responses.findIndex((answer) => !OPTIONS.slice(1).includes(answer));
    if (invalid >= 0) throw new Error(`Resposta inválida na questão ${invalid + 1}. Use A, B, C, D ou E.`);
    const correct = responses.reduce((total, answer, index) => total + Number(answer === state.answers[index]), 0);
    return {
      id: createId(),
      student,
      className: firstString(payload.turma, payload.class, state.examClass) || '—',
      exam: firstString(payload.prova, payload.exam, state.examName) || state.examName,
      responses,
      correct,
      total: state.answers.length,
      date: new Date().toISOString()
    };
  }

  function firstString(...values) {
    return values.find((value) => typeof value === 'string' && value.trim())?.trim() || '';
  }

  function createId() {
    return window.crypto && window.crypto.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function renderResults() {
    const results = state.results;
    elements.resultsBody.replaceChildren();
    elements.emptyState.hidden = results.length > 0;
    elements.resultsBody.closest('table').hidden = results.length === 0;
    results.slice(0, 100).forEach((result) => {
      const row = document.createElement('tr');
      const percentage = Math.round((result.correct / result.total) * 100);
      [
        result.student,
        result.className || '—',
        result.exam,
        `${result.correct}/${result.total}`,
        `${percentage}%`
      ].forEach((value, index) => {
        const cell = document.createElement('td');
        if (index === 4) {
          const pill = document.createElement('span');
          pill.className = `score-pill${percentage < 50 ? ' low' : ''}`;
          pill.textContent = value;
          cell.append(pill);
        } else {
          cell.textContent = value;
        }
        row.append(cell);
      });
      const dateCell = document.createElement('td');
      dateCell.textContent = formatDate(result.date);
      row.append(dateCell);
      elements.resultsBody.append(row);
    });
    elements.totalStat.textContent = String(results.length);
    const average = results.length
      ? Math.round(results.reduce((sum, result) => sum + (result.correct / result.total) * 100, 0) / results.length)
      : null;
    elements.averageStat.textContent = average === null ? '—' : `${average}%`;
    elements.lastStat.textContent = results.length ? formatDate(results[0].date) : '—';
    elements.resultsCount.textContent = `Exibindo ${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}`;
    elements.exportButton.disabled = results.length === 0;
    elements.clearButton.hidden = results.length === 0;
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(date);
  }

  function exportCsv() {
    if (!state.results.length) return;
    const rows = [
      ['Aluno', 'Turma', 'Prova', 'Acertos', 'Total', 'Aproveitamento', 'Data'],
      ...state.results.map((result) => [
        result.student, result.className || '', result.exam, result.correct, result.total,
        `${Math.round((result.correct / result.total) * 100)}%`,
        new Date(result.date).toLocaleString('pt-BR')
      ])
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(';')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resultados-das-provas.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  function csvCell(value) {
    return `"${String(value).replaceAll('"', '""')}"`;
  }

  function clearResults() {
    if (!window.confirm('Deseja apagar todas as correções salvas neste navegador?')) return;
    const previousResults = state.results;
    state.results = [];
    if (!persist()) {
      state.results = previousResults;
      return;
    }
    renderResults();
    showToast('Resultados apagados.');
  }

  function showToast(message) {
    window.clearTimeout(toastTimeout);
    elements.toast.textContent = message;
    elements.toast.classList.add('visible');
    toastTimeout = window.setTimeout(() => elements.toast.classList.remove('visible'), 3200);
  }

  initializeAuth();
})();
