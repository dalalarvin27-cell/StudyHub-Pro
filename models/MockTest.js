const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionId: { 
    type: String, 
    default: () => new mongoose.Types.ObjectId().toString() 
  },
  questionText: { 
    type: String, 
    required: true 
  },
  options: [{ 
    type: String, 
    required: true 
  }],
  correctAnswer: { 
    type: String, 
    required: true // Store index as string ("0", "1", "2", "3") or exact option text
  },
  explanation: { 
    type: String, 
    default: '' 
  }
});

const mockTestSchema = new mongoose.Schema({
  testId: { 
    type: mongoose.Schema.Types.ObjectId, 
    default: () => new mongoose.Types.ObjectId(),
    required: true,
    unique: true,
    index: true
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: false
  },
  documentId: { 
    type: String, 
    default: null 
  },
  sourceFile: { 
    type: String, 
    required: true 
  },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    default: 'medium' 
  },
  duration: { 
    type: Number, 
    enum: [5, 10, 15], 
    default: 10 
  },
  questions: [questionSchema],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('MockTest', mockTestSchema);