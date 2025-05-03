const config = {
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  
  // Security settings
  securityLogLevel: process.env.SECURITY_LOG_LEVEL || 'info',
  maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
  loginLockoutTime: parseInt(process.env.LOGIN_LOCKOUT_TIME || '15', 10), // minutes
  
  // ABAC settings (for future use)
  enableABAC: process.env.ENABLE_ABAC === 'true',
  
  // API rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15', 10) * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // limit each IP to 100 requests per windowMs
  },
  
  // Field Visibility Matrix (Section 5.5)
  fieldVisibility: {
    // Define access levels for different roles
    roles: {
      securityStaff: 'security',
      dataEntry: 'dataEntry',
      admin: 'admin'
    },
    
    // Matrix defining field visibility by role
    matrix: {
      residentInfo: {
        name: {
          security: 'view',
          dataEntry: 'view_edit',
          admin: 'full'
        },
        contactDetails: {
          security: 'hidden',
          dataEntry: 'edit',
          admin: 'full'
        },
        financialFiles: {
          security: 'hidden',
          dataEntry: 'hidden',
          admin: 'full'
        },
        contractFiles: {
          security: 'hidden',
          dataEntry: 'hidden',
          admin: 'full'
        },
        profilePicture: {
          security: 'view',
          dataEntry: 'edit',
          admin: 'full'
        },
        fileUploadDownload: {
          security: 'no',
          dataEntry: 'upload',
          admin: 'full'
        },
        logs: {
          security: 'hidden',
          dataEntry: 'hidden',
          admin: 'view'
        }
      }
    },
    
    // Permission level definitions
    permissionLevels: {
      hidden: { view: false, edit: false, delete: false },
      no: { view: false, edit: false, delete: false, upload: false, download: false },
      view: { view: true, edit: false, delete: false },
      edit: { view: true, edit: true, delete: false },
      view_edit: { view: true, edit: true, delete: false },
      upload: { view: true, edit: false, delete: false, upload: true, download: false },
      full: { view: true, edit: true, delete: true, upload: true, download: true }
    }
  },  // <-- Add this comma here
  
  // File storage settings
  fileStorage: {

    encryptionKey: process.env.FILE_ENCRYPTION_KEY || 'change-this-in-production-env',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: {
      'application/pdf': {
        extension: 'pdf',
        icon: 'file-pdf',
        preview: true
      },
      'image/jpeg': {
        extension: 'jpg',
        icon: 'file-image',
        preview: true
      },
      'image/png': {
        extension: 'png',
        icon: 'file-image',
        preview: true
      },
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
        extension: 'docx',
        icon: 'file-word',
        preview: false
      }
    },
    fileCategories: [
      { id: 'property', label: { en: 'Property Ownership', es: 'Propiedad' } },
      { id: 'rental', label: { en: 'Rental Agreement', es: 'Contrato de Alquiler' } },
      { id: 'id', label: { en: 'ID Documents', es: 'Documentos de Identidad' } },
      { id: 'other', label: { en: 'Other Documents', es: 'Otros Documentos' } }
    ],
    uploadPath: process.env.FILE_UPLOAD_PATH || './uploads',
    tempPath: process.env.FILE_TEMP_PATH || './uploads/temp'
  }
};

export default config;