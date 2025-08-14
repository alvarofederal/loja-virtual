import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: true, // Permitir null para gerar automaticamente
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true, // Habilita created_at e updated_at
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (category) => {
      // Gerar slug se não existir
      if (!category.slug && category.name) {
        category.slug = generateCategorySlug(category.name);
      }
    },
    beforeUpdate: async (category) => {
      // Regenerar slug se nome mudou e slug não foi manualmente alterado
      if (category.changed('name') && category.name && !category.changed('slug')) {
        category.slug = generateCategorySlug(category.name);
      }
    }
  }
});

// Função auxiliar para gerar slug de categoria
function generateCategorySlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD') // Normalizar para remover acentos
    .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens múltiplos
    .replace(/^-+|-+$/g, '') // Remove hífens no início e fim
    .trim();
}

export default Category;
