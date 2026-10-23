// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let perguntasOriginais = [];
let speechRate = 1.0;
let perguntasAtivas = [];
let perguntasFiltradas = [];
let vocabularioOriginal = [];
let vocabularioAtivo = [];
let vocabularioFiltrado = [];
let vocabularioUsado = [];
let currentVocabIndex = 0;
let timerInterval = null;
let timerEnabled = false;
let timerSeconds = 0;
let currentQuestion = null;
let savedQuestions = JSON.parse(localStorage.getItem('savedQuestions')) || [];
let currentMode = 'questions';
let vocabularioHistorico = [];
let phrasalHistorico = [];

// Idiomatic Expressions
let idiomaticExpressionsOriginal = [];
let idiomaticExpressionsAtivo = [];
let idiomaticExpressionsUsado = [];
let idiomaticExpressionHistorico = [];
let currentIdiom = null;
const URL_IDIOMATIC = "idiomatic_expressions.json";
let currentVocabMode = 'words';

// Quiz
let quizVocabulary = [];
let currentQuizQuestion = {};
let quizMode = "en-pt";
let quizVocabularyUsed = [];
let quizVocabularyActive = [];
let quizPoints = 0;
let quizErrors = 0;

// Grammar
let grammarActiveExercises = [];
let grammarUsedExercises = [];
let grammarPoints = 0;
let grammarErrors = 0;
let currentExerciseIndex = 0;
let currentGrammarTopic = null;
let grammarTopics = [];

// Phrasal Verbs
let phrasalVerbsOriginal = [];
let phrasalVerbsFiltrados = [];
let phrasalVerbsAtivos = [];
let phrasalVerbsUsados = [];
let currentPhrasalVerb = null;

// Spelling Bee
let spellingQueue = [];
let spellingQueueOriginal = [];
let currentSpellingObj = null;
let spellingPoints = 0;
let spellingErrors = 0;
let spellingReplaysLeft = Infinity;
let spellingReplaysLimit = Infinity;
let spellingGameActive = false;
let spellingHintUsed = false;
let spellingHintsAvailable = 0;
let spellingWordsSeen = new Set();

// URLs
const URL_PERGUNTAS = "english_questions_650.json";
const URL_VOCABULARIO = "english_vocabulary.json";
const URL_GRAMMAR = "english_grammar.json";
const URL_PHRASALVERBS = "phrasal_verbs.json";
const URL_SENTENCE_DATA = "sentence_builder.json";

// ============================================
// CARREGAMENTO DE DADOS
// ============================================
async function carregarDados() {
  try {
    const responseQuestions = await fetch(URL_PERGUNTAS);
    if (!responseQuestions.ok) throw new Error(`Failed to load questions from ${URL_PERGUNTAS}`);
    perguntasOriginais = await responseQuestions.json();

    const responseVocab = await fetch(URL_VOCABULARIO);
    if (!responseVocab.ok) throw new Error(`Failed to load vocabulary from ${URL_VOCABULARIO}`);
    vocabularioOriginal = await responseVocab.json();
    quizVocabulary = [...vocabularioOriginal];

    const responseIdioms = await fetch(URL_IDIOMATIC);
    if (!responseIdioms.ok) throw new Error(`Failed to load idioms from ${URL_IDIOMATIC}`);
    idiomaticExpressionsOriginal = await responseIdioms.json();

    const responseGrammar = await fetch(URL_GRAMMAR);
    if (!responseGrammar.ok) throw new Error(`Failed to load grammar from ${URL_GRAMMAR}`);
    const grammarData = await responseGrammar.json();
    grammarTopics = Array.isArray(grammarData) ? grammarData : grammarData.grammarTopics;

    const responsePhrasalVerbs = await fetch(URL_PHRASALVERBS);
    if (!responsePhrasalVerbs.ok) throw new Error(`Failed to load phrasal verbs from ${URL_PHRASALVERBS}`);
    phrasalVerbsOriginal = await responsePhrasalVerbs.json();

    inicializarInterface();
    filtrarPerguntas();
    filtrarVocabulario();
    filtrarQuizVocabulary();
    filtrarPhrasalVerbs();
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    const resultado = document.getElementById("resultado");
    if (resultado) {
      resultado.innerHTML = `
        <div class="error-message">
          <p>Erro ao carregar os dados. Verifique se os arquivos JSON estão na mesma pasta.</p>
          <p>Detalhes: ${error.message}</p>
        </div>
      `;
    }
  }
}

function inicializarInterface() {
  inicializarSelects();
  inicializarEventListeners();
  atualizarBotoes();
  preencherSelects();
  console.log("Interface inicializada com sucesso!");
}

function inicializarSelects() {
  const levelSelects = ['levelSelect', 'vocabLevelSelect', 'quizLevelSelect', 'phrasalLevelSelect'];

  const grammarSelect = document.getElementById('grammarSelect');
  if (grammarSelect) {
    grammarSelect.addEventListener('change', () => {
      const grammarDisplay = document.getElementById('grammarDisplay');
      if (grammarDisplay && grammarDisplay.style.display === 'block') mostrarGramatica();
      const grammarPractice = document.getElementById('grammarPractice');
      if (grammarPractice && grammarPractice.style.display === 'block') praticarGramatica();
    });
  }

  levelSelects.forEach(selectId => {
    const select = document.getElementById(selectId);
    if (!select) return;
    if (select.value === '') select.value = 'all';
    select.addEventListener('change', () => {
      atualizarBotoes();
      if (selectId === 'levelSelect') filtrarPerguntas();
      else if (selectId === 'vocabLevelSelect') filtrarVocabulario();
      else if (selectId === 'quizLevelSelect') filtrarQuizVocabulary();
      else if (selectId === 'phrasalLevelSelect') filtrarPhrasalVerbs();
    });
  });

  const timerToggle = document.getElementById('timerToggle');
  if (timerToggle) {
    timerToggle.addEventListener('input', () => {
      const value = parseInt(timerToggle.value) || 0;
      timerEnabled = value > 0;
      timerSeconds = value;
      atualizarBotoes();
    });
  }

  const grammarModeSelect = document.getElementById('grammarModeSelect');
  if (grammarModeSelect) {
    grammarModeSelect.addEventListener('change', () => {
      const gp = document.getElementById('grammarPractice');
      if (currentGrammarTopic && gp && gp.style.display === 'block') praticarGramatica();
    });
  }

  const quizModeSelect = document.getElementById('quizMode');
  if (quizModeSelect) {
    quizModeSelect.addEventListener('change', () => {
      quizMode = quizModeSelect.value;
      if (currentQuizQuestion && currentQuizQuestion.word) exibirQuizQuestion();
    });
  }

  const phrasalVerbSelect = document.getElementById('phrasalVerbSelect');
  if (phrasalVerbSelect) {
    phrasalVerbSelect.addEventListener('change', () => {
      filtrarPhrasalVerbs();
      atualizarBotoes();
    });
  }

  const vocabModeSelect = document.getElementById('vocabModeSelect');
  if (vocabModeSelect) {
    vocabModeSelect.addEventListener('change', () => {
      filtrarVocabulario();
      resetarVocabulario();
    });
  }

  // Spelling Bee selects
  const spellingLevelSelect = document.getElementById('spellingLevelSelect');
  if (spellingLevelSelect) {
    spellingLevelSelect.addEventListener('change', () => {
      if (spellingGameActive) iniciarSpellingBee();
    });
  }

  const spellingModeSelect = document.getElementById('spellingModeSelect');
  if (spellingModeSelect) {
    spellingModeSelect.addEventListener('change', () => {
      if (spellingGameActive) iniciarSpellingBee();
    });
  }

  const spellingReplaysSelect = document.getElementById('spellingReplays');
  if (spellingReplaysSelect) {
    spellingReplaysSelect.addEventListener('change', () => {
      if (spellingGameActive) iniciarSpellingBee();
    });
  }
}

function inicializarEventListeners() {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.id.replace('btnMode', '').toLowerCase();
      alternarModo(mode);
    });
  });

  const bind = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  };

  bind('btnSortear', sortearPergunta);
  bind('btnVocab', sortearVocabulario);
  bind('btnStartQuiz', iniciarQuiz);
  bind('btnDrawPhrasal', sortearPhrasalVerb);
  bind('btnVocabBack', voltarVocabulario);

  bind('btnResetar', resetarPerguntas);
  bind('btnVocabReset', resetarVocabulario);
  bind('btnPhrasalReset', resetarPhrasalVerbs);
  bind('btnShowTranslation', mostrarTraducao);
  bind('btnShowPhrasalMeaning', mostrarSignificadoPhrasal);
  bind('btnNextQuestion', proximaPerguntaQuiz);
  bind('btnSpeakVocab', () => falarTexto(document.getElementById('vocabWord')?.textContent));
  bind('btnSpeakQuiz', () => falarTexto(document.getElementById('quizWord')?.textContent));
  bind('btnSpeakPhrasal', () => falarTexto(document.getElementById('phrasalVerb')?.textContent));

  bind('btnShowGrammar', mostrarGramatica);
  bind('btnPracticeGrammar', praticarGramatica);
  bind('btnCheckExercise', verificarExercicio);
  bind('btnNextExercise', proximoExercicio);
  bind('btnResetExercises', resetarExercicios);

  bind('btnSave', salvarPergunta);
  bind('btnSaved', mostrarSalvas);

  bind('dismissNotification', () => {
    const el = document.getElementById('timeUpNotification');
    if (el) el.style.display = 'none';
  });

  // Spelling Bee
  bind('btnStartSpelling', iniciarSpellingBee);
  bind('btnPlaySpelling', () => tocarSpelling(false));
  bind('btnSlowSpelling', () => tocarSpelling(true));
  bind('btnHintSpelling', mostrarHintSpelling);
  bind('btnResetSpelling', resetarSpellingBee);
}

function preencherSelects() {
  const grammarSelect = document.getElementById('grammarSelect');
  if (grammarSelect && grammarTopics.length > 0) {
    grammarSelect.innerHTML = '<option value="">Select a grammar topic</option>';
    grammarSelect.innerHTML += '<option value="random">🎲 Random Topic</option>';
    grammarTopics.forEach(topic => {
      const option = document.createElement('option');
      option.value = topic.topic;
      option.textContent = topic.topic;
      grammarSelect.appendChild(option);
    });
  }

  const grammarModeSelect = document.getElementById('grammarModeSelect');
  if (grammarModeSelect) {
    grammarModeSelect.innerHTML = `
      <option value="all">All Modes</option>
      <option value="multiple_choice">Multiple Choice</option>
      <option value="fill_in">Fill in the Blanks</option>
      <option value="rewrite">Rewrite Sentences</option>
    `;
  }

  const phrasalVerbSelect = document.getElementById('phrasalVerbSelect');
  if (phrasalVerbSelect && phrasalVerbsOriginal.length > 0) {
    const mainVerbs = [...new Set(phrasalVerbsOriginal.map(pv => pv.verb))].sort();
    phrasalVerbSelect.innerHTML = '<option value="all">All Verbs</option>';
    mainVerbs.forEach(verb => {
      const option = document.createElement('option');
      option.value = verb;
      option.textContent = verb;
      phrasalVerbSelect.appendChild(option);
    });
  }
}

function atualizarBotoes() {
  const level = document.getElementById('levelSelect')?.value;
  const vocabLevel = document.getElementById('vocabLevelSelect')?.value;
  const quizLevel = document.getElementById('quizLevelSelect')?.value;
  const phrasalLevel = document.getElementById('phrasalLevelSelect')?.value;

  const setDisabled = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.disabled = val;
  };

  setDisabled('btnSortear', level === '' || level === undefined);
  setDisabled('btnVocab', vocabLevel === '' || vocabLevel === undefined);
  setDisabled('btnStartQuiz', quizLevel === '' || quizLevel === undefined);
  setDisabled('btnDrawPhrasal', phrasalLevel === '' || phrasalLevel === undefined);

  setDisabled('btnResetar', perguntasAtivas.length === 0);
  setDisabled('btnVocabReset', vocabularioAtivo.length === 0 && idiomaticExpressionsAtivo.length === 0);
  setDisabled('btnPhrasalReset', phrasalVerbsAtivos.length === 0);
}

function alternarModo(modo) {
  ['questions', 'vocabulary', 'quiz', 'grammar', 'phrasal', 'sentence', 'spelling'].forEach(m => {
    const el = document.getElementById(`${m}Controls`);
    if (el) el.style.display = 'none';
  });

  const target = document.getElementById(`${modo}Controls`);
  if (target) target.style.display = 'block';
  currentMode = modo;
  atualizarBotoes();

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// ============================================
// PERGUNTAS
// ============================================
function filtrarPerguntas() {
  const nivel = document.getElementById('levelSelect')?.value;
  if (!nivel) return;

  perguntasFiltradas = nivel === 'all'
    ? [...perguntasOriginais]
    : perguntasOriginais.filter(p => p && p.level && p.level.toUpperCase() === nivel.toUpperCase());

  perguntasAtivas = [...perguntasFiltradas];

  const resultado = document.getElementById("resultado");
  if (resultado) {
    resultado.innerHTML = perguntasFiltradas.length === 0
      ? `<div class="empty-message"><p>No questions available for ${nivel} level.</p></div>`
      : `<div class="empty-message">
           <p>Ready with ${perguntasFiltradas.length} questions for ${nivel} level</p>
           <p>Click "Draw Question" to begin</p>
         </div>`;
  }

  atualizarBotoes();
}

function sortearPergunta() {
  if (perguntasAtivas.length === 0) {
    const resultado = document.getElementById("resultado");
    if (resultado) {
      resultado.innerHTML = `
        <div class="empty-message">
          <p>No questions available for the selected level.</p>
          <button class="reset-btn" onclick="resetarPerguntas()">Reset Questions</button>
        </div>`;
    }
    return;
  }

  const indiceSorteado = Math.floor(Math.random() * perguntasAtivas.length);
  currentQuestion = perguntasAtivas[indiceSorteado];
  perguntasAtivas.splice(indiceSorteado, 1);
  exibirPergunta(currentQuestion);

  if (timerEnabled) iniciarTimer();
  atualizarBotoes();
}

function exibirPergunta(pergunta) {
  const resultadoDiv = document.getElementById("resultado");
  if (!resultadoDiv) return;

  resultadoDiv.innerHTML = `
    <div class="difficulty ${pergunta.level}">${pergunta.level}</div>
    <div class="question-text">${pergunta.question}</div>
    <button id="btnSpeakQuestion" class="secondary-button" style="margin-top:10px;">
      🔊 Ouvir Pergunta
    </button>
  `;

  const btnSpeak = document.getElementById("btnSpeakQuestion");
  if (btnSpeak) btnSpeak.onclick = () => falarTexto(pergunta.question, 'en-US');

  if (pergunta.example) {
    resultadoDiv.innerHTML += `
      <div class="vocab-example">
        <strong>Example:</strong> ${pergunta.example}
      </div>
    `;
  }
}

function resetarPerguntas() {
  filtrarPerguntas();
  const resultado = document.getElementById("resultado");
  if (resultado) {
    resultado.innerHTML = `
      <div class="empty-message">
        <p>Questions have been reset.</p>
        <p>${perguntasAtivas.length} questions available for selected level.</p>
      </div>
    `;
  }
  atualizarBotoes();
}

// ============================================
// VOCABULÁRIO
// ============================================
function filtrarVocabulario() {
  const nivel = document.getElementById('vocabLevelSelect')?.value;
  const vocabMode = document.getElementById('vocabModeSelect')?.value;
  if (!nivel || !vocabMode) return;

  if (vocabMode === 'words') {
    vocabularioFiltrado = nivel === 'all'
      ? [...vocabularioOriginal]
      : vocabularioOriginal.filter(v => v && v.level === nivel);

    vocabularioAtivo = [...vocabularioFiltrado];
    vocabularioUsado = [];
    vocabularioHistorico = [];
    currentVocabIndex = 0;

    if (vocabularioFiltrado.length === 0) {
      const card = document.getElementById('vocabCard');
      if (card) card.style.display = 'none';
    }
  } else {
    filtrarIdiomaticExpressions();
  }

  atualizarBotoes();
}

function sortearVocabulario() {
  const vocabMode = document.getElementById('vocabModeSelect')?.value;
  currentVocabMode = vocabMode;
  if (vocabMode === 'words') sortearPalavra();
  else sortearIdiomaticExpression();
}

function sortearPalavra() {
  if (vocabularioAtivo.length === 0) {
    const card = document.getElementById('vocabCard');
    if (card) card.style.display = 'none';
    const vocabularyControls = document.getElementById('vocabularyControls');
    if (vocabularyControls && !vocabularyControls.querySelector('.empty-message')) {
      vocabularyControls.insertAdjacentHTML('beforeend', `
        <div class="empty-message">
          <p>No more words left. Click "Reset Vocabulary" to start again.</p>
        </div>
      `);
    }
    return;
  }

  const indiceSorteado = Math.floor(Math.random() * vocabularioAtivo.length);
  const palavraSorteada = vocabularioAtivo[indiceSorteado];
  if (!palavraSorteada) {
    alert('Error: Invalid vocabulary item.');
    return;
  }

  vocabularioAtivo.splice(indiceSorteado, 1);
  vocabularioUsado.push(palavraSorteada);
  vocabularioHistorico.push(palavraSorteada);

  exibirVocabulario(palavraSorteada);
  atualizarBotoes();
}

function voltarVocabulario() {
  const vocabMode = document.getElementById('vocabModeSelect')?.value;
  if (vocabMode === 'words') {
    if (vocabularioHistorico.length < 2) {
      alert("No previous word to return to.");
      return;
    }
    vocabularioHistorico.pop();
    exibirVocabulario(vocabularioHistorico[vocabularioHistorico.length - 1]);
  } else {
    if (idiomaticExpressionHistorico.length < 2) {
      alert("No previous idiom to return to.");
      return;
    }
    idiomaticExpressionHistorico.pop();
    exibirIdiomaticExpression(idiomaticExpressionHistorico[idiomaticExpressionHistorico.length - 1]);
  }
}

function resetarVocabulario() {
  const vocabMode = document.getElementById('vocabModeSelect')?.value;
  if (vocabMode === 'words') resetarPalavras();
  else resetarIdiomaticExpressions();
}

function resetarPalavras() {
  const nivel = document.getElementById('vocabLevelSelect')?.value;
  vocabularioAtivo = nivel === 'all'
    ? [...vocabularioOriginal]
    : vocabularioOriginal.filter(v => v.level === nivel);

  vocabularioUsado = [];
  currentVocabIndex = 0;
  vocabularioHistorico = [];

  const card = document.getElementById('vocabCard');
  if (card) card.style.display = 'none';

  const emptyMessage = document.querySelector('#vocabularyControls .empty-message');
  if (emptyMessage) emptyMessage.remove();

  atualizarBotoes();

  const vocabularyControls = document.getElementById('vocabularyControls');
  if (vocabularyControls && !vocabularyControls.querySelector('.empty-message')) {
    const resetMessage = document.createElement('div');
    resetMessage.className = 'empty-message';
    resetMessage.innerHTML = `
      <p>Vocabulary has been reset.</p>
      <p>Click "Practice" to draw a new word.</p>
    `;
    vocabularyControls.appendChild(resetMessage);
  }
}

function mostrarTraducao() {
  const translationElement = document.getElementById('vocabTranslation');
  if (translationElement) {
    translationElement.style.display = translationElement.style.display === 'none' ? 'block' : 'none';
  }
  const definitionElement = document.getElementById('vocabDefinition');
  if (definitionElement) {
    definitionElement.style.display = definitionElement.style.display === 'none' ? 'block' : 'none';
  }
}

function exibirVocabulario(vocab) {
  const vocabCard = document.getElementById('vocabCard');
  if (!vocabCard) return;
  vocabCard.style.display = 'block';

  const levelEl = document.getElementById('vocabLevel');
  if (levelEl) {
    levelEl.className = `difficulty ${vocab.level}`;
    levelEl.textContent = vocab.level;
  }
  const wordEl = document.getElementById('vocabWord');
  if (wordEl) wordEl.textContent = vocab.word;
  const transEl = document.getElementById('vocabTranslation');
  if (transEl) transEl.textContent = vocab.translation;

  const defEl = document.getElementById('vocabDefinition');
  if (defEl) {
    defEl.innerHTML = `
      <strong>English:</strong> ${vocab.definition_en || '—'}<br>
      <strong>Português:</strong> ${vocab.definition_pt || '—'}
    `;
  }

  let exemploDestacado = vocab.example || '';
  if (vocab.word && vocab.example) {
    const regex = new RegExp(`\\b${vocab.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    exemploDestacado = vocab.example.replace(regex, `<span class="vocab-highlight">$&</span>`);
  }
  const exEl = document.getElementById('vocabExample');
  if (exEl) exEl.innerHTML = `Example: ${exemploDestacado}`;
  if (transEl) transEl.style.display = 'none';

  setTimeout(() => addVoiceToVocabulary(), 100);
}

// ============================================
// IDIOMATIC EXPRESSIONS
// ============================================
function filtrarIdiomaticExpressions() {
  const nivel = document.getElementById('vocabLevelSelect')?.value;
  idiomaticExpressionsAtivo = nivel === 'all'
    ? [...idiomaticExpressionsOriginal]
    : idiomaticExpressionsOriginal.filter(exp => exp && exp.level === nivel);

  idiomaticExpressionsUsado = [];
  currentIdiom = null;
  idiomaticExpressionHistorico = [];
  atualizarBotoes();

  if (idiomaticExpressionsAtivo.length === 0) {
    const card = document.getElementById('vocabCard');
    if (card) card.style.display = 'none';
    const vocabularyControls = document.getElementById('vocabularyControls');
    if (vocabularyControls && !vocabularyControls.querySelector('.empty-message')) {
      vocabularyControls.insertAdjacentHTML('beforeend', `
        <div class="empty-message">
          <p>No idiomatic expressions found for ${nivel} level.</p>
        </div>
      `);
    }
  }
}

function sortearIdiomaticExpression() {
  if (idiomaticExpressionsAtivo.length === 0) {
    const card = document.getElementById('vocabCard');
    if (card) card.style.display = 'none';
    const vocabularyControls = document.getElementById('vocabularyControls');
    if (vocabularyControls && !vocabularyControls.querySelector('.empty-message')) {
      vocabularyControls.insertAdjacentHTML('beforeend', `
        <div class="empty-message">
          <p>No more idioms left. Click "Reset" to start again.</p>
        </div>
      `);
    }
    return;
  }

  const indiceSorteado = Math.floor(Math.random() * idiomaticExpressionsAtivo.length);
  currentIdiom = idiomaticExpressionsAtivo[indiceSorteado];
  idiomaticExpressionsAtivo.splice(indiceSorteado, 1);
  idiomaticExpressionsUsado.push(currentIdiom);
  idiomaticExpressionHistorico.push(currentIdiom);
  exibirIdiomaticExpression(currentIdiom);
  atualizarBotoes();
}

function exibirIdiomaticExpression(idiom) {
  const vocabCard = document.getElementById('vocabCard');
  if (!vocabCard) return;
  vocabCard.style.display = 'block';

  const levelEl = document.getElementById('vocabLevel');
  if (levelEl) {
    levelEl.className = `difficulty ${idiom.level}`;
    levelEl.textContent = idiom.level;
  }
  const wordEl = document.getElementById('vocabWord');
  if (wordEl) wordEl.textContent = idiom.expression;
  const transEl = document.getElementById('vocabTranslation');
  if (transEl) transEl.textContent = idiom.translation;

  const defEl = document.getElementById('vocabDefinition');
  if (defEl) {
    defEl.innerHTML = `
      <strong>English:</strong> ${idiom.definition_en || '—'}<br>
      <strong>Português:</strong> ${idiom.definition_pt || '—'}
    `;
  }

  let exemploDestacado = idiom.example || '';
  if (idiom.expression && idiom.example) {
    const safeExpr = idiom.expression.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${safeExpr}\\b`, 'gi');
    exemploDestacado = idiom.example.replace(regex, `<span class="vocab-highlight">$&</span>`);
  }
  const exEl = document.getElementById('vocabExample');
  if (exEl) exEl.innerHTML = `Example: ${exemploDestacado}`;
  if (transEl) transEl.style.display = 'none';

  setTimeout(() => addVoiceToVocabulary(), 100);
}

function resetarIdiomaticExpressions() {
  const nivel = document.getElementById('vocabLevelSelect')?.value;
  idiomaticExpressionsAtivo = nivel === 'all'
    ? [...idiomaticExpressionsOriginal]
    : idiomaticExpressionsOriginal.filter(exp => exp.level === nivel);

  idiomaticExpressionsUsado = [];
  idiomaticExpressionHistorico = [];
  currentIdiom = null;

  const card = document.getElementById('vocabCard');
  if (card) card.style.display = 'none';

  const emptyMessage = document.querySelector('#vocabularyControls .empty-message');
  if (emptyMessage) emptyMessage.remove();

  atualizarBotoes();

  const vocabularyControls = document.getElementById('vocabularyControls');
  if (vocabularyControls && !vocabularyControls.querySelector('.empty-message')) {
    const resetMessage = document.createElement('div');
    resetMessage.className = 'empty-message';
    resetMessage.innerHTML = `
      <p>Idiomatic expressions have been reset.</p>
      <p>Click "Practice" to draw a new expression.</p>
    `;
    vocabularyControls.appendChild(resetMessage);
  }
}

// ============================================
// QUIZ
// ============================================
function filtrarQuizVocabulary() {
  const nivel = document.getElementById('quizLevelSelect')?.value;
  if (!nivel) return;

  quizVocabularyActive = nivel === 'all'
    ? [...quizVocabulary]
    : quizVocabulary.filter(v => v.level === nivel);

  quizVocabularyUsed = [];
  quizPoints = 0;
  quizErrors = 0;
  atualizarPontuacaoQuiz();

  const quizContainer = document.getElementById('quizContainer');
  if (quizContainer) {
    quizContainer.innerHTML = `
      <div class="empty-message">
        <p>Vocabulary quiz ready.</p>
        <p>Click "Start Quiz" to begin.</p>
      </div>
    `;
  }

  atualizarBotoes();
}

function iniciarQuiz() {
  if (quizVocabularyActive.length === 0) {
    const nivel = document.getElementById('quizLevelSelect')?.value;
    quizVocabularyActive = quizVocabulary.filter(v => nivel === 'all' || v.level === nivel);
    quizVocabularyUsed = [];

    if (quizVocabularyActive.length === 0) {
      const quizContainer = document.getElementById('quizContainer');
      if (quizContainer) {
        quizContainer.innerHTML = `
          <div class="empty-message">
            <p>No vocabulary available for this level.</p>
          </div>
        `;
      }
      return;
    }
  }

  const indiceSorteado = Math.floor(Math.random() * quizVocabularyActive.length);
  currentQuizQuestion = quizVocabularyActive[indiceSorteado];
  quizVocabularyActive.splice(indiceSorteado, 1);
  quizVocabularyUsed.push(currentQuizQuestion);

  exibirQuizQuestion();

  const btnNext = document.getElementById('btnNextQuestion');
  if (btnNext) btnNext.disabled = false;

  atualizarBotoes();
}

function exibirQuizQuestion() {
  const quizContainer = document.getElementById('quizContainer');
  if (!quizContainer || !currentQuizQuestion) return;

  const opcoes = gerarOpcoesQuiz(currentQuizQuestion);
  let palavraPergunta = '';

  if (quizMode === 'en-pt') palavraPergunta = currentQuizQuestion.word;
  else if (quizMode === 'pt-en') palavraPergunta = currentQuizQuestion.translation;
  else palavraPergunta = currentQuizQuestion.word;

  let opcoesHTML = '';
  opcoes.forEach((opcao) => {
    opcoesHTML += `
      <button class="quiz-btn" data-answer="${opcao.value.replace(/"/g, '&quot;')}" onclick="verificarRespostaQuiz(this.dataset.answer)">
        ${opcao.text}
      </button>
    `;
  });

  quizContainer.innerHTML = `
    <div class="quiz-question-area" id="quizQuestionArea">
      <div class="difficulty ${currentQuizQuestion.level}">${currentQuizQuestion.level}</div>
      <div class="vocab-word" id="quizWord">${palavraPergunta}</div>
    </div>
    <div class="quiz-options">${opcoesHTML}</div>
    <div class="quiz-feedback" id="quizFeedback"></div>
  `;

  const btnSpeak = document.getElementById("btnSpeakQuiz");
  if (btnSpeak) btnSpeak.onclick = () => falarTexto(palavraPergunta, 'en-US');
}

function gerarOpcoesQuiz(palavraCorreta) {
  let outrasPalavras = [];

  if (quizMode === 'en-pt') {
    outrasPalavras = quizVocabulary
      .filter(v => v.translation !== palavraCorreta.translation)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(v => v.translation);
  } else if (quizMode === 'pt-en') {
    outrasPalavras = quizVocabulary
      .filter(v => v.word !== palavraCorreta.word)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(v => v.word);
  } else {
    outrasPalavras = quizVocabulary
      .filter(v => v.definition_en !== palavraCorreta.definition_en)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(v => v.definition_en);
  }

  let todasOpcoes;
  if (quizMode === 'en-pt') todasOpcoes = [palavraCorreta.translation, ...outrasPalavras];
  else if (quizMode === 'pt-en') todasOpcoes = [palavraCorreta.word, ...outrasPalavras];
  else todasOpcoes = [palavraCorreta.definition_en, ...outrasPalavras];

  todasOpcoes = todasOpcoes.sort(() => 0.5 - Math.random());
  return todasOpcoes.map(opcao => ({ value: opcao, text: opcao }));
}

function verificarRespostaQuiz(respostaSelecionada) {
  const feedbackElement = document.getElementById('quizFeedback');
  const botoes = document.querySelectorAll('.quiz-btn');
  botoes.forEach(botao => { botao.disabled = true; });

  let respostaCerta;
  if (quizMode === 'en-pt') respostaCerta = currentQuizQuestion.translation;
  else if (quizMode === 'pt-en') respostaCerta = currentQuizQuestion.word;
  else respostaCerta = currentQuizQuestion.definition_en;

  if (respostaSelecionada === respostaCerta) {
    if (feedbackElement) {
      feedbackElement.textContent = 'Correct! 🎉';
      feedbackElement.className = 'quiz-feedback correct';
    }
    quizPoints++;
    botoes.forEach(botao => {
      if (botao.dataset.answer === respostaCerta) botao.classList.add('correct');
    });
  } else {
    if (feedbackElement) {
      feedbackElement.textContent = `Incorrect! The correct answer is: ${respostaCerta}`;
      feedbackElement.className = 'quiz-feedback incorrect';
    }
    quizErrors++;
    botoes.forEach(botao => {
      if (botao.dataset.answer === respostaSelecionada) botao.classList.add('incorrect');
      if (botao.dataset.answer === respostaCerta) botao.classList.add('correct');
    });
  }

  atualizarPontuacaoQuiz();

  setTimeout(() => {
    if (quizVocabularyActive.length > 0 || quizVocabularyUsed.length > 0) proximaPerguntaQuiz();
  }, 2000);
}

function atualizarPontuacaoQuiz() {
  const p = document.getElementById('quizPoints');
  const e = document.getElementById('quizErrors');
  const t = document.getElementById('quizTotal');
  if (p) p.textContent = quizPoints;
  if (e) e.textContent = quizErrors;
  if (t) t.textContent = quizPoints + quizErrors;
}

function proximaPerguntaQuiz() {
  const feedbackElement = document.getElementById('quizFeedback');
  const questionArea = document.getElementById('quizQuestionArea');

  if (feedbackElement) {
    feedbackElement.textContent = '';
    feedbackElement.className = 'quiz-feedback';
  }

  document.querySelectorAll('.quiz-btn').forEach(botao => {
    botao.classList.remove('correct', 'incorrect');
    botao.disabled = false;
  });

  if (questionArea) questionArea.classList.remove('correct-area', 'incorrect-area');

  if (quizVocabularyActive.length === 0) {
    const quizContainer = document.getElementById('quizContainer');
    if (quizContainer) {
      quizContainer.innerHTML = `
        <div class="empty-message">
          <p>Quiz completed!</p>
          <p>Final score: ${quizPoints} correct out of ${quizPoints + quizErrors}</p>
          <button class="reset-btn" onclick="filtrarQuizVocabulary()">Restart Quiz</button>
        </div>
      `;
    }
    const btnNext = document.getElementById('btnNextQuestion');
    if (btnNext) btnNext.disabled = true;
  } else {
    iniciarQuiz();
  }
}

// ============================================
// GRAMÁTICA
// ============================================
function mostrarGramatica() {
  const topicSelect = document.getElementById('grammarSelect');
  if (!topicSelect) return;
  const selectedTopic = topicSelect.value;

  let topic;
  if (currentGrammarTopic) {
    topic = currentGrammarTopic;
  } else if (selectedTopic === 'random') {
    const randomIndex = Math.floor(Math.random() * grammarTopics.length);
    topic = grammarTopics[randomIndex];
  } else {
    topic = grammarTopics.find(t => t.topic === selectedTopic);
  }

  if (!topic) return;

  const grammarDisplay = document.getElementById('grammarDisplay');
  if (!grammarDisplay) return;

  grammarDisplay.innerHTML = `
    <div style="margin-bottom:15px;">
      <button id="btnVoltarExercicio" class="secondary-button">⬅️ Voltar para Exercício</button>
    </div>
    <h3>${topic.topic}</h3>
    <div class="grammar-explanation">
      <p><strong>Explanation:</strong> ${topic.explanation}</p>
    </div>
    ${topic.rules ? `
      <div class="grammar-rules">
        <p><strong>Rules:</strong></p>
        <ul>${topic.rules.map(rule => `<li>${rule}</li>`).join('')}</ul>
      </div>
    ` : ''}
    <div class="grammar-examples">
      <p><strong>Examples:</strong></p>
      <ul>${topic.examples.map(ex => `<li>${ex}</li>`).join('')}</ul>
    </div>
  `;

  const gp = document.getElementById('grammarPractice');
  if (gp) gp.style.display = 'none';
  grammarDisplay.style.display = 'block';

  const btnVoltar = document.getElementById('btnVoltarExercicio');
  if (btnVoltar) {
    btnVoltar.addEventListener('click', () => {
      grammarDisplay.style.display = 'none';
      if (gp) gp.style.display = 'block';
    });
  }
}

function praticarGramatica() {
  const topicSelect = document.getElementById('grammarSelect');
  const modeSelect = document.getElementById('grammarModeSelect');
  if (!topicSelect) return;

  const selectedTopic = topicSelect.value;
  const selectedMode = modeSelect ? modeSelect.value : 'all';

  if (!selectedTopic) {
    alert('Please select a grammar topic first.');
    return;
  }

  if (selectedTopic === 'random') {
    const randomIndex = Math.floor(Math.random() * grammarTopics.length);
    currentGrammarTopic = grammarTopics[randomIndex];
  } else {
    currentGrammarTopic = grammarTopics.find(t => t.topic === selectedTopic);
  }

  if (!currentGrammarTopic) return;

  if (!currentGrammarTopic.exercises || currentGrammarTopic.exercises.length === 0) {
    alert('No exercises available for this topic.');
    return;
  }

  let exerciciosFiltrados = filtrarExerciciosPorModo(currentGrammarTopic.exercises, selectedMode);
  if (exerciciosFiltrados.length === 0) {
    alert(`No ${selectedMode} exercises available for this topic.`);
    return;
  }

  grammarActiveExercises = [...exerciciosFiltrados];
  grammarUsedExercises = [];
  grammarPoints = 0;
  grammarErrors = 0;
  currentExerciseIndex = 0;
  atualizarPontuacaoGrammar();

  const gp = document.getElementById('grammarPractice');
  const gd = document.getElementById('grammarDisplay');
  if (gp) gp.style.display = 'block';
  if (gd) gd.style.display = 'none';

  iniciarExercicios(grammarActiveExercises);
  gerenciarBotaoCheckExercicio();
}

function iniciarExercicios(exercises) {
  const exerciseContainer = document.getElementById('exerciseContainer');
  if (!exerciseContainer) return;
  const topicSelect = document.getElementById('grammarSelect');
  const selectedTopic = topicSelect ? topicSelect.value : '';

  if (currentExerciseIndex >= exercises.length) currentExerciseIndex = 0;

  const exercise = exercises[currentExerciseIndex];
  if (!exercise) {
    console.error('No exercise found at index', currentExerciseIndex);
    return;
  }

  exerciseContainer.innerHTML = '';

  let modeDisplay = '';
  if (selectedTopic === 'random' && currentGrammarTopic) {
    modeDisplay = `<div class="exercise-mode">Current Topic: ${currentGrammarTopic.topic}</div>`;
  } else if (exercise.mode) {
    modeDisplay = `<div class="exercise-mode">${exercise.mode.toUpperCase()}</div>`;
  }

  if (exercise.mode === 'rewrite') {
    criarExercicioComUmaCaixa(exercise, modeDisplay);
  } else if (exercise.question && exercise.question.includes('_____')) {
    criarExercicioComLacunas(exercise, modeDisplay);
  } else if (exercise.question && exercise.question.includes('_')) {
    criarExercicioComCaixasPorGrupo(exercise, modeDisplay);
  } else {
    criarExercicioComUmaCaixa(exercise, modeDisplay);
  }

  const nextBtn = document.getElementById('btnNextExercise');
  if (nextBtn) nextBtn.disabled = false;
}

function criarExercicioComLacunas(exercise, modeDisplay = '') {
  const parts = exercise.question.split('_____');
  const numGaps = parts.length - 1;

  let answers;
  if (Array.isArray(exercise.answer)) answers = exercise.answer;
  else answers = typeof exercise.answer === 'string' ? exercise.answer.split(',') : [exercise.answer];

  let questionHTML = `
    ${modeDisplay}
    <div class="exercise-title">${exercise.instruction || 'Complete the sentence'}</div>
    <div class="exercise-content" style="font-size: 1rem; line-height: 1.6;">
  `;

  parts.forEach((part, index) => {
    questionHTML += `<span>${part}</span>`;
    if (index < numGaps) {
      const answerValue = answers[index] ? String(answers[index]).trim() : '';
      questionHTML += `
        <input type="text" class="gap-input" data-index="${index}" 
               data-answer="${answerValue.replace(/"/g, '&quot;')}"
               style="min-width: 150px; width: 150px; padding: 8px 12px; 
                      margin: 0 5px; border: 2px solid #8A2BE2; border-radius: 6px;
                      font-size: 0.95rem;"
               placeholder="________" oninput="ajustarLarguraInput(this)">
      `;
    }
  });

  questionHTML += `</div>`;

  const exerciseContainer = document.getElementById('exerciseContainer');
  if (!exerciseContainer) return;

  exerciseContainer.innerHTML = questionHTML + `
    <div class="exercise-buttons" style="margin-top: 20px; text-align: center;">
      <button class="check-btn" id="inlineCheckBtn" style="padding: 10px 20px;">✓ Verificar Resposta</button>
    </div>
    <div class="exercise-feedback" id="exerciseFeedback"></div>
    <div class="exercise-answer" id="exerciseCorrectAnswer" style="display: none;">
      <strong>Resposta correta:</strong> <span>${answers.join(', ')}</span>
    </div>
  `;

  const gapInputs = document.querySelectorAll('.gap-input');
  gapInputs.forEach((input, idx) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        verificarExercicioComLacunas(exercise.answer);
      }
      if (e.key === 'Tab' && idx < gapInputs.length - 1) {
        e.preventDefault();
        gapInputs[idx + 1].focus();
      }
    });
  });

  const inlineBtn = document.getElementById('inlineCheckBtn');
  if (inlineBtn) inlineBtn.onclick = () => verificarExercicioComLacunas(exercise.answer);

  if (gapInputs.length > 0) setTimeout(() => gapInputs[0].focus(), 100);
}

function criarExercicioComCaixasPorGrupo(exercise) {
  const regex = /(_{2,})/g;
  const parts = exercise.question.split(regex);

  let questionHTML = `
    <div class="exercise-title">${exercise.instruction || ''}</div>
    <div class="exercise-content" style="font-size: 1.1rem; line-height: 1.6; display: flex; flex-wrap: wrap; align-items: center;">
  `;

  let gapCount = 0;
  let answers;
  if (Array.isArray(exercise.answer)) answers = exercise.answer;
  else answers = typeof exercise.answer === 'string' ? exercise.answer.split(',') : [exercise.answer];

  parts.forEach(part => {
    if (part.startsWith('_') && part.length >= 2) {
      const answerValue = answers[gapCount] ? String(answers[gapCount]).trim() : '';
      questionHTML += `
        <input type="text" class="gap-input" data-index="${gapCount}" 
               data-answer="${answerValue.replace(/"/g, '&quot;')}"
               style="min-width: 120px; width: 120px; padding: 8px 12px; 
                      margin: 0 5px; border: 2px solid #8A2BE2; border-radius: 6px;"
               placeholder="________" oninput="ajustarLarguraInput(this)">
      `;
      gapCount++;
    } else {
      questionHTML += `<span class="sentence-text">${part}</span>`;
    }
  });

  const answerDisplay = Array.isArray(exercise.answer) ? exercise.answer.join(', ') : exercise.answer;
  questionHTML += `</div>`;

  const exerciseContainer = document.getElementById('exerciseContainer');
  if (!exerciseContainer) return;

  exerciseContainer.innerHTML = questionHTML + `
    <div class="exercise-buttons" style="margin-top: 20px; text-align: center;">
      <button class="check-btn" id="inlineCheckBtn" style="padding: 10px 20px;">✓ Verificar Resposta</button>
    </div>
    <div class="exercise-feedback" id="exerciseFeedback"></div>
    <div class="exercise-answer" id="exerciseCorrectAnswer" style="display: none;">
      <strong>Resposta correta:</strong> <span>${answerDisplay}</span>
    </div>
  `;

  const gapInputs = document.querySelectorAll('.gap-input');
  gapInputs.forEach((input) => {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        verificarExercicioComCaixas(exercise.answer);
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        const nextIndex = parseInt(this.dataset.index) + 1;
        const nextInput = document.querySelector(`.gap-input[data-index="${nextIndex}"]`);
        if (nextInput) nextInput.focus();
      }
    });
  });

  const inlineBtn = document.getElementById('inlineCheckBtn');
  if (inlineBtn) inlineBtn.onclick = () => verificarExercicioComCaixas(exercise.answer);

  if (gapInputs.length > 0) setTimeout(() => gapInputs[0].focus(), 100);
}

function criarExercicioComUmaCaixa(exercise, modeDisplay = '') {
  const exerciseContainer = document.getElementById('exerciseContainer');
  if (!exerciseContainer) return;

  const possibleAnswers = obterRespostasValidas(exercise.answer);
  const answerText = possibleAnswers.join(' ou ');

  exerciseContainer.innerHTML = `
    ${modeDisplay}
    <div class="exercise-title">${exercise.instruction || ''}</div>
    <div class="exercise-content">
      <div class="exercise-question">${exercise.question}</div>
      <div class="exercise-input-container">
        <input type="text" id="exerciseAnswer" 
               placeholder="Digite sua resposta aqui..." 
               class="exercise-input"
               style="width: 100%; padding: 12px; margin: 10px 0; border: 2px solid #8A2BE2; border-radius: 8px; font-size: 16px;">
      </div>
    </div>
    <div class="exercise-buttons" style="margin-top: 20px; text-align: center;">
      <button class="check-btn" id="inlineCheckBtn" style="padding: 12px 24px; font-size: 16px;">
        ✓ Verificar Resposta
      </button>
    </div>
    <div class="exercise-feedback" id="exerciseFeedback" style="margin-top: 15px;"></div>
    <div class="exercise-answer" id="exerciseCorrectAnswer" style="display: none; margin-top: 15px;">
      <strong>Resposta correta:</strong> <span>${answerText}</span>
    </div>
  `;

  const inlineBtn = document.getElementById('inlineCheckBtn');
  if (inlineBtn) inlineBtn.onclick = () => verificarExercicio();

  const input = document.getElementById('exerciseAnswer');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        verificarExercicio();
      }
    });
    setTimeout(() => input.focus(), 100);
  }
}

function obterRespostasValidas(answer) {
  let possibleAnswers = [];
  if (Array.isArray(answer)) {
    possibleAnswers = answer.map(a => String(a).trim());
  } else if (typeof answer === 'string') {
    possibleAnswers = answer.split('/').map(a => a.trim());
  } else {
    possibleAnswers = [''];
  }
  return possibleAnswers.filter(a => a !== '');
}

function verificarExercicioComLacunas(correctAnswer) {
  const gapInputs = document.querySelectorAll('.gap-input');
  if (gapInputs.length === 0) return;

  const answers = Array.isArray(correctAnswer) ? correctAnswer : String(correctAnswer).split(',');
  let allCorrect = true;
  const userAnswers = [];

  gapInputs.forEach((input, index) => {
    const userAnswer = input.value.trim().toLowerCase();
    userAnswers.push(userAnswer);
    const possibleAnswers = answers[index] ? String(answers[index]).trim().toLowerCase().split('/') : [''];
    const isCorrect = possibleAnswers.some(correct => userAnswer === correct.trim());

    if (isCorrect) {
      input.style.borderColor = '#4CAF50';
      input.style.backgroundColor = 'rgba(76,175,80,0.1)';
    } else {
      input.style.borderColor = '#F44336';
      input.style.backgroundColor = 'rgba(244,67,54,0.1)';
      allCorrect = false;
    }
    input.disabled = true;
  });

  const correctEl = document.getElementById('exerciseCorrectAnswer');
  const feedbackElement = document.getElementById('exerciseFeedback');

  if (allCorrect) {
    grammarPoints++;
    grammarActiveExercises.splice(currentExerciseIndex, 1);
    if (correctEl) correctEl.style.display = 'none';
    if (feedbackElement) {
      feedbackElement.innerHTML = '<span style="color:#4CAF50;font-weight:600;">✅ Correto! Excelente!</span>';
      feedbackElement.className = 'exercise-feedback correct';
    }
  } else {
    grammarErrors++;
    const errado = grammarActiveExercises.splice(currentExerciseIndex, 1)[0];
    grammarActiveExercises.push(errado);

    const respostasFormatadas = answers.map((a, idx) => {
      const answerStr = String(a);
      const userAnswer = userAnswers[idx] || '(vazio)';
      return `<div style="margin: 5px 0;">
        <strong>Campo ${idx + 1}:</strong> Sua resposta: "${userAnswer}" | Correto: ${answerStr.replace(/\//g, ' ou ')}
      </div>`;
    }).join('');

    if (correctEl) {
      correctEl.style.display = 'block';
      correctEl.innerHTML = `<strong>Respostas corretas:</strong><br>${respostasFormatadas}`;
    }
    if (feedbackElement) {
      feedbackElement.innerHTML = '<span style="color:#F44336;font-weight:600;">❌ Incorreto. Você verá este exercício novamente.</span>';
      feedbackElement.className = 'exercise-feedback incorrect';
    }
  }

  atualizarPontuacaoGrammar();

  const inlineBtn = document.getElementById('inlineCheckBtn');
  if (inlineBtn) inlineBtn.disabled = true;

  setTimeout(() => proximoExercicio(), allCorrect ? 1500 : 3000);
}

function verificarExercicioComCaixas(correctAnswer) {
  const gapInputs = document.querySelectorAll('.gap-input');
  if (gapInputs.length === 0) return;

  const answers = Array.isArray(correctAnswer) ? correctAnswer : String(correctAnswer).split(',');
  let allCorrect = true;
  const userAnswers = [];

  gapInputs.forEach((input, index) => {
    const userAnswer = input.value.trim().toLowerCase();
    userAnswers.push(userAnswer);
    const possibleAnswers = answers[index] ? String(answers[index]).trim().toLowerCase().split('/') : [''];
    const isCorrect = possibleAnswers.some(correct => userAnswer === correct.trim());

    if (isCorrect) {
      input.style.borderColor = '#4CAF50';
      input.style.backgroundColor = 'rgba(76,175,80,0.1)';
    } else {
      input.style.borderColor = '#F44336';
      input.style.backgroundColor = 'rgba(244,67,54,0.1)';
      allCorrect = false;
    }
    input.disabled = true;
  });

  const correctEl = document.getElementById('exerciseCorrectAnswer');
  const feedbackElement = document.getElementById('exerciseFeedback');

  if (allCorrect) {
    grammarPoints++;
    grammarActiveExercises.splice(currentExerciseIndex, 1);
    if (correctEl) correctEl.style.display = 'none';
    if (feedbackElement) {
      feedbackElement.innerHTML = '<span style="color:#4CAF50;font-weight:600;">✅ Correto! Parabéns!</span>';
      feedbackElement.className = 'exercise-feedback correct';
    }
  } else {
    grammarErrors++;
    const errado = grammarActiveExercises.splice(currentExerciseIndex, 1)[0];
    grammarActiveExercises.push(errado);

    const respostasFormatadas = answers.map((a, idx) => {
      const answerStr = String(a);
      const userAnswer = userAnswers[idx] || '(vazio)';
      return `<div style="margin: 5px 0;">
        <strong>Campo ${idx + 1}:</strong> Sua resposta: "${userAnswer}" | Correto: ${answerStr.replace(/\//g, ' ou ')}
      </div>`;
    }).join('');

    if (correctEl) {
      correctEl.style.display = 'block';
      correctEl.innerHTML = `<strong>Respostas corretas:</strong><br>${respostasFormatadas}`;
    }
    if (feedbackElement) {
      feedbackElement.innerHTML = '<span style="color:#F44336;font-weight:600;">❌ Algumas respostas estão incorretas.</span>';
      feedbackElement.className = 'exercise-feedback incorrect';
    }
  }

  atualizarPontuacaoGrammar();
  const inlineBtn = document.getElementById('inlineCheckBtn');
  if (inlineBtn) inlineBtn.disabled = true;

  setTimeout(() => proximoExercicio(), allCorrect ? 1500 : 3000);
}

function verificarExercicio() {
  const userAnswerElement = document.getElementById('exerciseAnswer');
  if (!userAnswerElement) return;

  const userAnswer = userAnswerElement.value.trim();
  const feedbackElement = document.getElementById('exerciseFeedback');

  if (!userAnswer) {
    if (feedbackElement) {
      feedbackElement.innerHTML = '<span style="color: #FF9800;">⚠️ Por favor, digite uma resposta primeiro!</span>';
      feedbackElement.className = 'exercise-feedback warning';
    }
    return;
  }

  const exercise = grammarActiveExercises[currentExerciseIndex];
  if (!exercise) return;

  const possibleAnswers = obterRespostasValidas(exercise.answer);
  const normalizedUserAnswer = userAnswer.toLowerCase().replace(/\s+/g, ' ').trim();

  const isCorrect = possibleAnswers.some(correct => {
    const normalizedCorrect = correct.toLowerCase().replace(/\s+/g, ' ').trim();
    return normalizedUserAnswer === normalizedCorrect;
  });

  const correctEl = document.getElementById('exerciseCorrectAnswer');

  if (isCorrect) {
    grammarPoints++;
    grammarActiveExercises.splice(currentExerciseIndex, 1);
    if (correctEl) correctEl.style.display = 'none';
    if (feedbackElement) {
      feedbackElement.innerHTML = '<span style="color:#4CAF50;">✅ Correto! Parabéns!</span>';
      feedbackElement.className = 'exercise-feedback correct';
    }
    userAnswerElement.disabled = true;
    const inlineCheckBtn = document.getElementById('inlineCheckBtn');
    if (inlineCheckBtn) inlineCheckBtn.disabled = true;
  } else {
    grammarErrors++;
    const errado = grammarActiveExercises.splice(currentExerciseIndex, 1)[0];
    grammarActiveExercises.push(errado);

    if (correctEl) {
      correctEl.style.display = 'block';
      correctEl.innerHTML = `<strong>Resposta correta:</strong> <span>${possibleAnswers.join(' ou ')}</span>`;
    }
    if (feedbackElement) {
      feedbackElement.innerHTML = '<span style="color:#F44336;">❌ Incorreto. Você verá este exercício novamente.</span>';
      feedbackElement.className = 'exercise-feedback incorrect';
    }
  }

  atualizarPontuacaoGrammar();

  setTimeout(() => proximoExercicio(), isCorrect ? 1500 : 3000);
}

function proximoExercicio() {
  const correctEl = document.getElementById('exerciseCorrectAnswer');
  if (correctEl) correctEl.style.display = 'none';

  const feedbackElement = document.getElementById('exerciseFeedback');
  if (feedbackElement) {
    feedbackElement.innerHTML = '';
    feedbackElement.className = 'exercise-feedback';
  }

  const inlineCheckBtn = document.getElementById('inlineCheckBtn');
  if (inlineCheckBtn) inlineCheckBtn.disabled = false;

  const topicSelect = document.getElementById('grammarSelect');
  if (topicSelect && topicSelect.value === 'random') {
    const randomIndex = Math.floor(Math.random() * grammarTopics.length);
    currentGrammarTopic = grammarTopics[randomIndex];
    const modeSelect = document.getElementById('grammarModeSelect');
    const selectedMode = modeSelect ? modeSelect.value : 'all';
    grammarActiveExercises = [...filtrarExerciciosPorModo(currentGrammarTopic.exercises, selectedMode)];
    currentExerciseIndex = 0;
  }

  if (grammarActiveExercises.length === 0) {
    const exerciseContainer = document.getElementById('exerciseContainer');
    if (exerciseContainer) {
      exerciseContainer.innerHTML = `
        <div class="empty-message">
          <p>🎉 All exercises completed! 🎉</p>
          <p>Final score: ${grammarPoints} correct, ${grammarErrors} errors</p>
          <button class="reset-btn" onclick="resetarExercicios()">Reset Exercises</button>
        </div>
      `;
    }
    const nextBtn = document.getElementById('btnNextExercise');
    if (nextBtn) nextBtn.disabled = true;
    return;
  }

  if (currentExerciseIndex >= grammarActiveExercises.length) currentExerciseIndex = 0;

  const exercise = grammarActiveExercises[currentExerciseIndex];
  iniciarExercicios([exercise]);
}

function filtrarExerciciosPorModo(exercises, modoSelecionado) {
  if (modoSelecionado === 'all') return exercises;
  return exercises.filter(exercise => exercise.mode === modoSelecionado);
}

function atualizarPontuacaoGrammar() {
  const p = document.getElementById('grammarPoints');
  const e = document.getElementById('grammarErrors');
  const t = document.getElementById('grammarTotal');
  if (p) p.textContent = grammarPoints;
  if (e) e.textContent = grammarErrors;
  if (t) t.textContent = grammarPoints + grammarErrors;
}

function resetarExercicios() {
  grammarActiveExercises = [];
  grammarUsedExercises = [];
  grammarPoints = 0;
  grammarErrors = 0;
  currentExerciseIndex = 0;
  atualizarPontuacaoGrammar();

  const exerciseContainer = document.getElementById('exerciseContainer');
  if (exerciseContainer) {
    exerciseContainer.innerHTML = `
      <div class="empty-message">
        <p>✅ Exercises have been reset.</p>
        <p>Select a grammar topic and click "Practice Exercises" to begin.</p>
      </div>
    `;
  }

  const grammarPractice = document.getElementById('grammarPractice');
  if (grammarPractice) grammarPractice.style.display = 'none';

  const checkBtn = document.getElementById('btnCheckExercise');
  if (checkBtn) checkBtn.disabled = true;

  const nextBtn = document.getElementById('btnNextExercise');
  if (nextBtn) nextBtn.disabled = false;
}

function gerenciarBotaoCheckExercicio() {
  const btnCheckExercise = document.getElementById('btnCheckExercise');
  if (!btnCheckExercise) return;
  btnCheckExercise.style.display = 'flex';
  const inlineCheckBtn = document.getElementById('inlineCheckBtn');
  if (inlineCheckBtn) btnCheckExercise.style.display = 'none';
}

function ajustarLarguraInput(input) {
  const minWidth = 120;
  const charWidth = 10;
  const padding = 30;
  const newWidth = Math.max(minWidth, (input.value.length * charWidth) + padding);
  input.style.width = newWidth + 'px';
}

// ============================================
// PHRASAL VERBS
// ============================================
function filtrarPhrasalVerbs() {
  const nivel = document.getElementById('phrasalLevelSelect')?.value;
  if (!nivel) return;

  let listaFiltrada = [...phrasalVerbsOriginal];
  if (nivel !== 'all') listaFiltrada = listaFiltrada.filter(pv => pv && pv.level === nivel);

  const mainVerbSelect = document.getElementById('phrasalVerbSelect');
  if (mainVerbSelect && mainVerbSelect.value !== 'all') {
    listaFiltrada = listaFiltrada.filter(pv => pv && pv.verb === mainVerbSelect.value);
  }

  phrasalVerbsFiltrados = listaFiltrada;
  phrasalVerbsAtivos = [...phrasalVerbsFiltrados];
  phrasalVerbsUsados = [];
  currentPhrasalVerb = null;

  atualizarSelectMainVerbs(nivel);

  const drawBtn = document.getElementById("btnDrawPhrasal");
  if (drawBtn) drawBtn.disabled = phrasalVerbsFiltrados.length === 0;

  if (phrasalVerbsFiltrados.length === 0) {
    const phrasalCard = document.getElementById("phrasalCard");
    if (phrasalCard) phrasalCard.style.display = "none";
    const emptyMsg = document.querySelector('#phrasalControls .empty-message');
    if (!emptyMsg) {
      const controls = document.getElementById("phrasalControls");
      if (controls) {
        controls.insertAdjacentHTML('beforeend',
          '<div class="empty-message">No phrasal verbs found for the selected filters.</div>');
      }
    }
  } else {
    const emptyMsg = document.querySelector('#phrasalControls .empty-message');
    if (emptyMsg) emptyMsg.remove();
  }

  atualizarBotoes();
}

function atualizarSelectMainVerbs(nivel) {
  const phrasalVerbSelect = document.getElementById('phrasalVerbSelect');
  if (!phrasalVerbSelect) return;

  let phrasalVerbsParaFiltrar = nivel === 'all'
    ? [...phrasalVerbsOriginal]
    : phrasalVerbsOriginal.filter(pv => pv.level === nivel);

  const mainVerbs = [...new Set(phrasalVerbsParaFiltrar.map(pv => pv.verb))].sort();
  const valorAtual = phrasalVerbSelect.value;

  phrasalVerbSelect.innerHTML = '<option value="all">All Verbs</option>';
  mainVerbs.forEach(verb => {
    const option = document.createElement('option');
    option.value = verb;
    option.textContent = verb;
    phrasalVerbSelect.appendChild(option);
  });

  if (mainVerbs.includes(valorAtual)) phrasalVerbSelect.value = valorAtual;
  else phrasalVerbSelect.value = 'all';
}

function sortearPhrasalVerb() {
  const container = document.getElementById("phrasalControls");
  if (!container) return;
  const existingEmptyMessage = document.querySelector('#phrasalControls .empty-message');
  if (existingEmptyMessage) existingEmptyMessage.remove();

  if (!phrasalVerbsAtivos || phrasalVerbsAtivos.length === 0) {
    if (phrasalVerbsUsados && phrasalVerbsUsados.length > 0) {
      container.insertAdjacentHTML('beforeend',
        '<div class="empty-message">🎉 All phrasal verbs for this filter have been practiced!<br><button class="reset-btn" onclick="resetarPhrasalVerbs()">Reset</button></div>');
    } else {
      container.insertAdjacentHTML('beforeend',
        '<div class="empty-message">No phrasal verbs found for the current filters.</div>');
    }
    const btn = document.getElementById("btnDrawPhrasal");
    if (btn) btn.disabled = true;
    return;
  }

  const randomIndex = Math.floor(Math.random() * phrasalVerbsAtivos.length);
  currentPhrasalVerb = phrasalVerbsAtivos[randomIndex];
  phrasalVerbsAtivos.splice(randomIndex, 1);
  phrasalVerbsUsados.push(currentPhrasalVerb);
  phrasalHistorico.push(currentPhrasalVerb);

  exibirPhrasalVerb(currentPhrasalVerb);
  atualizarBotoes();
}

function exibirPhrasalVerb(phrasalVerb) {
  const phrasalCard = document.getElementById('phrasalCard');
  if (!phrasalCard) return;
  phrasalCard.style.display = 'block';

  const levelEl = document.getElementById('phrasalLevel');
  if (levelEl) {
    levelEl.className = `difficulty ${phrasalVerb.level}`;
    levelEl.textContent = phrasalVerb.level;
  }
  const verbEl = document.getElementById('phrasalVerb');
  if (verbEl) verbEl.textContent = phrasalVerb.phrasal_verb;
  const transEl = document.getElementById('phrasalTranslation');
  if (transEl) transEl.textContent = phrasalVerb.translation;
  const defEl = document.getElementById('phrasalDefinition');
  if (defEl) {
    defEl.innerHTML = `<strong>English:</strong> ${phrasalVerb.definition_en || "—"}<br>
                       <strong>Português:</strong> ${phrasalVerb.definition_pt || "—"}`;
  }

  let exemploDestacado = phrasalVerb.example || '';
  if (phrasalVerb.phrasal_verb && phrasalVerb.example) {
    const safe = phrasalVerb.phrasal_verb.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${safe}\\b`, 'gi');
    exemploDestacado = phrasalVerb.example.replace(regex, `<span class="vocab-highlight">$&</span>`);
  }
  const exEl = document.getElementById('phrasalExample');
  if (exEl) exEl.innerHTML = `Example: ${exemploDestacado}`;

  if (transEl) transEl.style.display = 'none';
  if (defEl) defEl.style.display = 'block';

  setTimeout(() => addVoiceToPhrasal(), 100);
}

function voltarPhrasalVerb() {
  if (!phrasalHistorico || phrasalHistorico.length < 2) {
    alert("No previous phrasal verb to return to.");
    return;
  }
  phrasalHistorico.pop();
  exibirPhrasalVerb(phrasalHistorico[phrasalHistorico.length - 1]);
}

function resetarPhrasalVerbs() {
  filtrarPhrasalVerbs();
  const emptyMessage = document.querySelector('#phrasalControls .empty-message');
  if (emptyMessage) emptyMessage.remove();
  const phrasalCard = document.getElementById("phrasalCard");
  if (phrasalCard) phrasalCard.style.display = "none";
  atualizarBotoes();
}

function mostrarSignificadoPhrasal() {
  const translationElement = document.getElementById('phrasalTranslation');
  if (translationElement) {
    translationElement.style.display = translationElement.style.display === 'none' ? 'block' : 'none';
  }
}

// ============================================
// SALVAMENTO DE PERGUNTAS
// ============================================
function salvarPergunta() {
  if (!currentQuestion) {
    alert('No question to save. Please draw a question first.');
    return;
  }
  const alreadySaved = savedQuestions.some(q => q.question === currentQuestion.question);
  if (!alreadySaved) {
    savedQuestions.push(currentQuestion);
    localStorage.setItem('savedQuestions', JSON.stringify(savedQuestions));
    alert('Question saved successfully!');
  } else {
    alert('This question is already saved.');
  }
}

function mostrarSalvas() {
  if (savedQuestions.length === 0) {
    alert('No saved questions yet.');
    return;
  }
  const savedList = savedQuestions.map((q, index) => `
    <div class="saved-item">
      <div class="difficulty ${q.level}">${q.level}</div>
      <div class="question-text">${q.question}</div>
      ${q.example ? `<div class="vocab-example"><strong>Example:</strong> ${q.example}</div>` : ''}
      <button class="secondary-button" onclick="removerSalva(${index})">Remove</button>
    </div>
  `).join('');

  const resultado = document.getElementById("resultado");
  if (resultado) {
    resultado.innerHTML = `
      <h3>Saved Questions (${savedQuestions.length})</h3>
      <div class="saved-questions">${savedList}</div>
      <button class="reset-btn" onclick="limparSalvas()">Clear All Saved Questions</button>
    `;
  }
}

function removerSalva(index) {
  savedQuestions.splice(index, 1);
  localStorage.setItem('savedQuestions', JSON.stringify(savedQuestions));
  mostrarSalvas();
}

function limparSalvas() {
  if (confirm('Are you sure you want to clear all saved questions?')) {
    savedQuestions = [];
    localStorage.removeItem('savedQuestions');
    const resultado = document.getElementById("resultado");
    if (resultado) {
      resultado.innerHTML = `<div class="empty-message"><p>All saved questions have been cleared.</p></div>`;
    }
  }
}

// ============================================
// TIMER
// ============================================
function iniciarTimer() {
  const timerDisplay = document.getElementById('timerDisplay');
  const timeRemaining = document.getElementById('timeRemaining');
  if (!timerDisplay || !timeRemaining) return;

  timerDisplay.style.display = 'flex';
  let secondsLeft = timerSeconds;
  timeRemaining.textContent = secondsLeft;

  const updateClass = (s) => {
    if (s <= 10) {
      timerDisplay.classList.add('danger');
      timerDisplay.classList.remove('warning');
    } else if (s <= 30) {
      timerDisplay.classList.add('warning');
      timerDisplay.classList.remove('danger');
    } else {
      timerDisplay.classList.remove('warning', 'danger');
    }
  };

  updateClass(secondsLeft);

  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    secondsLeft--;
    timeRemaining.textContent = secondsLeft;
    updateClass(secondsLeft);

    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      timerDisplay.style.display = 'none';
      const timeUpNotification = document.getElementById('timeUpNotification');
      if (timeUpNotification) timeUpNotification.style.display = 'block';
    }
  }, 1000);
}

// ============================================
// TEXT-TO-SPEECH
// ============================================
function getBestEnglishVoice() {
  const voices = window.speechSynthesis.getVoices();
  const priorityList = [
    "Google UK English Female", "Google UK English Male", "Google US English",
    "Microsoft Jenny - English (United States)",
    "Microsoft Aria - English (United States)",
    "Microsoft David - English (United States)",
    "Samantha", "Alex", "Fiona",
    "en-US-Wavenet-A", "en-US-Neural2-F",
    "Microsoft Zira - English (United States)"
  ];

  for (let voiceName of priorityList) {
    const foundVoice = voices.find(voice => voice.name === voiceName);
    if (foundVoice) return foundVoice;
  }
  const fallback = voices.find(voice => voice.lang === 'en-US' && voice.name.includes('Female'))
    || voices.find(voice => voice.lang.startsWith('en'))
    || voices[0];
  return fallback || null;
}

function falarTexto(texto, idioma = 'en-US') {
  if (!texto) return;
  if (!('speechSynthesis' in window)) {
    alert('Seu navegador não suporta síntese de voz.');
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = idioma;
  utterance.rate = speechRate ?? 0.9;
  utterance.pitch = 1.0;
  utterance.volume = 1;

  const bestVoice = getBestEnglishVoice();
  if (bestVoice) utterance.voice = bestVoice;

  window.speechSynthesis.speak(utterance);
}

// ============================================
// DOAÇÃO PIX
// ============================================
const PIX_KEY = "00020101021126580014br.gov.bcb.pix01366e4d4649-5b1d-41d3-8a31-45ded88c81f35204000053039865802BR5919LUCAS DO NASCIMENTO6008BRASILIA62080504SXQR6304F0D4";

function initDonation() {
  const donationButton = document.getElementById('donationButton');
  const donationModal = document.getElementById('donationModal');
  const closeBtn = document.getElementById('closeDonationModal');
  const pixKeyElement = document.getElementById('pixKey');
  const copyFeedback = document.getElementById('copyFeedback');

  if (!donationButton || !donationModal) return;

  if (pixKeyElement) {
    pixKeyElement.style.cursor = "pointer";
    pixKeyElement.style.backgroundColor = "#e8f5e9";
    pixKeyElement.style.border = "1px solid #4CAF50";
    pixKeyElement.style.borderRadius = "8px";
    pixKeyElement.style.padding = "12px";
  }

  donationButton.addEventListener('click', (e) => {
    e.stopPropagation();
    donationModal.classList.toggle('show');
  });

  if (closeBtn) closeBtn.addEventListener('click', () => donationModal.classList.remove('show'));

  document.addEventListener('click', (e) => {
    if (donationModal.classList.contains('show')) {
      if (!donationModal.contains(e.target) && !donationButton.contains(e.target)) {
        donationModal.classList.remove('show');
      }
    }
  });

  if (pixKeyElement) {
    pixKeyElement.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(PIX_KEY);
        if (copyFeedback) {
          copyFeedback.style.display = 'block';
          setTimeout(() => { copyFeedback.style.display = 'none'; }, 2000);
        }
        alert("✅ Chave PIX copiada!");
      } catch (err) {
        alert("📋 Chave PIX: " + PIX_KEY.substring(0, 30) + "...");
      }
    });
  }
}

// ============================================
// SENTENCE BUILDER
// ============================================
let SENTENCE_DATA = [];
let sentenceQueue = [];
let currentSentenceObj = null;
let availableWords = [];
let builtWords = [];
let sentenceCorrectCount = 0;
let sentenceTotalCount = 0;
let isChecking = false;
let isGameActive = false;

async function loadSentenceData() {
  try {
    const response = await fetch(URL_SENTENCE_DATA);
    if (!response.ok) throw new Error(`Failed to load: ${URL_SENTENCE_DATA}`);
    SENTENCE_DATA = await response.json();
    console.log(`✅ Sentence Builder: ${SENTENCE_DATA.length} frases carregadas!`);
    initSentenceBuilder();
  } catch (error) {
    console.error("❌ Erro:", error);
    SENTENCE_DATA = [
      { level: "A1", correct: "I like apples", translation: "Eu gosto de maçãs", words: ["I", "like", "apples"] },
      { level: "A1", correct: "She is a teacher", translation: "Ela é uma professora", words: ["She", "is", "a", "teacher"] },
      { level: "A1", correct: "They are happy", translation: "Eles estão felizes", words: ["They", "are", "happy"] }
    ];
    initSentenceBuilder();
  }
}

function initSentenceBuilder() {
  const levelSelect = document.getElementById('sentenceLevelSelect');
  const startBtn = document.getElementById('btnStartSentence');
  const resetBtn = document.getElementById('btnResetSentence');

  if (levelSelect) {
    levelSelect.addEventListener('change', () => {
      refreshByLevel();
      if (isGameActive) startSentenceBuilder();
    });
  }
  if (startBtn) startBtn.onclick = () => startSentenceBuilder();
  if (resetBtn) resetBtn.onclick = () => resetSentenceBuilder();

  refreshByLevel();
}

function refreshByLevel() {
  const levelSelect = document.getElementById('sentenceLevelSelect');
  const startBtn = document.getElementById('btnStartSentence');
  const container = document.getElementById('sentenceContainer');
  if (!levelSelect || !startBtn || !container) return;

  const level = levelSelect.value;
  const filtered = SENTENCE_DATA.filter(s => s.level === level);

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-message">⚠️ Nenhuma frase para o nível ${level}.</div>`;
    startBtn.disabled = true;
    return;
  }

  sentenceQueue = [...filtered];
  sentenceCorrectCount = 0;
  sentenceTotalCount = sentenceQueue.length;

  if (isGameActive) {
    currentSentenceObj = null;
    availableWords = [];
    builtWords = [];
    isChecking = false;
    shuffleArray(sentenceQueue);
    loadNextSentence();
  } else {
    currentSentenceObj = null;
    availableWords = [];
    builtWords = [];
    isGameActive = false;
    isChecking = false;
    shuffleArray(sentenceQueue);
    updateSentenceStats();
    container.innerHTML = `<div class="empty-message">✨ ${sentenceQueue.length} frases disponíveis para nível ${level}<br>Clique em "INICIAR" para começar ✨</div>`;
  }

  startBtn.disabled = false;
  levelSelect.style.display = 'block';
  levelSelect.disabled = false;
  updateSentenceStats();
}

function startSentenceBuilder() {
  const levelSelect = document.getElementById('sentenceLevelSelect');
  const startBtn = document.getElementById('btnStartSentence');
  if (!levelSelect || !startBtn) return;

  const level = levelSelect.value;
  const filtered = SENTENCE_DATA.filter(s => s.level === level);
  if (filtered.length === 0) {
    alert('Nenhuma frase disponível para este nível.');
    return;
  }

  sentenceQueue = [...filtered];
  sentenceCorrectCount = 0;
  sentenceTotalCount = sentenceQueue.length;
  isChecking = false;
  isGameActive = true;

  shuffleArray(sentenceQueue);
  loadNextSentence();
  startBtn.style.display = 'none';
  levelSelect.style.display = 'block';
  levelSelect.disabled = false;
}

function loadNextSentence() {
  const container = document.getElementById('sentenceContainer');
  const startBtn = document.getElementById('btnStartSentence');
  if (!container) return;

  if (sentenceQueue.length === 0) {
    isGameActive = false;
    container.innerHTML = `<div class="empty-message">🎉 PARABÉNS! Você completou todas as ${sentenceTotalCount} frases! 🎉<br><button class="reset-btn" onclick="resetSentenceBuilder()">Jogar Novamente</button></div>`;
    if (startBtn) startBtn.style.display = 'flex';
    updateSentenceStats();
    return;
  }

  isChecking = false;
  currentSentenceObj = sentenceQueue[0];
  availableWords = [...currentSentenceObj.words];
  builtWords = [];
  shuffleArray(availableWords);
  renderSentenceBuilder();
  updateSentenceStats();

  setTimeout(() => {
    if (currentSentenceObj && isGameActive) falarTexto(currentSentenceObj.correct, 'en-US');
  }, 300);
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function renderSentenceBuilder() {
  const container = document.getElementById('sentenceContainer');
  if (!container || !currentSentenceObj) return;

  container.innerHTML = `
    <div class="sentence-builder-wrapper">
      <div class="translation-area">
        <div class="translation-label">🇧🇷 PORTUGUÊS</div>
        <div class="translation-text">"${escapeHtml(currentSentenceObj.translation)}"</div>
        <button class="audio-btn" onclick="playEnglishAudio()">🔊 Play English</button>
      </div>
      
      <div class="speech-rate-controls">
        <span class="rate-label">⚡ Velocidade:</span>
        <button class="rate-btn ${speechRate === 0.3 ? 'active' : ''}" onclick="setSpeechRate(0.3)">0.3x</button>
        <button class="rate-btn ${speechRate === 0.5 ? 'active' : ''}" onclick="setSpeechRate(0.5)">0.5x</button>
        <button class="rate-btn ${speechRate === 0.7 ? 'active' : ''}" onclick="setSpeechRate(0.7)">0.7x</button>
        <button class="rate-btn ${speechRate === 1.0 ? 'active' : ''}" onclick="setSpeechRate(1.0)">1x</button>
        <button class="rate-btn ${speechRate === 1.5 ? 'active' : ''}" onclick="setSpeechRate(1.5)">1.5x</button>
      </div>
      
      <div class="area-label">📝 PALAVRAS DISPONÍVEIS</div>
      <div class="sentence-words-area">
        ${availableWords.map((word, i) => `<button class="sentence-word-btn" onclick="selectWord(${i})">${escapeHtml(word)}</button>`).join('')}
        ${availableWords.length === 0 ? '<div style="color:#8A2BE2; text-align:center; width:100%;">✨ Todas as palavras usadas! ✨</div>' : ''}
      </div>
      
      <div class="area-label built-label">🔨 SUA FRASE</div>
      <div class="sentence-built-area">
        ${builtWords.map((word, i) => `<button class="sentence-built-word" onclick="removeWord(${i})">${escapeHtml(word)} ✕</button>`).join('')}
        ${builtWords.length === 0 ? '<div style="color:#4CAF50; text-align:center; width:100%;">✨ Clique nas palavras acima ✨</div>' : ''}
      </div>
      
      <div class="check-button-container">
        <button class="btn-check-mobile" onclick="checkSentence()">✔️ VERIFICAR FRASE</button>
      </div>
      
      <div class="voice-controls">
        <button id="voiceSentenceBtn" class="voice-btn">🎤 Falar Frase Completa</button>
        <div id="voiceSentenceFeedback" class="voice-feedback"></div>
      </div>
      
      <div id="sentenceFeedback" class="sentence-feedback"></div>
    </div>
  `;

  const voiceBtn = document.getElementById('voiceSentenceBtn');
  if (voiceBtn) {
    voiceBtn.addEventListener('click', () => {
      if (!currentSentenceObj) {
        alert('Nenhuma frase ativa. Inicie o Sentence Builder primeiro.');
        return;
      }
      startVoiceRecordingForSentence(currentSentenceObj.correct);
    });
  }
}

function setSpeechRate(rate) {
  speechRate = rate;
  document.querySelectorAll('.rate-btn').forEach(btn => {
    const btnRate = parseFloat(btn.textContent.replace('x', ''));
    if (btnRate === rate) btn.classList.add('active');
    else btn.classList.remove('active');
  });
}
window.setSpeechRate = setSpeechRate;

function playEnglishAudio() {
  if (currentSentenceObj) falarTexto(currentSentenceObj.correct, 'en-US');
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function selectWord(index) {
  if (isChecking || !isGameActive) return;
  builtWords.push(availableWords[index]);
  availableWords.splice(index, 1);
  renderSentenceBuilder();
}

function removeWord(index) {
  if (isChecking || !isGameActive) return;
  availableWords.push(builtWords[index]);
  builtWords.splice(index, 1);
  renderSentenceBuilder();
}

function checkSentence() {
  if (isChecking || !isGameActive || !currentSentenceObj) return;

  const userSentence = builtWords.join(' ');
  const correctSentence = currentSentenceObj.correct;
  const sentenceFeedbackDiv = document.getElementById('sentenceFeedback');

  const normalize = (str) => {
    if (!str) return '';
    return str.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  };

  const normalizedUser = normalize(userSentence);
  const normalizedCorrect = normalize(correctSentence);

  if (normalizedUser === normalizedCorrect) {
    isChecking = true;
    sentenceCorrectCount++;
    sentenceQueue.shift();

    if (sentenceFeedbackDiv) {
      sentenceFeedbackDiv.className = 'sentence-feedback correct';
      sentenceFeedbackDiv.innerHTML = '✅✅✅ CORRETO! Muito bem! 🎉🎉🎉';
      sentenceFeedbackDiv.style.display = 'block';
    }

    updateSentenceStats();

    setTimeout(() => {
      isChecking = false;
      if (sentenceFeedbackDiv) sentenceFeedbackDiv.style.display = 'none';
      if (sentenceQueue.length === 0) {
        const container = document.getElementById('sentenceContainer');
        const startBtn = document.getElementById('btnStartSentence');
        if (container) {
          container.innerHTML = `<div class="empty-message">🎉 PARABÉNS! Você completou todas as ${sentenceTotalCount} frases! 🎉<br><button class="reset-btn" onclick="resetSentenceBuilder()">Jogar Novamente</button></div>`;
        }
        if (startBtn) startBtn.style.display = 'flex';
        isGameActive = false;
      } else {
        loadNextSentence();
      }
    }, 2000);
  } else {
    isChecking = true;
    const wrongSentence = sentenceQueue.shift();
    sentenceQueue.push(wrongSentence);

    if (sentenceFeedbackDiv) {
      sentenceFeedbackDiv.className = 'sentence-feedback incorrect';
      sentenceFeedbackDiv.innerHTML = `❌❌❌ INCORRETO! ❌❌❌<br><br>Frase correta: <strong>"${escapeHtml(correctSentence)}"</strong><br><br>Você vai tentar novamente! 🔄`;
      sentenceFeedbackDiv.style.display = 'block';
    }

    updateSentenceStats();

    setTimeout(() => {
      isChecking = false;
      if (sentenceFeedbackDiv) sentenceFeedbackDiv.style.display = 'none';
      loadNextSentence();
    }, 4000);
  }
}

function resetSentenceBuilder() {
  const levelSelect = document.getElementById('sentenceLevelSelect');
  const startBtn = document.getElementById('btnStartSentence');
  const container = document.getElementById('sentenceContainer');
  if (!levelSelect || !startBtn || !container) return;

  const level = levelSelect.value;
  const filtered = SENTENCE_DATA.filter(s => s.level === level);

  sentenceQueue = [...filtered];
  sentenceCorrectCount = 0;
  sentenceTotalCount = sentenceQueue.length;
  currentSentenceObj = null;
  availableWords = [];
  builtWords = [];
  isChecking = false;
  isGameActive = false;

  shuffleArray(sentenceQueue);
  updateSentenceStats();

  const fb = document.getElementById('sentenceFeedback');
  if (fb) fb.style.display = 'none';
  const vfb = document.getElementById('voiceSentenceFeedback');
  if (vfb) vfb.style.display = 'none';

  container.innerHTML = `<div class="empty-message">🔄 Reiniciado! ${sentenceQueue.length} frases disponíveis.<br>Clique em "INICIAR" para começar 🔄</div>`;
  startBtn.style.display = 'flex';
  levelSelect.style.display = 'block';
  levelSelect.disabled = false;
}

function updateSentenceStats() {
  const c = document.getElementById('sentenceCorrect');
  const r = document.getElementById('sentenceRemaining');
  const t = document.getElementById('sentenceTotal');
  if (c) c.textContent = sentenceCorrectCount;
  if (r) r.textContent = sentenceQueue.length;
  if (t) t.textContent = sentenceTotalCount;
}

window.selectWord = selectWord;
window.removeWord = removeWord;
window.resetSentenceBuilder = resetSentenceBuilder;
window.checkSentence = checkSentence;
window.playEnglishAudio = playEnglishAudio;

// ============================================
// VOICE RECOGNITION
// ============================================
let recognition = null;
let isRecording = false;
let currentVoiceContext = null;
let sentenceRecognition = null;
let isSentenceRecording = false;

const isSpeechSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

function initSpeechRecognition() {
  if (!isSpeechSupported) return null;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const instance = new SpeechRecognition();
  instance.continuous = false;
  instance.interimResults = false;
  instance.lang = 'en-US';
  return instance;
}

function convertNumbersToWords(text) {
  const numberMap = {
    '1st': 'first', '2nd': 'second', '3rd': 'third', '4th': 'fourth', '5th': 'fifth',
    '6th': 'sixth', '7th': 'seventh', '8th': 'eighth', '9th': 'ninth', '10th': 'tenth',
    '11th': 'eleventh', '12th': 'twelfth', '13th': 'thirteenth', '14th': 'fourteenth',
    '15th': 'fifteenth', '16th': 'sixteenth', '17th': 'seventeenth', '18th': 'eighteenth',
    '19th': 'nineteenth', '20th': 'twentieth', '21st': 'twenty-first', '22nd': 'twenty-second',
    '23rd': 'twenty-third', '24th': 'twenty-fourth', '25th': 'twenty-fifth',
    '30th': 'thirtieth', '31st': 'thirty-first',
    '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six',
    '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten', '11': 'eleven',
    '12': 'twelve', '13': 'thirteen', '14': 'fourteen', '15': 'fifteen',
    '16': 'sixteen', '17': 'seventeen', '18': 'eighteen', '19': 'nineteen',
    '20': 'twenty', '21': 'twenty-one', '22': 'twenty-two', '23': 'twenty-three',
    '24': 'twenty-four', '25': 'twenty-five', '30': 'thirty', '31': 'thirty-one'
  };

  let converted = text;
  const sortedKeys = Object.keys(numberMap).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    converted = converted.replace(regex, numberMap[key]);
  }
  return converted;
}

function normalizeText(text) {
  if (!text) return '';
  let normalized = text.toLowerCase().trim();
  normalized = convertNumbersToWords(normalized);
  normalized = normalized.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  return normalized;
}

function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
}

function calculateSimilarity(userText, expectedText) {
  const normalizedUser = normalizeText(userText);
  const normalizedExpected = normalizeText(expectedText);
  if (normalizedUser === normalizedExpected) return 100;
  const distance = levenshteinDistance(normalizedUser, normalizedExpected);
  const maxLength = Math.max(normalizedUser.length, normalizedExpected.length);
  if (maxLength === 0) return 0;
  return Math.max(0, Math.min(100, ((maxLength - distance) / maxLength) * 100));
}

function comparePronunciation(userText, expectedText, threshold = 70) {
  const similarity = calculateSimilarity(userText, expectedText);
  return {
    isCorrect: similarity >= threshold,
    similarity,
    normalizedUser: normalizeText(userText),
    normalizedExpected: normalizeText(expectedText),
    userOriginal: userText,
    expectedOriginal: expectedText
  };
}

function showVoiceFeedback(elementId, result) {
  const feedbackDiv = document.getElementById(elementId);
  if (!feedbackDiv) return;

  if (result.isCorrect) {
    feedbackDiv.className = 'voice-feedback correct';
    feedbackDiv.innerHTML = `
      🎉 Ótima pronúncia! (${Math.round(result.similarity)}% similar)
      <div class="voice-transcript">Você disse: "${result.userOriginal}"</div>
    `;
  } else {
    feedbackDiv.className = 'voice-feedback incorrect';
    feedbackDiv.innerHTML = `
      ❌ Pronúncia precisa melhorar (${Math.round(result.similarity)}% similar)
      <div class="voice-transcript">Você disse: "${result.userOriginal}"</div>
      <div class="voice-transcript">Esperado: "${result.expectedOriginal}"</div>
    `;
  }
  feedbackDiv.style.display = 'block';
  setTimeout(() => { if (feedbackDiv) feedbackDiv.style.display = 'none'; }, 4000);
}

function startVoiceRecording(context, expectedAnswer, callback) {
  if (!isSpeechSupported) {
    alert('Seu navegador não suporta reconhecimento de voz. Use Chrome, Edge ou Safari.');
    return;
  }
  if (!expectedAnswer) {
    alert('Nenhuma resposta esperada definida.');
    return;
  }
  if (isRecording) {
    stopVoiceRecording();
    return;
  }

  currentVoiceContext = context;
  recognition = initSpeechRecognition();
  if (!recognition) return;

  recognition.onstart = () => {
    isRecording = true;
    updateVoiceButtonState(context, true);
  };
  recognition.onend = () => {
    isRecording = false;
    updateVoiceButtonState(context, false);
  };
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const result = comparePronunciation(transcript, expectedAnswer);
    if (callback) callback(result, transcript);
    stopVoiceRecording();
  };
  recognition.onerror = (event) => {
    console.error('Erro no reconhecimento de voz:', event.error);
    showVoiceError(context, event.error);
    stopVoiceRecording();
  };

  recognition.start();
}

function stopVoiceRecording() {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
  isRecording = false;
  if (currentVoiceContext) updateVoiceButtonState(currentVoiceContext, false);
}

function updateVoiceButtonState(context, recording) {
  const buttonId = getVoiceButtonId(context);
  const button = document.getElementById(buttonId);
  if (!button) return;
  if (recording) {
    button.classList.add('recording');
    button.innerHTML = '🎤 Gravando... Parar';
  } else {
    button.classList.remove('recording');
    button.innerHTML = context === 'phrasal' ? '🎤 Falar Phrasal Verb' : '🎤 Falar Palavra';
  }
}

function getVoiceButtonId(context) {
  return { 'vocab': 'voiceVocabBtn', 'phrasal': 'voicePhrasalBtn' }[context] || 'voiceVocabBtn';
}

function showVoiceError(context, error) {
  const feedbackId = { 'vocab': 'voiceVocabFeedback', 'phrasal': 'voicePhrasalFeedback' }[context] || 'voiceVocabFeedback';
  const feedbackDiv = document.getElementById(feedbackId);
  if (feedbackDiv) {
    feedbackDiv.className = 'voice-feedback warning';
    feedbackDiv.innerHTML = `⚠️ Erro: ${error}`;
    feedbackDiv.style.display = 'block';
    setTimeout(() => { feedbackDiv.style.display = 'none'; }, 3000);
  }
}

function addVoiceToVocabulary() {
  const vocabCard = document.getElementById('vocabCard');
  if (!vocabCard) return;
  if (document.getElementById('voiceVocabBtn')) return;

  const voiceContainer = document.createElement('div');
  voiceContainer.className = 'voice-controls';
  voiceContainer.innerHTML = `
    <button id="voiceVocabBtn" class="voice-btn voice-vocab-btn">🎤 Falar Palavra</button>
    <div id="voiceVocabFeedback" class="voice-feedback"></div>
  `;
  vocabCard.appendChild(voiceContainer);

  document.getElementById('voiceVocabBtn').addEventListener('click', () => {
    const vocabWord = document.getElementById('vocabWord');
    if (!vocabWord || !vocabWord.textContent) {
      alert('Nenhuma palavra de vocabulário ativa.');
      return;
    }
    startVoiceRecording('vocab', vocabWord.textContent, (result) => {
      showVoiceFeedback('voiceVocabFeedback', result);
    });
  });
}

function addVoiceToPhrasal() {
  const phrasalCard = document.getElementById('phrasalCard');
  if (!phrasalCard) return;
  if (document.getElementById('voicePhrasalBtn')) return;

  const voiceContainer = document.createElement('div');
  voiceContainer.className = 'voice-controls';
  voiceContainer.innerHTML = `
    <button id="voicePhrasalBtn" class="voice-btn voice-phrasal-btn">🎤 Falar Phrasal Verb</button>
    <div id="voicePhrasalFeedback" class="voice-feedback"></div>
  `;
  phrasalCard.appendChild(voiceContainer);

  document.getElementById('voicePhrasalBtn').addEventListener('click', () => {
    const phrasalVerb = document.getElementById('phrasalVerb');
    if (!phrasalVerb || !phrasalVerb.textContent) {
      alert('Nenhum phrasal verb ativo.');
      return;
    }
    startVoiceRecording('phrasal', phrasalVerb.textContent, (result) => {
      showVoiceFeedback('voicePhrasalFeedback', result);
    });
  });
}

function startVoiceRecordingForSentence(expectedAnswer) {
  if (!isSpeechSupported) {
    alert('Seu navegador não suporta reconhecimento de voz. Use Chrome, Edge ou Safari.');
    return;
  }
  if (!expectedAnswer) {
    alert('Nenhuma resposta esperada definida.');
    return;
  }
  if (isSentenceRecording) {
    stopSentenceVoiceRecording();
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  sentenceRecognition = new SpeechRecognition();
  sentenceRecognition.continuous = false;
  sentenceRecognition.interimResults = false;
  sentenceRecognition.lang = 'en-US';

  const voiceBtn = document.getElementById('voiceSentenceBtn');
  const feedbackDiv = document.getElementById('voiceSentenceFeedback');

  sentenceRecognition.onstart = () => {
    isSentenceRecording = true;
    if (voiceBtn) {
      voiceBtn.classList.add('recording');
      voiceBtn.innerHTML = '🎤 Gravando... Parar';
    }
  };
  sentenceRecognition.onend = () => {
    isSentenceRecording = false;
    if (voiceBtn) {
      voiceBtn.classList.remove('recording');
      voiceBtn.innerHTML = '🎤 Falar Frase Completa';
    }
  };
  sentenceRecognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const result = comparePronunciation(transcript, expectedAnswer);

    if (feedbackDiv) {
      if (result.isCorrect) {
        feedbackDiv.className = 'voice-feedback correct';
        feedbackDiv.innerHTML = `
          🎉 Excelente pronúncia! (${Math.round(result.similarity)}% similar)
          <div class="voice-transcript">Você disse: "${result.userOriginal}"</div>
        `;
        feedbackDiv.style.display = 'block';

        if (!isChecking) {
          isChecking = true;
          processCorrectSentence(transcript, expectedAnswer);
        }
      } else {
        feedbackDiv.className = 'voice-feedback incorrect';
        feedbackDiv.innerHTML = `
          ❌ Pronúncia precisa melhorar (${Math.round(result.similarity)}% similar)
          <div class="voice-transcript">Você disse: "${result.userOriginal}"</div>
          <div class="voice-transcript">Esperado: "${result.expectedOriginal}"</div>
        `;
        feedbackDiv.style.display = 'block';
      }
      setTimeout(() => { if (feedbackDiv) feedbackDiv.style.display = 'none'; }, 3000);
    }
    stopSentenceVoiceRecording();
  };
  sentenceRecognition.onerror = (event) => {
    console.error('Erro no reconhecimento:', event.error);
    if (feedbackDiv) {
      feedbackDiv.className = 'voice-feedback warning';
      feedbackDiv.innerHTML = `⚠️ Erro: ${event.error}`;
      feedbackDiv.style.display = 'block';
      setTimeout(() => { feedbackDiv.style.display = 'none'; }, 3000);
    }
    stopSentenceVoiceRecording();
  };
  sentenceRecognition.start();
}

function stopSentenceVoiceRecording() {
  if (sentenceRecognition) {
    sentenceRecognition.stop();
    sentenceRecognition = null;
  }
  isSentenceRecording = false;
  const voiceBtn = document.getElementById('voiceSentenceBtn');
  if (voiceBtn) {
    voiceBtn.classList.remove('recording');
    voiceBtn.innerHTML = '🎤 Falar Frase Completa';
  }
}

function processCorrectSentence(spokenText, expectedAnswer) {
  if (isChecking && !isGameActive) return;

  const sentenceFeedbackDiv = document.getElementById('sentenceFeedback');
  const normalize = (str) => {
    if (!str) return '';
    return str.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  };

  const normalizedSpoken = normalize(spokenText);
  const normalizedExpected = normalize(expectedAnswer);

  if (normalizedSpoken === normalizedExpected && sentenceQueue.length > 0) {
    isChecking = true;
    sentenceCorrectCount++;
    sentenceQueue.shift();

    if (sentenceFeedbackDiv) {
      sentenceFeedbackDiv.className = 'sentence-feedback correct';
      sentenceFeedbackDiv.innerHTML = '✅✅✅ CORRETO! Muito bem! 🎉🎉🎉';
      sentenceFeedbackDiv.style.display = 'block';
    }

    updateSentenceStats();

    setTimeout(() => {
      isChecking = false;
      if (sentenceFeedbackDiv) sentenceFeedbackDiv.style.display = 'none';
      if (sentenceQueue.length === 0) {
        const container = document.getElementById('sentenceContainer');
        const startBtn = document.getElementById('btnStartSentence');
        if (container) {
          container.innerHTML = `<div class="empty-message">🎉 PARABÉNS! Você completou todas as ${sentenceTotalCount} frases! 🎉<br><button class="reset-btn" onclick="resetSentenceBuilder()">Jogar Novamente</button></div>`;
        }
        if (startBtn) startBtn.style.display = 'flex';
        isGameActive = false;
      } else {
        loadNextSentence();
      }
    }, 2000);
  } else {
    isChecking = false;
  }
}

// ============================================
// SPELLING BEE MODE
// ============================================
function construirSpellingPool(nivel) {
  const pool = [];

  vocabularioOriginal.forEach(v => {
    if (!v || !v.word) return;
    if (nivel !== 'all' && v.level !== nivel) return;
    pool.push({
      type: 'word',
      level: v.level,
      answer: v.word,
      translation: v.translation,
      definition_en: v.definition_en,
      definition_pt: v.definition_pt,
      example: v.example,
      source: 'vocabulary'
    });
  });

  phrasalVerbsOriginal.forEach(pv => {
    if (!pv || !pv.phrasal_verb) return;
    if (nivel !== 'all' && pv.level !== nivel) return;
    pool.push({
      type: 'word',
      level: pv.level,
      answer: pv.phrasal_verb,
      translation: pv.translation,
      definition_en: pv.definition_en,
      definition_pt: pv.definition_pt,
      example: pv.example,
      source: 'phrasal'
    });
  });

  SENTENCE_DATA.forEach(s => {
    if (!s || !s.correct) return;
    if (nivel !== 'all' && s.level !== nivel) return;
    pool.push({
      type: 'phrase',
      level: s.level,
      answer: s.correct,
      translation: s.translation,
      definition_en: '',
      definition_pt: '',
      example: s.correct,
      source: 'sentence'
    });
  });

  return pool;
}

function iniciarSpellingBee() {
  const nivel = document.getElementById('spellingLevelSelect')?.value || 'all';
  const replays = document.getElementById('spellingReplays')?.value || 'unlimited';
  const modo = document.getElementById('spellingModeSelect')?.value || 'word';

  if (replays === 'unlimited') spellingReplaysLimit = Infinity;
  else spellingReplaysLimit = parseInt(replays) || 0;

  // ✅ CORREÇÃO: montar pool completo e depois filtrar por tipo
  let pool = construirSpellingPool(nivel);

  // 🔥 FILTRO POR TIPO — resolve o bug de "Word only" trazer frases
  if (modo === 'word') {
    pool = pool.filter(item => item.type === 'word');
  } else if (modo === 'phrase') {
    pool = pool.filter(item => item.type === 'phrase');
  }
  // 'progressive' → mantém ambos; decidirTipoConteudo() escolhe por item

  if (pool.length === 0) {
    const container = document.getElementById('spellingContainer');
    if (container) {
      let msg = '⚠️ Nenhum item disponível para este nível.';
      if (modo === 'phrase') msg = '⚠️ Nenhuma frase disponível para este nível. Tente "Word only" ou "Progressive".';
      if (modo === 'word') msg = '⚠️ Nenhuma palavra disponível para este nível. Tente "Full phrase" ou "Progressive".';
      container.innerHTML = `<div class="empty-message">${msg}</div>`;
    }
    return;
  }

  // Embaralhar
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  spellingQueueOriginal = [...pool];
  spellingQueue = [...pool];
  spellingPoints = 0;
  spellingErrors = 0;
  spellingGameActive = true;
  spellingWordsSeen = new Set();
  atualizarSpellingScore();

  const startBtn = document.getElementById('btnStartSpelling');
  if (startBtn) startBtn.style.display = 'none';

  carregarProximaSpelling();
}

function carregarProximaSpelling() {
  const container = document.getElementById('spellingContainer');
  if (!container) return;

  if (spellingQueue.length === 0) {
    spellingGameActive = false;
    container.innerHTML = `
      <div class="empty-message">
        🎉 Spelling Bee completo! 🎉<br><br>
        Placar final: <strong>${spellingPoints}</strong> acertos, <strong>${spellingErrors}</strong> erros.<br><br>
        <button class="reset-btn" onclick="iniciarSpellingBee()">Jogar Novamente</button>
      </div>
    `;
    const startBtn = document.getElementById('btnStartSpelling');
    if (startBtn) startBtn.style.display = 'flex';
    atualizarBotoesSpelling(false);
    return;
  }

  currentSpellingObj = spellingQueue[0];
  spellingReplaysLeft = spellingReplaysLimit;
  spellingHintUsed = false;
  spellingHintsAvailable = calcularHintsDisponiveis(currentSpellingObj.answer);

  const modoSelect = document.getElementById('spellingModeSelect')?.value || 'word';
  const tipoConteudo = decidirTipoConteudo(modoSelect, currentSpellingObj);

  currentSpellingObj._modoExibicao = tipoConteudo;

  container.innerHTML = `
    <div class="spelling-wrapper">
      <div class="spelling-card">
        <div class="difficulty ${currentSpellingObj.level}">${currentSpellingObj.level}</div>
        <div class="spelling-type-badge">${tipoConteudo === 'word' ? '📝 Palavra' : '📖 Frase'}</div>

        <div class="spelling-instruction">
          ${tipoConteudo === 'word'
            ? 'Ouça a palavra e escreva o que você ouviu:'
            : 'Ouça a frase completa e escreva o que você ouviu:'}
        </div>

        <div class="spelling-audio-controls">
          <button id="spellingPlayBig" class="spelling-play-btn">🔊 Tocar</button>
        </div>

        <div class="spelling-input-wrap">
          <input 
            type="text" 
            id="spellingAnswerInput" 
            class="spelling-input" 
            placeholder="${tipoConteudo === 'word' ? 'Digite a palavra...' : 'Digite a frase...'}"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
          >
        </div>

        <div class="spelling-actions">
          <button id="btnSpellingCheck" class="check-btn">✓ Verificar</button>
          <button id="btnSpellingSkip" class="secondary-button">⏭️ Pular</button>
        </div>

        <div id="spellingFeedback" class="spelling-feedback"></div>

        <div id="spellingReveal" class="spelling-reveal" style="display:none;"></div>
      </div>
    </div>
  `;

  const input = document.getElementById('spellingAnswerInput');
  const btnCheck = document.getElementById('btnSpellingCheck');
  const btnSkip = document.getElementById('btnSpellingSkip');
  const btnPlayBig = document.getElementById('spellingPlayBig');

  if (btnCheck) btnCheck.onclick = verificarSpelling;
  if (btnSkip) btnSkip.onclick = pularSpelling;
  if (btnPlayBig) btnPlayBig.onclick = () => tocarSpelling(false);

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        verificarSpelling();
      }
    });
    setTimeout(() => input.focus(), 150);
  }

  atualizarBotoesSpelling(true);
  atualizarSpellingScore();

  setTimeout(() => tocarSpelling(false, true), 400);  // true = isAutoPlay
}

function decidirTipoConteudo(modo, item) {
  if (modo === 'word') return 'word';
  if (modo === 'phrase') return 'phrase';
  if (modo === 'progressive') {
    if (!item) return 'word';
    if (item.level === 'A1' || item.level === 'A2') return 'word';
    return 'phrase';
  }
  return 'word';
}

function calcularHintsDisponiveis(answer) {
  if (!answer) return 0;
  const letters = answer.replace(/[^a-zA-Z]/g, '').length;
  return Math.min(5, Math.max(1, Math.floor(letters / 4)));
}

function atualizarBotoesSpelling(ativo) {
  const play = document.getElementById('btnPlaySpelling');
  const slow = document.getElementById('btnSlowSpelling');
  const hint = document.getElementById('btnHintSpelling');
  const replaysEl = document.getElementById('spellingReplaysLeft');

  if (play) play.disabled = !ativo;
  if (slow) slow.disabled = !ativo;
  if (hint) hint.disabled = !ativo;

  if (replaysEl) {
    if (spellingReplaysLimit === Infinity) replaysEl.textContent = '∞';
    else replaysEl.textContent = spellingReplaysLeft;
  }
}

function atualizarSpellingScore() {
  const p = document.getElementById('spellingPoints');
  const e = document.getElementById('spellingErrors');
  const t = document.getElementById('spellingTotal');
  if (p) p.textContent = spellingPoints;
  if (e) e.textContent = spellingErrors;
  if (t) t.textContent = spellingPoints + spellingErrors;
}

function tocarSpelling(lento, isAutoPlay = false) {
  if (!spellingGameActive || !currentSpellingObj) return;

  const texto = currentSpellingObj.answer;
  const rateOriginal = speechRate;
  if (lento) speechRate = 0.5;

  falarTexto(texto, 'en-US');
  speechRate = rateOriginal;

  // ✅ CORREÇÃO: auto-play inicial NÃO desconta replay
  // Só desconta quando o usuário clica manualmente nos botões
  if (!isAutoPlay) {
    if (spellingReplaysLimit !== Infinity && spellingReplaysLeft > 0) {
      spellingReplaysLeft--;
      const el = document.getElementById('spellingReplaysLeft');
      if (el) el.textContent = spellingReplaysLeft;
    }

    if (spellingReplaysLimit !== Infinity && spellingReplaysLeft <= 0) {
      const play = document.getElementById('btnPlaySpelling');
      const slow = document.getElementById('btnSlowSpelling');
      const bigPlay = document.getElementById('spellingPlayBig');
      if (play) play.disabled = true;
      if (slow) slow.disabled = true;
      if (bigPlay) bigPlay.disabled = true;
    }
  }
}

function mostrarHintSpelling() {
  if (!currentSpellingObj || !spellingGameActive) return;
  if (spellingHintUsed) return;
  if (spellingHintsAvailable <= 0) {
    const fb = document.getElementById('spellingFeedback');
    if (fb) {
      fb.className = 'spelling-feedback warning';
      fb.innerHTML = '💡 Você já usou todas as dicas desta palavra.';
      fb.style.display = 'block';
      setTimeout(() => { fb.style.display = 'none'; }, 2500);
    }
    return;
  }

  spellingHintUsed = true;

  const answer = currentSpellingObj.answer;
  const isWord = currentSpellingObj._modoExibicao === 'word';
  const lettersOnly = answer.replace(/[^a-zA-Z]/g, '');

  let hintText = '';
  if (isWord) {
    const firstLetter = lettersOnly[0] || '';
    hintText = `💡 Dica: começa com "<strong>${firstLetter.toUpperCase()}</strong>" e tem <strong>${lettersOnly.length}</strong> letras.`;
  } else {
    const words = answer.split(/\s+/);
    const hintWords = words.map(w => {
      const letters = w.replace(/[^a-zA-Z]/g, '');
      return `${w[0]}${'_'.repeat(Math.max(0, letters.length - 1))}`;
    });
    hintText = `💡 Dica: <strong>${hintWords.join(' ')}</strong>`;
  }

  const fb = document.getElementById('spellingFeedback');
  if (fb) {
    fb.className = 'spelling-feedback hint';
    fb.innerHTML = hintText;
    fb.style.display = 'block';
  }

  const hintBtn = document.getElementById('btnHintSpelling');
  if (hintBtn) hintBtn.disabled = true;
}

function verificarSpelling() {
  if (!currentSpellingObj || !spellingGameActive) return;

  const input = document.getElementById('spellingAnswerInput');
  if (!input) return;

  const userAnswer = input.value.trim();
  const fb = document.getElementById('spellingFeedback');
  const revealDiv = document.getElementById('spellingReveal');

  if (!userAnswer) {
    if (fb) {
      fb.className = 'spelling-feedback warning';
      fb.innerHTML = '⚠️ Digite algo primeiro!';
      fb.style.display = 'block';
    }
    return;
  }

  const normalize = (str) => {
    if (!str) return '';
    return str.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  };

  const normalizedUser = normalize(userAnswer);
  const normalizedCorrect = normalize(currentSpellingObj.answer);
  const isCorrect = normalizedUser === normalizedCorrect;

  const checkBtn = document.getElementById('btnSpellingCheck');
  const skipBtn = document.getElementById('btnSpellingSkip');
  if (checkBtn) checkBtn.disabled = true;
  if (skipBtn) skipBtn.disabled = true;
  input.disabled = true;

  if (isCorrect) {
    spellingPoints++;
    spellingWordsSeen.add(currentSpellingObj.answer);

    if (fb) {
      fb.className = 'spelling-feedback correct';
      fb.innerHTML = '✅ Correto! Muito bem! 🎉';
      fb.style.display = 'block';
    }

    if (revealDiv) {
      revealDiv.style.display = 'block';
      revealDiv.innerHTML = gerarRevealHTML(currentSpellingObj, true);
    }

    atualizarSpellingScore();

    setTimeout(() => {
      if (spellingQueue.length > 0) {
        spellingQueue.shift();
        carregarProximaSpelling();
      }
    }, 2000);

  } else {
    spellingErrors++;

    if (fb) {
      fb.className = 'spelling-feedback incorrect';
      fb.innerHTML = `
        ❌ Não foi dessa vez!
        <div style="margin-top:10px;">${renderLetterDiff(userAnswer, currentSpellingObj.answer)}</div>
        <div style="margin-top:8px;font-size:0.85rem;opacity:0.8;">
          Resposta correta: <strong>${escapeHtml(currentSpellingObj.answer)}</strong>
        </div>
      `;
      fb.style.display = 'block';
    }

    atualizarSpellingScore();

    // ✅ CORREÇÃO: popular o reveal ANTES de adicionar os botões
    if (revealDiv) {
      revealDiv.style.display = 'block';
      revealDiv.innerHTML = gerarRevealHTML(currentSpellingObj, false);

      // Botão Próxima
      const nextBtn = document.createElement('button');
      nextBtn.className = 'check-btn';
      nextBtn.textContent = '➡️ Próxima';
      nextBtn.style.marginTop = '12px';
      nextBtn.style.marginRight = '8px';
      nextBtn.onclick = () => {
        if (spellingQueue.length > 0) {
          spellingQueue.shift();
          carregarProximaSpelling();
        }
      };
      revealDiv.appendChild(nextBtn);

      // Botão Tentar Novamente
      const tryAgainBtn = document.createElement('button');
      tryAgainBtn.className = 'secondary-button';
      tryAgainBtn.textContent = '🔄 Tentar Novamente';
      tryAgainBtn.style.marginTop = '12px';
      tryAgainBtn.onclick = () => {
        if (revealDiv) {
          revealDiv.innerHTML = '';
          revealDiv.style.display = 'none';
        }
        if (fb) fb.style.display = 'none';
        if (input) {
          input.value = '';
          input.disabled = false;
          input.focus();
        }
        if (checkBtn) checkBtn.disabled = false;
        if (skipBtn) skipBtn.disabled = false;
      };
      revealDiv.appendChild(tryAgainBtn);
    }

    // Colocar a palavra de volta no final da fila (para revisão)
    const errada = spellingQueue.shift();
    spellingQueue.push(errada);
  }
}

function gerarRevealHTML(item, correto) {
  let html = '<div class="spelling-reveal-content">';
  html += `<div class="spelling-answer-word">${escapeHtml(item.answer)}</div>`;

  if (item.translation) {
    html += `<div class="spelling-translation"><strong>🇧🇷 Tradução:</strong> ${escapeHtml(item.translation)}</div>`;
  }

  if (item.definition_en) {
    html += `<div class="spelling-definition"><strong>📘 English:</strong> ${escapeHtml(item.definition_en)}</div>`;
  }

  if (item.definition_pt) {
    html += `<div class="spelling-definition"><strong>📗 Português:</strong> ${escapeHtml(item.definition_pt)}</div>`;
  }

  if (item.example) {
    html += `<div class="spelling-example"><strong>💬 Exemplo:</strong> <em>${escapeHtml(item.example)}</em></div>`;
  }

  html += '</div>';
  return html;
}
// ============================================
// DIFF LETRA POR LETRA PARA O SPELLING BEE
// ============================================

// Calcula o alinhamento entre duas strings (LCS) e retorna
// um array de pares { userChar, correctChar, status }
// status: 'match' | 'wrong' | 'extra' | 'missing'
function alignStrings(userStr, correctStr) {
  const u = userStr.split('');
  const c = correctStr.split('');
  const m = u.length;
  const n = c.length;

  // Matriz LCS
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (u[i - 1].toLowerCase() === c[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Reconstruir o alinhamento (de trás para frente)
  const result = [];
  let i = m, j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && u[i - 1].toLowerCase() === c[j - 1].toLowerCase()) {
      result.push({ userChar: u[i - 1], correctChar: c[j - 1], status: 'match' });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      // Letra faltante (existe na correta, não no input)
      result.push({ userChar: null, correctChar: c[j - 1], status: 'missing' });
      j--;
    } else if (i > 0) {
      // Letra extra (existe no input, não na correta)
      result.push({ userChar: u[i - 1], correctChar: null, status: 'extra' });
      i--;
    }
  }

  return result.reverse();
}

// Gera HTML colorido do diff
function renderLetterDiff(userAnswer, correctAnswer) {
  const alignment = alignStrings(userAnswer, correctAnswer);

  let userLineHTML = '';
  let correctLineHTML = '';
  let missingLineHTML = '';
  let hasMissing = false;

  alignment.forEach(pair => {
    if (pair.status === 'match') {
      userLineHTML += `<span class="letter-match">${escapeHtml(pair.userChar)}</span>`;
      correctLineHTML += `<span class="letter-match">${escapeHtml(pair.correctChar)}</span>`;
    } else if (pair.status === 'extra') {
      userLineHTML += `<span class="letter-extra">${escapeHtml(pair.userChar)}</span>`;
      correctLineHTML += `<span class="letter-gap">·</span>`;
    } else if (pair.status === 'missing') {
      userLineHTML += `<span class="letter-missing-gap">_</span>`;
      correctLineHTML += `<span class="letter-missing">${escapeHtml(pair.correctChar)}</span>`;
      missingLineHTML += escapeHtml(pair.correctChar);
      hasMissing = true;
    }
  });

  let html = '<div class="letter-diff">';

  html += `
    <div class="diff-row">
      <div class="diff-label">Sua resposta:</div>
      <div class="diff-chars">${userLineHTML}</div>
    </div>
    <div class="diff-row">
      <div class="diff-label">Correta:</div>
      <div class="diff-chars">${correctLineHTML}</div>
    </div>
  `;

  if (hasMissing) {
    html += `
      <div class="diff-row diff-missing-row">
        <div class="diff-label">Faltando:</div>
        <div class="diff-chars"><span class="letter-missing">${missingLineHTML}</span></div>
      </div>
    `;
  }

  html += '</div>';
  return html;
}

function pularSpelling() {
  if (!currentSpellingObj || !spellingGameActive) return;

  const input = document.getElementById('spellingAnswerInput');
  const fb = document.getElementById('spellingFeedback');
  const revealDiv = document.getElementById('spellingReveal');

  if (fb) {
    fb.className = 'spelling-feedback warning';
    fb.innerHTML = `⏭️ Você pulou. A resposta correta era: "<strong>${escapeHtml(currentSpellingObj.answer)}</strong>"`;
    fb.style.display = 'block';
  }

  if (revealDiv) {
    revealDiv.style.display = 'block';
    revealDiv.innerHTML = gerarRevealHTML(currentSpellingObj, false);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'check-btn';
    nextBtn.textContent = '➡️ Próxima';
    nextBtn.style.marginTop = '10px';
    nextBtn.onclick = () => {
      if (spellingQueue.length > 0) {
        spellingQueue.shift();
        carregarProximaSpelling();
      }
    };
    revealDiv.appendChild(nextBtn);
  }

  const checkBtn = document.getElementById('btnSpellingCheck');
  const skipBtn = document.getElementById('btnSpellingSkip');
  if (checkBtn) checkBtn.disabled = true;
  if (skipBtn) skipBtn.disabled = true;
  if (input) input.disabled = true;
}

function resetarSpellingBee() {
  spellingQueue = [];
  spellingQueueOriginal = [];
  currentSpellingObj = null;
  spellingPoints = 0;
  spellingErrors = 0;
  spellingGameActive = false;
  atualizarSpellingScore();

  const container = document.getElementById('spellingContainer');
  if (container) {
    container.innerHTML = `
      <div class="empty-message">
        🔄 Spelling Bee resetado.<br>Selecione um nível e clique em "Start Spelling Bee".
      </div>
    `;
  }

  const startBtn = document.getElementById('btnStartSpelling');
  if (startBtn) startBtn.style.display = 'flex';

  atualizarBotoesSpelling(false);
}

window.iniciarSpellingBee = iniciarSpellingBee;
window.resetarSpellingBee = resetarSpellingBee;
window.startVoiceRecording = startVoiceRecording;
window.stopVoiceRecording = stopVoiceRecording;
window.comparePronunciation = comparePronunciation;

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  carregarDados();
  loadSentenceData();
  initDonation();

  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      console.log("🎤 Vozes carregadas:", window.speechSynthesis.getVoices().length);
      getBestEnglishVoice();
    };
  }
});