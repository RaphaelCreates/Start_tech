document.addEventListener('DOMContentLoaded', function() {

    // --- BANCO DE DADOS DE HORÁRIOS ---
    const todosOsHorarios = {
        'santana': { 'seg-manha': ['07:20', '07:50', '08:20', '08:50', '09:20', '09:50'], 'seg-tarde': ['17:40', '18:15', '18:50', '19:25', '20:00'], 'ter-manha': ['07:20', '07:50', '08:00', '08:20', '08:50', '09:10', '09:20', '09:50'], 'ter-tarde': ['17:40', '18:15', '18:30', '18:50', '19:25', '19:50', '20:00'], 'qua-manha': ['07:20', '07:50', '08:00', '08:20', '08:50', '09:10', '09:20', '09:50'], 'qua-tarde': ['17:40', '18:15', '18:30', '18:50', '19:25', '19:50', '20:00'], 'qui-manha': ['07:20', '07:50', '08:00', '08:20', '08:50', '09:10', '09:20', '09:50'], 'qui-tarde': ['17:40', '18:15', '18:30', '18:50', '19:25', '19:50', '20:00'], 'sex-manha': ['07:20', '07:50', '08:20', '08:50', '09:20', '09:50'], 'sex-tarde': ['17:40', '18:15', '18:50', '19:25', '20:00'], },
        'barra-funda': { 'seg-manha': ['07:10', '08:20', '09:15', '09:45'], 'seg-tarde': ['17:40', '18:15', '19:10', '19:50'], 'ter-manha': ['07:10', '07:30', '08:20', '08:40', '09:15', '09:45'], 'ter-tarde': ['17:30', '17:40', '18:15', '19:10', '19:20', '19:50'], 'qua-manha': ['07:10', '07:30', '08:20', '08:40', '09:15', '09:45'], 'qua-tarde': ['17:30', '17:40', '18:15', '19:10', '19:20', '19:50'], 'qui-manha': ['07:10', '07:30', '08:20', '08:40', '09:15', '09:45'], 'qui-tarde': ['17:30', '17:40', '18:15', '19:10', '19:20', '19:50'], 'sex-manha': ['07:10', '08:20', '09:15', '09:45'], 'sex-tarde': ['17:40', '18:15', '19:10', '19:50'], }
    };

    // --- LÓGICA DO ACORDEÃO (sem alterações) ---
    const gatilhosAcordeao = document.querySelectorAll('.acordeao-gatilho');
    gatilhosAcordeao.forEach(gatilho => { gatilho.addEventListener('click', function() { this.classList.toggle('ativo'); const conteudo = this.nextElementSibling; if (conteudo.style.maxHeight) { conteudo.style.maxHeight = null; } else { conteudo.style.maxHeight = conteudo.scrollHeight + "px"; } }); });

    // --- LÓGICA PARA ATUALIZAR HORÁRIOS (COM SELEÇÃO ÚNICA) ---
    function atualizarHorarios(filtro) {
        const containerLinha = filtro.closest('.acordeao-item');
        const nomeLinha = containerLinha.id.replace('linha-', '');
        const periodoSelecionado = filtro.value;
        const divHorarios = containerLinha.querySelector('.lista-horarios');
        const horarios = todosOsHorarios[nomeLinha][periodoSelecionado];
        divHorarios.innerHTML = '';
        horarios.forEach(horario => { const label = document.createElement('label'); label.innerHTML = `<input type="checkbox" name="horario-${nomeLinha}" value="${horario}"> ${horario}`; divHorarios.appendChild(label); });
        const checkboxes = divHorarios.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => { checkbox.addEventListener('click', function() { if (this.checked) { checkboxes.forEach(outroCheckbox => { if (outroCheckbox !== this) { outroCheckbox.checked = false; } }); } }); });
    }
    const todosOsFiltros = document.querySelectorAll('.filtro-dia');
    todosOsFiltros.forEach(filtro => { atualizarHorarios(filtro); filtro.addEventListener('change', () => atualizarHorarios(filtro)); });

    // --- LÓGICA DO POPUP (MODAL) ---

    // Pega as referências dos elementos do modal, incluindo as novas "telas"
    const modal = document.getElementById('modal-confirmacao');
    const vistaConfirmacao = document.getElementById('modal-vista-confirmacao');
    const vistaSucesso = document.getElementById('modal-vista-sucesso');
    const modalTextoPrincipal = document.getElementById('modal-texto-principal');
    const modalDetalhes = document.getElementById('modal-detalhes');
    const btnConfirmar = document.getElementById('modal-btn-confirmar');
    const todosBtnInteresse = document.querySelectorAll('.btn-interesse');

    function getProximaData(diaSelecionado) {
        const dias = { 'seg': 1, 'ter': 2, 'qua': 3, 'qui': 4, 'sex': 5 };
        const diaDaSemanaAlvo = dias[diaSelecionado.substring(0, 3)];
        const hoje = new Date();
        const diaDaSemanaHoje = hoje.getDay() === 0 ? 7 : hoje.getDay();
        let diasAAdicionar = diaDaSemanaAlvo - diaDaSemanaHoje;
        if (diasAAdicionar <= 0) { diasAAdicionar += 7; }
        const proximaData = new Date();
        proximaData.setDate(new Date().getDate() + diasAAdicionar);
        return proximaData.toLocaleDateString('pt-BR');
    }

    todosBtnInteresse.forEach(btn => {
        btn.addEventListener('click', function() {
            const containerLinha = this.closest('.acordeao-item');
            const nomeLinha = containerLinha.id.replace('linha-', '').replace('-', ' ');
            const filtro = containerLinha.querySelector('.filtro-dia');
            const periodoSelecionadoValue = filtro.value;
            const periodoSelecionadoTexto = filtro.options[filtro.selectedIndex].text;
            const checkboxMarcado = containerLinha.querySelector('input[type="checkbox"]:checked');

            if (!checkboxMarcado) {
                alert('Por favor, selecione um horário antes de registrar interesse.');
                return;
            }

            const horarioEscolhido = checkboxMarcado.value;
            const proximaData = getProximaData(periodoSelecionadoValue);
            
            modalTextoPrincipal.innerHTML = `Deseja registrar interesse em fretado ${nomeLinha}? <br> (${periodoSelecionadoTexto.split('(')[1]}`;
            modalDetalhes.textContent = `Data: ${proximaData} - Horário: ${horarioEscolhido}`;
            
            modal.classList.remove('escondido');
        });
    });
    
    // --- NOVO: LÓGICA DE FEEDBACK DE SUCESSO ---

    // Função para fechar o modal e RESETAR para o estado inicial
    function fecharModal() {
        modal.classList.add('escondido');
        
        // IMPORTANTE: Reseta o modal para a próxima vez que for aberto
        setTimeout(() => {
            vistaConfirmacao.classList.remove('escondido');
            vistaSucesso.classList.add('escondido');
        }, 300); // Espera a animação de fade-out terminar
    }

    // O que acontece ao clicar em "Confirmar"
    btnConfirmar.addEventListener('click', function() {
        // 1. Esconde a vista de confirmação
        vistaConfirmacao.classList.add('escondido');
        // 2. Mostra a vista de sucesso
        vistaSucesso.classList.remove('escondido');

        // 3. Fecha o modal automaticamente após 2 segundos
        setTimeout(fecharModal, 2000);
    });

    // Evento para fechar o modal clicando no fundo
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            fecharModal();
        }
    });
});

// Adicione este código no final do seu 'script.js'
document.querySelectorAll('.acordeao-item').forEach(item => {
    const linkFila = item.querySelector('.aba-fila');
    const filtro = item.querySelector('.filtro-dia');
    const nomeLinha = item.id.replace('linha-', '');

    function atualizarLinkFila() {
        const horarioSelecionado = item.querySelector('input[type="checkbox"]:checked');
        let horarioValor = horarioSelecionado ? horarioSelecionado.value : "N/A";
        linkFila.href = `fila.html?linha=${nomeLinha}&horario=${horarioValor}`;
    }

    // Atualiza o link sempre que o filtro ou um checkbox mudar
    filtro.addEventListener('change', atualizarLinkFila);
    item.addEventListener('click', (e) => {
        if (e.target.type === 'checkbox') {
            atualizarLinkFila();
        }
    });

    // Atualiza o link na primeira carga
    atualizarLinkFila();
});