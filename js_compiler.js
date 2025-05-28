document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const exerciseId = urlParams.get('id');
    const titleElement = document.getElementById('exercise-title');
    const descriptionElement = document.getElementById('exercise-description');
    const htmlInput = document.getElementById('code-input');
    const cssInput = document.getElementById('css-input');
    const jsInput = document.getElementById('js-input');
    const previewFrame = document.getElementById('preview-frame');
    const saveButton = document.getElementById('save-progress');
    const submitButton = document.getElementById('submit-exercise');
    const runButton = document.querySelector('.run-button');
    const previewButton = document.querySelector('.preview-button');
    const tabs = document.querySelectorAll('.tab');
    const BASE_URL = 'https://auth-system-123.onrender.com';

    let currentTab = 'html';
    let codeContent = {
        html: htmlInput.value,
        css: cssInput.value,
        js: jsInput.value
    };

    cssInput.classList.add('hidden');
    jsInput.classList.add('hidden');

    // Tab System
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabType = tab.dataset.tab;
            if (tabType === currentTab) return;

            // Save current content
            codeContent[currentTab] = getCurrentEditor().value;
            
            // Switch tabs
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tabType;
            
            // Hide all editors
            htmlInput.classList.add('hidden');
            cssInput.classList.add('hidden');
            jsInput.classList.add('hidden');
            
            // Show current editor
            getCurrentEditor().classList.remove('hidden');
        });
    });

    function getCurrentEditor() {
        if (currentTab === 'html') return htmlInput;
        if (currentTab === 'css') return cssInput;
        if (currentTab === 'js') return jsInput;
        return htmlInput; // default
    }

    // Initial Checks
    if (!exerciseId) {
        showError('No exercise ID provided in URL.');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        showError('Please sign in to access this exercise.');
        return;
    }

    // Load Exercise
    try {
        const response = await fetch(`${BASE_URL}/exercises/${exerciseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`Failed to load exercise (${response.status})`);

        const exercise = await response.json();
        populateExercise(exercise);
        await loadProgress();
        updatePreview();
    } catch (error) {
        showError(error.message);
    }

    // Event Listeners
    codeInput.addEventListener('input', () => updatePreview());
    cssInput.addEventListener('input', () => updatePreview());
    jsInput.addEventListener('input', () => updatePreview());
    runButton.addEventListener('click', () => updatePreview());
    previewButton.addEventListener('click', () => updatePreview());
    saveButton.addEventListener('click', saveProgress);
    submitButton.addEventListener('click', submitExercise);

    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu');
    const nav = document.querySelector('nav ul');
    mobileMenuBtn.addEventListener('click', () => {
        nav.style.display = nav.style.display === 'block' ? 'none' : 'block';
    });

    // Utility Functions
    function showError(message) {
        titleElement.textContent = 'Exercise';
        descriptionElement.textContent = message;
    }

    function populateExercise(exercise) {
        titleElement.textContent = exercise.title || 'TechLearn Solutions';
        descriptionElement.textContent = exercise.description || 
            'Create a simple webpage that displays a heading and a paragraph styled with CSS.';
        
        if (exercise.starterCode) {
            codeInput.value = exercise.starterCode.html || `<h1>Welcome!</h1>\n<p>This is your first exercise.</p>`;
            cssInput.value = exercise.starterCode.css || 'h1 { color: blue; }';
            jsInput.value = exercise.starterCode.js || 'console.log("Hello World!");';

            codeContent = {
                html: codeInput.value,
                css: cssInput.value,
                js: jsInput.value
            };
        }
    }

    async function loadProgress() {
        try {
            const response = await fetch(`${BASE_URL}/progress/${exerciseId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const progress = await response.json();
                if (progress.code) {
                    codeInput.value = progress.code.html || codeInput.value;
                    cssInput.value = progress.code.css || cssInput.value;
                    jsInput.value = progress.code.js || jsInput.value;

                    codeContent = {
                        html: codeInput.value,
                        css: cssInput.value,
                        js: jsInput.value
                    };
                }
            }
        } catch (error) {
            console.error('Progress load error:', error);
        }
    }

    function updatePreview() {
        // Save current content before preview
        codeContent[currentTab] = getCurrentEditor().value;

        const html = codeContent.html;
        const css = codeContent.css;
        const js = codeContent.js;

        previewFrame.srcdoc = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>${css}</style>
            </head>
            <body>${html}
                <script>${js}<\/script>
            </body>
            </html>
        `;
    }

    async function saveProgress() {
        try {
            codeContent[currentTab] = getCurrentEditor().value;

            const response = await fetch(`${BASE_URL}/progress/${exerciseId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    code: {
                        html: codeContent.html,
                        css: codeContent.css,
                        js: codeContent.js
                    }
                })
            });

            alert(response.ok ? 'Progress saved successfully!' : 'Failed to save progress');
        } catch (error) {
            console.error('Save error:', error);
            alert('Error saving progress');
        }
    }

    async function submitExercise() {
        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';

            codeContent[currentTab] = getCurrentEditor().value;

            const response = await fetch(`${BASE_URL}/exercises/${exerciseId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    code: {
                        html: codeContent.html,
                        css: codeContent.css,
                        js: codeContent.js
                    },
                    submittedAt: new Date().toISOString()
                })
            });

            if (response.ok) {
                submitButton.textContent = 'Submitted ✓';
                alert('Exercise submitted successfully!');
            } else {
                throw new Error(await response.text());
            }
        } catch (error) {
            console.error('Submission error:', error);
            submitButton.disabled = false;
            submitButton.textContent = 'Submit';
            alert(`Submission failed: ${error.message}`);
        }
    }
});