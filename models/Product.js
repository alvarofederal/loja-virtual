import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Category from './Category.js';

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(200),
    allowNull: true, // Temporariamente permitir null para gerar automaticamente
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  short_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  compare_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  cost_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  weight: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  dimensions: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_bestseller: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  meta_title: {
    type: DataTypes.STRING(60),
    allowNull: true
  },
  meta_description: {
    type: DataTypes.STRING(160),
    allowNull: true
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  category_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  // Imagem principal (mantida para compatibilidade)
  image: {
    type: DataTypes.BLOB('long'),
    allowNull: true,
    comment: 'Imagem principal do produto armazenada como BLOB'
  },
  image_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Tipo MIME da imagem principal (ex: image/jpeg, image/png)'
  },
  // Carrossel de imagens (até 3 imagens)
  image_2: {
    type: DataTypes.BLOB('long'),
    allowNull: true,
    comment: 'Segunda imagem do carrossel'
  },
  image_2_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Tipo MIME da segunda imagem'
  },
  image_3: {
    type: DataTypes.BLOB('long'),
    allowNull: true,
    comment: 'Terceira imagem do carrossel'
  },
  image_3_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Tipo MIME da terceira imagem'
  }
}, {
  timestamps: true, // Habilita created_at e updated_at
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (product) => {
      // Sempre gerar slug se não existir
      if (!product.slug && product.name) {
        product.slug = generateSlug(product.name);
      }
    },
    beforeUpdate: async (product) => {
      // Regenerar slug se nome mudou e slug não foi manualmente alterado
      if (product.changed('name') && product.name && !product.changed('slug')) {
        product.slug = generateSlug(product.name);
      }
    }
  }
});

// Função auxiliar para gerar slug
function generateSlug(name) {
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

// Método para obter todas as imagens do produto
Product.prototype.getImages = function() {
  const images = [];
  
  if (this.image) {
    images.push({
      data: this.image,
      type: this.image_type,
      position: 1
    });
  }
  
  if (this.image_2) {
    images.push({
      data: this.image_2,
      type: this.image_2_type,
      position: 2
    });
  }
  
  if (this.image_3) {
    images.push({
      data: this.image_3,
      type: this.image_3_type,
      position: 3
    });
  }
  
  return images;
};

// Método para definir imagens do carrossel
Product.prototype.setImages = function(imageFiles) {
  if (!imageFiles || imageFiles.length === 0) return;
  
  // Limpar imagens existentes
  this.image = null;
  this.image_type = null;
  this.image_2 = null;
  this.image_2_type = null;
  this.image_3 = null;
  this.image_3_type = null;
  
  // Definir imagens (máximo 3)
  const maxImages = Math.min(imageFiles.length, 3);
  
  for (let i = 0; i < maxImages; i++) {
    const file = imageFiles[i];
    if (file && file.buffer) {
      if (i === 0) {
        this.image = file.buffer;
        this.image_type = file.mimetype;
      } else if (i === 1) {
        this.image_2 = file.buffer;
        this.image_2_type = file.mimetype;
      } else if (i === 2) {
        this.image_3 = file.buffer;
        this.image_3_type = file.mimetype;
      }
    }
  }
};

// Relacionamento com Category
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });

export default Product;
