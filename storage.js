import { S3Client, PutObjectCommand } from 'https://cdn.jsdelivr.net/npm/@aws-sdk/client-s3/+esm';

/**
 * ============================================================================
 * ⚠️ SECURITY WARNING ⚠️
 *
 * You should NEVER hardcode your Cloudflare R2 Secret Access Key in frontend
 * JavaScript. Anyone visiting your site can view the source code and steal
 * your key, giving them full control over your storage bucket.
 *
 * In a production environment, you should use a backend server (or Supabase
 * Edge Functions) to generate a "Presigned URL". Your frontend then uses
 * that temporary URL to upload the file securely.
 *
 * For this demo, we are setting up the structure. If the keys are left as
 * placeholders, the code will simulate a successful upload.
 * ============================================================================
 */

const R2_ACCOUNT_ID = '9dd9f65f2b45d7d473f91154f22e0d8e';
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const BUCKET_NAME = 'sl-learn-bucket'; // Replace with your actual bucket name

// Placeholder credentials - DO NOT replace these with real keys if pushing to a public repository
const R2_ACCESS_KEY_ID = 'YOUR_R2_ACCESS_KEY';
const R2_SECRET_ACCESS_KEY = 'YOUR_R2_SECRET_KEY';

// Initialize S3 Client for Cloudflare R2
const s3Client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    }
});

/**
 * Uploads a file to Cloudflare R2
 * @param {File} file - The file object from an input element
 * @param {string} prefix - Folder prefix (e.g., 'receipts/', 'materials/', 'recordings/')
 * @returns {Promise<string>} - The path/key of the uploaded file
 */
export async function uploadToR2(file, prefix = '') {
    const fileName = `${prefix}${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Check if we are using placeholders
    if (R2_ACCESS_KEY_ID === 'YOUR_R2_ACCESS_KEY' || R2_SECRET_ACCESS_KEY === 'YOUR_R2_SECRET_KEY') {
        console.warn('Simulating upload because real R2 credentials are not provided. This is safe for frontend testing.');
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(`simulated/${fileName}`);
            }, 1000); // Simulate network delay
        });
    }

    try {
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileName,
            Body: file,
            ContentType: file.type,
        });

        await s3Client.send(command);
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
