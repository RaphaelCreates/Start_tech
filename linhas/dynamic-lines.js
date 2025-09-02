// Configuração da API
const API_BASE_URL = 'http://localhost:8000';

// Função para buscar schedule atual
async function fetchCurrentSchedule() {
    try {
        const response = await fetch(`${API_BASE_URL}/schedules/current`);
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar schedule atual:', error);
        return null;
    }
}

// Função para buscar próximo schedule
async function fetchNextSchedule() {
    try {
        const response = await fetch(`${API_BASE_URL}/schedules/next`);
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar próximo schedule:', error);
        return null;
    }
}

// Função para atualizar informações de tempo em uma linha específica
async function updateTimeInfo(lineElement) {
    const infoTempoDiv = lineElement.querySelector('.info-tempo span');
    const infoTempoContainer = lineElement.querySelector('.info-tempo');
    
    if (!infoTempoDiv || !infoTempoContainer) return;
    
    try {
        const lineId = lineElement.getAttribute('data-line-id');
        
        // Buscar schedule atual e próximo para esta linha específica
        const [currentResponse, nextResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/schedules/current?line_id=${lineId}`),
            fetch(`${API_BASE_URL}/schedules/next?line_id=${lineId}`)
        ]);
        
        const currentSchedule = currentResponse.ok ? await currentResponse.json() : null;
        const nextSchedule = nextResponse.ok ? await nextResponse.json() : null;
        
        const now = new Date();
        
        // 1. VERIFICAR SE ÔNIBUS ESTÁ NO LOCAL (entre arrival e departure)
        if (currentSchedule) {
            const arrivalTime = new Date(currentSchedule.departure_datetime);
            arrivalTime.setMinutes(arrivalTime.getMinutes() - 5); // arrival = departure - 5min
            const departureTime = new Date(currentSchedule.departure_datetime);
            
            if (now >= arrivalTime && now <= departureTime) {
                // ÔNIBUS ESTÁ NO LOCAL
                infoTempoDiv.textContent = 'Ônibus no local';
                infoTempoContainer.style.backgroundColor = '#d4edda'; // Verde claro
                infoTempoContainer.style.color = '#155724'; // Verde escuro
                return;
            }
        }
        
        // 2. CALCULAR TEMPO ATÉ O PRÓXIMO ÔNIBUS
        if (nextSchedule) {
            const nextArrival = new Date(nextSchedule.departure_datetime);
            nextArrival.setMinutes(nextArrival.getMinutes() - 5); // arrival = departure - 5min
            
            const diffMs = nextArrival - now;
            
            if (diffMs > 0) {
                const diffMinutes = Math.floor(diffMs / (1000 * 60));
                const diffHours = Math.floor(diffMinutes / 60);
                const remainingMinutes = diffMinutes % 60;
                
                let timeText;
                if (diffHours > 0) {
                    if (remainingMinutes > 0) {
                        timeText = `${diffHours}h ${remainingMinutes}min`;
                    } else {
                        timeText = `${diffHours}h`;
                    }
                } else {
                    timeText = `${diffMinutes} min`;
                }
                
                infoTempoDiv.textContent = timeText;
                infoTempoContainer.style.backgroundColor = '#e8f5e9'; // Verde original
                infoTempoContainer.style.color = '#2e7d32';
                return;
            }
        }
        
        // 3. NENHUM ÔNIBUS DISPONÍVEL
        infoTempoDiv.textContent = 'Sem horários';
        infoTempoContainer.style.backgroundColor = '#ffebee'; // Vermelho claro
        infoTempoContainer.style.color = '#c62828';
        
    } catch (error) {
        console.error('Erro ao atualizar informações de tempo:', error);
        infoTempoDiv.textContent = 'Erro';
        infoTempoContainer.style.backgroundColor = '#ffebee';
        infoTempoContainer.style.color = '#c62828';
    }
}

// Função para atualizar todas as informações de tempo
async function updateAllTimeInfo() {
    const allLines = document.querySelectorAll('.acordeao-item');
    for (const lineElement of allLines) {
        await updateTimeInfo(lineElement);
    }
}

// Função para recarregar dados
async function refreshData() {
    console.log('Atualizando dados...');
    
    // Mostrar feedback visual
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.innerHTML = '<span class="material-symbols-outlined">refresh</span>Atualizando...';
    }
    
    await loadAndRenderLines();
    
    // Atualizar informações de tempo após carregar as linhas
    await updateAllTimeInfo();
    
    // Restaurar botão
    if (refreshBtn) {
        refreshBtn.innerHTML = '<span class="material-symbols-outlined">refresh</span>Atualizar Horários';
    }
}

// Função para buscar todas as linhas com seus schedules da API
async function fetchLinesWithSchedules() {
    try {
        console.log('Buscando linhas com schedules da API...');
        const response = await fetch(`${API_BASE_URL}/lines/`);
        console.log('Resposta da API:', response.status);
        if (!response.ok) {
            throw new Error(`Erro ao buscar linhas: ${response.status}`);
        }
        const lines = await response.json();
        console.log('Linhas recebidas:', lines);
        return lines;
    } catch (error) {
        console.error('Erro ao buscar linhas:', error);
        showErrorMessage('Erro ao carregar linhas. Verifique se o servidor está rodando.');
        return [];
    }
}

// Função para converter horários da API em formato adequado para o frontend
function convertSchedulesToTimeSlots(schedules) {
    const timeSlots = {
        'seg': [],
        'ter': [],
        'qua': [],
        'qui': [],
        'sex': []
    };

    schedules.forEach(schedule => {
        // Extrair apenas HH:MM do horário
        let timeString;
        
        if (schedule.departure_datetime) {
            // Caso dos endpoints /schedules/current e /schedules/next
            const departureTime = new Date(schedule.departure_datetime);
            timeString = departureTime.getHours().toString().padStart(2, '0') + ':' + 
                        departureTime.getMinutes().toString().padStart(2, '0');
        } else if (schedule.departure_time) {
            // Caso do endpoint /lines/ onde departure_time pode estar em formato datetime
            if (schedule.departure_time.includes('T')) {
                // Se for datetime completo (2025-09-01T06:15:00)
                const departureTime = new Date(schedule.departure_time);
                timeString = departureTime.getHours().toString().padStart(2, '0') + ':' + 
                            departureTime.getMinutes().toString().padStart(2, '0');
            } else {
                // Se for apenas horário (06:15)
                timeString = schedule.departure_time;
            }
        } else {
            // Fallback
            timeString = "00:00";
        }
        
        // Usar o campo day_week do banco ao invés de calcular da data
        const dayOfWeek = schedule.day_week; // 1 = segunda, 2 = terça, etc.
        
        // Mapear dia da semana
        const dayMap = {
            1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex'
        };
        
        if (dayMap[dayOfWeek]) {
            const dayKey = dayMap[dayOfWeek];
            if (timeSlots[dayKey]) {
                timeSlots[dayKey].push(timeString);
            }
        }
    });

    // Ordenar horários
    Object.keys(timeSlots).forEach(key => {
        timeSlots[key].sort();
    });

    return timeSlots;
}

// Função para criar HTML de uma linha
function createLineHTML(line, schedules) {
    const lineId = `linha-${line.name.toLowerCase().replace(/\s+/g, '-')}`;
    const timeSlots = convertSchedulesToTimeSlots(schedules);
    
    return `
        <div class="acordeao-item" id="${lineId}" data-line-id="${line.id}">
            <button type="button" class="acordeao-gatilho">
                <div class="linha-info">
                    <span class="material-symbols-outlined">directions_bus</span>
                    <span>LINHA - ${line.name.toUpperCase()}</span>
                </div>
                <span class="material-symbols-outlined chevron">expand_more</span>
            </button>
            <div class="acordeao-conteudo">
                <div class="card-horarios">
                    <div class="coluna-esquerda">
                        <div class="abas">
                            <a href="#" class="aba-ativa">Horários</a>
                            <a href="#" class="aba-fila">Fila</a>
                        </div>
                        <div class="lista-horarios">
                            <!-- Horários serão carregados dinamicamente -->
                        </div>
                    </div>
                    <div class="coluna-direita">
                        <select class="filtro-dia">
                            <option value="seg" selected>Segunda-feira</option>
                            <option value="ter">Terça-feira</option>
                            <option value="qua">Quarta-feira</option>
                            <option value="qui">Quinta-feira</option>
                            <option value="sex">Sexta-feira</option>
                        </select>
                        <button class="btn-interesse">Registrar interesse</button>
                        <div class="info-tempo">
                            <img src="../img/icone_onibus.png" alt="Ícone de ônibus verde">
                            <span>20 min</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Função para atualizar horários de uma linha específica
async function updateLineSchedules(lineElement, schedules) {
    const timeSlots = convertSchedulesToTimeSlots(schedules);
    const lineId = lineElement.getAttribute('data-line-id');
    
    // Buscar horários atual e próximo para esta linha
    let currentTime = null;
    let nextTime = null;
    
    try {
        const currentResponse = await fetch(`${API_BASE_URL}/schedules/current?line_id=${lineId}`);
        if (currentResponse.ok) {
            const currentSchedule = await currentResponse.json();
            if (currentSchedule && currentSchedule.departure_time) {
                currentTime = currentSchedule.departure_time;
            }
        }
        
        const nextResponse = await fetch(`${API_BASE_URL}/schedules/next?line_id=${lineId}`);
        if (nextResponse.ok) {
            const nextSchedule = await nextResponse.json();
            if (nextSchedule && nextSchedule.departure_time) {
                nextTime = nextSchedule.departure_time;
            }
        }
    } catch (error) {
        console.error('Erro ao buscar horários atual/próximo:', error);
    }
    
    // Função para atualizar horários baseado no filtro selecionado
    async function updateSchedulesDisplay(filtro) {
        const diaSelecionado = filtro.value;
        const divHorarios = lineElement.querySelector('.lista-horarios');
        const horarios = timeSlots[diaSelecionado] || [];
        
        divHorarios.innerHTML = '';
        
        if (horarios.length === 0) {
            divHorarios.innerHTML = '<p class="no-schedules">Nenhum horário disponível para este dia</p>';
            return;
        }
        
        // Verificar disponibilidade para cada horário usando a API
        for (const horario of horarios) {
            const label = document.createElement('label');
            
            try {
                // Verificar se é possível registrar interesse neste horário
                const response = await fetch(`http://127.0.0.1:8000/schedules/can-register-interest?line_id=${lineId}&departure_time=${horario}`);
                const data = await response.json();
                const isAvailableForInterest = data.can_register;
                
                // Aplicar estilo baseado na resposta da API
                const className = isAvailableForInterest ? 'available-schedule' : 'unavailable-schedule';
                const title = isAvailableForInterest ? 
                    'Disponível para registro de interesse' : 
                    'Horário não disponível para registro de interesse';
                
                label.innerHTML = `<input type="checkbox" name="horario-${lineId}" value="${horario}" ${!isAvailableForInterest ? 'disabled' : ''}> 
                                   <span class="${className}" title="${title}">${horario}</span>`;
            } catch (error) {
                console.error('Erro ao verificar disponibilidade:', error);
                // Em caso de erro, deixar indisponível por segurança
                label.innerHTML = `<input type="checkbox" name="horario-${lineId}" value="${horario}" disabled> 
                                   <span class="unavailable-schedule" title="Erro ao verificar disponibilidade">${horario}</span>`;
            }
            
            divHorarios.appendChild(label);
        }

        // Implementar seleção única de checkbox (apenas para checkboxes habilitados)
        const checkboxes = divHorarios.querySelectorAll('input[type="checkbox"]:not([disabled])');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('click', function() {
                if (this.checked) {
                    checkboxes.forEach(outroCheckbox => {
                        if (outroCheckbox !== this) {
                            outroCheckbox.checked = false;
                        }
                    });
                }
            });
        });
    }

    // Configurar filtro de dia
    const filtro = lineElement.querySelector('.filtro-dia');
    await updateSchedulesDisplay(filtro);
    filtro.addEventListener('change', () => updateSchedulesDisplay(filtro));
    
    // Atualizar informações de tempo para esta linha
    updateTimeInfo(lineElement);
}

// Função para configurar funcionalidade de acordeão
function setupAccordionFunctionality() {
    const gatilhosAcordeao = document.querySelectorAll('.acordeao-gatilho');
    gatilhosAcordeao.forEach(gatilho => {
        gatilho.addEventListener('click', function() {
            this.classList.toggle('ativo');
            const conteudo = this.nextElementSibling;
            if (conteudo.style.maxHeight) {
                conteudo.style.maxHeight = null;
            } else {
                conteudo.style.maxHeight = conteudo.scrollHeight + "px";
            }
        });
    });
}

// Função para configurar modal de interesse
function setupInterestModal() {
    const modal = document.getElementById('modal-confirmacao');
    const vistaConfirmacao = document.getElementById('modal-vista-confirmacao');
    const vistaSucesso = document.getElementById('modal-vista-sucesso');
    const modalTextoPrincipal = document.getElementById('modal-texto-principal');
    const modalDetalhes = document.getElementById('modal-detalhes');
    const btnConfirmar = document.getElementById('modal-btn-confirmar');

    function getProximaData(diaSelecionado) {
        const dias = { 'seg': 1, 'ter': 2, 'qua': 3, 'qui': 4, 'sex': 5 };
        const diaDaSemanaAlvo = dias[diaSelecionado];
        const hoje = new Date();
        const diaDaSemanaHoje = hoje.getDay() === 0 ? 7 : hoje.getDay();
        let diasAAdicionar = diaDaSemanaAlvo - diaDaSemanaHoje;
        if (diasAAdicionar <= 0) { diasAAdicionar += 7; }
        const proximaData = new Date();
        proximaData.setDate(new Date().getDate() + diasAAdicionar);
        return proximaData.toLocaleDateString('pt-BR');
    }

    function fecharModal() {
        modal.classList.add('escondido');
        setTimeout(() => {
            vistaConfirmacao.classList.remove('escondido');
            vistaSucesso.classList.add('escondido');
        }, 300);
    }

    // Configurar botões de interesse
    document.addEventListener('click', async function(event) {
        if (event.target.classList.contains('btn-interesse')) {
            const containerLinha = event.target.closest('.acordeao-item');
            const nomeLinha = containerLinha.querySelector('.linha-info span:last-child').textContent.replace('LINHA - ', '');
            const filtro = containerLinha.querySelector('.filtro-dia');
            const diaSelecionadoValue = filtro.value;
            const diaSelecionadoTexto = filtro.options[filtro.selectedIndex].text;
            const checkboxMarcado = containerLinha.querySelector('input[type="checkbox"]:checked');

            if (!checkboxMarcado) {
                alert('Por favor, selecione um horário antes de registrar interesse.');
                return;
            }

            const horarioEscolhido = checkboxMarcado.value;
            const lineId = containerLinha.getAttribute('data-line-id');
            
            // Verificar se é possível registrar interesse neste horário
            try {
                const canRegisterResponse = await fetch(`${API_BASE_URL}/schedules/can-register-interest?line_id=${lineId}&departure_time=${horarioEscolhido}`);
                if (canRegisterResponse.ok) {
                    const canRegisterData = await canRegisterResponse.json();
                    if (!canRegisterData.can_register) {
                        alert('Só é possível registrar interesse no horário atual ou próximo.');
                        return;
                    }
                } else {
                    alert('Erro ao verificar disponibilidade. Tente novamente.');
                    return;
                }
            } catch (error) {
                console.error('Erro ao verificar se pode registrar interesse:', error);
                alert('Erro ao verificar disponibilidade. Tente novamente.');
                return;
            }
            
            const proximaData = getProximaData(diaSelecionadoValue);
            
            modalTextoPrincipal.innerHTML = `Deseja registrar interesse em fretado ${nomeLinha}? <br> (${diaSelecionadoTexto})`;
            modalDetalhes.textContent = `Data: ${proximaData} - Horário: ${horarioEscolhido}`;
            
            modal.classList.remove('escondido');
        }
    });

    // Configurar botão confirmar
    btnConfirmar.addEventListener('click', async function() {
        // Buscar dados do interesse registrado
        const containerLinha = document.querySelector('.acordeao-item input[type="checkbox"]:checked')?.closest('.acordeao-item');
        if (containerLinha) {
            const lineId = containerLinha.getAttribute('data-line-id');
            const horarioEscolhido = containerLinha.querySelector('input[type="checkbox"]:checked')?.value;
            
            if (lineId && horarioEscolhido) {
                try {
                    // Registrar interesse na API
                    const response = await fetch(`${API_BASE_URL}/schedules/register-interest?line_id=${lineId}&departure_time=${horarioEscolhido}`, {
                        method: 'POST'
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        console.log('Interesse registrado:', result);
                    }
                } catch (error) {
                    console.error('Erro ao registrar interesse:', error);
                }
            }
        }
        
        vistaConfirmacao.classList.add('escondido');
        vistaSucesso.classList.remove('escondido');
        setTimeout(fecharModal, 2000);
    });

    // Fechar modal clicando no fundo
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            fecharModal();
        }
    });
}

// Função para configurar links da fila
function setupQueueLinks() {
    // Usar delegação de eventos no elemento pai que sempre existe
    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
        console.error('Elemento main-content não encontrado!');
        return;
    }
    
    mainContent.addEventListener('click', async function(event) {
        if (event.target.classList.contains('aba-fila')) {
            event.preventDefault();
            const containerLinha = event.target.closest('.acordeao-item');
            
            if (!containerLinha) {
                console.error('Container da linha não encontrado!');
                return;
            }
            
            const lineId = containerLinha.getAttribute('data-line-id');
            
            // Buscar o nome da linha do botão do acordeão
            const linhaInfo = containerLinha.querySelector('.linha-info span:last-child');
            const linhaTexto = linhaInfo ? linhaInfo.textContent : "Linha Desconhecida";
            const nomeLinhaLimpo = linhaTexto.replace('LINHA - ', '');
            
            // Buscar o current schedule da linha específica
            try {
                const response = await fetch(`${API_BASE_URL}/schedules/current?line_id=${lineId}`);
                let horarioAtual = "N/A";
                
                if (response.ok) {
                    const currentSchedule = await response.json();
                    if (currentSchedule && currentSchedule.departure_time) {
                        // Usar o formato HH:MM
                        if (currentSchedule.departure_time.includes(':') && currentSchedule.departure_time.length <= 5) {
                            horarioAtual = currentSchedule.departure_time;
                        } else {
                            // Se vier em formato datetime, converter
                            const departureTime = new Date(currentSchedule.departure_time);
                            horarioAtual = departureTime.getHours().toString().padStart(2, '0') + ':' + 
                                         departureTime.getMinutes().toString().padStart(2, '0');
                        }
                    } else {
                        // Se não há current schedule, buscar o next da linha específica
                        const nextResponse = await fetch(`${API_BASE_URL}/schedules/next?line_id=${lineId}`);
                        if (nextResponse.ok) {
                            const nextSchedule = await nextResponse.json();
                            if (nextSchedule && nextSchedule.departure_time) {
                                if (nextSchedule.departure_time.includes(':') && nextSchedule.departure_time.length <= 5) {
                                    horarioAtual = nextSchedule.departure_time;
                                } else {
                                    const departureTime = new Date(nextSchedule.departure_time);
                                    horarioAtual = departureTime.getHours().toString().padStart(2, '0') + ':' + 
                                                 departureTime.getMinutes().toString().padStart(2, '0');
                                }
                            }
                        }
                    }
                }
                
                const url = `fila.html?linha=${lineId}&nome=${encodeURIComponent(nomeLinhaLimpo)}&horario=${horarioAtual}`;
                window.location.href = url;
                
            } catch (error) {
                console.error('Erro ao buscar current schedule:', error);
                // Em caso de erro, redirecionar mesmo assim
                const url = `fila.html?linha=${lineId}&nome=${encodeURIComponent(nomeLinhaLimpo)}&horario=N/A`;
                window.location.href = url;
            }
        }
    });
}

// Função para exibir mensagem de erro
function showErrorMessage(message) {
    const mainContent = document.getElementById('main-content');
    const refreshContainer = mainContent.querySelector('.refresh-container');
    
    mainContent.innerHTML = '';
    
    // Preservar o botão de refresh
    if (refreshContainer) {
        mainContent.appendChild(refreshContainer);
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <span class="material-symbols-outlined">error</span>
        <p>${message}</p>
        <button onclick="refreshData()" class="retry-btn">Tentar Novamente</button>
    `;
    mainContent.appendChild(errorDiv);
}

// Função principal para carregar e renderizar as linhas
async function loadAndRenderLines() {
    const mainContent = document.getElementById('main-content');
    const refreshBtn = document.getElementById('refresh-btn');
    
    try {
        console.log('Iniciando carregamento das linhas...');
        
        // Mostrar loading no botão se existir
        if (refreshBtn) {
            refreshBtn.classList.add('loading');
            refreshBtn.disabled = true;
        }
        
        // Buscar todas as linhas com schedules incluídos
        const lines = await fetchLinesWithSchedules();
        
        if (lines.length === 0) {
            console.log('Nenhuma linha encontrada');
            const refreshContainer = mainContent.querySelector('.refresh-container');
            mainContent.innerHTML = '';
            if (refreshContainer) {
                mainContent.appendChild(refreshContainer);
            }
            const noLinesDiv = document.createElement('div');
            noLinesDiv.className = 'no-lines';
            noLinesDiv.innerHTML = '<p>Nenhuma linha disponível no momento.</p>';
            mainContent.appendChild(noLinesDiv);
            return;
        }

        console.log(`Encontradas ${lines.length} linhas, criando interface...`);

        // Preservar o botão de refresh e limpar o resto
        const refreshContainer = mainContent.querySelector('.refresh-container');
        mainContent.innerHTML = '';
        if (refreshContainer) {
            mainContent.appendChild(refreshContainer);
        }

        // Para cada linha, criar HTML com seus schedules
        for (const line of lines) {
            console.log(`Processando linha: ${line.name} com ${line.schedules ? line.schedules.length : 0} horários`);
            
            const lineHTML = createLineHTML(line, line.schedules || []);
            
            // Criar elemento temporário para inserir HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = lineHTML;
            const lineElement = tempDiv.firstElementChild;
            
            // Adicionar ao main
            mainContent.appendChild(lineElement);
            
            // Configurar horários para esta linha
            updateLineSchedules(lineElement, line.schedules || []);
        }

        console.log('Interface criada, configurando funcionalidades...');

        // Configurar funcionalidades
        setupAccordionFunctionality();
        setupInterestModal();
        setupQueueLinks();

        console.log('Carregamento completo!');

    } catch (error) {
        console.error('Erro ao carregar linhas:', error);
        showErrorMessage('Erro inesperado ao carregar linhas.');
    } finally {
        // Remover loading do botão
        if (refreshBtn) {
            refreshBtn.classList.remove('loading');
            refreshBtn.disabled = false;
        }
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    loadAndRenderLines();
    
    // Configurar botão de refresh
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshData);
    }
    
    // Atualização automática completa a cada 2 minutos
    setInterval(() => {
        console.log('Atualização automática dos dados...');
        refreshData();
    }, 120000); // 2 minutos
    
    // Atualização apenas das informações de tempo a cada 30 segundos
    setInterval(() => {
        console.log('Atualizando informações de tempo...');
        updateAllTimeInfo();
    }, 30000); // 30 segundos
    
    // Atualizar quando a página ganha foco (usuário volta para a aba)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            console.log('Página ganhou foco, atualizando dados...');
            refreshData();
        }
    });
});
