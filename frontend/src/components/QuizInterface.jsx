import { useState } from 'react';

function QuizInterface({ selectedDocument }) {
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Placeholder quiz data - will be fetched from backend
  const [quiz, setQuiz] = useState(null);

  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    // TODO: Call backend to generate quiz
    
    // Simulate API call
    setTimeout(() => {
      setQuiz({
        questions: [
          {
            id: 1,
            question: "What is the main topic of this document?",
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: 0
          },
          {
            id: 2,
            question: "Which concept is explained in chapter 2?",
            options: ["Concept A", "Concept B", "Concept C", "Concept D"],
            correctAnswer: 1
          }
        ]
      });
      setIsGenerating(false);
      setQuizStarted(true);
    }, 2000);
  };

  const handleSelectAnswer = (questionId, optionIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: optionIndex
    });
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const calculateScore = () => {
    if (!quiz) return 0;
    let correct = 0;
    quiz.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  if (!quizStarted) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-4xl mb-4">📝</p>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Ready to test your knowledge?
          </h2>
          <p className="text-gray-600 mb-6">
            I'll generate a quiz based on "{selectedDocument.name}"
          </p>
          <button
            onClick={handleGenerateQuiz}
            disabled={isGenerating}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {isGenerating ? 'Generating Quiz...' : 'Generate Quiz'}
          </button>
        </div>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    const total = quiz.questions.length;
    const percentage = ((score / total) * 100).toFixed(0);

    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-6xl mb-4">🎉</p>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Quiz Complete!</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <p className="text-5xl font-bold text-blue-600 mb-2">{percentage}%</p>
            <p className="text-gray-600">
              You got {score} out of {total} questions correct
            </p>
          </div>
          <button
            onClick={() => {
              setQuizStarted(false);
              setCurrentQuestion(0);
              setSelectedAnswers({});
              setShowResults(false);
              setQuiz(null);
            }}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Try Another Quiz
          </button>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];

  return (
    <div className="h-full flex flex-col p-6">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
          <span>{Object.keys(selectedAnswers).length} answered</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          {question.question}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectAnswer(question.id, idx)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedAnswers[question.id] === idx
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <span className="font-medium">{String.fromCharCode(65 + idx)}.</span> {option}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="px-6 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg font-medium transition-colors"
        >
          ← Previous
        </button>

        {currentQuestion === quiz.questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            className="px-8 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}

export default QuizInterface;
