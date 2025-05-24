document.addEventListener('DOMContentLoaded', function() {
    // Função para mostrar mensagem quando não há cursos
    function mostrarMensagemSemResultados(mostrar) {
        let mensagem = document.querySelector('.sem-resultados');
        if (!mensagem && mostrar) {
            mensagem = document.createElement('div');
            mensagem.className = 'col-12 text-center py-5 sem-resultados';
            mensagem.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Nenhum curso encontrado nesta categoria. Tente outro filtro.
                </div>
            `;
            document.querySelector('#cursos .row.g-4').appendChild(mensagem);
        } else if (mensagem && !mostrar) {
            mensagem.remove();
        }
    }

    // Adiciona evento de clique aos botões de filtro
    document.querySelectorAll('.filtro-curso').forEach(botao => {
        botao.addEventListener('click', function(e) {
            e.preventDefault();
            const area = this.dataset.area;
            filtrarCursos(area);
            
            // Atualiza o botão ativo
            document.querySelectorAll('.filtro-curso').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // Função para filtrar os cursos
    function filtrarCursos(area) {
        const cards = document.querySelectorAll('.card-curso');
        let algumVisivel = false;
        
        cards.forEach(card => {
            const areasDoCurso = JSON.parse(card.dataset.areas);
            const deveMostrar = area === 'todos' || areasDoCurso.includes(area);
            
            if (deveMostrar) {
                card.style.display = 'block';
                card.parentElement.style.display = 'block';
                algumVisivel = true;
            } else {
                card.style.display = 'none';
                card.parentElement.style.display = 'none';
            }
        });
        
        // Mostra mensagem se não houver resultados
        mostrarMensagemSemResultados(!algumVisivel);
        
        // Rola suavemente para a seção de cursos
        if (algumVisivel) {
            document.querySelector('#cursos').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    // Inicializa mostrando todos os cursos
    filtrarCursos('todos');
});
