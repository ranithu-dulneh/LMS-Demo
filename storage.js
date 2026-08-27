import { supabase } from './auth.js';

// IMPORTANT: Replace this with your actual deployed Cloudflare Worker URL
const WORKER_URL = "https://lms-upload-worker.<YOUR_SUBDOMAIN>.workers.dev";

/**
 * Uploads a file to Cloudflare R2 securely using a Presigned URL via a Cloudflare Worker.
 * @param {File} file - The file object from an input element
 * @param {string} prefix - Folder prefix (e.g., 'receipts/', 'materials/', 'recordings/')
 * @param {function} onProgress - Optional callback function to track upload progress (percentage)
 * @returns {Promise<string>} - The path/key of the uploaded file
 */
export async function uploadToR2(file, prefix = '', onProgress = null) {
    const fileName = `${prefix}${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    try {
        // Request a presigned URL from the Cloudflare Worker
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fileName: fileName,
                contentType: file.type
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error getting presigned URL:', errorText);
            throw new Error(`Worker error: ${response.status} ${errorText}`);
        }

        const data = await response.json();

        if (!data || !data.signedUrl) {
            throw new Error('No signedUrl returned from Worker');
        }

        // Upload directly to Cloudflare R2 using the presigned URL via XMLHttpRequest for progress tracking
        await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable && onProgress) {
                    const percentage = Math.round((event.loaded / event.total) * 100);
                    onProgress(percentage);
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.response);
                } else {
                    reject(new Error(`Upload to R2 failed with status: ${xhr.status}`));
                }
            };

            xhr.onerror = () => reject(new Error('Network error occurred during upload.'));

            xhr.open('PUT', data.signedUrl);
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.send(file);
        });

        console.log('Successfully uploaded to R2:', fileName);
        return fileName;
    } catch (error) {
        console.error('Error uploading to Cloudflare R2:', error);
        throw error;
    }
}

// ----------------------------------------------------------------------------
// Form Handlers
// ----------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {

    // Helper function for file previews
    function handleFilePreview(inputId, previewId) {
        const fileInput = document.getElementById(inputId);
        const previewContainer = document.getElementById(previewId);

        if (fileInput && previewContainer) {
            fileInput.addEventListener('change', () => {
                const file = fileInput.files[0];
                previewContainer.innerHTML = ''; // Clear previous preview

                if (file) {
                    previewContainer.classList.remove('hidden');

                    if (file.type.startsWith('image/')) {
                        const img = document.createElement('img');
                        img.src = URL.createObjectURL(file);
                        img.style.maxWidth = '100%';
                        img.style.maxHeight = '200px';
                        img.style.borderRadius = '8px';
                        previewContainer.appendChild(img);
                    } else if (file.type.startsWith('video/')) {
                        const video = document.createElement('video');
                        video.src = URL.createObjectURL(file);
                        video.controls = true;
                        video.style.maxWidth = '100%';
                        video.style.maxHeight = '200px';
                        video.style.borderRadius = '8px';
                        previewContainer.appendChild(video);
                    } else {
                        // For PDFs or other files
                        const p = document.createElement('p');
                        p.textContent = `📄 Selected File: ${file.name}`;
                        p.style.fontWeight = 'bold';
                        previewContainer.appendChild(p);
                    }
                } else {
                    previewContainer.classList.add('hidden');
                }
            });
        }
    }

    // Setup previews
    handleFilePreview('receipt-file', 'receipt-preview');
    handleFilePreview('doc-file', 'doc-preview');
    handleFilePreview('video-file', 'video-preview');

    // 1. Student Receipt Upload Form (index.html)
    const receiptForm = document.getElementById('receipt-upload-form');
    if (receiptForm) {
        receiptForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('receipt-file');
            const file = fileInput.files[0];
            const submitBtn = receiptForm.querySelector('button[type="submit"]');

            const progressContainer = document.getElementById('receipt-progress-container');
            const progressBar = document.getElementById('receipt-progress-bar');
            const progressText = document.getElementById('receipt-progress-text');
            const previewContainer = document.getElementById('receipt-preview');
            const referenceNoInput = document.getElementById('reference-no');

            const { data: { session } } = await supabase.auth.getSession();

            if (file) {
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
                submitBtn.disabled = true;

                if (progressContainer) progressContainer.classList.remove('hidden');

                try {
                    const uploadedPath = await uploadToR2(file, 'receipts/', (percentage) => {
                        if (progressBar) progressBar.style.width = `${percentage}%`;
                        if (progressText) progressText.textContent = `${percentage}%`;
                    });

                    // Save to database
                    const { error: dbError } = await supabase.from('Stu_Reciepts').insert([
                        {
                            file_path: uploadedPath,
                            reference_no: referenceNoInput ? referenceNoInput.value : null,
                            user_email: session ? session.user.email : 'anonymous'
                        }
                    ]);
                    if (dbError) {
                        console.error('Error saving receipt to database:', dbError);
                        alert(`File uploaded to R2, but failed to save to database. Check console.`);
                    } else {
                        alert(`Receipt Uploaded Successfully!\n(Path: ${uploadedPath})\nWaiting for Admin approval.`);
                        receiptForm.reset();
                    }

                    if (previewContainer) {
                        previewContainer.innerHTML = '';
                        previewContainer.classList.add('hidden');
                    }
                } catch (error) {
                    alert('Failed to upload receipt. Check console for details.');
                } finally {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    if (progressContainer) {
                        progressContainer.classList.add('hidden');
                        if (progressBar) progressBar.style.width = '0%';
                        if (progressText) progressText.textContent = '0%';
                    }
                }
            }
        });
    }

    // 2. Admin Material Upload Form (admin.html)
    const materialForm = document.getElementById('material-upload-form');
    if (materialForm) {
        materialForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('doc-file');
            const file = fileInput.files[0];
            const submitBtn = materialForm.querySelector('button[type="submit"]');

            const progressContainer = document.getElementById('doc-progress-container');
            const progressBar = document.getElementById('doc-progress-bar');
            const progressText = document.getElementById('doc-progress-text');
            const previewContainer = document.getElementById('doc-preview');

            const docTitleInput = document.getElementById('doc-title');
            const accessRadios = document.getElementsByName('doc_access');
            let accessLevel = 'free';
            for (const radio of accessRadios) { if (radio.checked) accessLevel = radio.value; }
            const docPriceInput = document.getElementById('doc-price');

            if (file) {
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
                submitBtn.disabled = true;

                if (progressContainer) progressContainer.classList.remove('hidden');

                try {
                    const uploadedPath = await uploadToR2(file, 'materials/', (percentage) => {
                        if (progressBar) progressBar.style.width = `${percentage}%`;
                        if (progressText) progressText.textContent = `${percentage}%`;
                    });

                    // Save to database
                    const { error: dbError } = await supabase.from('Tutes').insert([
                        {
                            title: docTitleInput ? docTitleInput.value : file.name,
                            file_path: uploadedPath,
                            access_level: accessLevel,
                            price: accessLevel === 'paid' && docPriceInput ? parseFloat(docPriceInput.value) : 0
                        }
                    ]);
                    if (dbError) {
                        console.error('Error saving material to database:', dbError);
                        alert(`File uploaded to R2, but failed to save to database. Check console.`);
                    } else {
                        alert(`Material Uploaded Successfully!\n(Path: ${uploadedPath})`);
                        materialForm.reset();
                    }

                    if (previewContainer) {
                        previewContainer.innerHTML = '';
                        previewContainer.classList.add('hidden');
                    }
                    // Optional: Reset dynamic price input if it was shown
                    const priceInput = document.getElementById('material-price-input');
                    if (priceInput) priceInput.classList.add('hidden');
                } catch (error) {
                    alert('Failed to upload material. Check console for details.');
                } finally {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    if (progressContainer) {
                        progressContainer.classList.add('hidden');
                        if (progressBar) progressBar.style.width = '0%';
                        if (progressText) progressText.textContent = '0%';
                    }
                }
            } else {
                alert('Please select a file to upload.');
            }
        });
    }

    // 3. Admin Recording Upload Form (admin.html)
    const recordingForm = document.getElementById('recording-upload-form');
    if (recordingForm) {
        recordingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('video-file');
            const file = fileInput.files[0];
            const submitBtn = recordingForm.querySelector('button[type="submit"]');

            const progressContainer = document.getElementById('video-progress-container');
            const progressBar = document.getElementById('video-progress-bar');
            const progressText = document.getElementById('video-progress-text');
            const previewContainer = document.getElementById('video-preview');

            const videoTitleInput = document.getElementById('video-title');
            const accessRadios = document.getElementsByName('video_access');
            let accessLevel = 'free';
            for (const radio of accessRadios) { if (radio.checked) accessLevel = radio.value; }
            const videoPriceInput = document.getElementById('video-price');

            if (file) {
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
                submitBtn.disabled = true;

                if (progressContainer) progressContainer.classList.remove('hidden');

                try {
                    const uploadedPath = await uploadToR2(file, 'recordings/', (percentage) => {
                        if (progressBar) progressBar.style.width = `${percentage}%`;
                        if (progressText) progressText.textContent = `${percentage}%`;
                    });

                    // Save to database
                    const { error: dbError } = await supabase.from('Recordings').insert([
                        {
                            title: videoTitleInput ? videoTitleInput.value : file.name,
                            file_path: uploadedPath,
                            access_level: accessLevel,
                            price: accessLevel === 'paid' && videoPriceInput ? parseFloat(videoPriceInput.value) : 0
                        }
                    ]);
                    if (dbError) {
                        console.error('Error saving recording to database:', dbError);
                        alert(`File uploaded to R2, but failed to save to database. Check console.`);
                    } else {
                        alert(`Recording Uploaded Successfully!\n(Path: ${uploadedPath})`);
                        recordingForm.reset();
                    }

                    if (previewContainer) {
                        previewContainer.innerHTML = '';
                        previewContainer.classList.add('hidden');
                    }
                    const priceInput = document.getElementById('recording-price-input');
                    if (priceInput) priceInput.classList.add('hidden');
                } catch (error) {
                    alert('Failed to upload recording. Check console for details.');
                } finally {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    if (progressContainer) {
                        progressContainer.classList.add('hidden');
                        if (progressBar) progressBar.style.width = '0%';
                        if (progressText) progressText.textContent = '0%';
                    }
                }
            } else {
                alert('Please select a video to upload.');
            }
        });
    }
});
