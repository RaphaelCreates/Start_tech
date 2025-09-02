document.addEventListener('DOMContentLoaded', function() {

    // --- DADOS SIMULADOS (no mundo real, viriam de um servidor) ---
    const totalAssentos = 46;
    let interesseCount = 0; // Inicia com 0 - será atualizado dinamicamente
    let filaCount = 0;
    let usuarioEstaNaFila = false; // Começa como se o usuário não estivesse na fila
    
    // Dados da linha atual (extraídos da URL)
    let lineId = null;
    let nomeLinhaAtual = null;
    let horarioAtual = null;

    // --- ELEMENTOS DA PÁGINA ---
    const infoLinhaHorario = document.getElementById('info-linha-horario');
    const contadorInteresse = document.getElementById('contador-interesse');
    const contadorFila = document.getElementById('contador-fila');
    const gradeAssentos = document.getElementById('grade-assentos');
    const btnFila = document.getElementById('btn-fila');

    // --- FUNÇÕES ---

    // 1. Lê os dados da URL (ex: ?linha=1&nome=Santana&horario=07:20)
    function carregarDadosDaURL() {
        const params = new URLSearchParams(window.location.search);
        lineId = params.get('linha');
        const nomeLinhaParam = params.get('nome');
        horarioAtual = params.get('horario') || 'N/A';
        
        // Se temos o nome da linha na URL, usa ele
        if (nomeLinhaParam) {
            nomeLinhaAtual = decodeURIComponent(nomeLinhaParam);
            infoLinhaHorario.textContent = `LINHA - ${nomeLinhaAtual} - ${horarioAtual}`;
        } else {
            // Fallback para buscar da API se não tiver o nome na URL
            buscarNomeLinhaDaAPI(lineId, horarioAtual);
        }
        
        // Buscar dados do schedule específico
        if (lineId && horarioAtual && horarioAtual !== 'N/A') {
            buscarDadosDoSchedule();
        }
    }

    // Função para buscar dados do schedule específico (interesse, etc.)
    async function buscarDadosDoSchedule() {
        try {
            const response = await fetch(`http://localhost:8000/schedules/by-line-time?line_id=${lineId}&departure_time=${horarioAtual}`);
            if (response.ok) {
                const scheduleData = await response.json();
                if (scheduleData) {
                    interesseCount = scheduleData.interest || 0;
                    atualizarUI();
                }
            }
        } catch (error) {
            console.error('Erro ao buscar dados do schedule:', error);
        }
    }

    // Função para buscar nome da linha da API caso não esteja na URL
    async function buscarNomeLinhaDaAPI(lineId, horario) {
        try {
            const response = await fetch(`http://localhost:8000/lines/`);
            if (response.ok) {
                const data = await response.json();
                const linha = data.find(l => l.id == lineId);
                if (linha) {
                    nomeLinhaAtual = linha.name;
                    infoLinhaHorario.textContent = `LINHA - ${linha.name} - ${horario}`;
                } else {
                    infoLinhaHorario.textContent = `LINHA - ${lineId} - ${horario}`;
                }
            } else {
                infoLinhaHorario.textContent = `LINHA - ${lineId} - ${horario}`;
            }
        } catch (error) {
            console.error('Erro ao buscar dados da linha:', error);
            infoLinhaHorario.textContent = `LINHA - ${lineId} - ${horario}`;
        }
    }

    // 2. Desenha ou redesenha os assentos na tela
    function renderizarAssentos() {
        gradeAssentos.innerHTML = ''; // Limpa os assentos antigos
        for (let i = 0; i < totalAssentos; i++) {
            const assento = document.createElement('div');
            assento.classList.add('assento');
            
            // Pinta de verde os assentos ocupados, e de vermelho os vagos
            if (i < filaCount) {
                assento.classList.add('ocupado');
            } else {
                assento.classList.add('vago');
            }
            gradeAssentos.appendChild(assento);
        }
    }

    // 3. Atualiza os contadores e o botão
    function atualizarUI() {
        contadorInteresse.textContent = interesseCount;
        contadorFila.textContent = filaCount;
        
        if (usuarioEstaNaFila) {
            btnFila.textContent = 'Sair da Fila';
            btnFila.classList.add('sair');
        } else {
            btnFila.textContent = 'Entrar na Fila';
            btnFila.classList.remove('sair');
        }
        renderizarAssentos();
    }

    // Função para atualizar dados em tempo real
    function atualizarDadosEmTempoReal() {
        if (lineId && horarioAtual && horarioAtual !== 'N/A') {
            buscarDadosDoSchedule();
        }
    }

    // 4. Lógica ao clicar no botão de entrar/sair
    btnFila.addEventListener('click', function() {
        if (usuarioEstaNaFila) {
            // Lógica para SAIR da fila
            filaCount--;
            usuarioEstaNaFila = false;
        } else {
            // Lógica para ENTRAR na fila
            if (filaCount >= totalAssentos) {
                alert('O fretado já está lotado!');
                return;
            }
            filaCount++;
            usuarioEstaNaFila = true;
        }
        // Atualiza a tela com os novos dados
        atualizarUI();
    });

    // --- INICIALIZAÇÃO DA PÁGINA ---
    carregarDadosDaURL();
    atualizarUI(); // Chama para renderizar o estado inicial
    
    // Atualizar dados a cada 10 segundos
    setInterval(atualizarDadosEmTempoReal, 10000);
});