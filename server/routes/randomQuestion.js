const express = require('express');
const router = express.Router();
const axios = require('axios');

const RESOURCE_ID = 'bf7cb748-f220-474b-a4d5-2d59f93db28d';

router.get('/random', async (req, res) => {
  try {
    const response = await axios.get(
      `https://data.gov.il/api/3/action/datastore_search?resource_id=${RESOURCE_ID}&limit=1802`
    );

    const records = response.data.result.records;
    const random = Math.floor(Math.random() * records.length);
    const record = records[random];

    const questionText = record.title2;
    const html = record.description4;

    const liMatches = html.match(/<li><span.*?>(.*?)<\/span><\/li>/g) || [];

    const options = liMatches.map(li => {
      const textMatch = li.match(/<span.*?>(.*?)<\/span>/);
      return textMatch ? textMatch[1] : '';
    });

    const correctMatch = html.match(/<span id="correctAnswer.*?">(.*?)<\/span>/);
    const correctAnswer = correctMatch ? correctMatch[1] : options[0];

    res.json({
      question: questionText,
      options,
      correctAnswer,
      questionId: random
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'בעיה בטעינת השאלה' });
  }
});

module.exports = router;
