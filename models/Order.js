import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  order_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'),
    defaultValue: 'pending'
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  shipping_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  mercado_pago_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  shipping_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  shipping_city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  shipping_state: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  shipping_zip_code: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  billing_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  customer_name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  customer_email: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  customer_phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tracking_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  tracking_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  shipped_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true, // Habilita created_at e updated_at
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Relacionamento com User
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });

export default Order;
