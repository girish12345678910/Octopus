import Filter from 'bad-words';

class EnhancedProfanityFilter {
  constructor() {
    this.filter = new Filter();
    this.setupCustomConfiguration();
  }

  setupCustomConfiguration() {
    // ✅ Remove false positives that shouldn't be filtered
    this.filter.removeWords('fuck', 'damn', 'crap');

    // ✅ Add custom words specific to your community
    const customBadWords = [
      'spam', 'toxic', 'noob', 'trash', 'garbage',
      'idiot', 'stupid', 'moron', 'loser', 'retard',
      // Add gaming/chat specific terms
      'ez', 'rekt', 'pwned', 'git gud',
      // Add any other words specific to your app
    ];
    
    this.filter.addWords(...customBadWords);

    // ✅ Custom regex for better detection including special characters
    this.filter.replaceRegex = /[A-Za-z0-9öÖÇçŞşĞğİıÜü_]/g;
  }

  // Check if text contains profanity
  isProfane(text) {
    return this.filter.isProfane(text);
  }

  // Clean text by replacing bad words with asterisks
  clean(text) {
    return this.filter.clean(text);
  }

  // Custom method to detect severity levels
  analyzeProfanity(text) {
    const originalText = text;
    const cleanedText = this.clean(text);
    const hasProfanity = originalText !== cleanedText;
    
    if (!hasProfanity) {
      return {
        level: 'clean',
        action: 'allow',
        cleanText: originalText
      };
    }

    // Count number of bad words
    const badWordCount = (originalText.match(/\*{3,}/g) || []).length;
    
    if (badWordCount === 1) {
      return {
        level: 'mild',
        action: 'warn',
        cleanText: cleanedText,
        message: 'Please keep the conversation respectful'
      };
    } else if (badWordCount >= 2) {
      return {
        level: 'severe',
        action: 'block',
        cleanText: '***',
        message: 'Message blocked due to inappropriate content'
      };
    }
  }

  // Method to handle different types of bypass attempts
  normalizeText(text) {
    return text
      .toLowerCase()
      // Replace common character substitutions
      .replace(/[4@]/g, 'a')
      .replace(/[3€]/g, 'e')
      .replace(/[1!|]/g, 'i')
      .replace(/[0]/g, 'o')
      .replace(/[5$]/g, 's')
      .replace(/[7]/g, 't')
      // Remove extra spaces and special characters
      .replace(/[\s\-_.]+/g, '');
  }

  // Advanced profanity check with normalization
  advancedCheck(text) {
    const normalizedText = this.normalizeText(text);
    return this.isProfane(normalizedText);
  }
}

export default new EnhancedProfanityFilter();
