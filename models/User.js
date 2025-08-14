import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [2, 100]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  state: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  zip_code: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reset_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  reset_token_expires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  profile_image: {
    type: DataTypes.BLOB('long'),
    allowNull: true,
    comment: 'Foto de perfil do usuário armazenada como BLOB'
  },
  profile_image_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Tipo MIME da imagem de perfil (ex: image/jpeg, image/png)'
  }
}, {
  timestamps: true, // Habilita created_at e updated_at
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

// Método para verificar senha
User.prototype.verifyPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Método para gerar token de reset
User.prototype.generateResetToken = async function() {
  const crypto = await import('crypto');
  this.reset_token = crypto.randomBytes(32).toString('hex');
  this.reset_token_expires = new Date(Date.now() + 3600000); // 1 hora
  return this.reset_token;
};

export default User;
