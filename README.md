# TechServices - Serviços de Programação para Empresas

Uma aplicação web construída com Flask que oferece serviços de programação para empresas e permite o cadastro de empresas através do CNPJ.

## Funcionalidades

- Cadastro de empresas com validação de CNPJ
- Exibição dos serviços de programação oferecidos
- Formulário de contato
- Design responsivo

## Instalação

1. Clone este repositório
2. Crie um ambiente virtual:
   ```
   python -m venv venv
   venv\Scripts\activate  # No Windows
   source venv/bin/activate  # No macOS/Linux
   ```
3. Instale as dependências:
   ```
   pip install -r requirements.txt
   ```
4. Execute a aplicação:
   ```
   python app.py
   ```
5. Abra um navegador e acesse `http://127.0.0.1:5000`

## Tecnologias Utilizadas

- Python
- Flask (Framework web)
- SQLAlchemy (ORM)
- WTForms (Manipulação de formulários)
- Bootstrap 5 (Frontend)
- jQuery (Biblioteca JavaScript)

## Estrutura do Projeto

```
/
├── app.py                 # Arquivo principal da aplicação
├── requirements.txt       # Dependências do projeto
├── README.md              # Este arquivo
├── static/                # Arquivos estáticos
│   ├── css/
│   │   └── style.css      # Estilos CSS
│   └── js/
│       └── main.js        # JavaScript
└── templates/             # Templates HTML
    ├── base.html          # Template base
    ├── index.html         # Página inicial
    ├── services.html      # Página de serviços
    ├── register.html      # Formulário de cadastro
    ├── about.html         # Página sobre
    ├── contact.html       # Página de contato
    └── 404.html           # Página de erro 404
```

## Licença

Este projeto está licenciado sob a licença MIT.
