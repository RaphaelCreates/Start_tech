
const loginForm = document.getElementById('login-form');

const API_BASE_URL = 'http://127.0.0.1:8000'; // Endereço local do  backend

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Pega os valores dos campos de usuário e senha usando os IDs 
    const username = document.getElementById('usuario').value;
    const password = document.getElementById('senha').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Login bem-sucedido! Token:', data.token);
            localStorage.setItem('access_token', data.token);
            window.location.href = '/dashboard.html'; 
        } else {
            console.error('Falha no login:', data.detail);
            alert('Falha no login: ' + data.detail);
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        alert('Erro ao conectar com a API.');
    }
});