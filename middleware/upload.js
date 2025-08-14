import multer from 'multer';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';

// Configuração do storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = 'public/uploads/products';
    
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Filtro de arquivos
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado. Use apenas JPEG, PNG ou WebP.'), false);
  }
};

// Configuração do multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 3 // Máximo 3 arquivos
  }
});

// Middleware para processar imagens
export const processImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    const processedImages = [];
    
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const filePath = file.path;
      
      // Processar imagem com Sharp
      const processedImage = await sharp(filePath)
        .resize(800, 800, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 85 })
        .toBuffer();
      
      // Salvar versão processada
      await fs.writeFile(filePath, processedImage);
      
      // Criar thumbnail
      const thumbnailPath = filePath.replace(path.extname(filePath), '_thumb' + path.extname(filePath));
      await sharp(filePath)
        .resize(300, 300, { 
          fit: 'cover' 
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
      
      processedImages.push({
        original: file,
        thumbnail: thumbnailPath,
        url: `/uploads/products/${path.basename(filePath)}`,
        thumbnail_url: `/uploads/products/${path.basename(thumbnailPath)}`
      });
    }
    
    req.processedImages = processedImages;
    next();
  } catch (error) {
    console.error('Erro ao processar imagens:', error);
    req.flash('error', 'Erro ao processar imagens');
    next(error);
  }
};

// Middleware para upload de múltiplas imagens
export const uploadProductImages = upload.array('images', 3);

// Middleware para upload de imagem única
export const uploadSingleImage = upload.single('image');

// Middleware para deletar imagens antigas
export const deleteOldImages = async (req, res, next) => {
  try {
    if (req.body.oldImages) {
      const oldImages = JSON.parse(req.body.oldImages);
      
      for (const imagePath of oldImages) {
        try {
          await fs.unlink(`public${imagePath}`);
          const thumbnailPath = imagePath.replace(path.extname(imagePath), '_thumb' + path.extname(imagePath));
          await fs.unlink(`public${thumbnailPath}`);
        } catch (error) {
          console.error('Erro ao deletar imagem antiga:', error);
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Erro ao deletar imagens antigas:', error);
    next();
  }
};

// Middleware para upload de imagem como BLOB (perfil)
export const uploadImageAsBlob = multer({
  storage: multer.memoryStorage(), // Armazena na memória como buffer
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Use apenas JPEG, PNG ou WebP.'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1 // Apenas 1 arquivo
  }
}).single('profile_image'); // Campo correto para o perfil

// Middleware para upload de imagem como BLOB (produtos)
export const uploadProductImageAsBlob = multer({
  storage: multer.memoryStorage(), // Armazena na memória como buffer
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Use apenas JPEG, PNG ou WebP.'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1 // Apenas 1 arquivo
  }
}).single('image'); // Campo correto para produtos

// Middleware para upload de múltiplas imagens como BLOB (carrossel de produtos)
export const uploadProductCarouselAsBlob = multer({
  storage: multer.memoryStorage(), // Armazena na memória como buffer
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Use apenas JPEG, PNG ou WebP.'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB por arquivo
    files: 3 // Máximo 3 arquivos para o carrossel
  }
}).array('product_images', 3); // Campo para múltiplas imagens de produto

export default upload;
