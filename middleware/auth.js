import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

// Middleware para verificar se o usuário está autenticado
export const requireAuth = async (req, res, next) => {
  try {
    const token = req.session.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      req.flash('error', 'Você precisa estar logado para acessar esta página');
      return res.redirect('/auth/login');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua-chave-secreta-aqui');
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.is_active) {
      req.flash('error', 'Usuário não encontrado ou inativo');
      return res.redirect('/auth/login');
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    req.flash('error', 'Sessão expirada. Faça login novamente.');
    return res.redirect('/auth/login');
  }
};

// Middleware para verificar se o usuário é admin
export const requireAdmin = async (req, res, next) => {
  try {
    await requireAuth(req, res, () => {
      if (req.user.role !== 'admin') {
        req.flash('error', 'Acesso negado. Você precisa ser administrador.');
        return res.redirect('/');
      }
      next();
    });
  } catch (error) {
    console.error('Erro na verificação de admin:', error);
    req.flash('error', 'Erro na verificação de permissões');
    return res.redirect('/');
  }
};

// Middleware para verificar se o usuário é dono do recurso ou admin
export const requireOwnershipOrAdmin = async (req, res, next) => {
  try {
    await requireAuth(req, res, () => {
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Verificar se o usuário é dono do recurso
      const resourceUserId = req.params.userId || req.body.userId;
      if (req.user.id === resourceUserId) {
        return next();
      }
      
      req.flash('error', 'Acesso negado. Você não tem permissão para acessar este recurso.');
      return res.redirect('/');
    });
  } catch (error) {
    console.error('Erro na verificação de propriedade:', error);
    req.flash('error', 'Erro na verificação de permissões');
    return res.redirect('/');
  }
};

// Middleware opcional para autenticação (não bloqueia se não autenticado)
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.session.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua-chave-secreta-aqui');
      const user = await User.findByPk(decoded.userId);
      
      if (user && user.is_active) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Se houver erro na autenticação, continua sem usuário
    next();
  }
};
