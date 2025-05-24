// Função para alternar entre temas
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Aplica o novo tema
    html.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Atualiza o ícone
    const icon = document.querySelector('#themeToggle + label i');
    if (icon) {
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    console.log('Tema alterado para:', newTheme);
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Força o tema escuro independentemente das preferências do sistema
    const savedTheme = 'dark';
    
    // Aplica o tema
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    localStorage.setItem('theme', savedTheme);
    
    // Configura o botão de alternância
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
        // Atualiza o estado do botão
        toggleBtn.checked = true;
        
        // Adiciona o evento de clique
        toggleBtn.addEventListener('change', toggleTheme);
    }
    
    console.log('Tema inicializado:', savedTheme);
});
