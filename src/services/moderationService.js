import { geminiService } from './geminiService';

class ModerationService {
  constructor() {
    this.profanityWords = [
      // Add common profanity words here
      'spam', 'scam', 'fake'
    ];
    this.spamThreshold = 3; // messages per minute
    this.userMessageHistory = new Map();
  }

  async moderateMessage(message, userId) {
    const checks = await Promise.all([
      this.checkProfanity(message),
      this.checkSpam(userId),
      this.checkAIModeration(message),
      this.checkLength(message)
    ]);

    return {
      isAllowed: checks.every(check => check.passed),
      flags: checks.filter(check => !check.passed).map(check => check.reason),
      cleanedMessage: this.cleanMessage(message)
    };
  }

  checkProfanity(message) {
    const containsProfanity = this.profanityWords.some(word => 
      message.toLowerCase().includes(word.toLowerCase())
    );

    return {
      passed: !containsProfanity,
      reason: containsProfanity ? 'profanity' : null
    };
  }

  checkSpam(userId) {
    const now = Date.now();
    const userHistory = this.userMessageHistory.get(userId) || [];
    
    // Remove messages older than 1 minute
    const recentMessages = userHistory.filter(timestamp => now - timestamp < 60000);
    
    const isSpam = recentMessages.length >= this.spamThreshold;
    
    // Update history
    recentMessages.push(now);
    this.userMessageHistory.set(userId, recentMessages);

    return {
      passed: !isSpam,
      reason: isSpam ? 'spam' : null
    };
  }

  async checkAIModeration(message) {
    try {
      const result = await geminiService.moderateContent(message);
      return {
        passed: result.isSafe,
        reason: result.isSafe ? null : 'inappropriate_content'
      };
    } catch (error) {
      console.error('AI moderation error:', error);
      return { passed: true, reason: null };
    }
  }

  checkLength(message) {
    const tooLong = message.length > 500;
    const tooShort = message.trim().length < 1;

    return {
      passed: !tooLong && !tooShort,
      reason: tooLong ? 'too_long' : tooShort ? 'too_short' : null
    };
  }

  cleanMessage(message) {
    // Replace profanity with asterisks
    let cleaned = message;
    this.profanityWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      cleaned = cleaned.replace(regex, '*'.repeat(word.length));
    });
    return cleaned;
  }

  reportUser(reportedUserId, reporterUserId, reason) {
    // In a real app, this would save to database
    console.log(`User ${reporterUserId} reported ${reportedUserId} for: ${reason}`);
  }
}

export const moderationService = new ModerationService();
