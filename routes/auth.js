import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { uploadImageAsBlob } from '../middleware/upload.js';

const router = express.Router();

// Middleware para verificar se usuário está logado
const requireAuth = async (req, res, next) => {
  if (!req.session.user) {
    req.flash('error', 'Você precisa estar logado para acessar esta página');
    return res.redirect('/auth/login');
  }
  
  try {
    const user = await User.findByPk(req.session.user.id);
    if (!user || !user.is_active) {
      req.session.destroy();
      req.flash('error', 'Sua conta foi desativada');
      return res.redirect('/auth/login');
    }
    next();
  } catch (error) {
    req.flash('error', 'Erro de autenticação');
    return res.redirect('/auth/login');
  }
};

// Middleware para verificar se é admin
const requireAdmin = async (req, res, next) => {
  if (!req.session.user) {
    req.flash('error', 'Você precisa estar logado para acessar esta página');
    return res.redirect('/auth/login');
  }
  
  try {
    const user = await User.findByPk(req.session.user.id);
    if (!user || user.role !== 'admin' || !user.is_active) {
      req.flash('error', 'Acesso negado. Apenas administradores podem acessar esta página');
      return res.redirect('/');
    }
    next();
  } catch (error) {
    req.flash('error', 'Erro de autenticação');
    return res.redirect('/auth/login');
  }
};

// Página de login
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('auth/login', { title: 'Login - Arte & Tradição' });
});

// Processar login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      req.flash('error', 'Email ou senha incorretos');
      return res.redirect('/auth/login');
    }
    
    if (!user.is_active) {
      req.flash('error', 'Sua conta foi desativada. Entre em contato com o administrador.');
      return res.redirect('/auth/login');
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      req.flash('error', 'Email ou senha incorretos');
      return res.redirect('/auth/login');
    }
    
    // Atualizar último login
    await user.update({ last_login: new Date() });
    
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    req.flash('success', `Bem-vindo, ${user.name}!`);
    
    // Redirecionar admin para painel administrativo
    if (user.role === 'admin') {
      res.redirect('/admin');
    } else {
      res.redirect('/');
    }
  } catch (error) {
    console.error('Erro no login:', error);
    req.flash('error', 'Erro interno do servidor');
    res.redirect('/auth/login');
  }
});

// Página de registro
router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('auth/register', { title: 'Registro - Arte & Tradição' });
});

// Processar registro
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;
    
    // Validações básicas
    if (!name || !email || !password) {
      req.flash('error', 'Todos os campos são obrigatórios');
      return res.redirect('/auth/register');
    }
    
    if (password !== confirmPassword) {
      req.flash('error', 'As senhas não coincidem');
      return res.redirect('/auth/register');
    }
    
    if (password.length < 6) {
      req.flash('error', 'A senha deve ter pelo menos 6 caracteres');
      return res.redirect('/auth/register');
    }
    
    // Verificar se email já existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      req.flash('error', 'Este email já está em uso');
      return res.redirect('/auth/register');
    }
    
    // Criar novo usuário
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'user',
      is_active: true
    });
    
    // Enviar email de boas-vindas
    const welcomeEmail = `
      <h2>Bem-vindo à Arte & Tradição!</h2>
      <p>Olá ${name},</p>
      <p>Sua conta foi criada com sucesso!</p>
      <p>Email: ${email}</p>
      <p>Acesse: <a href="${process.env.BASE_URL || 'http://localhost:3000'}">${process.env.BASE_URL || 'http://localhost:3000'}</a></p>
      <p>Obrigado por escolher a Arte & Tradição!</p>
    `;
    
    req.app.locals.sendEmail(email, 'Bem-vindo à Arte & Tradição!', welcomeEmail);
    
    req.flash('success', 'Conta criada com sucesso! Faça login para continuar.');
    res.redirect('/auth/login');
  } catch (error) {
    console.error('Erro no registro:', error);
    req.flash('error', 'Erro interno do servidor');
    res.redirect('/auth/register');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao fazer logout:', err);
    }
    res.redirect('/');
  });
});

// Perfil do usuário
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.user.id);
    res.render('auth/profile', { 
      title: 'Meu Perfil - Arte & Tradição',
      user 
    });
  } catch (error) {
    console.error('Erro ao carregar perfil:', error);
    req.flash('error', 'Erro ao carregar perfil');
    res.redirect('/');
  }
});

// Atualizar perfil
router.put('/profile', requireAuth, uploadImageAsBlob, async (req, res) => {
  try {
    const { name, email, phone, address, city, state, zip_code, currentPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findByPk(req.session.user.id);
    
    // Verificar senha atual se for alterar senha
    if (newPassword) {
      if (!currentPassword) {
        req.flash('error', 'Por favor, informe sua senha atual para alterar a senha');
        return res.redirect('/auth/profile');
      }
      
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        req.flash('error', 'Senha atual incorreta');
        return res.redirect('/auth/profile');
      }
      
      if (newPassword !== confirmPassword) {
        req.flash('error', 'As senhas não coincidem');
        return res.redirect('/auth/profile');
      }
      
      if (newPassword.length < 6) {
        req.flash('error', 'A nova senha deve ter pelo menos 6 caracteres');
        return res.redirect('/auth/profile');
      }
      
      user.password = await bcrypt.hash(newPassword, 10);
    }
    
    // Atualizar dados básicos
    user.name = name;
    user.email = email;
    user.phone = phone;
    user.address = address;
    user.city = city;
    user.state = state;
    user.zip_code = zip_code;
    
    // Atualizar foto de perfil se fornecida
    if (req.file) {
      user.profile_image = req.file.buffer;
      user.profile_image_type = req.file.mimetype;
    }
    
    await user.save();
    
    // Atualizar sessão
    req.session.user.name = name;
    req.session.user.email = email;
    
    req.flash('success', 'Perfil atualizado com sucesso');
    res.redirect('/auth/profile');
  } catch (error) {
    console.error('❌ Erro ao atualizar perfil:', error);
    req.flash('error', 'Erro ao atualizar perfil');
    res.redirect('/auth/profile');
  }
});

// Exibir imagem de perfil
router.get('/profile/image', requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.user.id);
    if (!user || !user.profile_image) {
      return res.status(404).send('Imagem não encontrada');
    }
    res.set('Content-Type', user.profile_image_type || 'image/jpeg');
    res.send(user.profile_image);
  } catch (error) {
    console.error('Erro ao carregar imagem de perfil:', error);
    res.status(500).send('Erro interno do servidor');
  }
});

// Esqueci minha senha
router.get('/forgot-password', (req, res) => {
  res.render('auth/forgot-password', { title: 'Esqueci minha senha - Arte & Tradição' });
});

// Processar esqueci minha senha
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      req.flash('error', 'Email não encontrado');
      return res.redirect('/auth/forgot-password');
    }
    
    // Gerar token de reset
    const resetToken = await user.generateResetToken();
    await user.save();
    
    // Enviar email com link de reset
    const resetEmail = `
      <h2>Redefinir Senha - Arte & Tradição</h2>
      <p>Olá ${user.name},</p>
      <p>Você solicitou a redefinição de sua senha.</p>
      <p>Clique no link abaixo para criar uma nova senha:</p>
      <p><a href="${process.env.BASE_URL || 'http://localhost:3000'}/auth/reset-password/${resetToken}">Redefinir Senha</a></p>
      <p>Este link expira em 1 hora.</p>
      <p>Se você não solicitou esta alteração, ignore este email.</p>
    `;
    
    req.app.locals.sendEmail(email, 'Redefinir Senha - Arte & Tradição', resetEmail);
    
    req.flash('success', 'Email de redefinição enviado. Verifique sua caixa de entrada.');
    res.redirect('/auth/login');
  } catch (error) {
    console.error('Erro ao processar esqueci senha:', error);
    req.flash('error', 'Erro interno do servidor');
    res.redirect('/auth/forgot-password');
  }
});

// Página de redefinir senha
router.get('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const user = await User.findOne({
      where: {
        reset_token: token,
        reset_token_expires: { [require('sequelize').Op.gt]: new Date() }
      }
    });
    
    if (!user) {
      req.flash('error', 'Token inválido ou expirado');
      return res.redirect('/auth/login');
    }
    
    res.render('auth/reset-password', { 
      title: 'Redefinir Senha - Arte & Tradição',
      token 
    });
  } catch (error) {
    console.error('Erro ao carregar reset password:', error);
    req.flash('error', 'Erro interno do servidor');
    res.redirect('/auth/login');
  }
});

// Processar redefinição de senha
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
      req.flash('error', 'As senhas não coincidem');
      return res.redirect(`/auth/reset-password/${token}`);
    }
    
    if (password.length < 6) {
      req.flash('error', 'A senha deve ter pelo menos 6 caracteres');
      return res.redirect(`/auth/reset-password/${token}`);
    }
    
    const user = await User.findOne({
      where: {
        reset_token: token,
        reset_token_expires: { [require('sequelize').Op.gt]: new Date() }
      }
    });
    
    if (!user) {
      req.flash('error', 'Token inválido ou expirado');
      return res.redirect('/auth/login');
    }
    
    // Atualizar senha e limpar token
    user.password = await bcrypt.hash(password, 10);
    user.reset_token = null;
    user.reset_token_expires = null;
    await user.save();
    
    req.flash('success', 'Senha redefinida com sucesso! Faça login com sua nova senha.');
    res.redirect('/auth/login');
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    req.flash('error', 'Erro interno do servidor');
    res.redirect('/auth/login');
  }
});

export default router; 