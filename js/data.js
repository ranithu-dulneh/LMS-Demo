import { supabase } from '../auth.js';

// IMPORTANT: Replace this with your actual Cloudflare R2 Public Bucket URL or custom domain
const R2_PUBLIC_URL = "https://pub-<YOUR_R2_DEV_ID>.r2.dev";

document.addEventListener('DOMContentLoaded', () => {
    // Determine which page we are on
    const isStudentPage = document.getElementById('recordings-list') !== null;
    const isAdminPage = document.getElementById('requests-list') !== null;

    if (isStudentPage) {
        fetchRecordings();
        fetchMaterials();
    }

    if (isAdminPage) {
        fetchPurchaseRequests();
    }
});

// ============================================================================
// STUDENT DASHBOARD FETCHING
// ============================================================================

async function fetchRecordings() {
    const container = document.getElementById('recordings-list');
    if (!container) return;

    try {
        const { data: recordings, error } = await supabase
            .from('Recordings')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        container.innerHTML = ''; // Clear loading text

        if (recordings.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">No recordings available yet.</p>';
            return;
        }

        recordings.forEach(rec => {
            // Extract YouTube ID (format is "youtube:VIDEO_ID")
            const videoId = rec.file_path.startsWith('youtube:') ? rec.file_path.split(':')[1] : '';

            // Format Date
            const dateStr = new Date(rec.created_at).toLocaleDateString();

            let cardHTML = '';

            if (rec.access_level === 'free') {
                cardHTML = `
                    <div class="card video-card" onclick="window.openYouTubeVideo('${videoId}', '${rec.title.replace(/'/g, "\\'")}')">
                        <div class="thumbnail">
                            <i class="fas fa-play-circle play-icon"></i>
                            <span class="tag free">Free</span>
                        </div>
                        <div class="card-content">
                            <h3>${rec.title}</h3>
                            <p class="meta">Recorded: ${dateStr}</p>
                        </div>
                    </div>
                `;
            } else {
                cardHTML = `
                    <div class="card video-card locked">
                        <div class="thumbnail">
                            <div class="overlay"></div>
                            <i class="fas fa-lock lock-icon"></i>
                            <span class="tag paid">Paid</span>
                        </div>
                        <div class="card-content">
                            <h3>${rec.title}</h3>
                            <p class="meta">Recorded: ${dateStr}</p>
                            <div class="price-tag">LKR ${rec.price}</div>
                            <div class="action-buttons" style="display: flex; gap: 10px; margin-top: 10px;">
                                <button class="btn btn-primary" style="flex: 1; padding: 8px;" onclick="document.getElementById('checkout-nav-link').click();"><i class="fas fa-bolt"></i> Pay Now</button>
                                <button class="btn btn-outline" style="flex: 1; padding: 8px;" onclick="alert('Added to Cart')"><i class="fas fa-cart-plus"></i> Add to Cart</button>
                            </div>
                        </div>
                    </div>
                `;
            }
            container.insertAdjacentHTML('beforeend', cardHTML);
        });

    } catch (error) {
        console.error('Error fetching recordings:', error);
        container.innerHTML = '<p style="color: var(--accent-red);">Failed to load recordings.</p>';
    }
}

async function fetchMaterials() {
    const container = document.getElementById('materials-list');
    if (!container) return;

    try {
        const { data: materials, error } = await supabase
            .from('Tutes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        container.innerHTML = ''; // Clear loading text

        if (materials.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">No materials available yet.</p>';
            return;
        }

        materials.forEach(mat => {
            const fileUrl = `${R2_PUBLIC_URL}/${mat.file_path}`;
            let itemHTML = '';

            if (mat.access_level === 'free') {
                itemHTML = `
                    <div class="material-item">
                        <div class="material-icon free">
                            <i class="fas fa-file-pdf"></i>
                        </div>
                        <div class="material-info">
                            <h3>${mat.title}</h3>
                            <p class="meta">PDF Document</p>
                        </div>
                        <div class="material-action">
                            <span class="tag free">Free</span>
                            <a href="${fileUrl}" target="_blank" class="btn btn-secondary" style="text-decoration: none;"><i class="fas fa-download"></i> Download</a>
                        </div>
                    </div>
                `;
            } else {
                itemHTML = `
                    <div class="material-item locked-item">
                        <div class="material-icon paid">
                            <i class="fas fa-file-pdf"></i>
                        </div>
                        <div class="material-info">
                            <h3>${mat.title}</h3>
                            <p class="meta">PDF Document</p>
                            <div class="price-tag" style="margin-top: 5px; color: var(--text-main); font-weight: bold;">LKR ${mat.price}</div>
                        </div>
                        <div class="material-action" style="flex-direction: column; align-items: flex-end; gap: 10px;">
                            <span class="tag paid"><i class="fas fa-lock"></i> Paid</span>
                            <div style="display: flex; gap: 10px;">
                                <button class="btn btn-primary" style="padding: 8px 15px;" onclick="document.getElementById('checkout-nav-link').click();"><i class="fas fa-bolt"></i> Pay Now</button>
                                <button class="btn btn-outline" style="padding: 8px 15px;" onclick="alert('Added to Cart')"><i class="fas fa-cart-plus"></i> Add</button>
                            </div>
                        </div>
                    </div>
                `;
            }
            container.insertAdjacentHTML('beforeend', itemHTML);
        });

    } catch (error) {
        console.error('Error fetching materials:', error);
        container.innerHTML = '<p style="color: var(--accent-red);">Failed to load materials.</p>';
    }
}


// ============================================================================
// ADMIN DASHBOARD FETCHING
// ============================================================================

async function fetchPurchaseRequests() {
    const container = document.getElementById('requests-list');
    if (!container) return;

    try {
        const { data: requests, error } = await supabase
            .from('Stu_Reciepts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        container.innerHTML = ''; // Clear loading text

        if (requests.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">No pending purchase requests.</p>';
            return;
        }

        requests.forEach(req => {
            const receiptUrl = `${R2_PUBLIC_URL}/${req.file_path}`;
            const dateStr = new Date(req.created_at).toLocaleDateString();
            const timeStr = new Date(req.created_at).toLocaleTimeString();

            // Determine icon based on status
            let statusBadge = '';
            if (req.status === 'pending') {
                statusBadge = `<span class="badge" style="background: #fff3cd; color: #856404; padding: 5px 10px; border-radius: 4px; display: block; margin-bottom: 10px; text-align: center;">Pending</span>`;
            } else if (req.status === 'approved') {
                statusBadge = `<span class="badge" style="background: #d4edda; color: #155724; padding: 5px 10px; border-radius: 4px; display: block; margin-bottom: 10px; text-align: center;">Approved</span>`;
            } else {
                statusBadge = `<span class="badge" style="background: #f8d7da; color: #721c24; padding: 5px 10px; border-radius: 4px; display: block; margin-bottom: 10px; text-align: center;">Rejected</span>`;
            }

            const itemHTML = `
                <div class="material-item">
                    <div class="material-icon">
                        <i class="fas fa-file-invoice-dollar" style="color: #0056b3;"></i>
                    </div>
                    <div class="material-info">
                        <h3>Student: ${req.user_email}</h3>
                        <p class="meta">Ref No: <strong>${req.reference_no || 'N/A'}</strong> &bull; Submitted: ${dateStr} ${timeStr}</p>
                        <a href="${receiptUrl}" target="_blank" class="view-receipt-link" style="display: inline-block; margin-top: 5px; color: #0056b3; text-decoration: none;"><i class="fas fa-external-link-alt"></i> View Uploaded Receipt</a>
                    </div>
                    <div class="material-action request-actions">
                        ${statusBadge}
                        <div style="display: flex; gap: 5px;">
                            <button class="btn btn-primary" style="background: #28a745; padding: 5px 10px; font-size: 0.9rem;" onclick="updateRequestStatus('${req.id}', 'approved')"><i class="fas fa-check"></i> Accept</button>
                            <button class="btn btn-secondary" style="padding: 5px 10px; font-size: 0.9rem;" onclick="updateRequestStatus('${req.id}', 'rejected')"><i class="fas fa-times"></i> Reject</button>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', itemHTML);
        });

    } catch (error) {
        console.error('Error fetching requests:', error);
        container.innerHTML = '<p style="color: var(--accent-red);">Failed to load purchase requests.</p>';
    }
}

// Attach function to window so inline onclick handlers in the HTML template can access it
window.updateRequestStatus = async function(requestId, newStatus) {
    try {
        const { error } = await supabase
            .from('Stu_Reciepts')
            .update({ status: newStatus })
            .eq('id', requestId);

        if (error) throw error;

        alert(`Request marked as ${newStatus}!`);
        fetchPurchaseRequests(); // Refresh the list

    } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update status.');
    }
};
