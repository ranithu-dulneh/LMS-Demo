import { supabase } from './auth.js';

/**
 * Uploads a file to Cloudflare R2 securely using a Presigned URL via Supabase Edge Functions.
 * @param {File} file - The file object from an input element
 * @param {string} prefix - Folder prefix (e.g., 'receipts/', 'materials/', 'recordings/')
 * @returns {Promise<string>} - The path/key of the uploaded file
 */
export async function uploadToR2(file, prefix = '') {
    const fileName = `${prefix}${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    try {
        // Request a presigned URL from the Edge Function
        const { data, error } = await supabase.functions.invoke('get-upload-url', {
            body: {
                fileName: fileName,
                contentType: file.type
            }
        });

        if (error) {
            console.error('Error getting presigned URL:', error);
            throw new Error(`Edge Function error: ${error.message}`);
        }

        if (!data || !data.signedUrl) {
            throw new Error('No signedUrl returned from Edge Function');
        }

        // Upload directly to Cloudflare R2 using the presigned URL
        const uploadResponse = await fetch(data.signedUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': file.type
            },
            body: file
        });

        if (!uploadResponse.ok) {
            throw new Error(`Upload to R2 failed with status: ${uploadResponse.status}`);
        }

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

    // 1. Student Receipt Upload Form (index.html)
    const receiptForm = document.getElementById('receipt-upload-form');
    if (receiptForm) {
        receiptForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('receipt-file');
            const file = fileInput.files[0];
            const submitBtn = receiptForm.querySelector('button[type="submit"]');

            if (file) {
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
                submitBtn.disabled = true;

                try {
                    const uploadedPath = await uploadToR2(file, 'receipts/');
                    alert(`Receipt Uploaded Successfully!\n(Path: ${uploadedPath})\nWaiting for Admin approval.`);
                    receiptForm.reset();
                } catch (error) {
                    alert('Failed to upload receipt. Check console for details.');
                } finally {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
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

            if (file) {
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
                submitBtn.disabled = true;

                try {
                    const uploadedPath = await uploadToR2(file, 'materials/');
                    alert(`Material Uploaded Successfully!\n(Path: ${uploadedPath})`);
                    materialForm.reset();
                    // Optional: Reset dynamic price input if it was shown
                    const priceInput = document.getElementById('material-price-input');
                    if (priceInput) priceInput.classList.add('hidden');
                } catch (error) {
                    alert('Failed to upload material. Check console for details.');
                } finally {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
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

            if (file) {
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
                submitBtn.disabled = true;

                try {
                    const uploadedPath = await uploadToR2(file, 'recordings/');
                    alert(`Recording Uploaded Successfully!\n(Path: ${uploadedPath})`);
                    recordingForm.reset();
                    const priceInput = document.getElementById('recording-price-input');
                    if (priceInput) priceInput.classList.add('hidden');
                } catch (error) {
                    alert('Failed to upload recording. Check console for details.');
                } finally {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            } else {
                alert('Please select a video to upload.');
            }
        });
    }
});
