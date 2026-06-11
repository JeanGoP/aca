const examples = {
  restaurant:
    'Como podria la pyme Restaurante El Buen Sabor aumentar en un 15% sus ventas de almuerzos ejecutivos, debido a la baja recordacion de marca en clientes cercanos, aplicando estrategias de Fundamentos de Mercadeo?',
  fashion:
    'De que manera la boutique Moda Clara puede reducir en un 18% la devolucion de prendas, causada por una comunicacion poco clara de tallas, usando herramientas de segmentacion y mezcla de mercadeo?',
  factory:
    'Como podria la fabrica MetalNorte incrementar en un 12% los pedidos empresariales, debido a la falta de posicionamiento en el mercado local, aplicando conceptos de mercado objetivo y propuesta de valor?',
  logistics:
    'Como puede la distribuidora Rapido Sur disminuir en un 10% las quejas de clientes, por retrasos asociados a una comunicacion comercial insuficiente, usando estrategias de servicio al cliente y mercadeo relacional?',
  ecommerce:
    'Como podria la pyme Tienda Virtual TecnoClub incrementar en un 20% la tasa de conversion en su plataforma de comercio electronico, mitigando el abandono del carrito debido a la falta de pasarelas de pago locales, aplicando estrategias de Fundamentos de Mercadeo?'
};

const criteria = [
  {
    id: 'question',
    title: '1. Pregunta/Verbo',
    pass: 'Formula detectada',
    fail: 'Falta pregunta clara',
    markClass: 'question',
    icon: '?',
    test(text, normalized) {
      return /\?/.test(text) || /\b(como|de que manera|cual|que)\b/.test(normalized);
    },
    find(text) {
      return findFirst(text, [
        /¿?\b(C[oó]mo|De qu[eé] manera|Cu[aá]l|Qu[eé])\b/i,
        /\b(podr[ií]a|puede|permitir[ií]a|ayudar[ií]a)\b/i
      ]);
    }
  },
  {
    id: 'company',
    title: '2. Empresa/Area',
    pass: 'Empresa o area delimitada',
    fail: 'No se delimita entidad',
    markClass: 'company',
    icon: 'E',
    test(text, normalized) {
      return /\b(pyme|empresa|restaurante|boutique|fabrica|distribuidora|tienda|negocio|area|departamento|marca|emprendimiento)\b/.test(normalized);
    },
    find(text) {
      return findFirst(text, [
        /\b(pyme|empresa|restaurante|boutique|f[aá]brica|distribuidora|tienda|negocio|[aá]rea|departamento|marca|emprendimiento)\b(?:\s+["']?[\wÁÉÍÓÚÜÑáéíóúüñ]+["']?){0,4}/i
      ]);
    }
  },
  {
    id: 'data',
    title: '3. Dato Real',
    pass: 'Dato o cifra numerica',
    fail: 'Falta dato medible',
    markClass: 'data',
    icon: '#',
    test(text, normalized) {
      return /(\d+\s?%|\$\s?\d+|\b\d+(?:[.,]\d+)?\b)/.test(normalized);
    },
    find(text) {
      return findFirst(text, [/(\d+\s?%|\$\s?\d+(?:[.,]\d+)?|\b\d+(?:[.,]\d+)?\b)/i]);
    }
  },
  {
    id: 'cause',
    title: '4. Causa Raiz',
    pass: 'Causa raiz identificada',
    fail: 'Falta causa raiz',
    markClass: 'cause',
    icon: 'C',
    test(text, normalized) {
      return /\b(debido a|causad[ao] por|por la falta de|por falta de|porque|ya que|dado que|a causa de|mitigando|asociad[ao]s? a)\b/.test(normalized);
    },
    find(text) {
      return findFirst(text, [
        /\b(debido a|causad[ao] por|por la falta de|por falta de|porque|ya que|dado que|a causa de|mitigando|asociad[ao]s? a)\b(?:\s+\S+){0,8}/i
      ]);
    }
  },
  {
    id: 'subject',
    title: '5. Asignatura',
    pass: 'Conexion con materia',
    fail: 'Falta conexion academica',
    markClass: 'subject',
    icon: 'A',
    test(text, normalized) {
      return /\b(fundamentos de mercadeo|mercadeo|marketing|mercado|segmentacion|mezcla de mercadeo|4p|precio|producto|plaza|promocion|posicionamiento|propuesta de valor|servicio al cliente)\b/.test(normalized);
    },
    find(text) {
      return findFirst(text, [
        /\b(Fundamentos de Mercadeo|mercadeo|marketing|mercado objetivo|segmentaci[oó]n|mezcla de mercadeo|4P|precio|producto|plaza|promoci[oó]n|posicionamiento|propuesta de valor|servicio al cliente)\b/i
      ]);
    }
  }
];

const input = document.querySelector('#questionInput');
const highlightedQuestion = document.querySelector('#highlightedQuestion');
const criteriaGrid = document.querySelector('#criteriaGrid');
const resultPanel = document.querySelector('#resultPanel');
const clearButton = document.querySelector('#clearInput');

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char]);
}

function findFirst(text, patterns) {
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) {
      return {
        start: match.index,
        end: match.index + match[0].length
      };
    }
  }
  return null;
}

function collectMatches(text, results) {
  const matches = [];

  results.forEach((result) => {
    const found = result.criterion.find(text);
    if (result.ok && found && found.end > found.start) {
      matches.push({ ...found, className: result.criterion.markClass });
    }
  });

  return matches
    .sort((a, b) => a.start - b.start || b.end - a.end)
    .reduce((clean, next) => {
      const previous = clean[clean.length - 1];
      if (!previous || next.start >= previous.end) {
        clean.push(next);
      }
      return clean;
    }, []);
}

function renderHighlighted(text, results) {
  if (!text.trim()) {
    highlightedQuestion.innerHTML = '<span class="placeholder">Escribe una pregunta para ver el analisis aqui.</span>';
    return;
  }

  const matches = collectMatches(text, results);
  let cursor = 0;
  let html = '';

  matches.forEach((match) => {
    html += escapeHtml(text.slice(cursor, match.start));
    html += `<span class="mark ${match.className}">${escapeHtml(text.slice(match.start, match.end))}</span>`;
    cursor = match.end;
  });

  html += escapeHtml(text.slice(cursor));
  highlightedQuestion.innerHTML = html;
}

function renderCriteria(results) {
  criteriaGrid.innerHTML = results.map((result) => `
    <article class="criterion ${result.ok ? '' : 'missing'}">
      <span class="icon" aria-hidden="true">${result.criterion.icon}</span>
      <h2>${result.criterion.title}</h2>
      <p>${result.ok ? result.criterion.pass : result.criterion.fail}</p>
    </article>
  `).join('');
}

function renderResult(results) {
  const total = results.filter((result) => result.ok).length;
  const missing = results
    .filter((result) => !result.ok)
    .map((result) => result.criterion.title.replace(/^\d+\.\s*/, '').toLowerCase());

  resultPanel.classList.remove('warning', 'error');

  if (total === 5) {
    resultPanel.textContent = 'Excelente trabajo: 5/5 criterios. La pregunta cumple con todos los parametros y esta lista para el informe.';
    return;
  }

  if (total >= 3) {
    resultPanel.classList.add('warning');
    resultPanel.textContent = `Buen avance: ${total}/5 criterios. Ajusta: ${missing.join(', ')}.`;
    return;
  }

  resultPanel.classList.add('error');
  resultPanel.textContent = `Debe fortalecerse: ${total}/5 criterios. Incluye una pregunta mas completa con ${missing.join(', ')}.`;
}

function validate() {
  const text = input.value;
  const normalized = normalizeText(text);
  const results = criteria.map((criterion) => ({
    criterion,
    ok: criterion.test(text, normalized)
  }));

  renderHighlighted(text, results);
  renderCriteria(results);
  renderResult(results);
}

document.querySelectorAll('[data-example]').forEach((button) => {
  button.addEventListener('click', () => {
    input.value = examples[button.dataset.example];
    validate();
    input.focus();
  });
});

clearButton.addEventListener('click', () => {
  input.value = '';
  validate();
  input.focus();
});

input.addEventListener('input', validate);

input.value = examples.ecommerce;
validate();
