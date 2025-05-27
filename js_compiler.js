document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const urlParams = new URLSearchParams(window.location.search);
    const exerciseId = urlParams.get('id');
    const titleElement = document.getElementById('exercise-title');
    const descriptionElement = document.getElementById('exercise-description');
    const codeInput = document.getElementById('code-input');
    const previewFrame = document.getElementById('preview-frame');
    const saveButton = document.getElementById('save-progress');
    const submitButton = document.getElementById('submit-exercise');
    const runButton = document.querySelector('.run-button');
    const previewButton = document.querySelector('.preview-button');
    const tabs = document.querySelectorAll('.tab');
    const BASE_URL = 'https://auth-system-123.onrender.com';

    // Tab System
    let currentTab = 'html';
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.textContent.toLowerCase();
        });
    });

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
    runButton.addEventListener('click', () => updatePreview());
    previewButton.addEventListener('click', () => updatePreview());
    saveButton.addEventListener('click', saveProgress);
    submitButton.addEventListener('click', submitExercise);

    // Mobile Menu
    const mobileMenuBtn = document.querySelector('.mobile-menu');
    const nav = document.querySelector('nav ul');
    mobileMenuBtn.addEventListener('click', () => {
        nav.style.display = nav.style.display === 'block' ? 'none' : 'block';
    });

    // Core Functions
    function showError(message) {
        titleElement.textContent = 'Exercise';
        descriptionElement.textContent = message;
    }

    function populateExercise(exercise) {
        titleElement.textContent = exercise.title || 'TechLearn Solutions';
        descriptionElement.textContent = exercise.description || 
            'Create a simple webpage that displays a heading and a paragraph styled with CSS.';
        codeInput.value = exercise.starterCode || `<h1>Welcome!</h1>\n<p>This is your first exercise.</p>`;
    }

    async function loadProgress() {
        try {
            const response = await fetch(`${BASE_URL}/progress/${exerciseId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const progress = await response.json();
                if (progress.code) codeInput.value = progress.code;
            }
        } catch (error) {
            console.error('Progress load error:', error);
        }
    }

    function updatePreview() {
        previewFrame.srcdoc = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        padding: 20px;
                        line-height: 1.6;
                    }
                    h1 { color: ${currentTab === 'css' ? 'var(--primary)' : 'inherit'}; }
                </style>
            </head>
            <body>${codeInput.value}</body>
            </html>
        `;
    }

    async function saveProgress() {
        try {
            const response = await fetch(`${BASE_URL}/progress/${exerciseId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ code: codeInput.value })
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
            
            const response = await fetch(`${BASE_URL}/exercises/${exerciseId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    code: codeInput.value,
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