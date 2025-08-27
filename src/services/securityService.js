class SecurityService {
  constructor() {
    this.maxRequestsPerMinute = 30;
    this.requestCounts = new Map();
  }

  // Rate limiting
  isRateLimited(userId) {
    const now = Date.now();
    const userRequests = this.requestCounts.get(userId) || [];
    
    // Remove requests older than 1 minute
    const recentRequests = userRequests.filter(time => now - time < 60000);
    
    if (recentRequests.length >= this.maxRequestsPerMinute) {
      return true;
    }

    // Add current request
    recentRequests.push(now);
    this.requestCounts.set(userId, recentRequests);
    
    return false;
  }

  // Input sanitization
  sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  // Content validation
  validateMessage(content) {
    const errors = [];
    
    if (!content || content.trim().length === 0) {
      errors.push('Message cannot be empty');
    }
    
    if (content.length > 500) {
      errors.push('Message too long (max 500 characters)');
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\b(?:script|javascript|vbscript|onload|onerror)\b/gi,
      /<[^>]*>/g, // HTML tags
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        errors.push('Message contains prohibited content');
        break;
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: this.sanitizeInput(content)
    };
  }
}

export const securityService = new SecurityService();
