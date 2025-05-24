/**
 * Script principal da plataforma de aprendizado
 * Contém a lógica para interações do usuário na área de cursos
 */

document.addEventListener('DOMContentLoaded', function() {
    // Ativa os tooltips do Bootstrap
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Ativa os popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Menu lateral responsivo
    const sidebarToggle = document.createElement('button');
    sidebarToggle.className = 'btn btn-primary btn-sm d-lg-none fixed-bottom m-3';
    sidebarToggle.innerHTML = '<i class="fas fa-bars"></i>';
    sidebarToggle.style.zIndex = '1000';
    sidebarToggle.style.borderRadius = '50%';
    sidebarToggle.style.width = '50px';
    sidebarToggle.style.height = '50px';
    sidebarToggle.style.display = 'flex';
    sidebarToggle.style.alignItems = 'center';
    sidebarToggle.style.justifyContent = 'center';
    sidebarToggle.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('main');
    
    if (sidebar && window.innerWidth < 992) {
        document.body.appendChild(sidebarToggle);
        
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show');
        });
        
        // Fechar o menu ao clicar fora
        document.addEventListener('click', function(event) {
            if (!sidebar.contains(event.target) && !sidebarToggle.contains(event.target)) {
                sidebar.classList.remove('show');
            }
        });
        
        // Fechar menu ao clicar em um link
        const sidebarLinks = sidebar.querySelectorAll('.nav-link');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth < 992) {
                    sidebar.classList.remove('show');
                }
            });
        });
    }
    
    // Lógica para o editor de código
    const codeEditors = document.querySelectorAll('.code-editor');
    
    codeEditors.forEach(editor => {
        const textarea = editor.querySelector('textarea');
        const pre = editor.querySelector('pre');
        const lineNumbers = editor.querySelector('.line-numbers');
        
        if (textarea && pre) {
            // Atualiza o código destacado quando o usuário digita
            textarea.addEventListener('input', function() {
                const code = this.value;
                // Substitui caracteres especiais para exibição
                const highlightedCode = code
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/\n/g, '<br>');
                
                pre.innerHTML = highlightedCode;
                hljs.highlightElement(pre);
                
                // Atualiza os números das linhas
                updateLineNumbers(textarea, lineNumbers);
            });
            
            // Rola o texto destacado junto com o textarea
            textarea.addEventListener('scroll', function() {
                pre.scrollTop = this.scrollTop;
                pre.scrollLeft = this.scrollLeft;
                
                if (lineNumbers) {
                    lineNumbers.scrollTop = this.scrollTop;
                }
            });
            
            // Tab no editor de código
            textarea.addEventListener('keydown', function(e) {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    
                    const start = this.selectionStart;
                    const end = this.selectionEnd;
                    const value = this.value;
                    
                    // Insere 4 espaços
                    this.value = value.substring(0, start) + '    ' + value.substring(end);
                    
                    // Move o cursor para depois dos espaços inseridos
                    this.selectionStart = this.selectionEnd = start + 4;
                    
                    // Dispara o evento de input para atualizar o highlight
                    const event = new Event('input');
                    this.dispatchEvent(event);
                }
            });
            
            // Inicializa o editor
            const event = new Event('input');
            textarea.dispatchEvent(event);
        }
    });
    
    // Função para atualizar os números das linhas
    function updateLineNumbers(textarea, lineNumbersElement) {
        if (!lineNumbersElement) return;
        
        const lines = textarea.value.split('\n').length;
        let lineNumbersHTML = '';
        
        for (let i = 1; i <= lines; i++) {
            lineNumbersHTML += i + '<br>';
        }
        
        lineNumbersElement.innerHTML = lineNumbersHTML;
    }
    
    // Lógica para as questões de múltipla escolha
    const quizOptions = document.querySelectorAll('.quiz-option');
    
    quizOptions.forEach(option => {
        option.addEventListener('click', function() {
            const questionContainer = this.closest('.quiz-container');
            const feedback = questionContainer.querySelector('.quiz-feedback');
            const submitBtn = questionContainer.querySelector('.submit-quiz');
            const nextBtn = questionContainer.querySelector('.next-question');
            
            // Remove a seleção de outras opções
            questionContainer.querySelectorAll('.quiz-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Seleciona a opção clicada
            this.classList.add('selected');
            const isCorrect = this.getAttribute('data-correct') === 'true';
            
            // Mostra o feedback se existir
            if (feedback) {
                feedback.style.display = 'block';
                feedback.className = 'quiz-feedback ' + (isCorrect ? 'correct' : 'incorrect');
                
                if (isCorrect) {
                    feedback.innerHTML = '<i class="fas fa-check-circle me-2"></i> Resposta correta! ' + 
                        (feedback.getAttribute('data-correct-feedback') || '');
                } else {
                    feedback.innerHTML = '<i class="fas fa-times-circle me-2"></i> Resposta incorreta. ' + 
                        (feedback.getAttribute('data-incorrect-feedback') || '');
                }
            }
            
            // Ativa o botão de próxima pergunta
            if (nextBtn) {
                nextBtn.disabled = false;
            }
            
            // Se for a última pergunta, mostra o botão de enviar
            if (submitBtn && questionContainer.hasAttribute('data-last-question')) {
                submitBtn.style.display = 'inline-block';
            }
        });
    });
    
    // Lógica para o envio do quiz
    const quizForms = document.querySelectorAll('.quiz-form');
    
    quizForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Aqui você pode adicionar a lógica para enviar as respostas
            // e mostrar os resultados do quiz
            const results = document.getElementById('quiz-results');
            
            if (results) {
                results.style.display = 'block';
                results.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Lógica para os acordeões
    const accordionButtons = document.querySelectorAll('.accordion-button');
    
    accordionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const accordionItem = this.closest('.accordion-item');
            const collapse = accordionItem.querySelector('.accordion-collapse');
            
            // Fecha outros itens do acordeão
            if (!this.classList.contains('collapsed')) {
                const allAccordionItems = document.querySelectorAll('.accordion-item');
                allAccordionItems.forEach(item => {
                    if (item !== accordionItem) {
                        const otherButton = item.querySelector('.accordion-button');
                        const otherCollapse = item.querySelector('.accordion-collapse');
                        
                        if (otherButton && !otherButton.classList.contains('collapsed')) {
                            otherButton.classList.add('collapsed');
                            otherCollapse.classList.remove('show');
                        }
                    }
                });
            }
        });
    });
    
    // Lógica para o progresso do curso
    const progressBars = document.querySelectorAll('.progress-bar');
    
    progressBars.forEach(bar => {
        const target = parseInt(bar.getAttribute('aria-valuenow'));
        let current = 0;
        const increment = target / 50; // Ajuste a velocidade da animação aqui
        
        const animateProgress = () => {
            if (current < target) {
                current += increment;
                if (current > target) current = target;
                
                bar.style.width = current + '%';
                bar.setAttribute('aria-valuenow', Math.round(current));
                bar.textContent = Math.round(current) + '%';
                
                requestAnimationFrame(animateProgress);
            }
        };
        
        // Inicia a animação quando o elemento estiver visível na tela
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateProgress();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(bar);
    });
    
    // Lógica para o modo escuro (opcional)
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    if (darkModeToggle) {
        // Verifica se há uma preferência salva
        const darkMode = localStorage.getItem('darkMode') === 'true';
        
        // Aplica o modo escuro se estiver ativado
        if (darkMode) {
            document.body.classList.add('dark-mode');
            darkModeToggle.checked = true;
        }
        
        // Adiciona o evento de mudança
        darkModeToggle.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'true');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'false');
            }
        });
    }
    
    // Lógica para o player de vídeo
    const videoPlayers = document.querySelectorAll('.video-player');
    
    videoPlayers.forEach(player => {
        const video = player.querySelector('video');
        const playBtn = player.querySelector('.play-btn');
        const progress = player.querySelector('.progress');
        const progressBar = player.querySelector('.progress-bar');
        const timeElapsed = player.querySelector('.time-elapsed');
        const duration = player.querySelector('.duration');
        const fullscreenBtn = player.querySelector('.fullscreen-btn');
        const volumeBtn = player.querySelector('.volume-btn');
        const volumeSlider = player.querySelector('.volume-slider');
        
        if (video && playBtn) {
            // Botão de play/pause
            playBtn.addEventListener('click', function() {
                if (video.paused) {
                    video.play();
                    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                } else {
                    video.pause();
                    playBtn.innerHTML = '<i class="fas fa-play"></i>';
                }
            });
            
            // Atualiza o botão de play/pause quando o vídeo terminar
            video.addEventListener('ended', function() {
                playBtn.innerHTML = '<i class="fas fa-redo"></i>';
            });
            
            // Atualiza a barra de progresso
            video.addEventListener('timeupdate', function() {
                const percent = (video.currentTime / video.duration) * 100;
                progressBar.style.width = percent + '%';
                
                // Atualiza o tempo decorrido
                const minutes = Math.floor(video.currentTime / 60);
                const seconds = Math.floor(video.currentTime % 60);
                timeElapsed.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            });
            
            // Clique na barra de progresso para buscar
            progress.addEventListener('click', function(e) {
                const rect = progress.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                video.currentTime = pos * video.duration;
            });
            
            // Botão de tela cheia
            if (fullscreenBtn) {
                fullscreenBtn.addEventListener('click', function() {
                    if (video.requestFullscreen) {
                        video.requestFullscreen();
                    } else if (video.webkitRequestFullscreen) {
                        video.webkitRequestFullscreen();
                    } else if (video.msRequestFullscreen) {
                        video.msRequestFullscreen();
                    }
                });
            }
            
            // Controle de volume
            if (volumeBtn && volumeSlider) {
                volumeBtn.addEventListener('click', function() {
                    if (video.volume > 0) {
                        video.volume = 0;
                        volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
                    } else {
                        video.volume = volumeSlider.value / 100;
                        volumeBtn.innerHTML = video.volume < 0.5 ? 
                            '<i class="fas fa-volume-down"></i>' : 
                            '<i class="fas fa-volume-up"></i>';
                    }
                });
                
                volumeSlider.addEventListener('input', function() {
                    video.volume = this.value / 100;
                    
                    if (this.value > 50) {
                        volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                    } else if (this.value > 0) {
                        volumeBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
                    } else {
                        volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
                    }
                });
            }
            
            // Atualiza a duração total do vídeo quando os metadados forem carregados
            video.addEventListener('loadedmetadata', function() {
                const minutes = Math.floor(video.duration / 60);
                const seconds = Math.floor(video.duration % 60);
                duration.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            });
        }
    });
    
    // Lógica para o carregamento lazy de imagens
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(img => imageObserver.observe(img));
    }
    
    // Lógica para o menu de navegação fixo
    const header = document.querySelector('header');
    
    if (header) {
        let lastScroll = 0;
        
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll <= 0) {
                header.classList.remove('scroll-up');
                return;
            }
            
            if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
                // Rolar para baixo
                header.classList.remove('scroll-up');
                header.classList.add('scroll-down');
            } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
                // Rolar para cima
                header.classList.remove('scroll-down');
                header.classList.add('scroll-up');
            }
            
            lastScroll = currentScroll;
        });
    }
    
    // Lógica para o menu de navegação responsivo
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
    }
    
    // Lógica para o botão de voltar ao topo
    const backToTopBtn = document.createElement('button');
    backToTopBtn.className = 'btn btn-primary back-to-top';
    backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTopBtn.setAttribute('aria-label', 'Voltar ao topo');
    document.body.appendChild(backToTopBtn);
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });
    
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Lógica para validação de formulários
    const forms = document.querySelectorAll('.needs-validation');
    
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            form.classList.add('was-validated');
        }, false);
    });
});

// Função para copiar código para a área de transferência
function copyToClipboard(elementId) {
    const codeElement = document.getElementById(elementId);
    
    if (codeElement) {
        const textArea = document.createElement('textarea');
        textArea.value = codeElement.textContent;
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            
            // Mostra uma mensagem de sucesso
            const tooltip = bootstrap.Tooltip.getInstance(codeElement) || 
                new bootstrap.Tooltip(codeElement, { 
                    title: 'Copiado!', 
                    trigger: 'manual' 
                });
                
            tooltip.show();
            
            // Esconde a mensagem após 2 segundos
            setTimeout(() => {
                tooltip.hide();
            }, 2000);
            
        } catch (err) {
            console.error('Falha ao copiar o texto: ', err);
        }
        
        document.body.removeChild(textArea);
    }
}

// Função para formatar código
function formatCode(elementId, language) {
    const codeElement = document.getElementById(elementId);
    
    if (codeElement) {
        // Remove a formatação atual
        codeElement.textContent = codeElement.textContent
            .replace(/\s+$/, '') // Remove espaços no final
            .replace(/^\s+/gm, ''); // Remove indentação
            
        // Aplica o highlight.js
        hljs.highlightElement(codeElement);
    }
}

// Inicializa os tooltips quando o documento estiver pronto
$(document).ready(function() {
    // Ativa os tooltips do Bootstrap
    $('[data-bs-toggle="tooltip"]').tooltip();
    
    // Ativa os popovers
    $('[data-bs-toggle="popover"]').popover();
    
    // Inicializa o player de vídeo
    $('.video-player').each(function() {
        const player = $(this);
        const video = player.find('video')[0];
        const playBtn = player.find('.play-btn');
        
        playBtn.on('click', function() {
            if (video.paused) {
                video.play();
                playBtn.html('<i class="fas fa-pause"></i>');
            } else {
                video.pause();
                playBtn.html('<i class="fas fa-play"></i>');
            }
        });
    });
    
    // Inicializa o seletor de tema
    const themeSwitcher = $('#themeSwitcher');
    
    if (themeSwitcher.length) {
        // Verifica o tema salvo no localStorage
        const currentTheme = localStorage.getItem('theme') || 'light';
        
        // Aplica o tema salvo
        if (currentTheme === 'dark') {
            $('body').addClass('dark-theme');
            themeSwitcher.prop('checked', true);
        }
        
        // Adiciona o evento de mudança
        themeSwitcher.on('change', function() {
            if ($(this).is(':checked')) {
                $('body').addClass('dark-theme');
                localStorage.setItem('theme', 'dark');
            } else {
                $('body').removeClass('dark-theme');
                localStorage.setItem('theme', 'light');
            }
        });
    }
});
