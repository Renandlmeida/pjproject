import os
from dotenv import load_dotenv
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SubmitField, PasswordField, SelectField, HiddenField
from wtforms.validators import DataRequired, Email, Length, ValidationError
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import requests
import json
from datetime import datetime, timedelta

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configurações básicas
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_key_for_testing')
    
    # Configuração do banco de dados
    database_url = os.environ.get('DATABASE_URL')
    if database_url and database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url or 'sqlite:///site.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
    
    return app

# Cria a aplicação
app = create_app()

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'admin_login'

@login_manager.user_loader
def load_user(user_id):
    return Admin.query.get(int(user_id))

# Models
class Company(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    cnpj = db.Column(db.String(18), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    address = db.Column(db.String(200), nullable=True)
    date_registered = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"Company('{self.name}', '{self.cnpj}')"

class Service(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.String(20), nullable=True)
    
    def __repr__(self):
        return f"Service('{self.title}')"

class Admin(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(200), default='default-course.jpg')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    modules = db.relationship('Module', backref='course', lazy=True)

class Module(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    order = db.Column(db.Integer, default=0)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    lessons = db.relationship('Lesson', backref='module', lazy=True, order_by='Lesson.order')

class Lesson(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text)
    order = db.Column(db.Integer, default=0)
    module_id = db.Column(db.Integer, db.ForeignKey('module.id'), nullable=False)
    questions = db.relationship('Question', backref='lesson', lazy=True)

class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(50), default='multiple_choice')  # multiple_choice, code, text
    options = db.Column(db.Text)  # JSON string of options for multiple choice
    correct_answer = db.Column(db.Text, nullable=False)  # JSON string of correct answers
    explanation = db.Column(db.Text)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False)
    order = db.Column(db.Integer, default=0)

class UserProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    score = db.Column(db.Float, default=0.0)
    last_accessed = db.Column(db.DateTime, default=datetime.utcnow)
    answers = db.relationship('UserAnswer', backref='progress', lazy=True)

class UserAnswer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    progress_id = db.Column(db.Integer, db.ForeignKey('user_progress.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id'), nullable=False)
    answer = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean, default=False)
    answered_at = db.Column(db.DateTime, default=datetime.utcnow)

# Forms
class CompanyRegistrationForm(FlaskForm):
    cnpj = StringField('CNPJ', validators=[DataRequired(), Length(min=14, max=18)])
    name = StringField('Nome da Empresa', validators=[DataRequired()])
    email = StringField('Email', validators=[DataRequired(), Email()])
    phone = StringField('Telefone')
    address = StringField('Endereço')
    submit = SubmitField('Cadastrar')
    
    def validate_cnpj(self, cnpj):
        company = Company.query.filter_by(cnpj=cnpj.data).first()
        if company:
            raise ValidationError('Este CNPJ já está cadastrado.')

class AdminLoginForm(FlaskForm):
    username = StringField('Usuário', validators=[DataRequired()])
    password = PasswordField('Senha', validators=[DataRequired()])
    submit = SubmitField('Entrar')

class CourseForm(FlaskForm):
    title = StringField('Título do Curso', validators=[DataRequired()])
    description = TextAreaField('Descrição', validators=[DataRequired()])
    image_url = StringField('URL da Imagem')
    is_active = SelectField('Status', choices=[(True, 'Ativo'), (False, 'Inativo')], coerce=bool)
    submit = SubmitField('Salvar')

class ModuleForm(FlaskForm):
    title = StringField('Título do Módulo', validators=[DataRequired()])
    description = TextAreaField('Descrição')
    order = StringField('Ordem', validators=[DataRequired()])
    course_id = SelectField('Curso', coerce=int, validators=[DataRequired()])
    submit = SubmitField('Salvar')
    
    def __init__(self, *args, **kwargs):
        super(ModuleForm, self).__init__(*args, **kwargs)
        self.course_id.choices = [(c.id, c.title) for c in Course.query.order_by('title')]

class LessonForm(FlaskForm):
    title = StringField('Título da Aula', validators=[DataRequired()])
    content = TextAreaField('Conteúdo')
    order = StringField('Ordem', validators=[DataRequired()])
    module_id = SelectField('Módulo', coerce=int, validators=[DataRequired()])
    submit = SubmitField('Salvar')
    
    def __init__(self, *args, **kwargs):
        super(LessonForm, self).__init__(*args, **kwargs)
        self.module_id.choices = [(m.id, f"{m.course.title} - {m.title}") 
                                for m in Module.query.join(Course).order_by('course.title', 'order')]

class QuestionForm(FlaskForm):
    question_text = TextAreaField('Pergunta', validators=[DataRequired()])
    question_type = SelectField('Tipo', choices=[
        ('multiple_choice', 'Múltipla Escolha'),
        ('true_false', 'Verdadeiro/Falso'),
        ('short_answer', 'Resposta Curta')
    ], validators=[DataRequired()])
    options = TextAreaField('Opções (uma por linha, use * para marcar a resposta correta)')
    correct_answer = StringField('Resposta Correta')
    explanation = TextAreaField('Explicação')
    order = StringField('Ordem', validators=[DataRequired()])
    lesson_id = SelectField('Aula', coerce=int, validators=[DataRequired()])
    submit = SubmitField('Salvar')
    
    def __init__(self, *args, **kwargs):
        super(QuestionForm, self).__init__(*args, **kwargs)
        self.lesson_id.choices = [(l.id, f"{l.module.course.title} - {l.module.title} - {l.title}")
                                for l in Lesson.query.join(Module).join(Course)
                                .order_by('course.title', 'module.order', 'lesson.order')]

# Routes
@app.route('/')
def home():
    courses = Course.query.filter_by(is_active=True).all()
    return render_template('index.html', courses=courses)

@app.route('/services')
def services():
    all_services = Service.query.all()
    return render_template('services.html', services=all_services)

@app.route('/register', methods=['GET', 'POST'])
def register():
    form = CompanyRegistrationForm()
    if form.validate_on_submit():
        company = Company(
            cnpj=form.cnpj.data,
            name=form.name.data,
            email=form.email.data,
            phone=form.phone.data,
            address=form.address.data
        )
        db.session.add(company)
        db.session.commit()
        flash('Sua empresa foi cadastrada com sucesso!', 'success')
        return redirect(url_for('home'))
    return render_template('register.html', form=form)

@app.route('/validate_cnpj', methods=['POST'])
def validate_cnpj():
    cnpj = request.json.get('cnpj', '')
    # Remove special characters
    cnpj = cnpj.replace('.', '').replace('/', '').replace('-', '')
    
    # Check if CNPJ is already registered
    existing_company = Company.query.filter_by(cnpj=cnpj).first()
    if existing_company:
        return jsonify({'valid': False, 'message': 'CNPJ já cadastrado'})
    
    # In a real application, you would validate with an external API
    # This is a simplified validation
    if len(cnpj) == 14 and cnpj.isdigit():
        # Here you would typically make an API call to validate the CNPJ
        # For demo purposes, we'll consider it valid if it's 14 digits
        return jsonify({'valid': True, 'message': 'CNPJ válido'})
    else:
        return jsonify({'valid': False, 'message': 'Formato de CNPJ inválido'})

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

# Cursos
@app.route('/cursos')
def cursos():
    return render_template('cursos/lista.html',cursos=Course.query.filter_by(is_active=True).all())
@app.route('/cursos/<curso>')
def curso_especifico(curso):
    if curso not in ['android','machine-learning','python','java']:abort(404)
    return render_template(f'cursos/{curso}.html')

@app.route('/curso/<int:course_id>')
@login_required
def curso_detalhe(course_id):
    course = Course.query.get_or_404(course_id)
    return render_template('cursos/detalhe.html', course=course)

@app.route('/modulo/<int:module_id>')
@login_required
def modulo_detalhe(module_id):
    module = Module.query.get_or_404(module_id)
    return render_template('cursos/modulo.html', module=module)

@app.route('/licao/<int:lesson_id>', methods=['GET', 'POST'])
@login_required
def licao_detalhe(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    
    if request.method == 'POST':
        # Processar respostas
        score = 0
        total_questions = len(lesson.questions)
        
        if total_questions > 0:
            for question in lesson.questions:
                user_answer = request.form.get(f'question_{question.id}')
                if user_answer and user_answer == question.correct_answer:
                    score += 1
            
            # Salvar progresso
            progress = UserProgress(
                user_id=current_user.id,
                lesson_id=lesson_id,
                completed=True,
                score=(score / total_questions) * 100
            )
            db.session.add(progress)
            db.session.commit()
            
            flash(f'Você acertou {score} de {total_questions} questões!', 'info')
            return redirect(url_for('modulo_detalhe', module_id=lesson.module_id))
    
    return render_template('cursos/licao.html', lesson=lesson)

# Admin Routes
@app.route('/admin')
@login_required
def admin_dashboard():
    if not current_user.is_authenticated:
        return redirect(url_for('admin_login'))
    return render_template('admin/dashboard.html')

@app.route('/admin/cursos')
@login_required
def admin_cursos():
    courses = Course.query.all()
    return render_template('admin/cursos/lista.html', courses=courses)

@app.route('/admin/curso/novo', methods=['GET', 'POST'])
@login_required
def admin_curso_novo():
    form = CourseForm()
    if form.validate_on_submit():
        course = Course(
            title=form.title.data,
            description=form.description.data,
            image_url=form.image_url.data or None
        )
        db.session.add(course)
        db.session.commit()
        flash('Curso criado com sucesso!', 'success')
        return redirect(url_for('admin_cursos'))
    return render_template('admin/cursos/form.html', form=form, title='Novo Curso')

@app.route('/admin/curso/editar/<int:id>', methods=['GET', 'POST'])
@login_required
def admin_curso_editar(id):
    course = Course.query.get_or_404(id)
    form = CourseForm(obj=course)
    if form.validate_on_submit():
        course.title = form.title.data
        course.description = form.description.data
        course.image_url = form.image_url.data or None
        db.session.commit()
        flash('Curso atualizado com sucesso!', 'success')
        return redirect(url_for('admin_cursos'))
    return render_template('admin/cursos/form.html', form=form, title='Editar Curso')

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if current_user.is_authenticated:
        return redirect(url_for('admin_dashboard'))
        
    form = AdminLoginForm()
    if form.validate_on_submit():
        admin = Admin.query.filter_by(username=form.username.data).first()
        if admin and admin.check_password(form.password.data):
            login_user(admin)
            next_page = request.args.get('next')
            return redirect(next_page or url_for('admin_dashboard'))
        flash('Usuário ou senha inválidos', 'danger')
    return render_template('admin/login.html', form=form)

@app.route('/admin/logout')
@login_required
def admin_logout():
    logout_user()
    return redirect(url_for('admin_login'))

# Módulos
@app.route('/admin/modulos')
@login_required
def admin_modulos():
    modules = Module.query.join(Course).order_by('course.title', 'order').all()
    return render_template('admin/modulos/lista.html', modules=modules)

@app.route('/admin/modulo/novo', methods=['GET', 'POST'])
@login_required
def admin_modulo_novo():
    form = ModuleForm()
    if form.validate_on_submit():
        module = Module(
            title=form.title.data,
            description=form.description.data,
            order=form.order.data,
            course_id=form.course_id.data
        )
        db.session.add(module)
        db.session.commit()
        flash('Módulo criado com sucesso!', 'success')
        return redirect(url_for('admin_modulos'))
    return render_template('admin/modulos/form.html', form=form, title='Novo Módulo')

@app.route('/admin/modulo/editar/<int:id>', methods=['GET', 'POST'])
@login_required
def admin_modulo_editar(id):
    module = Module.query.get_or_404(id)
    form = ModuleForm(obj=module)
    if form.validate_on_submit():
        form.populate_obj(module)
        db.session.commit()
        flash('Módulo atualizado com sucesso!', 'success')
        return redirect(url_for('admin_modulos'))
    return render_template('admin/modulos/form.html', form=form, title='Editar Módulo')

@app.route('/admin/modulo/excluir/<int:id>', methods=['POST'])
@login_required
def admin_modulo_excluir(id):
    module = Module.query.get_or_404(id)
    try:
        db.session.delete(module)
        db.session.commit()
        flash('Módulo excluído com sucesso!', 'success')
    except Exception as e:
        db.session.rollback()
        flash('Erro ao excluir o módulo. Verifique se não existem aulas vinculadas.', 'danger')
    return redirect(url_for('admin_modulos'))

# Aulas
@app.route('/admin/aulas')
@login_required
def admin_aulas():
    lessons = Lesson.query.join(Module).join(Course).order_by('course.title', 'module.order', 'order').all()
    return render_template('admin/aulas/lista.html', lessons=lessons)

@app.route('/admin/aula/novo', methods=['GET', 'POST'])
@login_required
def admin_aula_nova():
    form = LessonForm()
    if form.validate_on_submit():
        lesson = Lesson(
            title=form.title.data,
            content=form.content.data,
            order=form.order.data,
            module_id=form.module_id.data
        )
        db.session.add(lesson)
        db.session.commit()
        flash('Aula criada com sucesso!', 'success')
        return redirect(url_for('admin_aulas'))
    return render_template('admin/aulas/form.html', form=form, title='Nova Aula')

@app.route('/admin/aula/editar/<int:id>', methods=['GET', 'POST'])
@login_required
def admin_aula_editar(id):
    lesson = Lesson.query.get_or_404(id)
    form = LessonForm(obj=lesson)
    if form.validate_on_submit():
        form.populate_obj(lesson)
        db.session.commit()
        flash('Aula atualizada com sucesso!', 'success')
        return redirect(url_for('admin_aulas'))
    return render_template('admin/aulas/form.html', form=form, title='Editar Aula')

@app.route('/admin/aula/excluir/<int:id>', methods=['POST'])
@login_required
def admin_aula_excluir(id):
    lesson = Lesson.query.get_or_404(id)
    try:
        db.session.delete(lesson)
        db.session.commit()
        flash('Aula excluída com sucesso!', 'success')
    except Exception as e:
        db.session.rollback()
        flash('Erro ao excluir a aula. Verifique se não existem perguntas vinculadas.', 'danger')
    return redirect(url_for('admin_aulas'))

# Perguntas
@app.route('/admin/perguntas')
@login_required
def admin_perguntas():
    questions = Question.query.join(Lesson).join(Module).join(Course).order_by('course.title', 'module.order', 'lesson.order', 'order').all()
    return render_template('admin/perguntas/lista.html', questions=questions)

@app.route('/admin/pergunta/nova', methods=['GET', 'POST'])
@login_required
def admin_pergunta_nova():
    form = QuestionForm()
    if form.validate_on_submit():
        question = Question(
            question_text=form.question_text.data,
            question_type=form.question_type.data,
            options=form.options.data,
            correct_answer=form.correct_answer.data,
            explanation=form.explanation.data,
            order=form.order.data,
            lesson_id=form.lesson_id.data
        )
        db.session.add(question)
        db.session.commit()
        flash('Pergunta criada com sucesso!', 'success')
        return redirect(url_for('admin_perguntas'))
    return render_template('admin/perguntas/form.html', form=form, title='Nova Pergunta')

@app.route('/admin/pergunta/editar/<int:id>', methods=['GET', 'POST'])
@login_required
def admin_pergunta_editar(id):
    question = Question.query.get_or_404(id)
    form = QuestionForm(obj=question)
    if form.validate_on_submit():
        form.populate_obj(question)
        db.session.commit()
        flash('Pergunta atualizada com sucesso!', 'success')
        return redirect(url_for('admin_perguntas'))
    return render_template('admin/perguntas/form.html', form=form, title='Editar Pergunta')

@app.route('/admin/pergunta/excluir/<int:id>', methods=['POST'])
@login_required
def admin_pergunta_excluir(id):
    question = Question.query.get_or_404(id)
    db.session.delete(question)
    db.session.commit()
    flash('Pergunta excluída com sucesso!', 'success')
    return redirect(url_for('admin_perguntas'))

# API Endpoints
@app.route('/api/check_answer/<int:question_id>', methods=['POST'])
@login_required
def check_answer(question_id):
    question = Question.query.get_or_404(question_id)
    user_answer = request.json.get('answer', '').strip()
    
    is_correct = False
    if question.question_type == 'multiple_choice':
        is_correct = user_answer == question.correct_answer
    elif question.question_type == 'code':
        # Implementar validação de código (simplificado)
        is_correct = user_answer.strip() == question.correct_answer.strip()
    else:  # text
        # Implementar validação de texto (simplificado)
        is_correct = user_answer.lower() == question.correct_answer.lower()
    
    return jsonify({
        'correct': is_correct,
        'explanation': question.explanation if question.explanation else ''
    })

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

# Create database tables
@app.before_first_request
def create_tables():
    db.create_all()
    
    # Add default admin user if none exists
    if not Admin.query.first():
        admin = Admin(username='admin')
        admin.set_password('admin123')
        db.session.add(admin)
    
    # Add some sample services if none exist
    if Service.query.count() == 0:
        services = [
            Service(title='Desenvolvimento Web', 
                   description='Desenvolvimento de websites e aplicações web personalizadas utilizando tecnologias modernas.',
                   price='A partir de R$5.000'),
            Service(title='Desenvolvimento de Apps Mobile', 
                   description='Aplicativos nativos e multiplataforma para iOS e Android.',
                   price='A partir de R$8.000'),
            Service(title='Integração de Sistemas', 
                   description='Integração perfeita dos seus sistemas existentes com novas tecnologias.',
                   price='A partir de R$3.500'),
            Service(title='Consultoria em TI', 
                   description='Assessoria especializada em estratégia tecnológica e implementação.',
                   price='R$200/hora')
        ]
        db.session.add_all(services)
    
    # Add sample course if none exists
    if Course.query.count() == 0:
        course = Course(
            title='Introdução à Programação',
            description='Aprenda os conceitos básicos de programação com Python',
            image_url='https://via.placeholder.com/300x200?text=Programa%C3%A7%C3%A3o+Python'
        )
        db.session.add(course)
        db.session.flush()  # Get the course ID
        
        module = Module(
            title='Primeiros Passos',
            description='Conceitos iniciais de programação',
            order=1,
            course_id=course.id
        )
        db.session.add(module)
        db.session.flush()
        
        lesson = Lesson(
            title='O que é Programação?',
            content='''# O que é Programação?
            
Programação é o processo de escrever instruções para um computador executar.

## Por que aprender programação?
- Criar soluções para problemas reais
- Melhorar habilidades lógicas
- Ampliar oportunidades de carreira

## Exemplo de Código Simples

```python
# Este é um comentário
print("Olá, Mundo!")  # Esta linha imprime uma mensagem
```''',
            order=1,
            module_id=module.id
        )
        db.session.add(lesson)
        db.session.flush()
        
        # Add sample questions
        questions = [
            Question(
                question_text='O que é programação?',
                question_type='multiple_choice',
                options=json.dumps([
                    'Um tipo de jogo',
                    'Processo de escrever instruções para um computador',
                    'Uma linguagem de programação',
                    'Um tipo de hardware'
                ]),
                correct_answer=json.dumps('Processo de escrever instruções para um computador'),
                explanation='Programação é o processo de escrever instruções para um computador executar.',
                lesson_id=lesson.id,
                order=1
            ),
            Question(
                question_text='Qual comando imprime algo na tela em Python?',
                question_type='code',
                correct_answer=json.dumps('print("Olá")'),
                explanation='A função print() é usada para exibir informações na tela em Python.',
                lesson_id=lesson.id,
                order=2
            )
        ]
        db.session.add_all(questions)
    
    db.session.commit()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=(os.environ.get('FLASK_ENV') == 'development'))
