const express = require('express');
const router = express.Router();

// گٹ ہب ریپوزٹری کا RAW روٹ پاتھ (جہاں آپ کا ڈیٹا موجود ہے)
const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/toheed-ahmad/toheed-ibadat-api/main';

const GITHUB_META_URL = `${GITHUB_BASE_URL}/data/meta/meta.json`;
const GITHUB_DATA_DIR_URL = `${GITHUB_BASE_URL}/data`;

/**
 * ہیلپر فنکشن: گٹ ہب سے لائیو JSON ڈیٹا فیچ کرنے کے لیے
 */
const fetchGitHubJSON = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`GitHub Fetch Failed for URL: ${url} | Status: ${response.status}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`Network error fetching from GitHub (${url}):`, error.message);
        return null;
    }
};

/**
 * 1. GET /api/meta
 * گٹ ہب سے لائیو meta.json کی لسٹ حاصل کرنے کے لیے
 */
router.get('/meta', async (req, res) => {
    const metaData = await fetchGitHubJSON(GITHUB_META_URL);
    if (!metaData) {
        return res.status(504).json({ 
            success: false, 
            message: "Unable to retrieve metadata from GitHub. Please check connection or repository URL." 
        });
    }
    res.status(200).json({ success: true, data: metaData });
});

/**
 * 2. GET /api/module/:id
 * گٹ ہب سے کسی بھی مخصوص ماڈیول کا پورا لائیو ڈیٹا لوڈ کرنے کے لیے
 */
router.get('/module/:id', async (req, res) => {
    const moduleId = req.params.id;
    const metaData = await fetchGitHubJSON(GITHUB_META_URL);
    
    if (!metaData) {
        return res.status(504).json({ success: false, message: "Metadata unreachable from GitHub." });
    }

    // چیک کریں کہ ماڈیول میٹا فائل میں رجسٹرڈ ہے یا نہیں
    const moduleMeta = metaData.modules.find(m => m.id === moduleId);
    if (!moduleMeta) {
        return res.status(404).json({ success: false, message: "Module ID not found in GitHub metadata." });
    }

    // گٹ ہب سے ٹارگیٹ فائل کا لائیو ڈیٹا فیچ کریں
    const targetUrl = `${GITHUB_DATA_DIR_URL}/${moduleMeta.file}`;
    const moduleData = await fetchGitHubJSON(targetUrl);

    if (!moduleData) {
        return res.status(404).json({ success: false, message: `Data file '${moduleMeta.file}' could not be fetched.` });
    }

    res.status(200).json({ success: true, data: moduleData });
});

/**
 * 3. GET /api/module/:id/chapters
 * کسی ماڈیول کے صرف ابواب (Chapters) کی لسٹ حاصل کرنے کے لیے
 */
router.get('/module/:id/chapters', async (req, res) => {
    const moduleId = req.params.id;
    const metaData = await fetchGitHubJSON(GITHUB_META_URL);

    const moduleMeta = metaData?.modules.find(m => m.id === moduleId);
    if (!moduleMeta) return res.status(404).json({ success: false, message: "Module not found." });

    const targetUrl = `${GITHUB_DATA_DIR_URL}/${moduleMeta.file}`;
    const moduleData = await fetchGitHubJSON(targetUrl);

    if (!moduleData) return res.status(404).json({ success: false, message: "Target JSON file missing on GitHub." });

    // ابواب فلٹر کریں تاکہ ڈیٹا کا سائز چھوٹا رہے
    const chapters = moduleData.chapters.map(ch => ({
        id: ch.id,
        category: ch.category,
        chapter_id: ch.chapter_id,
        title: ch.title
    }));

    res.status(200).json({ success: true, count: chapters.length, data: chapters });
});

/**
 * 4. GET /api/module/:id/chapter/:chapterId
 * کسی ماڈیول کے مخصوص چیپٹر کا مکمل ڈیٹا اور اس کا مواد لائیو فیچ کرنے کے لیے
 */
router.get('/module/:id/chapter/:chapterId', async (req, res) => {
    const { id, chapterId } = req.params;
    const metaData = await fetchGitHubJSON(GITHUB_META_URL);

    const moduleMeta = metaData?.modules.find(m => m.id === id);
    if (!moduleMeta) return res.status(404).json({ success: false, message: "Module not found." });

    const targetUrl = `${GITHUB_DATA_DIR_URL}/${moduleMeta.file}`;
    const moduleData = await fetchGitHubJSON(targetUrl);

    if (!moduleData) return res.status(404).json({ success: false, message: "Data could not be fetched." });

    const chapter = moduleData.chapters.find(ch => ch.chapter_id === parseInt(chapterId));
    
    if (!chapter) {
        return res.status(404).json({ success: false, message: "Chapter not found in this remote module." });
    }

    res.status(200).json({ success: true, data: chapter });
});

module.exports = router;