// controllers/quizController.js

exports.getQuizById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ID is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);

    // Search by either MongoDB default _id OR custom testId
    const quiz = await Quiz.findOne({
      $or: [
        ...(isValidObjectId ? [{ _id: id }] : []),
        ...(isValidObjectId ? [{ testId: id }] : []),
        { documentId: id }
      ]
    });

    if (!quiz) {
      console.log(`[QUIZ ERROR] Test not found for ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: "Mock test not found."
      });
    }

    return res.status(200).json({
      success: true,
      data: quiz
    });

  } catch (error) {
    console.error(`[QUIZ ERROR] Fetch failed:`, error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching mock test."
    });
  }
};