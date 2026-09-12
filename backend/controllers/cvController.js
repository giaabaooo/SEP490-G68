// controllers/cvController.js
const CV = require('../models/CV');

// Helper escape HTML để chống XSS khi render trang CV
function escapeHtml(unsafe) {
  if (unsafe === undefined || unsafe === null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// [POST] Tạo mới hoặc Lưu CV
exports.saveCV = async (req, res) => {
  try {
    const { cvId, title, design, data, sectionOrder } = req.body;
    const userId = req.user.id;

    // Validate backend cơ bản
    if (!data?.personal?.fullName || !data?.personal?.email) {
      return res.status(400).json({ message: 'Tên và Email là bắt buộc' });
    }

    let cv;
    if (cvId) {
      // Nếu có ID -> Cập nhật
      cv = await CV.findOneAndUpdate(
        { _id: cvId, user: userId },
        { title, design, data, ...(sectionOrder ? { sectionOrder } : {}) },
        { new: true }
      );

      // Thông báo cho nhà tuyển dụng của các hồ sơ đang hoạt động sử dụng CV này
      try {
        const Application = require('../models/Application');
        const { createNotification } = require('../utils/notificationHelper');
        const activeApps = await Application.find({
          userId: userId,
          appliedCvId: cvId,
          status: { $in: ['Applied', 'Testing', 'Interviewing'] }
        }).populate('jobId', 'title recruiterId');

        for (const app of activeApps) {
          if (app.jobId?.recruiterId) {
            await createNotification({
              userId: app.jobId.recruiterId,
              title: `Ứng viên cập nhật nội dung CV: ${data?.personal?.fullName || 'Ứng viên'}`,
              message: `Ứng viên ${data?.personal?.fullName || 'Ứng viên'} vừa cập nhật lại thông tin trên CV trực tuyến cho vị trí "${app.jobId.title}". Bấm để xem chi tiết hồ sơ.`,
              type: 'application_submitted',
              link: `/bussiness/candidate/${app._id}`,
              relatedApplicationId: app._id
            });
          }
        }
      } catch (notifErr) {
        console.error('Lỗi gửi thông báo cập nhật CV:', notifErr.message);
      }
    } else {
      // Nếu không -> Tạo mới
      cv = new CV({ user: userId, title, design, data, sectionOrder: sectionOrder || undefined });
      await cv.save();
    }

    res.status(200).json({ message: 'Lưu CV thành công', cv });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi lưu CV' });
  }
};

// [GET] Lấy danh sách CV của User
exports.getMyCVs = async (req, res) => {
  try {
    const cvs = await CV.find({ user: req.user.id }).sort({ updatedAt: -1 });
    res.status(200).json(cvs);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// [GET] Lấy chi tiết CV theo ID (dành cho API / frontend viewer)
exports.getCVById = async (req, res) => {
  try {
    const { id } = req.params;
    const cv = await CV.findById(id).populate('user', 'fullName email avatar');
    if (!cv) {
      return res.status(404).json({ message: 'Không tìm thấy CV' });
    }
    res.status(200).json(cv);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy CV' });
  }
};

// [GET] Render trang xem CV dạng văn bản tài liệu A4 / Print-to-PDF hoàn chỉnh
exports.renderCVView = async (req, res) => {
  try {
    const { id } = req.params;
    const cv = await CV.findById(id);

    if (!cv) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <title>Không tìm thấy CV - Careerio</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #334155; }
            .box { text-align: center; background: white; padding: 40px; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); max-width: 400px; }
            h2 { color: #e11d48; margin-top: 0; }
          </style>
        </head>
        <body>
          <div class="box">
            <h2>Không tìm thấy hồ sơ</h2>
            <p>Hồ sơ CV này không tồn tại hoặc đã bị xóa khỏi hệ thống.</p>
          </div>
        </body>
        </html>
      `);
    }

    const d = cv.data || {};
    const personal = d.personal || {};
    const titles = d.sectionTitles || {};
    const design = cv.design || { font: 'Roboto', color: '#059669', lineSpacing: 1.5, layout: 'classic' };
    const primaryColor = design.color || '#059669';
    const font = design.font || 'Roboto';
    const layout = design.layout || 'classic';
    const sectionOrder = cv.sectionOrder?.length 
      ? cv.sectionOrder 
      : ['objective', 'experience', 'education', 'activities', 'certificates', 'skills', 'hobbies'];

    // Helper render item
    const renderSectionsHtml = (filterFn = () => true) => {
      let html = '';
      sectionOrder.filter(filterFn).forEach((key) => {
        const titleText = escapeHtml(titles[key] || key);

        if (key === 'objective' && d.objective?.trim()) {
          html += `
            <div class="section">
              <div class="section-title">${titleText}</div>
              <div class="section-content">${escapeHtml(d.objective).replace(/\n/g, '<br/>')}</div>
            </div>`;
        } else if (key === 'skills' && d.skills?.trim()) {
          html += `
            <div class="section">
              <div class="section-title">${titleText}</div>
              <div class="section-content">${escapeHtml(d.skills).replace(/\n/g, '<br/>')}</div>
            </div>`;
        } else if (key === 'hobbies' && d.hobbies?.trim()) {
          html += `
            <div class="section">
              <div class="section-title">${titleText}</div>
              <div class="section-content">${escapeHtml(d.hobbies).replace(/\n/g, '<br/>')}</div>
            </div>`;
        } else if (key === 'education' && Array.isArray(d.education) && d.education.some(e => e.school)) {
          html += `<div class="section"><div class="section-title">${titleText}</div><div class="items-list">`;
          d.education.forEach(e => {
            if (!e.school) return;
            html += `
              <div class="item">
                <div class="item-header">
                  <span class="item-name">${escapeHtml(e.school)}</span>
                  <span class="item-time">${escapeHtml(e.time || '')}</span>
                </div>
                ${e.major ? `<div class="item-sub">${escapeHtml(e.major)}</div>` : ''}
                ${e.description ? `<div class="item-desc">${escapeHtml(e.description).replace(/\n/g, '<br/>')}</div>` : ''}
              </div>`;
          });
          html += `</div></div>`;
        } else if (key === 'experience' && Array.isArray(d.experience) && d.experience.some(e => e.company)) {
          html += `<div class="section"><div class="section-title">${titleText}</div><div class="items-list">`;
          d.experience.forEach(e => {
            if (!e.company) return;
            html += `
              <div class="item">
                <div class="item-header">
                  <span class="item-name">${escapeHtml(e.company)}</span>
                  <span class="item-time">${escapeHtml(e.time || '')}</span>
                </div>
                ${e.position ? `<div class="item-sub">${escapeHtml(e.position)}</div>` : ''}
                ${e.description ? `<div class="item-desc">${escapeHtml(e.description).replace(/\n/g, '<br/>')}</div>` : ''}
              </div>`;
          });
          html += `</div></div>`;
        } else if (key === 'activities' && Array.isArray(d.activities) && d.activities.some(e => e.organization)) {
          html += `<div class="section"><div class="section-title">${titleText}</div><div class="items-list">`;
          d.activities.forEach(e => {
            if (!e.organization) return;
            html += `
              <div class="item">
                <div class="item-header">
                  <span class="item-name">${escapeHtml(e.organization)}</span>
                  <span class="item-time">${escapeHtml(e.time || '')}</span>
                </div>
                ${e.role ? `<div class="item-sub">${escapeHtml(e.role)}</div>` : ''}
                ${e.description ? `<div class="item-desc">${escapeHtml(e.description).replace(/\n/g, '<br/>')}</div>` : ''}
              </div>`;
          });
          html += `</div></div>`;
        } else if (key === 'certificates' && Array.isArray(d.certificates) && d.certificates.some(e => e.name)) {
          html += `<div class="section"><div class="section-title">${titleText}</div><div class="items-list">`;
          d.certificates.forEach(e => {
            if (!e.name) return;
            html += `
              <div class="item">
                <div class="item-header">
                  <span class="item-name">${escapeHtml(e.name)}</span>
                  <span class="item-time">${escapeHtml(e.time || '')}</span>
                </div>
              </div>`;
          });
          html += `</div></div>`;
        }
      });
      return html;
    };

    const contactHtml = `
      <div class="contact-list">
        ${personal.phone ? `<span class="contact-item">📞 ${escapeHtml(personal.phone)}</span>` : ''}
        ${personal.email ? `<span class="contact-item">✉️ ${escapeHtml(personal.email)}</span>` : ''}
        ${personal.dob ? `<span class="contact-item">🎂 ${escapeHtml(personal.dob)}</span>` : ''}
        ${personal.gender ? `<span class="contact-item">⚧ ${escapeHtml(personal.gender)}</span>` : ''}
        ${personal.address ? `<span class="contact-item">📍 ${escapeHtml(personal.address)}</span>` : ''}
        ${personal.link ? `<span class="contact-item">🔗 ${escapeHtml(personal.link)}</span>` : ''}
      </div>`;

    const avatarHtml = personal.avatar 
      ? `<div class="avatar-wrap"><img src="${escapeHtml(personal.avatar)}" alt="Avatar" class="avatar-img" /></div>` 
      : '';

    const htmlDocument = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CV - ${escapeHtml(personal.fullName || 'Ứng viên')} | Careerio</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Roboto:wght@400;500;700;900&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: '${font}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #e2e8f0;
            color: #1e293b;
            line-height: ${design.lineSpacing || 1.5};
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* THANH ACTION TRÊN CÙNG (ẨN KHI IN HOẶC XUẤT PDF) */
          .toolbar {
            position: sticky;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(8px);
            color: white;
            padding: 12px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          .toolbar-title { font-weight: 700; font-size: 15px; display: flex; align-items: center; gap: 8px; }
          .toolbar-badge { background: ${primaryColor}; font-size: 11px; padding: 2px 8px; border-radius: 6px; font-weight: 800; text-transform: uppercase; }
          .toolbar-actions { display: flex; gap: 10px; }
          .btn-print {
            background: ${primaryColor};
            color: white;
            border: none;
            padding: 8px 18px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 13px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
          }
          .btn-print:hover { filter: brightness(1.1); transform: translateY(-1px); }
          .btn-close {
            background: rgba(255,255,255,0.15);
            color: white;
            border: none;
            padding: 8px 14px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn-close:hover { background: rgba(255,255,255,0.25); }

          /* KHỔ GIẤY A4 CHUẨN */
          .cv-page-container {
            width: 100%;
            display: flex;
            justify-content: center;
            padding: 30px 10px 60px;
          }
          .cv-sheet {
            width: 210mm;
            min-height: 297mm;
            background: white;
            box-shadow: 0 10px 30px rgba(0,0,0,0.12);
            position: relative;
            overflow: hidden;
          }

          /* STYLES CHO TỪNG LAYOUT */
          ${layout === 'classic' ? `
            .cv-sheet { padding: 20mm; }
            .cv-header { display: flex; gap: 24px; align-items: center; border-bottom: 4px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 24px; }
            .avatar-img { width: 110px; height: 110px; border-radius: 50%; object-fit: cover; border: 3px solid ${primaryColor}; }
            .candidate-name { font-size: 28px; font-weight: 900; text-transform: uppercase; color: ${primaryColor}; letter-spacing: -0.5px; }
            .candidate-job { font-size: 16px; font-weight: 600; color: #64748b; margin-top: 2px; }
            .contact-list { display: flex; flex-wrap: wrap; gap: 10px 16px; margin-top: 10px; font-size: 13px; color: #475569; }
            .section { margin-bottom: 20px; page-break-inside: avoid; }
            .section-title { font-size: 16px; font-weight: 800; text-transform: uppercase; color: ${primaryColor}; border-bottom: 2px solid ${primaryColor}; padding-bottom: 4px; margin-bottom: 10px; }
            .section-content { font-size: 13.5px; color: #334155; line-height: 1.6; }
            .items-list { display: flex; flex-direction: column; gap: 12px; }
            .item { page-break-inside: avoid; }
            .item-header { display: flex; justify-content: space-between; font-weight: 700; font-size: 14px; color: #0f172a; }
            .item-time { color: #64748b; font-size: 12.5px; font-weight: 500; }
            .item-sub { font-size: 13px; font-style: italic; color: #475569; margin-top: 2px; }
            .item-desc { font-size: 13px; color: #334155; margin-top: 4px; line-height: 1.5; }
          ` : ''}

          ${layout === 'minimalist' ? `
            .cv-header { background: #f8fafc; border-bottom: 4px solid ${primaryColor}; padding: 20mm 20mm 15mm; }
            .avatar-img { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 2px solid ${primaryColor}; }
            .candidate-name { font-size: 30px; font-weight: 900; text-transform: uppercase; color: ${primaryColor}; }
            .candidate-job { font-size: 17px; font-weight: 600; color: #64748b; margin-top: 4px; }
            .contact-list { display: flex; flex-wrap: wrap; gap: 10px 18px; margin-top: 12px; font-size: 13px; color: #475569; }
            .cv-body { padding: 15mm 20mm; }
            .section { margin-bottom: 22px; page-break-inside: avoid; }
            .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; background: ${primaryColor}; color: white; display: inline-block; padding: 4px 14px; border-radius: 0 10px 10px 0; margin-left: -20mm; margin-bottom: 12px; }
            .section-content { font-size: 13.5px; color: #334155; line-height: 1.6; }
            .items-list { display: flex; flex-direction: column; gap: 12px; }
            .item { page-break-inside: avoid; }
            .item-header { display: flex; justify-content: space-between; font-weight: 700; font-size: 14px; color: #0f172a; }
            .item-time { color: #64748b; font-size: 12.5px; font-weight: 500; }
            .item-sub { font-size: 13px; font-style: italic; color: #475569; margin-top: 2px; }
            .item-desc { font-size: 13px; color: #334155; margin-top: 4px; line-height: 1.5; }
          ` : ''}

          ${layout === '2-col' ? `
            .two-col-wrap { display: flex; width: 100%; min-height: 297mm; }
            .left-col { width: 34%; background: ${primaryColor}; color: white; padding: 24px; }
            .left-col .avatar-img { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(255,255,255,0.4); margin: 0 auto 20px; display: block; }
            .left-col .section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 6px; margin-bottom: 12px; letter-spacing: 1px; color: #ffffff; }
            .left-col .contact-list { display: flex; flex-direction: column; gap: 10px; font-size: 12.5px; color: rgba(255,255,255,0.9); word-break: break-word; }
            .left-col .section-content { font-size: 12.5px; color: rgba(255,255,255,0.9); line-height: 1.6; }
            .left-col .section { margin-bottom: 24px; page-break-inside: avoid; }
            
            .right-col { width: 66%; padding: 28px 24px; background: white; }
            .candidate-name { font-size: 30px; font-weight: 900; text-transform: uppercase; color: #0f172a; }
            .candidate-job { font-size: 17px; font-weight: 600; color: ${primaryColor}; margin-top: 4px; margin-bottom: 24px; }
            .right-col .section { margin-bottom: 20px; page-break-inside: avoid; }
            .right-col .section-title { font-size: 15px; font-weight: 800; text-transform: uppercase; color: ${primaryColor}; border-bottom: 2px solid ${primaryColor}; padding-bottom: 4px; margin-bottom: 12px; }
            .right-col .section-content { font-size: 13px; color: #334155; line-height: 1.6; }
            .items-list { display: flex; flex-direction: column; gap: 12px; }
            .item { page-break-inside: avoid; }
            .item-header { display: flex; justify-content: space-between; font-weight: 700; font-size: 13.5px; color: #0f172a; }
            .item-time { color: #64748b; font-size: 12px; font-weight: 500; }
            .item-sub { font-size: 12.5px; font-style: italic; color: #475569; margin-top: 2px; }
            .item-desc { font-size: 12.5px; color: #334155; margin-top: 4px; line-height: 1.5; }
          ` : ''}

          /* CẤU HÌNH IN ẤN CHUẨN XÁC KHỔ A4 */
          @media print {
            body { background: white; margin: 0; padding: 0; }
            .toolbar { display: none !important; }
            .cv-page-container { padding: 0 !important; }
            .cv-sheet {
              box-shadow: none !important;
              width: 100% !important;
              max-width: 100% !important;
              min-height: auto !important;
            }
            @page {
              size: A4 portrait;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <!-- THANH CÔNG CỤ XEM CV -->
        <div class="toolbar">
          <div class="toolbar-title">
            <span>Careerio CV Viewer</span>
            <span class="toolbar-badge">Tài liệu PDF</span>
            <span style="opacity: 0.6; font-size: 13px; margin-left: 8px;">| ${escapeHtml(cv.title || 'Hồ sơ ứng viên')}</span>
          </div>
          <div class="toolbar-actions">
            <button onclick="window.print()" class="btn-print">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              In / Lưu PDF
            </button>
            <button onclick="window.close()" class="btn-close">Đóng</button>
          </div>
        </div>

        <!-- TỜ GIẤY A4 HIỂN THỊ NỘI DUNG CV -->
        <div class="cv-page-container">
          <div class="cv-sheet">
            ${layout === 'classic' ? `
              <div class="cv-header">
                ${avatarHtml}
                <div style="flex: 1;">
                  <h1 class="candidate-name">${escapeHtml(personal.fullName || 'ỨNG VIÊN')}</h1>
                  <div class="candidate-job">${escapeHtml(personal.jobTitle || '')}</div>
                  ${contactHtml}
                </div>
              </div>
              <div class="cv-body">
                ${renderSectionsHtml()}
              </div>
            ` : ''}

            ${layout === 'minimalist' ? `
              <div class="cv-header">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <h1 class="candidate-name">${escapeHtml(personal.fullName || 'ỨNG VIÊN')}</h1>
                    <div class="candidate-job">${escapeHtml(personal.jobTitle || '')}</div>
                  </div>
                  ${avatarHtml}
                </div>
                ${contactHtml}
              </div>
              <div class="cv-body">
                ${renderSectionsHtml()}
              </div>
            ` : ''}

            ${layout === '2-col' ? `
              <div class="two-col-wrap">
                <div class="left-col">
                  ${avatarHtml}
                  <div class="section">
                    <div class="section-title">Liên hệ</div>
                    ${contactHtml}
                  </div>
                  ${renderSectionsHtml(k => k === 'skills' || k === 'hobbies')}
                </div>
                <div class="right-col">
                  <h1 class="candidate-name">${escapeHtml(personal.fullName || 'ỨNG VIÊN')}</h1>
                  <div class="candidate-job">${escapeHtml(personal.jobTitle || '')}</div>
                  ${renderSectionsHtml(k => k !== 'skills' && k !== 'hobbies')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(htmlDocument);
  } catch (error) {
    console.error('Lỗi khi render CV view:', error);
    return res.status(500).send('Lỗi máy chủ khi hiển thị CV');
  }
};