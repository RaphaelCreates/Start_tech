document.addEventListener('DOMContentLoaded', function() {

    // --- DADOS SIMULADOS (no mundo real, viriam de um servidor) ---
    const totalAssentos = 46;
    const interesseCount = 17; // Fixo, como na descrição
    let filaCount = 0;
    let usuarioEstaNaFila = false; // Começa como se o usuário não estivesse na fila

    // --- ELEMENTOS DA PÁGINA ---
    const infoLinhaHorario = document.getElementById('info-linha-horario');
    const contadorInteresse = document.getElementById('contador-interesse');
    const contadorFila = document.getElementById('contador-fila');
    const gradeAssentos = document.getElementById('grade-assentos');
    const btnFila = document.getElementById('btn-fila');

    // --- FUNÇÕES ---

    // 1. Lê os dados da URL (ex: ?linha=santana&horario=07:20)
    function carregarDadosDaURL() {
        const params = new URLSearchParams(window.location.search);
        const linha = params.get('linha') || 'N/A';
        const horario = params.get('horario') || 'N/A';
        
        infoLinhaHorario.textContent = `Linha ${linha.replace('-', ' ')} - ${horario}`;
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
});