// This service would normally fetch permissions from your backend
// For now, we'll simulate the permissions based on roles

export const fetchProfilePermissions = async (userRole) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Define default permissions that apply to all roles
  const defaultPermissions = {
    // Basic info permissions
    'profile.name.view': true,
    'profile.email.view': true,
    'profile.phone.view': true,
    
    // Password reset is available to all users
    'profile.password.reset': true,
    
    // Profile picture viewing is available to all
    'profile.picture.view': true,
    
    // Role is always viewable but never editable
    'profile.role.view': true,
    'profile.role.edit': false,
  };
  
  // Role-specific permissions
  const rolePermissions = {
    admin: {
      // Admins can edit all basic info
      'profile.name.edit': true,
      'profile.email.edit': true,
      'profile.phone.edit': true,
      
      // Admins can edit profile pictures
      'profile.picture.edit': true,
      
      // Admins have full access to documents
      'profile.documents.view': true,
      'profile.documents.upload': true,
      'profile.documents.download': true,
      'profile.documents.delete': true,
    },
    
    cityManager: {
      // Managers can edit their own basic info
      'profile.name.edit': true,
      'profile.email.edit': true,
      'profile.phone.edit': true,
      
      // Managers can edit profile pictures
      'profile.picture.edit': true,
      
      // Managers have limited document access
      'profile.documents.view': true,
      'profile.documents.upload': true,
      'profile.documents.download': true,
      'profile.documents.delete': false,
    },
    
    securityOfficer: {
      // Security officers can edit their own name and phone
      'profile.name.edit': true,
      'profile.email.edit': false,
      'profile.phone.edit': true,
      
      // Security officers can edit their profile picture
      'profile.picture.edit': true,
      
      // Security officers have view-only document access
      'profile.documents.view': true,
      'profile.documents.upload': false,
      'profile.documents.download': true,
      'profile.documents.delete': false,
    },
    
    resident: {
      // Residents can edit their own name and phone
      'profile.name.edit': true,
      'profile.email.edit': false,
      'profile.phone.edit': true,
      
      // Residents can edit their profile picture
      'profile.picture.edit': true,
      
      // Residents have limited document access
      'profile.documents.view': true,
      'profile.documents.upload': false,
      'profile.documents.download': true,
      'profile.documents.delete': false,
    },
    
    dataEntry: {
      // Data entry can edit their own basic info
      'profile.name.edit': true,
      'profile.email.edit': true,
      'profile.phone.edit': true,
      
      // Data entry can edit profile pictures
      'profile.picture.edit': true,
      
      // Data entry has upload permissions but not delete
      'profile.documents.view': true,
      'profile.documents.upload': true,
      'profile.documents.download': true,
      'profile.documents.delete': false,
    },
  };
  
  // Return combined permissions for the user's role
  return {
    ...defaultPermissions,
    ...(rolePermissions[userRole] || {}),
  };
};