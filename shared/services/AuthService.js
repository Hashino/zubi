import StorageService from './StorageService';

class AuthService {
  constructor() {
    this.currentUser = null;
  }

  // Generate a simple hash for password (NOT secure for production, just for demo)
  // This is a basic hash function for MVP - in production, use proper crypto libraries
  async hashPassword(password) {
    let hash = 0;
    if (password.length === 0) return hash.toString();
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Add timestamp to make it unique
    return 'hash_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
  }

  // Generate a random user ID
  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Register a new user
  async register(userData) {
    try {
      const { email, password, name, phone, userType } = userData;

      // Validate required fields
      if (!email || !password || !name || !userType) {
        return {
          success: false,
          error: 'Todos os campos são obrigatórios'
        };
      }

      // Check if user already exists
      const existingUser = await StorageService.getUserProfile();
      if (existingUser && existingUser.email === email) {
        return {
          success: false,
          error: 'Usuário já cadastrado com este email'
        };
      }

      // Hash password
      const passwordHash = await this.hashPassword(password);

      // Create user profile
      const userId = this.generateUserId();
      const userProfile = {
        id: userId,
        email,
        name,
        phone,
        userType, // 'passenger' or 'driver'
        passwordHash,
        createdAt: new Date().toISOString(),
        verified: false,
        profileComplete: false,
      };

      // Add driver-specific fields
      if (userType === 'driver') {
        userProfile.driverInfo = {
          vehicleModel: '',
          vehiclePlate: '',
          vehicleColor: '',
          vehicleYear: '',
          licenseNumber: '',
          licenseExpiry: '',
          rating: 5.0,
          totalTrips: 0,
          verified: false,
        };
      }

      // Save user profile
      await StorageService.saveUserProfile(userProfile);

      // Generate and save auth token
      const authToken = await this.generateAuthToken(userId);
      await StorageService.saveAuthToken(authToken);

      this.currentUser = userProfile;

      return {
        success: true,
        user: userProfile,
        token: authToken,
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Erro ao criar conta: ' + error.message
      };
    }
  }

  // Login user
  async login(email, password) {
    try {
      // Get stored user profile
      const userProfile = await StorageService.getUserProfile();

      if (!userProfile) {
        return {
          success: false,
          error: 'Usuário não encontrado'
        };
      }

      if (userProfile.email !== email) {
        return {
          success: false,
          error: 'Email ou senha incorretos'
        };
      }

      // Verify password
      const passwordHash = await this.hashPassword(password);
      if (passwordHash !== userProfile.passwordHash) {
        return {
          success: false,
          error: 'Email ou senha incorretos'
        };
      }

      // Generate and save new auth token
      const authToken = await this.generateAuthToken(userProfile.id);
      await StorageService.saveAuthToken(authToken);

      this.currentUser = userProfile;

      return {
        success: true,
        user: userProfile,
        token: authToken,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Erro ao fazer login: ' + error.message
      };
    }
  }

  // Logout user
  async logout() {
    try {
      await StorageService.removeAuthToken();
      this.currentUser = null;
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const token = await StorageService.getAuthToken();
      const userProfile = await StorageService.getUserProfile();
      
      if (token && userProfile) {
        this.currentUser = userProfile;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }

  // Get current user
  async getCurrentUser() {
    if (this.currentUser) {
      return this.currentUser;
    }
    
    const userProfile = await StorageService.getUserProfile();
    if (userProfile) {
      this.currentUser = userProfile;
      return userProfile;
    }
    
    return null;
  }

  // Update user profile
  async updateProfile(updates) {
    try {
      const result = await StorageService.updateUserProfile(updates);
      if (result.success) {
        this.currentUser = { ...this.currentUser, ...updates };
      }
      return result;
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message };
    }
  }

  // Complete driver profile (additional verification fields)
  async completeDriverProfile(driverInfo) {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser || currentUser.userType !== 'driver') {
        return {
          success: false,
          error: 'Apenas motoristas podem completar este perfil'
        };
      }

      const updates = {
        driverInfo: {
          ...currentUser.driverInfo,
          ...driverInfo,
        },
        profileComplete: true,
      };

      return await this.updateProfile(updates);
    } catch (error) {
      console.error('Driver profile completion error:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate auth token (simple version for demo)
  async generateAuthToken(userId) {
    const timestamp = Date.now().toString();
    const randomPart = Math.random().toString(36).substr(2, 9);
    const tokenString = `${userId}_${timestamp}_${randomPart}`;
    const token = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      tokenString
    );
    return token;
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  validatePassword(password) {
    if (password.length < 6) {
      return {
        valid: false,
        error: 'A senha deve ter pelo menos 6 caracteres'
      };
    }
    return { valid: true };
  }

  // Validate phone number (Brazilian format)
  validatePhone(phone) {
    const phoneRegex = /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/;
    return phoneRegex.test(phone);
  }
}

export default new AuthService();
