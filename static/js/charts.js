// Keep track of chart instances to prevent memory leaks and reuse errors
let activeCharts = {};

function safeRenderChart(canvasId, config) {
  if (activeCharts[canvasId]) {
    activeCharts[canvasId].destroy();
  }
  const canvas = document.getElementById(canvasId);
  if (canvas) {
    const ctx = canvas.getContext('2d');
    activeCharts[canvasId] = new Chart(ctx, config);
  }
}

// Fetch default data from server
async function fetchDefaultData() {
  const response = await fetch('/api/data');
  if (!response.ok) {
    throw new Error('Falha ao buscar dados iniciais');
  }
  return await response.json();
}

// Interpretations and badge color helper functions
function getSusBadgeConfig(score) {
  if (score == null) return { text: 'Sem dados', class: 'bg-secondary' };
  if (score < 50) return { text: 'Baixa Usabilidade', class: 'bg-danger text-white' };
  if (score < 70) return { text: 'Usabilidade Marginal', class: 'bg-warning text-dark' };
  if (score < 80) return { text: 'Aceitável', class: 'bg-info text-white' };
  return { text: 'Excelente Usabilidade', class: 'bg-success text-white' };
}

function getUeqBadgeConfig(score) {
  if (score == null) return { text: 'Sem dados', class: 'bg-secondary' };
  if (score < -0.8) return { text: 'Negativo', class: 'bg-danger text-white' };
  if (score <= 0.8) return { text: 'Neutro', class: 'bg-warning text-dark' };
  return { text: 'Altamente Positivo', class: 'bg-success text-white' };
}

// Main Render Function
function renderDashboard(data) {
  // 1. Populate KPI Cards
  document.getElementById('kpiParticipants').textContent = data.n_participants || 0;
  
  const susVal = data.sus && data.sus.media_geral != null ? data.sus.media_geral : null;
  const susSummaryTextEl = document.getElementById('susSummaryText');
  if (susSummaryTextEl) {
    susSummaryTextEl.textContent = susVal != null ? `${susVal.toFixed(2)} / 100` : '—';
  }

  const kpiSusEl = document.getElementById('kpiSus');
  const kpiSusBadge = document.getElementById('kpiSusBadge');
  if (susVal != null) {
    kpiSusEl.textContent = susVal.toFixed(1);
    const badge = getSusBadgeConfig(susVal);
    kpiSusBadge.textContent = badge.text;
    kpiSusBadge.className = `kpi-badge ${badge.class}`;
  } else {
    kpiSusEl.textContent = '—';
    kpiSusBadge.textContent = 'Sem dados';
    kpiSusBadge.className = 'kpi-badge bg-secondary';
  }

  const pragmaticVal = data.ueq && data.ueq.pragmatic_mean != null ? data.ueq.pragmatic_mean : 0.0;
  document.getElementById('kpiPragmatic').textContent = pragmaticVal.toFixed(2);

  const hedonicVal = data.ueq && data.ueq.hedonic_mean != null ? data.ueq.hedonic_mean : 0.0;
  document.getElementById('kpiHedonic').textContent = hedonicVal.toFixed(2);

  const ueqOverallVal = data.ueq && data.ueq.overall_mean != null ? data.ueq.overall_mean : null;
  const kpiUeqEl = document.getElementById('kpiUeqOverall');
  const kpiUeqBadge = document.getElementById('kpiUeqBadge');
  if (ueqOverallVal != null) {
    kpiUeqEl.textContent = ueqOverallVal.toFixed(2);
    const badge = getUeqBadgeConfig(ueqOverallVal);
    kpiUeqBadge.textContent = badge.text;
    kpiUeqBadge.className = `kpi-badge ${badge.class}`;
  } else {
    kpiUeqEl.textContent = '—';
    kpiUeqBadge.textContent = 'Sem dados';
    kpiUeqBadge.className = 'kpi-badge bg-secondary';
  }

  // 2. Render SUS Histogram (SUS Score by Participant)
  if (data.sus && data.sus.scores) {
    const susScores = data.sus.scores.filter(s => s !== null);
    const labels = susScores.map((_, i) => `Part. ${i + 1}`);
    safeRenderChart('susHist', {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Escore SUS Individual',
          data: susScores,
          backgroundColor: 'rgba(79, 70, 229, 0.85)',
          borderColor: 'rgb(79, 70, 229)',
          borderWidth: 1,
          borderRadius: 6,
          hoverBackgroundColor: 'rgb(67, 56, 202)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            grid: { color: '#f1f5f9' },
            title: { display: true, text: 'Pontuação (0-100)', font: { weight: 'bold' } }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  // 3. Render UEQ Dimensions Horizontal Chart
  if (data.ueq && data.ueq.dimension_means) {
    const labels = Object.keys(data.ueq.dimension_means);
    const values = labels.map(k => data.ueq.dimension_means[k] ?? 0);
    
    // Assign nice colors based on positive/negative values
    const backgroundColors = values.map(v => v >= 0.8 ? 'rgba(16, 185, 129, 0.85)' : (v <= -0.8 ? 'rgba(239, 68, 68, 0.85)' : 'rgba(245, 158, 11, 0.85)'));
    const borderColors = values.map(v => v >= 0.8 ? 'rgb(16, 185, 129)' : (v <= -0.8 ? 'rgb(239, 68, 68)' : 'rgb(245, 158, 11)'));

    safeRenderChart('ueqDim', {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Média convertida',
          data: values,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            min: -3,
            max: 3,
            grid: { color: '#e2e8f0' },
            title: { display: true, text: 'Escala UEQ (-3 a +3)', font: { weight: 'bold' } }
          },
          y: {
            grid: { display: false }
          }
        }
      }
    });
  }

  // 4. Render Table Area (Individual Results summary)
  const tableArea = document.getElementById('tableArea');
  if (tableArea && data.sus && data.ueq) {
    const n = data.n_participants || 0;
    let html = '<div class="table-responsive"><table class="table table-hover table-striped">';
    html += '<thead><tr><th># Participante</th><th>Escore SUS</th><th>Faixa SUS</th><th>Média UEQ Geral</th><th>Faixa UEQ</th></tr></thead><tbody>';
    for (let i = 0; i < n; i++) {
      const susScore = data.sus.scores[i];
      const susFaixa = data.sus.faixas[i] || '—';
      const ueqScore = data.ueq.media_geral[i];
      const ueqFaixa = data.ueq.faixas[i] || '—';
      
      const susColorClass = susScore >= 80 ? 'text-success fw-bold' : (susScore < 50 ? 'text-danger' : '');
      const ueqColorClass = ueqScore > 0.8 ? 'text-success fw-bold' : (ueqScore < -0.8 ? 'text-danger' : '');

      html += `<tr>
        <td><strong>Participante ${i + 1}</strong></td>
        <td><span class="${susColorClass}">${susScore != null ? susScore.toFixed(1) : '—'}</span></td>
        <td><span class="badge ${susScore >= 80 ? 'bg-success' : (susScore < 50 ? 'bg-danger' : 'bg-warning text-dark')}">${susFaixa}</span></td>
        <td><span class="${ueqColorClass}">${ueqScore != null ? ueqScore.toFixed(2) : '—'}</span></td>
        <td><span class="badge ${ueqScore > 0.8 ? 'bg-success' : (ueqScore < -0.8 ? 'bg-danger' : 'bg-warning text-dark')}">${ueqFaixa}</span></td>
      </tr>`;
    }
    html += '</tbody></table></div>';
    tableArea.innerHTML = html;
  }

  // 5. Render Demographics Tab Charts
  if (data.demographics) {
    const dem = data.demographics;
    
    // Digital Experience Chart (Doughnut)
    if (dem.digital_experience) {
      const keys = Object.keys(dem.digital_experience);
      const vals = Object.values(dem.digital_experience);
      safeRenderChart('digitalExpChart', {
        type: 'doughnut',
        data: {
          labels: keys,
          datasets: [{
            data: vals,
            backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } }
          }
        }
      });
    }

    // Used current system? (Pie)
    if (dem.used_current_system) {
      const keys = Object.keys(dem.used_current_system);
      const vals = Object.values(dem.used_current_system);
      safeRenderChart('usedSystemChart', {
        type: 'pie',
        data: {
          labels: keys,
          datasets: [{
            data: vals,
            backgroundColor: ['#10b981', '#ef4444', '#cbd5e1'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }

    // Time on current system (Bar)
    if (dem.current_system_time) {
      const keys = Object.keys(dem.current_system_time);
      const vals = Object.values(dem.current_system_time);
      safeRenderChart('systemTimeChart', {
        type: 'bar',
        data: {
          labels: keys,
          datasets: [{
            label: 'Participantes',
            data: vals,
            backgroundColor: '#06b6d4',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
            x: { ticks: { font: { size: 9 } } }
          }
        }
      });
    }

    // Frequency on current system (Bar)
    if (dem.use_frequency) {
      const keys = Object.keys(dem.use_frequency);
      const vals = Object.values(dem.use_frequency);
      safeRenderChart('systemFreqChart', {
        type: 'bar',
        data: {
          labels: keys,
          datasets: [{
            label: 'Frequência',
            data: vals,
            backgroundColor: '#f59e0b',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
            x: { ticks: { font: { size: 9 } } }
          }
        }
      });
    }
  }

  // 6. Correlation / Cross-analysis Chart (Dual Y-Axis)
  if (data.experience_correlation && data.experience_correlation.length > 0) {
    const experiences = data.experience_correlation.map(item => item.experience);
    const susMeans = data.experience_correlation.map(item => item.sus_mean);
    const ueqMeans = data.experience_correlation.map(item => item.ueq_mean);

    safeRenderChart('correlationChart', {
      type: 'bar',
      data: {
        labels: experiences,
        datasets: [
          {
            label: 'Média SUS (Eixo Esquerdo)',
            data: susMeans,
            backgroundColor: 'rgba(79, 70, 229, 0.8)',
            borderColor: 'rgb(79, 70, 229)',
            borderWidth: 1,
            yAxisID: 'y',
            borderRadius: 6,
            barPercentage: 0.5,
            categoryPercentage: 0.7
          },
          {
            label: 'Média UEQ Geral (Eixo Direito)',
            data: ueqMeans,
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 1,
            yAxisID: 'y1',
            borderRadius: 6,
            barPercentage: 0.5,
            categoryPercentage: 0.7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            min: 0,
            max: 100,
            title: { display: true, text: 'Pontuação SUS (0..100)', font: { weight: 'bold' } },
            grid: { color: '#f1f5f9' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            min: -3,
            max: 3,
            title: { display: true, text: 'Pontuação UEQ (-3..+3)', font: { weight: 'bold' } },
            grid: { drawOnChartArea: false } // Only draw grid for left axis
          },
          x: {
            ticks: {
              callback: function(val, index) {
                // Shorten long labels on X axis to make it legible
                const label = experiences[index];
                if (label.length > 25) {
                  return label.substring(0, 22) + '...';
                }
                return label;
              }
            }
          }
        }
      }
    });
  }

  // 7. Qualitative Feedbacks Rendering
  const renderFeedbackList = (areaId, commentsList, cardClass) => {
    const area = document.getElementById(areaId);
    if (!area) return;
    
    if (!commentsList || commentsList.length === 0) {
      area.innerHTML = '<div class="text-muted small italic p-3">Nenhum comentário registrado.</div>';
      return;
    }
    
    let html = '';
    commentsList.forEach(item => {
      html += `
        <div class="feedback-card ${cardClass}">
          <div class="feedback-text">"${item.text}"</div>
          <div class="feedback-meta">
            <span><i class="bi bi-person-fill me-1"></i> Participante ${item.index}</span>
            <span class="badge bg-light text-dark border">Enviado</span>
          </div>
        </div>
      `;
    });
    area.innerHTML = html;
  };

  if (data.open_questions) {
    renderFeedbackList('positiveFeedbackArea', data.open_questions.positive, 'positive');
    renderFeedbackList('improvementsFeedbackArea', data.open_questions.improvements, 'improvement');
  }

  // 8. Populate Transparency & Calculations Area
  const calc = document.getElementById('calcMethod');
  const rawSusTable = document.getElementById('rawSusTable');
  const rawUeqTable = document.getElementById('rawUeqTable');
  const ueqSummary = document.getElementById('ueqSummary');

  if (data.calculation_method && calc) {
    let text = '';
    if (data.calculation_method.SUS) text += `Método SUS:\n${data.calculation_method.SUS}\n\n`;
    if (data.calculation_method.UEQ) text += `Método UEQ:\n${data.calculation_method.UEQ}\n\n`;
    if (data.calculation_method.UEQ_dimensions_mapping) {
      text += 'Mapeamento de perguntas e dimensões no UEQ:\n';
      for (const [question, dim] of Object.entries(data.calculation_method.UEQ_dimensions_mapping)) {
        text += `- ${question}: ${dim}\n`;
      }
    }
    calc.textContent = text;
  }

  function getColumnClass(col) {
    if (col === 'SUS' || col === 'UEQ_media_geral') return 'raw-average fw-bold';
    if (col.endsWith(' - SUS ajustado') || col.endsWith(' - UEQ convertido')) return 'raw-converted';
    return 'raw-original text-muted';
  }

  function renderTable(area, headers, rows) {
    if (!area) return;
    let html = '<div class="table-responsive"><table class="table table-sm table-bordered raw-table"><thead><tr>';
    for (const c of headers) {
      const cls = getColumnClass(c);
      // Clean header name for display
      const displayName = c.replace(' - SUS ajustado', ' (Ajustado)').replace(' - UEQ convertido', ' (Convertido)');
      html += `<th class="${cls}">${displayName}</th>`;
    }
    html += '</tr></thead><tbody>';
    for (const row of rows) {
      html += '<tr>';
      for (const c of headers) {
        const cls = getColumnClass(c);
        const val = row[c];
        const formattedVal = (typeof val === 'number') ? val.toFixed(1) : (val ?? '');
        html += `<td class="${cls}">${formattedVal}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    area.innerHTML = html;
  }

  if (data.raw_sus && data.raw_sus.length) {
    renderTable(rawSusTable, data.raw_sus_headers, data.raw_sus);
  }
  if (data.raw_ueq && data.raw_ueq.length) {
    renderTable(rawUeqTable, data.raw_ueq_headers, data.raw_ueq);
  }

  if (data.ueq && ueqSummary) {
    let summaryHtml = '<div class="mb-3"><strong>Média por Pergunta do UEQ (escala convertida -3 a +3):</strong></div>';
    summaryHtml += '<div class="row"><div class="col-md-6"><ul class="list-group list-group-flush mb-3">';
    const questionOrder = data.ueq.question_order || Object.keys(data.ueq.question_means);
    
    questionOrder.forEach((question, idx) => {
      if (idx === Math.ceil(questionOrder.length / 2)) {
        summaryHtml += '</ul></div><div class="col-md-6"><ul class="list-group list-group-flush mb-3">';
      }
      const mean = data.ueq.question_means[question];
      const dim = data.calculation_method?.UEQ_dimensions_mapping?.[question] || '';
      const dimLabel = dim ? ` <span class="badge bg-secondary ms-1">${dim}</span>` : '';
      summaryHtml += `<li class="list-group-item d-flex justify-content-between align-items-center py-2">
        <span class="small text-truncate" style="max-width: 80%;" title="${question}">${question}</span>
        <span class="d-flex align-items-center">
          ${dimLabel}
          <span class="fw-bold ms-2 ${mean >= 0.8 ? 'text-success' : (mean <= -0.8 ? 'text-danger' : 'text-warning')}">${mean.toFixed(3)}</span>
        </span>
      </li>`;
    });
    summaryHtml += '</ul></div></div>';
    
    summaryHtml += '<div class="mt-3 p-3 bg-light rounded border">';
    summaryHtml += '<div class="mb-2"><strong>Média Agrupada por Dimensão do UEQ:</strong></div><div class="row">';
    for (const [dim, mean] of Object.entries(data.ueq.dimension_means)) {
      summaryHtml += `<div class="col-sm-6 col-md-3 mb-2">
        <div class="bg-white p-2 border rounded text-center">
          <div class="small text-muted font-bold">${dim}</div>
          <div class="fs-5 fw-bold ${mean >= 0.8 ? 'text-success' : (mean <= -0.8 ? 'text-danger' : 'text-warning')}">${mean.toFixed(3)}</div>
        </div>
      </div>`;
    }
    summaryHtml += '</div></div>';
    
    summaryHtml += `
      <div class="mt-3 d-flex justify-content-between align-items-center border-top pt-3">
        <span><strong>Escore UEQ Geral:</strong></span>
        <span class="fs-4 fw-bold ${ueqOverallVal >= 0.8 ? 'text-success' : (ueqOverallVal <= -0.8 ? 'text-danger' : 'text-warning')}">${ueqOverallVal != null ? ueqOverallVal.toFixed(3) : '—'}</span>
      </div>
    `;
    ueqSummary.innerHTML = summaryHtml;
  }
}

// Handle Dynamic Upload Requests
async function uploadAndAnalyzeCSV(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const uploadZone = document.getElementById('uploadZone');
  const originalHtml = uploadZone.innerHTML;
  
  // Show uploading spinner state
  uploadZone.innerHTML = `
    <div class="spinner-border text-primary my-2" role="status">
      <span class="visually-hidden">Enviando...</span>
    </div>
    <div class="upload-text fw-bold">Processando seu arquivo CSV...</div>
    <div class="upload-subtext">Isso levará apenas alguns milissegundos.</div>
  `;
  
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Erro ao processar o arquivo CSV.');
    }
    
    const data = await response.json();
    renderDashboard(data);
    
    // Show success state briefly
    uploadZone.innerHTML = `
      <i class="bi bi-check-circle-fill text-success upload-icon"></i>
      <div class="upload-text text-success">Arquivo CSV importado e calculado com sucesso!</div>
      <div class="upload-subtext">Dashboard atualizado dinamicamente.</div>
    `;
    
    setTimeout(() => {
      uploadZone.innerHTML = originalHtml;
      setupUploadEvents(); // Rebind events since we changed innerHTML
    }, 3000);
    
  } catch (error) {
    // Show error state
    uploadZone.innerHTML = `
      <i class="bi bi-exclamation-octagon-fill text-danger upload-icon"></i>
      <div class="upload-text text-danger">Falha na importação!</div>
      <div class="upload-subtext">${error.message}</div>
    `;
    setTimeout(() => {
      uploadZone.innerHTML = originalHtml;
      setupUploadEvents();
    }, 4500);
  }
}

// Bind Drag & Drop and click events on upload zone
function setupUploadEvents() {
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');

  uploadZone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadAndAnalyzeCSV(e.target.files[0]);
    }
  });

  // Drag over states
  ['dragenter', 'dragover'].forEach(eventName => {
    uploadZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    uploadZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.remove('dragover');
    }, false);
  });

  uploadZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files[0]) {
      uploadAndAnalyzeCSV(files[0]);
    }
  });
}

// Initial initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  setupUploadEvents();
  
  // Set default tabs trigger
  const tabEl = document.getElementById('toggleTransparency');
  if (tabEl) {
    tabEl.addEventListener('click', () => {
      const area = document.getElementById('transparencyArea');
      area.style.display = area.style.display === 'none' ? 'block' : 'none';
    });
  }

  try {
    const initialData = await fetchDefaultData();
    renderDashboard(initialData);
  } catch (err) {
    console.error('Falha ao renderizar dados padrão:', err);
  }
});
